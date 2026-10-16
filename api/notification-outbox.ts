import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";

import { inTransaction } from "./database";
import { decryptPhone, transactionalWhatsappPolicyVersion } from "./whatsapp-contact";

const payloadSchema = z.object({
  bookingId: z.string().uuid(),
  merchantId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
}).passthrough();

const maxAttempts = 8;
const leaseDurationMs = 2 * 60_000;
const maxBatchSize = 10;
const maxProviderRequestsPerMinute = 12;

type OutboxRecord = {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: unknown;
  attempt_count: number;
  claim_token: string;
};

type Notification = { recipientId: string; label: string; service: string; locality: string };
export type TransactionalWhatsAppSender = (recipientE164: string, variables: Record<string, string>) => Promise<{ messageSid: string; status: string }>;

export function createNotificationOutboxDispatcher(
  pool: Pick<Pool, "connect">,
  encryptionKey: Buffer,
  send: TransactionalWhatsAppSender,
) {
  if (encryptionKey.length !== 32) throw new Error("WhatsApp contact encryption key is invalid");
  let running = false;

  async function claim(): Promise<OutboxRecord | null> {
    return inTransaction(pool, async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(hashtext('fixhub-whatsapp-outbox-rate'))");
      const recent = await client.query<{ attempts: number }>(
        "SELECT count(*)::int AS attempts FROM transactional_outbox WHERE last_attempt_at >= clock_timestamp() - interval '1 minute'",
      );
      if (Number(recent.rows[0]?.attempts ?? 0) >= maxProviderRequestsPerMinute) return null;
      await client.query(
        `UPDATE transactional_outbox SET status = 'uncertain', claim_token = NULL, claimed_at = NULL,
                processed_at = clock_timestamp(), last_error_code = 'provider_outcome_unknown'
         WHERE status = 'processing' AND provider_attempt_started_at IS NOT NULL
           AND claimed_at < clock_timestamp() - ($1::int * interval '1 millisecond')`,
        [leaseDurationMs],
      );
      await client.query(
        `UPDATE transactional_outbox SET status = 'failed', claim_token = NULL, claimed_at = NULL,
                processed_at = clock_timestamp(), last_error_code = 'attempts_exhausted'
         WHERE status = 'processing' AND provider_attempt_started_at IS NULL AND attempt_count >= $1
           AND claimed_at < clock_timestamp() - ($2::int * interval '1 millisecond')`,
        [maxAttempts, leaseDurationMs],
      );
      const token = randomUUID();
      const result = await client.query<OutboxRecord>(
        `WITH candidate AS (
           SELECT id FROM transactional_outbox
           WHERE attempt_count < $1 AND (
             (status = 'pending' AND provider_attempt_started_at IS NULL AND available_at <= clock_timestamp()) OR
             (status = 'processing' AND provider_attempt_started_at IS NULL
               AND claimed_at < clock_timestamp() - ($2::int * interval '1 millisecond'))
           )
           ORDER BY available_at, created_at
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE transactional_outbox AS outbox
         SET status = 'processing', attempt_count = attempt_count + 1,
             claimed_at = clock_timestamp(), claim_token = $3, last_attempt_at = clock_timestamp(),
             provider_attempt_started_at = NULL, last_error_code = NULL
         FROM candidate WHERE outbox.id = candidate.id
         RETURNING outbox.id, outbox.event_type, outbox.aggregate_id, outbox.payload, outbox.attempt_count, outbox.claim_token`,
        [maxAttempts, leaseDurationMs, token],
      );
      return result.rows[0] ?? null;
    });
  }

  async function resolveNotification(event: OutboxRecord): Promise<Notification | null> {
    let payload: unknown;
    try { payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload; }
    catch { return null; }
    const requestCreated = event.event_type === "request.created";
    const parsed = payloadSchema.safeParse(payload);
    if (!requestCreated && (!parsed.success || parsed.data.bookingId !== event.aggregate_id)) return null;
    const bookingId = requestCreated ? event.aggregate_id : parsed.success ? parsed.data.bookingId : "";
    const merchantId = parsed.success ? parsed.data.merchantId : undefined;
    const offerId = parsed.success ? parsed.data.offerId : undefined;
    const client = await pool.connect();
    try {
      let result;
      if (event.event_type === "merchant.booking_offer" && merchantId && offerId) {
        result = await client.query<Notification>(
          `SELECT m.subject_id AS "recipientId", 'New service request' AS label, s.name AS service, a.locality
           FROM booking_offer o
           JOIN service_booking b ON b.id = o.booking_id
           JOIN merchant_profile m ON m.subject_id = o.merchant_id
           JOIN identity_subject i ON i.id = m.subject_id AND i.status = 'active'
           JOIN service_catalog s ON s.id = b.service_id
           JOIN customer_address a ON a.id = b.address_id
           WHERE o.id = $1 AND o.booking_id = $2 AND o.merchant_id = $3 AND o.status = 'pending'
             AND (o.expires_at IS NULL OR o.expires_at > clock_timestamp())
             AND b.status = 'offered' AND b.merchant_id IS NULL
             AND m.verification_status = 'verified' AND m.accepting_jobs = true`,
          [offerId, bookingId, merchantId],
        );
      } else if (event.event_type === "request.created") {
        result = await client.query<Notification>(
          `SELECT b.customer_id AS "recipientId", 'Your request is recorded. No provider is assigned yet.' AS label,
                  ''::text AS service, ''::text AS locality
           FROM service_booking b
           JOIN identity_subject i ON i.id = b.customer_id AND i.status = 'active'
           WHERE b.id = $1 AND b.status = 'offered' AND b.merchant_id IS NULL`,
          [event.aggregate_id],
        );
      } else if (event.event_type === "customer.booking_accepted" || event.event_type === "customer.booking_in_progress") {
        const expectedStatus = event.event_type === "customer.booking_accepted" ? "accepted" : "in_progress";
        const label = expectedStatus === "accepted" ? "Provider accepted" : "Work started";
        result = await client.query<Notification>(
          `SELECT b.customer_id AS "recipientId", $2::text AS label, s.name AS service, a.locality
           FROM service_booking b
           JOIN identity_subject i ON i.id = b.customer_id AND i.status = 'active'
           JOIN service_catalog s ON s.id = b.service_id
           JOIN customer_address a ON a.id = b.address_id
           WHERE b.id = $1 AND b.status = $3`,
          [bookingId, label, expectedStatus],
        );
      } else if (event.event_type === "merchant.booking_completed" && merchantId) {
        result = await client.query<Notification>(
          `SELECT b.merchant_id AS "recipientId", 'Service completed' AS label, s.name AS service, a.locality
           FROM service_booking b
           JOIN merchant_profile m ON m.subject_id = b.merchant_id AND m.verification_status = 'verified'
           JOIN identity_subject i ON i.id = m.subject_id AND i.status = 'active'
           JOIN service_catalog s ON s.id = b.service_id
           JOIN customer_address a ON a.id = b.address_id
           WHERE b.id = $1 AND b.merchant_id = $2 AND b.status = 'completed'`,
          [bookingId, merchantId],
        );
      } else {
        return null;
      }
      return result.rows[0] ?? null;
    } finally { client.release(); }
  }

  async function notificationIsCurrent(event: OutboxRecord, client: PoolClient): Promise<boolean> {
    let payload: unknown;
    try { payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload; }
    catch { return false; }
    const parsed = payloadSchema.safeParse(payload);
    const bookingId = event.aggregate_id;

    if (event.event_type === "request.created") {
      const booking = await client.query<{ status: string; merchant_id: string | null }>(
        "SELECT status, merchant_id FROM service_booking WHERE id = $1 FOR SHARE",
        [bookingId],
      );
      return booking.rows[0]?.status === "offered" && booking.rows[0]?.merchant_id === null;
    }

    if (!parsed.success || parsed.data.bookingId !== bookingId) return false;
    const { merchantId, offerId } = parsed.data;
    if (event.event_type === "merchant.booking_offer" && merchantId && offerId) {
      const booking = await client.query<{ status: string; merchant_id: string | null }>(
        "SELECT status, merchant_id FROM service_booking WHERE id = $1 FOR SHARE",
        [bookingId],
      );
      if (booking.rows[0]?.status !== "offered" || booking.rows[0]?.merchant_id !== null) return false;
      const offer = await client.query<{ status: string; active: boolean }>(
        `SELECT status, (expires_at IS NULL OR expires_at > clock_timestamp()) AS active
         FROM booking_offer WHERE id = $1 AND booking_id = $2 AND merchant_id = $3 FOR SHARE`,
        [offerId, bookingId, merchantId],
      );
      if (offer.rows[0]?.status !== "pending" || offer.rows[0]?.active !== true) return false;
      const profile = await client.query<{ verification_status: string; accepting_jobs: boolean }>(
        "SELECT verification_status, accepting_jobs FROM merchant_profile WHERE subject_id = $1 FOR SHARE",
        [merchantId],
      );
      return profile.rows[0]?.verification_status === "verified" && profile.rows[0]?.accepting_jobs === true;
    }

    if (event.event_type === "customer.booking_accepted" || event.event_type === "customer.booking_in_progress") {
      const expected = event.event_type === "customer.booking_accepted" ? "accepted" : "in_progress";
      const booking = await client.query<{ status: string }>(
        "SELECT status FROM service_booking WHERE id = $1 FOR SHARE",
        [bookingId],
      );
      return booking.rows[0]?.status === expected;
    }

    if (event.event_type === "merchant.booking_completed" && merchantId) {
      const booking = await client.query<{ status: string; merchant_id: string | null }>(
        "SELECT status, merchant_id FROM service_booking WHERE id = $1 FOR SHARE",
        [bookingId],
      );
      if (booking.rows[0]?.status !== "completed" || booking.rows[0]?.merchant_id !== merchantId) return false;
      const profile = await client.query<{ verification_status: string }>(
        "SELECT verification_status FROM merchant_profile WHERE subject_id = $1 FOR SHARE",
        [merchantId],
      );
      return profile.rows[0]?.verification_status === "verified";
    }
    return false;
  }

  async function updateClaim(event: OutboxRecord, values: { status: "sent" | "suppressed" | "pending" | "failed" | "uncertain"; errorCode?: string; delayMs?: number; messageSid?: string; providerStatus?: string }) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE transactional_outbox
         SET status = $3, claim_token = NULL, claimed_at = NULL, last_error_code = $4,
             provider_message_id = COALESCE($5, provider_message_id), provider_status = COALESCE($7, provider_status),
             available_at = CASE WHEN $3 = 'pending' THEN clock_timestamp() + ($6::int * interval '1 millisecond') ELSE available_at END,
             processed_at = CASE WHEN $3 IN ('sent', 'suppressed', 'failed', 'uncertain') THEN clock_timestamp() ELSE NULL END
         WHERE id = $1 AND claim_token = $2 AND status = 'processing'`,
        [event.id, event.claim_token, values.status, values.errorCode ?? null, values.messageSid ?? null, values.delayMs ?? 0, values.providerStatus ?? null],
      );
      if (result.rowCount !== 1) throw new Error("Notification outbox lease was lost");
    } finally { client.release(); }
  }

  async function markProviderAttemptStarted(event: OutboxRecord): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query<{ id: string }>(
        `UPDATE transactional_outbox
         SET provider_attempt_started_at = clock_timestamp(), claimed_at = clock_timestamp()
         WHERE id = $1 AND claim_token = $2 AND status = 'processing'
           AND provider_attempt_started_at IS NULL
         RETURNING id`,
        [event.id, event.claim_token],
      );
      return result.rows.length === 1;
    } finally { client.release(); }
  }

  async function retry(event: OutboxRecord, errorCode: string): Promise<"failed" | "retry"> {
    const terminal = event.attempt_count >= maxAttempts;
    const exponentialDelay = Math.min(30 * 60_000, 5_000 * 2 ** Math.max(0, event.attempt_count - 1));
    const jitteredDelay = Math.floor(exponentialDelay * (0.75 + Math.random() * 0.5));
    await updateClaim(event, { status: terminal ? "failed" : "pending", errorCode, delayMs: jitteredDelay });
    return terminal ? "failed" : "retry";
  }

  async function processOne(): Promise<"empty" | "sent" | "suppressed" | "failed" | "retry"> {
    const event = await claim();
    if (!event) return "empty";
    let notification: Notification | null;
    try { notification = await resolveNotification(event); }
    catch {
      return retry(event, "event_resolution_failed");
    }
    if (!notification) {
      await updateClaim(event, { status: "suppressed", errorCode: "event_not_current_or_unsupported" });
      return "suppressed";
    }
    const client = await pool.connect();
    let transactionOpen = false;
    let destroyClient = false;
    let providerOutcomeUncertain = false;
    let delivery: { kind: "sent"; messageSid: string; providerStatus: string } | { kind: "suppressed"; errorCode: string } | { kind: "uncertain" } | { kind: "lease_lost" } | { kind: "failed" } = { kind: "failed" };
    try {
      await client.query("BEGIN");
      transactionOpen = true;
      if (!await notificationIsCurrent(event, client)) {
        await client.query("COMMIT");
        transactionOpen = false;
        delivery = { kind: "suppressed", errorCode: "event_not_current_or_unsupported" };
      }
      const identity = delivery.kind === "suppressed" ? { rows: [] } : await client.query<{ status: string }>("SELECT status FROM identity_subject WHERE id = $1 FOR SHARE", [notification.recipientId]);
      const contactResult = delivery.kind === "suppressed" ? { rows: [] } : await client.query<{
        phone_ciphertext: Buffer;
        phone_iv: Buffer;
        phone_auth_tag: Buffer;
        phone_verified_at: Date | null;
        consent_policy_version: string;
        consent_revoked_at: Date | null;
      }>("SELECT phone_ciphertext, phone_iv, phone_auth_tag, phone_verified_at, consent_policy_version, consent_revoked_at FROM whatsapp_contact WHERE subject_id = $1 FOR SHARE", [notification.recipientId]);
      const contact = contactResult.rows[0];
      if (delivery.kind === "suppressed") {
        // The booking transitioned after resolution; the row lock prevents another change before this commit.
      } else if (identity.rows[0]?.status !== "active" || !contact?.phone_verified_at || contact.consent_revoked_at !== null || contact.consent_policy_version !== transactionalWhatsappPolicyVersion) {
        await client.query("COMMIT");
        transactionOpen = false;
        delivery = { kind: "suppressed", errorCode: "missing_consent_or_verified_contact" };
      } else {
        let recipient: string | null;
        try {
          recipient = decryptPhone({ ciphertext: contact.phone_ciphertext, iv: contact.phone_iv, authTag: contact.phone_auth_tag }, notification.recipientId, encryptionKey);
        } catch {
          recipient = null;
        }
        if (!recipient) {
          await client.query("COMMIT");
          transactionOpen = false;
          delivery = { kind: "suppressed", errorCode: "contact_unavailable" };
        } else {
          const variables: Record<string, string> = event.event_type === "request.created"
            ? { "1": notification.label, "2": "", "3": "" }
            : { "1": notification.label, "2": notification.service.slice(0, 120), "3": notification.locality.slice(0, 120) };
          providerOutcomeUncertain = true;
          if (!await markProviderAttemptStarted(event)) {
            await client.query("COMMIT");
            transactionOpen = false;
            delivery = { kind: "lease_lost" };
          } else {
            const sent = await send(recipient, variables);
            const recorded = await client.query(
              `UPDATE transactional_outbox
               SET status = 'sent', claim_token = NULL, claimed_at = NULL, last_error_code = NULL,
                   provider_message_id = $3, provider_status = $4, processed_at = clock_timestamp()
               WHERE id = $1 AND claim_token = $2 AND status = 'processing'`,
              [event.id, event.claim_token, sent.messageSid, sent.status],
            );
            if (recorded.rowCount !== 1) throw new Error("Notification outbox lease was lost after provider acceptance");
            await client.query("COMMIT");
            transactionOpen = false;
            delivery = { kind: "sent", messageSid: sent.messageSid, providerStatus: sent.status };
          }
        }
      }
    } catch {
      if (transactionOpen) {
        try { await client.query("ROLLBACK"); } catch { destroyClient = true; }
      }
      delivery = providerOutcomeUncertain ? { kind: "uncertain" } : { kind: "failed" };
    } finally { client.release(destroyClient); }

    if (delivery.kind === "suppressed") {
      await updateClaim(event, { status: "suppressed", errorCode: delivery.errorCode });
      return "suppressed";
    }
    if (delivery.kind === "sent") {
      return "sent";
    }
    if (delivery.kind === "lease_lost") return "failed";
    if (delivery.kind === "uncertain") {
      // Durable provider-attempt markers keep ambiguous delivery out of automatic lease recovery.
      try { await updateClaim(event, { status: "uncertain", errorCode: "provider_outcome_unknown" }); } catch { /* The durable attempt marker lets the stale-lease sweep quarantine it later. */ }
      return "failed";
    }
    return retry(event, "provider_delivery_failed");
  }

  async function dispatchBatch(limit = maxBatchSize) {
    if (running) return { sent: 0, suppressed: 0, failed: 0, retry: 0 };
    running = true;
    const counts = { sent: 0, suppressed: 0, failed: 0, retry: 0 };
    try {
      for (let index = 0; index < Math.max(0, Math.min(maxBatchSize, Math.floor(limit))); index += 1) {
        const result = await processOne();
        if (result === "empty") break;
        counts[result] += 1;
      }
      return counts;
    } finally { running = false; }
  }

  return { dispatchBatch };
}
