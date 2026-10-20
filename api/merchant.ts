import { randomUUID, createHash } from "node:crypto";
import type { Request, Response } from "express";
import type { Pool, QueryResultRow } from "pg";
import { z } from "zod";

import { inTransaction } from "./database";
import { bookingQuoteHash } from "./quote";

function subjectId(response: Response): string | undefined {
  const auth = response.locals.auth as { subjectId?: unknown } | undefined;
  return typeof auth?.subjectId === "string" ? auth.subjectId : undefined;
}

export function createMerchantHandlers(pool: Pick<Pool, "connect">) {
  async function listOffers(_request: Request, response: Response) {
    const merchantId = subjectId(response);
    if (!merchantId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT o.id AS offer_id, b.id AS booking_id, s.name AS service_name, s.category,
                b.scheduled_at, a.locality, o.visit_price_paise AS visit_estimate_paise,
                o.labor_price_paise AS labor_estimate_paise, o.expires_at
         FROM merchant_profile m
         JOIN booking_offer o ON o.merchant_id = m.subject_id
         JOIN service_booking b ON b.id = o.booking_id
         JOIN service_catalog s ON s.id = b.service_id
         JOIN customer_address a ON a.id = b.address_id AND a.customer_id = b.customer_id
         WHERE m.subject_id = $1 AND m.verification_status = 'verified' AND m.accepting_jobs = true
           AND o.status = 'pending' AND (o.expires_at IS NULL OR o.expires_at > clock_timestamp())
           AND b.merchant_id IS NULL AND b.status = 'offered'
         ORDER BY o.offered_at ASC LIMIT 100`,
        [merchantId],
      );
      return response.status(200).json({ items: result.rows });
    } finally {
      client.release();
    }
  }

  async function respondToOffer(request: Request, response: Response) {
    const merchantId = subjectId(response);
    if (!merchantId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const offerId = z.string().uuid().safeParse(request.params.id);
    const input = z
      .object({ decision: z.enum(["accept", "decline"]) })
      .strict()
      .safeParse(request.body);
    if (!offerId.success || !input.success) {
      return response.status(400).json({
        error: { code: "INVALID_INPUT", message: "Choose accept or decline for a valid offer." },
      });
    }
    const key = request.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) {
      return response.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Provide a valid Idempotency-Key header.",
        },
      });
    }
    const routeKey = `POST:/api/v1/merchant/offers/${offerId.data}/response`;
    const requestHash = createHash("sha256").update(JSON.stringify(input.data)).digest();
    const result = await inTransaction(pool, async (client) => {
      const reservation = await client.query(
        `INSERT INTO request_idempotency (subject_id, route_key, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING idempotency_key`,
        [merchantId, routeKey, key, requestHash],
      );
      if (!reservation.rows.length) {
        const prior = await client.query<{ request_hash: Buffer; response_body: QueryResultRow }>(
          `SELECT request_hash, response_body FROM request_idempotency
           WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3 FOR UPDATE`,
          [merchantId, routeKey, key],
        );
        if (!prior.rows.length || !prior.rows[0].request_hash.equals(requestHash)) {
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message: "Use a new key for a different response.",
              },
            },
          };
        }
        if (prior.rows[0].response_body) return { status: 200, body: prior.rows[0].response_body };
        return {
          status: 409,
          body: {
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "This response is still being processed.",
            },
          },
        };
      }

      const offerReference = await client.query<{ booking_id: string }>(
        "SELECT booking_id FROM booking_offer WHERE id = $1 AND merchant_id = $2",
        [offerId.data, merchantId],
      );
      if (!offerReference.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 404,
          body: { error: { code: "OFFER_NOT_FOUND", message: "This offer is unavailable." } },
        };
      }
      // All merchants lock the shared booking before any offer row, preventing a
      // deadlock when one acceptance cancels the other merchants' pending offers.
      const booking = await client.query<{
        id: string;
        status: string;
        merchant_id: string | null;
      }>("SELECT id, status, merchant_id FROM service_booking WHERE id = $1 FOR UPDATE", [
        offerReference.rows[0].booking_id,
      ]);
      const offered = await client.query<{
        status: string;
        expires_at: Date | null;
        is_expired: boolean;
        visit_price_paise: number;
        labor_price_paise: number;
      }>(
        `SELECT status, expires_at,
                expires_at IS NOT NULL AND expires_at <= clock_timestamp() AS is_expired,
                visit_price_paise, labor_price_paise
         FROM booking_offer WHERE id = $1 AND merchant_id = $2 FOR UPDATE`,
        [offerId.data, merchantId],
      );
      if (!booking.rows.length || !offered.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 404,
          body: { error: { code: "OFFER_NOT_FOUND", message: "This offer is unavailable." } },
        };
      }
      const current = {
        ...offered.rows[0],
        booking_id: booking.rows[0].id,
        booking_status: booking.rows[0].status,
        assigned_merchant_id: booking.rows[0].merchant_id,
      };
      const profile = await client.query<{ verification_status: string; accepting_jobs: boolean }>(
        "SELECT verification_status, accepting_jobs FROM merchant_profile WHERE subject_id = $1 FOR UPDATE",
        [merchantId],
      );
      const eligible =
        profile.rows[0]?.verification_status === "verified" &&
        profile.rows[0]?.accepting_jobs === true;
      const expired = current.is_expired;
      if (
        !eligible ||
        current.status !== "pending" ||
        current.assigned_merchant_id ||
        current.booking_status !== "offered" ||
        expired
      ) {
        const body = {
          error: {
            code: !eligible ? "MERCHANT_NOT_ELIGIBLE" : "OFFER_UNAVAILABLE",
            message: !eligible
              ? "Your verified merchant profile is not currently accepting requests."
              : "This offer has expired or is no longer available.",
          },
        };
        if (expired && current.status === "pending") {
          await client.query(
            "UPDATE booking_offer SET status = 'expired' WHERE id = $1 AND status = 'pending'",
            [offerId.data],
          );
        }
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return { status: eligible ? 409 : 403, body };
      }

      // The earlier expiry read can become stale while waiting for the profile
      // lock. Make the transition itself conditional on the database clock.
      const transitioned = await client.query(
        `UPDATE booking_offer
         SET status = $3, responded_at = clock_timestamp()
         WHERE id = $1 AND merchant_id = $2 AND status = 'pending'
           AND (expires_at IS NULL OR expires_at > clock_timestamp())
         RETURNING id`,
        [offerId.data, merchantId, input.data.decision === "accept" ? "accepted" : "declined"],
      );
      if (!transitioned.rows.length) {
        const expiredNow = await client.query(
          `UPDATE booking_offer SET status = 'expired'
           WHERE id = $1 AND merchant_id = $2 AND status = 'pending'
             AND expires_at IS NOT NULL AND expires_at <= clock_timestamp()
           RETURNING id`,
          [offerId.data, merchantId],
        );
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: expiredNow.rows.length ? "OFFER_EXPIRED" : "OFFER_UNAVAILABLE",
              message: "This offer has expired or is no longer available.",
            },
          },
        };
      }

      if (input.data.decision === "decline") {
        const body = { offer: { id: offerId.data, status: "declined" } };
        await client.query(
          "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key, JSON.stringify(body)],
        );
        return { status: 200, body };
      }

      // Conditional write is the assignment authority: concurrent merchants cannot both win.
      const assigned = await client.query(
        `UPDATE service_booking SET merchant_id = $1, status = 'accepted', visit_price_paise = $3,
             labor_estimate_paise = $4, updated_at = clock_timestamp(), version = version + 1
         WHERE id = $2 AND merchant_id IS NULL AND status = 'offered' RETURNING id`,
        [merchantId, current.booking_id, current.visit_price_paise, current.labor_price_paise],
      );
      if (!assigned.rows.length) {
        const body = {
          error: {
            code: "OFFER_ALREADY_ASSIGNED",
            message: "Another merchant has already accepted this request.",
          },
        };
        await client.query(
          "UPDATE booking_offer SET status = 'cancelled', responded_at = clock_timestamp() WHERE id = $1 AND status = 'pending'",
          [offerId.data],
        );
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return { status: 409, body };
      }
      await client.query(
        "UPDATE booking_offer SET status = 'cancelled', responded_at = clock_timestamp() WHERE booking_id = $1 AND id <> $2 AND status = 'pending'",
        [current.booking_id, offerId.data],
      );
      await client.query(
        `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key)
         VALUES ($1, 'customer.booking_accepted', $2, $3::jsonb, $4) ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          randomUUID(),
          current.booking_id,
          JSON.stringify({ bookingId: current.booking_id }),
          `booking-accepted:${current.booking_id}`,
        ],
      );
      const body = {
        offer: { id: offerId.data, bookingId: current.booking_id, status: "accepted" },
      };
      await client.query(
        "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
        [merchantId, routeKey, key, JSON.stringify(body)],
      );
      return { status: 200, body };
    });
    return response.status(result.status).json(result.body);
  }

  async function listJobs(_request: Request, response: Response) {
    const merchantId = subjectId(response);
    if (!merchantId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT b.id, b.status, b.scheduled_at, b.visit_price_paise, b.labor_estimate_paise,
                b.parts_estimate_paise, b.currency, b.payment_method, b.created_at, b.customer_quote_accepted_at,
                b.customer_accepted_quote_hash, s.name AS service_name,
                a.label AS address_label, a.address_text, a.locality, a.latitude, a.longitude
         FROM service_booking b JOIN service_catalog s ON s.id = b.service_id
         JOIN customer_address a ON a.id = b.address_id AND a.customer_id = b.customer_id
         JOIN merchant_profile m ON m.subject_id = b.merchant_id
         WHERE b.merchant_id = $1 AND m.verification_status = 'verified'
         ORDER BY b.created_at DESC LIMIT 100`,
        [merchantId],
      );
      const items = result.rows.map((row) => {
        const currentQuoteHash = bookingQuoteHash(row as Parameters<typeof bookingQuoteHash>[0]);
        const { customer_accepted_quote_hash: _acceptedQuoteHash, ...publicJob } = row;
        return {
          ...publicJob,
          customer_quote_accepted: Boolean(
            row.customer_quote_accepted_at &&
            (row.customer_accepted_quote_hash as Buffer | null)?.equals(currentQuoteHash),
          ),
        };
      });
      return response.status(200).json({ items });
    } finally {
      client.release();
    }
  }

  async function startJob(request: Request, response: Response) {
    const merchantId = subjectId(response);
    if (!merchantId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const bookingId = z.string().uuid().safeParse(request.params.id);
    if (!bookingId.success)
      return response
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: "The job id is invalid." } });
    const key = request.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) {
      return response.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Provide a valid Idempotency-Key header.",
        },
      });
    }
    const routeKey = `POST:/api/v1/merchant/jobs/${bookingId.data}/start`;
    const requestHash = createHash("sha256").update("start").digest();
    const result = await inTransaction(pool, async (client) => {
      const reservation = await client.query(
        `INSERT INTO request_idempotency (subject_id, route_key, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING idempotency_key`,
        [merchantId, routeKey, key, requestHash],
      );
      if (!reservation.rows.length) {
        const prior = await client.query<{ request_hash: Buffer; response_body: QueryResultRow }>(
          `SELECT request_hash, response_body FROM request_idempotency
           WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3 FOR UPDATE`,
          [merchantId, routeKey, key],
        );
        if (!prior.rows.length || !prior.rows[0].request_hash.equals(requestHash)) {
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message: "Use a new key for a different action.",
              },
            },
          };
        }
        if (prior.rows[0].response_body) return { status: 200, body: prior.rows[0].response_body };
        return {
          status: 409,
          body: {
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "This action is still being processed.",
            },
          },
        };
      }

      const job = await client.query<{
        status: string;
        visit_price_paise: number | string;
        labor_estimate_paise: number | string;
        parts_estimate_paise: number | string | null;
        currency: string;
        payment_method: string;
        customer_quote_accepted_at: Date | null;
        customer_accepted_quote_hash: Buffer | null;
      }>(
        `SELECT status, visit_price_paise, labor_estimate_paise, parts_estimate_paise,
                currency, payment_method, customer_quote_accepted_at, customer_accepted_quote_hash
         FROM service_booking WHERE id = $1 AND merchant_id = $2 FOR UPDATE`,
        [bookingId.data, merchantId],
      );
      if (!job.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 404,
          body: { error: { code: "JOB_NOT_FOUND", message: "This assigned job was not found." } },
        };
      }
      const profile = await client.query<{ verification_status: string }>(
        "SELECT verification_status FROM merchant_profile WHERE subject_id = $1 FOR UPDATE",
        [merchantId],
      );
      if (profile.rows[0]?.verification_status !== "verified") {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 403,
          body: {
            error: {
              code: "MERCHANT_NOT_ELIGIBLE",
              message: "A verified merchant account is required.",
            },
          },
        };
      }
      if (
        job.rows[0].status === "accepted" &&
        (!job.rows[0].customer_quote_accepted_at ||
          !job.rows[0].customer_accepted_quote_hash?.equals(bookingQuoteHash(job.rows[0])))
      ) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: "CUSTOMER_QUOTE_NOT_APPROVED",
              message:
                "Wait for the customer to approve the current quote before starting this job.",
            },
          },
        };
      }
      if (job.rows[0].status !== "accepted" && job.rows[0].status !== "in_progress") {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [merchantId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: { code: "JOB_STATE_CONFLICT", message: "Only an accepted job can be started." },
          },
        };
      }
      if (job.rows[0].status === "accepted") {
        await client.query(
          "UPDATE service_booking SET status = 'in_progress', updated_at = clock_timestamp(), version = version + 1 WHERE id = $1 AND merchant_id = $2 AND status = 'accepted'",
          [bookingId.data, merchantId],
        );
      }
      await client.query(
        `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key)
         VALUES ($1, 'customer.booking_in_progress', $2, $3::jsonb, $4) ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          randomUUID(),
          bookingId.data,
          JSON.stringify({ bookingId: bookingId.data }),
          `booking-in-progress:${bookingId.data}`,
        ],
      );
      const body = { job: { id: bookingId.data, status: "in_progress" } };
      await client.query(
        "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
        [merchantId, routeKey, key, JSON.stringify(body)],
      );
      return { status: 200, body };
    });
    return response.status(result.status).json(result.body);
  }

  return { listOffers, respondToOffer, listJobs, startJob };
}
