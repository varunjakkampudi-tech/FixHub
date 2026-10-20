import { createHash, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { Pool, QueryResultRow } from "pg";
import { z } from "zod";

import { inTransaction } from "./database";
import { bookingQuoteHash } from "./quote";

const addressInput = z
  .object({
    label: z.string().trim().min(1).max(40),
    address: z.string().trim().min(5).max(500),
    locality: z.string().trim().min(2).max(120),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .strict()
  .refine(
    (value) => (value.latitude === undefined) === (value.longitude === undefined),
    "Latitude and longitude must be provided together",
  );

const bookingInput = z
  .object({
    serviceId: z.string().uuid(),
    addressId: z.string().uuid(),
    scheduledAt: z.string().datetime({ offset: true }).optional(),
    note: z.string().trim().max(2000).default(""),
  })
  .strict()
  .refine((value) => {
    if (!value.scheduledAt) return true;
    const instant = Date.parse(value.scheduledAt);
    return instant >= Date.now() + 10 * 60_000 && instant <= Date.now() + 90 * 24 * 60 * 60_000;
  }, "Choose a time at least ten minutes from now and within ninety days");

const pricingPreviewInput = z
  .object({
    serviceId: z.string().uuid(),
    addressId: z.string().uuid(),
  })
  .strict();

type Candidate = {
  merchant_id: string;
  business_name: string;
  visit_price_paise: number | string;
  labor_from_paise: number | string;
  latitude: number | string | null;
  longitude: number | string | null;
  service_radius_km: number | string;
};

type AddressRecord = QueryResultRow & {
  latitude: number | string | null;
  longitude: number | string | null;
};

function addressResponse(row: AddressRecord) {
  return {
    ...row,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
  };
}

export function distanceKm(latA: number, lonA: number, latB: number, lonB: number): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(latB - latA);
  const dLon = radians(lonB - lonA);
  const a = Math.min(
    1,
    Math.max(
      0,
      Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(dLon / 2) ** 2,
    ),
  );
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function eligibleCandidates(
  candidates: Candidate[],
  location: { latitude: number; longitude: number } | null,
): Candidate[] {
  if (!location) return [];
  return candidates.filter((candidate) => {
    if (candidate.latitude === null || candidate.longitude === null) return false;
    const distance = distanceKm(
      location.latitude,
      location.longitude,
      Number(candidate.latitude),
      Number(candidate.longitude),
    );
    return distance <= Number(candidate.service_radius_km);
  });
}

function authSubject(response: Response): string | undefined {
  const auth = response.locals.auth as { subjectId?: unknown } | undefined;
  return typeof auth?.subjectId === "string" ? auth.subjectId : undefined;
}

function invalidInput(response: Response, issues: unknown) {
  return response.status(400).json({
    error: { code: "INVALID_INPUT", message: "Check the submitted information." },
    issues,
  });
}

export function createMarketplaceHandlers(pool: Pick<Pool, "connect">) {
  async function listServices(_request: Request, response: Response) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, slug, name, category, description FROM service_catalog WHERE active = true ORDER BY category, name",
      );
      return response.status(200).json({ items: result.rows });
    } finally {
      client.release();
    }
  }

  async function listAddresses(_request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const client = await pool.connect();
    try {
      const result = await client.query<AddressRecord>(
        `SELECT id, label, address_text AS address, locality, latitude, longitude, created_at
         FROM customer_address WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [customerId],
      );
      return response.status(200).json({ items: result.rows.map(addressResponse) });
    } finally {
      client.release();
    }
  }

  async function previewPrice(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const parsed = pricingPreviewInput.safeParse(request.query);
    if (!parsed.success)
      return invalidInput(
        response,
        parsed.error.issues.map(({ path, code }) => ({ path, code })),
      );

    const client = await pool.connect();
    try {
      const address = await client.query<{
        latitude: number | string | null;
        longitude: number | string | null;
      }>("SELECT latitude, longitude FROM customer_address WHERE id = $1 AND customer_id = $2", [
        parsed.data.addressId,
        customerId,
      ]);
      if (!address.rows.length)
        return response.status(404).json({
          error: { code: "ADDRESS_NOT_FOUND", message: "Choose one of your saved addresses." },
        });

      const service = await client.query<{ id: string }>(
        "SELECT id FROM service_catalog WHERE id = $1 AND active = true",
        [parsed.data.serviceId],
      );
      if (!service.rows.length)
        return response
          .status(404)
          .json({ error: { code: "SERVICE_NOT_FOUND", message: "Choose an active service." } });

      const candidates = await client.query<Candidate>(
        `SELECT m.subject_id AS merchant_id, m.business_name, m.latitude, m.longitude, m.service_radius_km,
                ms.visit_price_paise, ms.labor_from_paise
         FROM merchant_profile m
         JOIN merchant_service ms ON ms.merchant_id = m.subject_id AND ms.active = true
         WHERE ms.service_id = $1 AND m.verification_status = 'verified' AND m.accepting_jobs = true
         ORDER BY m.business_name`,
        [parsed.data.serviceId],
      );
      const location =
        address.rows[0].latitude !== null && address.rows[0].longitude !== null
          ? {
              latitude: Number(address.rows[0].latitude),
              longitude: Number(address.rows[0].longitude),
            }
          : null;
      const eligible = eligibleCandidates(candidates.rows, location);
      const totals = eligible.map(
        (candidate) => Number(candidate.visit_price_paise) + Number(candidate.labor_from_paise),
      );
      const available = totals.length > 0;
      return response.status(200).json({
        available,
        currency: "INR",
        paymentMethod: "cash_on_completion",
        minTotalPaise: available ? Math.min(...totals) : null,
        maxTotalPaise: available ? Math.max(...totals) : null,
        partsIncluded: false,
      });
    } finally {
      client.release();
    }
  }

  async function createAddress(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const parsed = addressInput.safeParse(request.body);
    if (!parsed.success)
      return invalidInput(
        response,
        parsed.error.issues.map(({ path, code }) => ({ path, code })),
      );
    const id = randomUUID();
    const { label, address, locality, latitude, longitude } = parsed.data;
    const client = await pool.connect();
    try {
      const result = await client.query<AddressRecord>(
        `INSERT INTO customer_address (id, customer_id, label, address_text, locality, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, label, address_text AS address, locality, latitude, longitude, created_at`,
        [id, customerId, label, address, locality, latitude ?? null, longitude ?? null],
      );
      return response.status(201).json({ item: addressResponse(result.rows[0]) });
    } finally {
      client.release();
    }
  }

  async function createBooking(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const parsed = bookingInput.safeParse(request.body);
    if (!parsed.success)
      return invalidInput(
        response,
        parsed.error.issues.map(({ path, code }) => ({ path, code })),
      );
    const idempotencyKey = request.get("Idempotency-Key");
    if (!idempotencyKey || !/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) {
      return response.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Provide a valid Idempotency-Key header.",
        },
      });
    }
    const payload = parsed.data;
    const requestHash = createHash("sha256").update(JSON.stringify(payload)).digest();
    const routeKey = "POST:/api/v1/customer/bookings";
    const result = await inTransaction(pool, async (client) => {
      const reservation = await client.query(
        `INSERT INTO request_idempotency (subject_id, route_key, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING idempotency_key`,
        [customerId, routeKey, idempotencyKey, requestHash],
      );
      if (!reservation.rows.length) {
        const previous = await client.query<{
          request_hash: Buffer;
          response_body: QueryResultRow;
        }>(
          `SELECT request_hash, response_body FROM request_idempotency
           WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3 FOR UPDATE`,
          [customerId, routeKey, idempotencyKey],
        );
        if (!previous.rows.length)
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_CONFLICT",
                message: "The request could not be replayed.",
              },
            },
          };
        if (!previous.rows[0].request_hash.equals(requestHash)) {
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message: "Use a new key for a different request.",
              },
            },
          };
        }
        if (previous.rows[0].response_body)
          return { status: 200, body: previous.rows[0].response_body, replayed: true };
        return {
          status: 409,
          body: {
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "A request with this key is still being processed.",
            },
          },
        };
      }

      const address = await client.query<{ latitude: number | null; longitude: number | null }>(
        "SELECT latitude, longitude FROM customer_address WHERE id = $1 AND customer_id = $2",
        [payload.addressId, customerId],
      );
      if (!address.rows.length) {
        const body = {
          error: { code: "ADDRESS_NOT_FOUND", message: "Choose one of your saved addresses." },
        };
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, idempotencyKey],
        );
        return { status: 404, body };
      }
      const service = await client.query<{ id: string; name: string }>(
        "SELECT id, name FROM service_catalog WHERE id = $1 AND active = true",
        [payload.serviceId],
      );
      if (!service.rows.length) {
        const body = { error: { code: "SERVICE_NOT_FOUND", message: "Choose an active service." } };
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, idempotencyKey],
        );
        return { status: 404, body };
      }

      const candidates = await client.query<Candidate>(
        `SELECT m.subject_id AS merchant_id, m.business_name, m.latitude, m.longitude, m.service_radius_km,
                ms.visit_price_paise, ms.labor_from_paise
         FROM merchant_profile m
         JOIN merchant_service ms ON ms.merchant_id = m.subject_id AND ms.active = true
         WHERE ms.service_id = $1 AND m.verification_status = 'verified' AND m.accepting_jobs = true
         ORDER BY m.business_name`,
        [payload.serviceId],
      );
      const eligible = eligibleCandidates(
        candidates.rows,
        address.rows[0].latitude !== null && address.rows[0].longitude !== null
          ? {
              latitude: Number(address.rows[0].latitude),
              longitude: Number(address.rows[0].longitude),
            }
          : null,
      );
      if (!eligible.length) {
        const body = {
          error: {
            code: "NO_ELIGIBLE_PROVIDER",
            message: "No verified provider is currently available for this service and location.",
          },
        };
        // No booking or offer side effect was created; allow a later retry with the
        // same key to observe changed provider availability.
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, idempotencyKey],
        );
        return { status: 409, body };
      }

      const cheapest = eligible.reduce((best, candidate) =>
        Number(candidate.visit_price_paise) + Number(candidate.labor_from_paise) <
        Number(best.visit_price_paise) + Number(best.labor_from_paise)
          ? candidate
          : best,
      );
      const bookingId = randomUUID();
      const serviceTotal = (candidate: Candidate) =>
        Number(candidate.visit_price_paise) + Number(candidate.labor_from_paise);
      await client.query(
        `INSERT INTO service_booking
          (id, customer_id, service_id, address_id, status, scheduled_at, customer_note, visit_price_paise, labor_estimate_paise)
         VALUES ($1, $2, $3, $4, 'offered', $5, $6, $7, $8)`,
        [
          bookingId,
          customerId,
          payload.serviceId,
          payload.addressId,
          payload.scheduledAt ?? null,
          payload.note,
          Number(cheapest.visit_price_paise),
          Number(cheapest.labor_from_paise),
        ],
      );
      for (const candidate of eligible) {
        const offerId = randomUUID();
        const eventId = randomUUID();
        await client.query(
          `INSERT INTO booking_offer (id, booking_id, merchant_id, visit_price_paise, labor_price_paise, expires_at)
           VALUES ($1, $2, $3, $4, $5, clock_timestamp() + interval '15 minutes')`,
          [
            offerId,
            bookingId,
            candidate.merchant_id,
            Number(candidate.visit_price_paise),
            Number(candidate.labor_from_paise),
          ],
        );
        await client.query(
          `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key)
           VALUES ($1, 'merchant.booking_offer', $2, $3::jsonb, $4)`,
          [
            eventId,
            bookingId,
            JSON.stringify({
              bookingId,
              offerId,
              merchantId: candidate.merchant_id,
              serviceId: payload.serviceId,
            }),
            `booking-offer:${offerId}`,
          ],
        );
      }
      const customerEventId = randomUUID();
      await client.query(
        `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key)
         VALUES ($1, 'request.created', $2, '{}'::jsonb, $3)`,
        [customerEventId, bookingId, `request-created:${bookingId}`],
      );
      const body = {
        booking: {
          id: bookingId,
          serviceId: payload.serviceId,
          serviceName: service.rows[0].name,
          status: "offered",
          paymentMethod: "cash_on_completion",
          currency: "INR",
          estimate: {
            visitPaise: Number(cheapest.visit_price_paise),
            laborFromPaise: Number(cheapest.labor_from_paise),
            totalFromPaise: serviceTotal(cheapest),
          },
          eligibleProviderCandidates: eligible.length,
          notificationStatus: "not_dispatched",
          notice:
            "Request and eligible offers are saved. WhatsApp delivery is attempted asynchronously only when enabled and permitted; an accepted offer in FixHub24 confirms assignment.",
          createdAt: new Date().toISOString(),
        },
      };
      await client.query(
        "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
        [customerId, routeKey, idempotencyKey, JSON.stringify(body)],
      );
      return { status: 201, body };
    });
    if (result.status >= 400) return response.status(result.status).json(result.body);
    return response.status(result.status).json(result.body);
  }

  async function listBookings(_request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT b.id, b.status, b.scheduled_at, b.visit_price_paise, b.labor_estimate_paise, b.parts_estimate_paise,
                b.currency, b.payment_method, b.created_at, s.name AS service_name,
                a.label AS address_label, a.locality, m.business_name, r.rating AS customer_rating, r.comment AS customer_review
         FROM service_booking b
         JOIN service_catalog s ON s.id = b.service_id
         JOIN customer_address a ON a.id = b.address_id AND a.customer_id = b.customer_id
         LEFT JOIN merchant_profile m ON m.subject_id = b.merchant_id
         LEFT JOIN booking_review r ON r.booking_id = b.id AND r.customer_id = b.customer_id
         WHERE b.customer_id = $1 ORDER BY b.created_at DESC LIMIT 50`,
        [customerId],
      );
      return response.status(200).json({ items: result.rows });
    } finally {
      client.release();
    }
  }

  async function getBooking(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const id = z.string().uuid().safeParse(request.params.id);
    if (!id.success)
      return response
        .status(400)
        .json({ error: { code: "INVALID_INPUT", message: "The booking id is invalid." } });
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT b.id, b.status, b.scheduled_at, b.customer_note, b.visit_price_paise, b.labor_estimate_paise,
                b.parts_estimate_paise, b.currency, b.payment_method, b.created_at, s.name AS service_name,
                a.label AS address_label, a.address_text, a.locality, a.latitude, a.longitude, m.business_name,
                b.customer_quote_accepted_at, b.customer_accepted_quote_hash,
                r.rating AS customer_rating, r.comment AS customer_review
         FROM service_booking b
         JOIN service_catalog s ON s.id = b.service_id
         JOIN customer_address a ON a.id = b.address_id AND a.customer_id = b.customer_id
         LEFT JOIN merchant_profile m ON m.subject_id = b.merchant_id
         LEFT JOIN booking_review r ON r.booking_id = b.id AND r.customer_id = b.customer_id
         WHERE b.id = $1 AND b.customer_id = $2`,
        [id.data, customerId],
      );
      if (!result.rows.length)
        return response
          .status(404)
          .json({ error: { code: "BOOKING_NOT_FOUND", message: "The booking was not found." } });
      const row = result.rows[0] as (typeof result.rows)[number] & {
        customer_accepted_quote_hash?: Buffer | null;
        customer_quote_accepted_at?: Date | null;
      };
      const currentQuoteHash = bookingQuoteHash(row);
      const { customer_accepted_quote_hash: _acceptedQuoteHash, ...publicBooking } = row;
      return response.status(200).json({
        booking: {
          ...publicBooking,
          quote_version: currentQuoteHash.toString("base64url"),
          customer_quote_accepted: Boolean(
            row.customer_quote_accepted_at &&
            row.customer_accepted_quote_hash?.equals(currentQuoteHash),
          ),
        },
      });
    } finally {
      client.release();
    }
  }

  async function approveQuote(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const id = z.string().uuid().safeParse(request.params.id);
    const input = z
      .object({ confirm: z.literal(true), quoteVersion: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
      .strict()
      .safeParse(request.body);
    if (!id.success || !input.success) return invalidInput(response, []);
    const key = request.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key))
      return response.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Provide a valid Idempotency-Key header.",
        },
      });
    const routeKey = `POST:/api/v1/customer/bookings/${id.data}/quote-approval`;
    const requestHash = createHash("sha256").update(JSON.stringify(input.data)).digest();
    const result = await inTransaction(pool, async (client) => {
      const reservation = await client.query(
        `INSERT INTO request_idempotency (subject_id, route_key, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING idempotency_key`,
        [customerId, routeKey, key, requestHash],
      );
      if (!reservation.rows.length) {
        const prior = await client.query<{ request_hash: Buffer; response_body: QueryResultRow }>(
          `SELECT request_hash, response_body FROM request_idempotency
           WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3 FOR UPDATE`,
          [customerId, routeKey, key],
        );
        if (!prior.rows.length || !prior.rows[0].request_hash.equals(requestHash))
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message: "Use a new key for a different quote approval.",
              },
            },
          };
        if (prior.rows[0].response_body) return { status: 200, body: prior.rows[0].response_body };
        return {
          status: 409,
          body: {
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "This quote approval is still being processed.",
            },
          },
        };
      }
      const booking = await client.query<{
        id: string;
        status: string;
        merchant_id: string | null;
        visit_price_paise: number | string;
        labor_estimate_paise: number | string;
        parts_estimate_paise: number | string | null;
        currency: string;
        payment_method: string;
        customer_quote_accepted_at: Date | null;
        customer_accepted_quote_hash: Buffer | null;
      }>(
        `SELECT id, status, merchant_id, visit_price_paise, labor_estimate_paise, parts_estimate_paise,
                currency, payment_method, customer_quote_accepted_at, customer_accepted_quote_hash
         FROM service_booking WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
        [id.data, customerId],
      );
      if (!booking.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 404,
          body: { error: { code: "BOOKING_NOT_FOUND", message: "The booking was not found." } },
        };
      }
      const current = booking.rows[0];
      if (current.status !== "accepted" || !current.merchant_id) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: "QUOTE_NOT_AVAILABLE",
              message: "A merchant must accept the request before you can approve its quote.",
            },
          },
        };
      }
      const quoteHash = bookingQuoteHash(current);
      const presentedQuoteHash = Buffer.from(input.data.quoteVersion, "base64url");
      if (
        presentedQuoteHash.length !== 32 ||
        presentedQuoteHash.toString("base64url") !== input.data.quoteVersion ||
        !presentedQuoteHash.equals(quoteHash)
      ) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: "QUOTE_CHANGED",
              message:
                "The quote changed after it was displayed. Refresh and review the current price before approving.",
            },
          },
        };
      }
      const alreadyAccepted = Boolean(
        current.customer_quote_accepted_at &&
        current.customer_accepted_quote_hash?.equals(quoteHash),
      );
      if (!alreadyAccepted) {
        await client.query(
          `UPDATE service_booking
           SET customer_quote_accepted_at = clock_timestamp(), customer_accepted_quote_hash = $2,
               updated_at = clock_timestamp(), version = version + 1
           WHERE id = $1 AND customer_id = $3 AND status = 'accepted'`,
          [id.data, quoteHash, customerId],
        );
      }
      const body = {
        quote: {
          bookingId: id.data,
          visitPricePaise: Number(current.visit_price_paise),
          laborEstimatePaise: Number(current.labor_estimate_paise),
          partsEstimatePaise:
            current.parts_estimate_paise === null ? null : Number(current.parts_estimate_paise),
          currency: current.currency,
          paymentMethod: current.payment_method,
          accepted: true,
        },
      };
      await client.query(
        "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
        [customerId, routeKey, key, JSON.stringify(body)],
      );
      return { status: 200, body };
    });
    return response.status(result.status).json(result.body);
  }

  async function confirmCompletion(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const id = z.string().uuid().safeParse(request.params.id);
    const input = z
      .object({ confirm: z.literal(true) })
      .strict()
      .safeParse(request.body);
    if (!id.success || !input.success) return invalidInput(response, []);
    const key = request.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key))
      return response.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Provide a valid Idempotency-Key header.",
        },
      });
    const routeKey = `POST:/api/v1/customer/bookings/${id.data}/complete`;
    const requestHash = createHash("sha256").update(JSON.stringify(input.data)).digest();
    const result = await inTransaction(pool, async (client) => {
      const reservation = await client.query(
        `INSERT INTO request_idempotency (subject_id, route_key, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING idempotency_key`,
        [customerId, routeKey, key, requestHash],
      );
      if (!reservation.rows.length) {
        const prior = await client.query<{ request_hash: Buffer; response_body: QueryResultRow }>(
          `SELECT request_hash, response_body FROM request_idempotency
           WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3 FOR UPDATE`,
          [customerId, routeKey, key],
        );
        if (!prior.rows.length || !prior.rows[0].request_hash.equals(requestHash))
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message: "Use a new key for a different action.",
              },
            },
          };
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
      const booking = await client.query<{ status: string; merchant_id: string | null }>(
        "SELECT status, merchant_id FROM service_booking WHERE id = $1 AND customer_id = $2 FOR UPDATE",
        [id.data, customerId],
      );
      if (!booking.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 404,
          body: { error: { code: "BOOKING_NOT_FOUND", message: "The booking was not found." } },
        };
      }
      if (
        (booking.rows[0].status !== "in_progress" && booking.rows[0].status !== "completed") ||
        !booking.rows[0].merchant_id
      ) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: "BOOKING_STATE_CONFLICT",
              message: "Only an in-progress service can be confirmed complete.",
            },
          },
        };
      }
      if (booking.rows[0].status === "in_progress") {
        await client.query(
          "UPDATE service_booking SET status = 'completed', updated_at = clock_timestamp(), version = version + 1 WHERE id = $1 AND customer_id = $2 AND status = 'in_progress'",
          [id.data, customerId],
        );
      }
      await client.query(
        `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key)
         VALUES ($1, 'merchant.booking_completed', $2, $3::jsonb, $4) ON CONFLICT (idempotency_key) DO NOTHING`,
        [
          randomUUID(),
          id.data,
          JSON.stringify({ bookingId: id.data, merchantId: booking.rows[0].merchant_id }),
          `booking-completed:${id.data}`,
        ],
      );
      const body = { booking: { id: id.data, status: "completed", reviewAllowed: true } };
      await client.query(
        "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
        [customerId, routeKey, key, JSON.stringify(body)],
      );
      return { status: 200, body };
    });
    return response.status(result.status).json(result.body);
  }

  async function createReview(request: Request, response: Response) {
    const customerId = authSubject(response);
    if (!customerId)
      return response
        .status(401)
        .json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    const id = z.string().uuid().safeParse(request.params.id);
    const input = z
      .object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).default(""),
      })
      .strict()
      .safeParse(request.body);
    if (!id.success || !input.success)
      return invalidInput(
        response,
        input.success ? [] : input.error.issues.map(({ path, code }) => ({ path, code })),
      );
    const key = request.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key))
      return response.status(400).json({
        error: {
          code: "IDEMPOTENCY_KEY_REQUIRED",
          message: "Provide a valid Idempotency-Key header.",
        },
      });
    const routeKey = `POST:/api/v1/customer/bookings/${id.data}/review`;
    const requestHash = createHash("sha256").update(JSON.stringify(input.data)).digest();
    const result = await inTransaction(pool, async (client) => {
      const reservation = await client.query(
        `INSERT INTO request_idempotency (subject_id, route_key, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING idempotency_key`,
        [customerId, routeKey, key, requestHash],
      );
      if (!reservation.rows.length) {
        const prior = await client.query<{ request_hash: Buffer; response_body: QueryResultRow }>(
          `SELECT request_hash, response_body FROM request_idempotency
           WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3 FOR UPDATE`,
          [customerId, routeKey, key],
        );
        if (!prior.rows.length || !prior.rows[0].request_hash.equals(requestHash))
          return {
            status: 409,
            body: {
              error: {
                code: "IDEMPOTENCY_KEY_REUSED",
                message: "Use a new key for a different review.",
              },
            },
          };
        if (prior.rows[0].response_body) return { status: 200, body: prior.rows[0].response_body };
        return {
          status: 409,
          body: {
            error: {
              code: "REQUEST_IN_PROGRESS",
              message: "This review is still being processed.",
            },
          },
        };
      }
      const booking = await client.query<{ status: string; merchant_id: string | null }>(
        "SELECT status, merchant_id FROM service_booking WHERE id = $1 AND customer_id = $2 FOR UPDATE",
        [id.data, customerId],
      );
      if (!booking.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 404,
          body: { error: { code: "BOOKING_NOT_FOUND", message: "The booking was not found." } },
        };
      }
      if (booking.rows[0].status !== "completed" || !booking.rows[0].merchant_id) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: "REVIEW_NOT_AVAILABLE",
              message: "A review can be submitted after customer-confirmed completion.",
            },
          },
        };
      }
      const review = await client.query<{ id: string; rating: number; comment: string }>(
        `INSERT INTO booking_review (id, booking_id, customer_id, merchant_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (booking_id) DO NOTHING RETURNING id, rating, comment`,
        [
          randomUUID(),
          id.data,
          customerId,
          booking.rows[0].merchant_id,
          input.data.rating,
          input.data.comment,
        ],
      );
      if (!review.rows.length) {
        await client.query(
          "DELETE FROM request_idempotency WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
          [customerId, routeKey, key],
        );
        return {
          status: 409,
          body: {
            error: {
              code: "REVIEW_ALREADY_SUBMITTED",
              message: "A review already exists for this booking.",
            },
          },
        };
      }
      const body = { review: review.rows[0] };
      await client.query(
        "UPDATE request_idempotency SET response_body = $4 WHERE subject_id = $1 AND route_key = $2 AND idempotency_key = $3",
        [customerId, routeKey, key, JSON.stringify(body)],
      );
      return { status: 201, body };
    });
    return response.status(result.status).json(result.body);
  }

  return {
    listServices,
    listAddresses,
    previewPrice,
    createAddress,
    createBooking,
    listBookings,
    getBooking,
    approveQuote,
    confirmCompletion,
    createReview,
  };
}
