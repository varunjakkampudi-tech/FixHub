import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import { z } from "zod";

import { inTransaction } from "./database";
import { decryptPhone } from "./whatsapp-contact";

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
        `UPDATE transactional_outbox SET status = 'failed', claim_token = NULL, claimed_at = NULL,
                processed_at = clock_timestamp(), last_error_code = 'attempts_exhausted'
         WHERE status = 'processing' AND attempt_count >= $1
           AND claimed_at < clock_timestamp() - ($2::int * interval '1 millisecond')`,
        [maxAttempts, leaseDurationMs],
      );
      const token = randomUUID();
      const result = await client.query<OutboxRecord>(
        `WITH candidate AS (
           SELECT id FROM transactional_outbox
           WHERE attempt_count < $1 AND (
             (status = 'pending' AND available_at <= clock_timestamp()) OR
             (status = 'processing' AND claimed_at < clock_timestamp() - ($2::int * interval '1 millisecond'))
           )
           ORDER BY available_at, created_at
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE transactional_outbox AS outbox
         SET status = 'processing', attempt_count = attempt_count + 1,
             claimed_at = clock_timestamp(), claim_token = $3, last_attempt_at = clock_timestamp(), last_error_code = NULL
         FROM candidate WHERE outbox.id = candidate.id
         RETURNING outbox.id, outbox.event_type, outbox.payload, outbox.attempt_count, outbox.claim_token`,
        [maxAttempts, leaseDurationMs, token],
      );
      return result.rows[0] ?? null;
    });
  }

  async function resolveNotification(event: OutboxRecord): Promise<Notification | null> {
    let payload: unknown;
    try { payload = typeof event.payload === "string" ? JSON.parse(event.payload) : event.payload; }
    catch { return null; }
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) return null;
    const { bookingId, merchantId, offerId } = parsed.data;
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

  async function updateClaim(event: OutboxRecord, values: { status: "sent" | "suppressed" | "pending" | "failed"; errorCode?: string; delayMs?: number; messageSid?: string; providerStatus?: string }) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE transactional_outbox
         SET status = $3, claim_token = NULL, claimed_at = NULL, last_error_code = $4,
             provider_message_id = COALESCE($5, provider_message_id), provider_status = COALESCE($7, provider_status),
             available_at = CASE WHEN $3 = 'pending' THEN clock_timestamp() + ($6::int * interval '1 millisecond') ELSE available_at END,
             processed_at = CASE WHEN $3 IN ('sent', 'suppressed', 'failed') THEN clock_timestamp() ELSE NULL END
         WHERE id = $1 AND claim_token = $2 AND status = 'processing'`,
        [event.id, event.claim_token, values.status, values.errorCode ?? null, values.messageSid ?? null, values.delayMs ?? 0, values.providerStatus ?? null],
      );
      if (result.rowCount !== 1) throw new Error("Notification outbox lease was lost");
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
    let delivery: { kind: "sent"; messageSid: string; providerStatus: string } | { kind: "suppressed"; errorCode: string } | { kind: "failed" } = { kind: "failed" };
    try {
      await client.query("BEGIN");
      transactionOpen = true;
      const identity = await client.query<{ status: string }>("SELECT status FROM identity_subject WHERE id = $1 FOR SHARE", [notification.recipientId]);
      const contactResult = await client.query<{
        phone_ciphertext: Buffer;
        phone_iv: Buffer;
        phone_auth_tag: Buffer;
        phone_verified_at: Date | null;
        consent_revoked_at: Date | null;
      }>("SELECT phone_ciphertext, phone_iv, phone_auth_tag, phone_verified_at, consent_revoked_at FROM whatsapp_contact WHERE subject_id = $1 FOR SHARE", [notification.recipientId]);
      const contact = contactResult.rows[0];
      if (identity.rows[0]?.status !== "active" || !contact?.phone_verified_at || contact.consent_revoked_at !== null) {
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
          const sent = await send(recipient, { "1": notification.label, "2": notification.service.slice(0, 120), "3": notification.locality.slice(0, 120) });
          await client.query("COMMIT");
          transactionOpen = false;
          delivery = { kind: "sent", messageSid: sent.messageSid, providerStatus: sent.status };
        }
      }
    } catch {
      if (transactionOpen) {
        try { await client.query("ROLLBACK"); } catch { destroyClient = true; }
      }
      delivery = { kind: "failed" };
    } finally { client.release(destroyClient); }

    if (delivery.kind === "suppressed") {
      await updateClaim(event, { status: "suppressed", errorCode: delivery.errorCode });
      return "suppressed";
    }
    if (delivery.kind === "sent") {
      await updateClaim(event, { status: "sent", messageSid: delivery.messageSid, providerStatus: delivery.providerStatus });
      return "sent";
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
