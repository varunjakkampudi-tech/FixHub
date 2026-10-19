import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomInt, timingSafeEqual, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { Pool } from "pg";
import { z } from "zod";

import { inTransaction } from "./database";

const phoneSchema = z.string().regex(/^\+[1-9]\d{7,14}$/);
export const transactionalWhatsappPolicyVersion = "transactional-whatsapp-v1";
const challengeLifetimeMs = 10 * 60_000;
const resendDelayMs = 60_000;

export type WhatsAppContactConfig = {
  hmacSecret: string;
  encryptionKey: Buffer;
};

export type EncryptedPhone = { ciphertext: Buffer; iv: Buffer; authTag: Buffer };
export type SendWhatsAppVerification = (recipientE164: string, code: string) => Promise<void>;

export function whatsappContactEncryptionKeyFromEnvironment(environment: NodeJS.ProcessEnv): Buffer | null {
  const encoded = environment.WHATSAPP_CONTACT_ENCRYPTION_KEY;
  if (!encoded) return null;
  const key = Buffer.from(encoded, "base64");
  const canonical = key.toString("base64");
  if (key.length !== 32 || (encoded !== canonical && encoded !== canonical.replace(/=+$/, ""))) {
    throw new Error("WHATSAPP_CONTACT_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }
  return key;
}

export function phoneLookupHmac(secret: string, phoneE164: string): Buffer {
  return createHmac("sha256", secret).update(`whatsapp-phone\0${phoneE164}`).digest();
}

export function encryptPhone(phoneE164: string, subjectId: string, key: Buffer): EncryptedPhone {
  if (key.length !== 32) throw new Error("WhatsApp contact encryption key is invalid");
  phoneSchema.parse(phoneE164);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(subjectId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(phoneE164, "utf8"), cipher.final()]);
  return { ciphertext, iv, authTag: cipher.getAuthTag() };
}

export function decryptPhone(encrypted: EncryptedPhone, subjectId: string, key: Buffer): string {
  if (key.length !== 32 || encrypted.iv.length !== 12 || encrypted.authTag.length !== 16) {
    throw new Error("Encrypted WhatsApp contact is invalid");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, encrypted.iv);
  decipher.setAAD(Buffer.from(subjectId, "utf8"));
  decipher.setAuthTag(encrypted.authTag);
  const phone = Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]).toString("utf8");
  return phoneSchema.parse(phone);
}

function codeHmac(secret: string, subjectId: string, phoneHmac: Buffer, code: string): Buffer {
  return createHmac("sha256", secret)
    .update(`whatsapp-verification\0${subjectId}\0${phoneHmac.toString("hex")}\0${code}`)
    .digest();
}

function equalDigest(expected: Buffer, actual: Buffer): boolean {
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function subjectId(response: Response): string | undefined {
  const auth = response.locals.auth as { subjectId?: unknown; roles?: unknown } | undefined;
  if (typeof auth?.subjectId !== "string" || !Array.isArray(auth.roles)) return undefined;
  if (!auth.roles.some((role) => role === "customer" || role === "merchant")) return undefined;
  return auth.subjectId;
}

function invalid(response: Response) {
  return response.status(400).json({ error: { code: "INVALID_INPUT", message: "Check the submitted information." } });
}

function maskedPhone(lastFour: string) {
  return `•••• ${lastFour}`;
}

export function createWhatsAppContactHandlers(
  pool: Pick<Pool, "connect">,
  config: WhatsAppContactConfig,
  sendVerification: SendWhatsAppVerification,
) {
  if (config.encryptionKey.length !== 32 || !config.hmacSecret.trim() || Buffer.byteLength(config.hmacSecret, "utf8") < 32) {
    throw new Error("WhatsApp contact protection is not configured");
  }

  async function getContact(_request: Request, response: Response) {
    response.setHeader("Cache-Control", "no-store");
    const owner = subjectId(response);
    if (!owner) return response.status(403).json({ error: { code: "ROLE_REQUIRED", message: "A customer or merchant account is required." } });
    const client = await pool.connect();
    try {
      const result = await client.query<{
        phone_last_four: string;
        phone_verified_at: Date | null;
        consent_granted_at: Date;
        consent_policy_version: string;
        consent_revoked_at: Date | null;
        verification_pending: boolean;
      }>(
        `SELECT wc.phone_last_four, wc.phone_verified_at, wc.consent_granted_at, wc.consent_policy_version, wc.consent_revoked_at,
                (ch.subject_id IS NOT NULL AND ch.consumed_at IS NULL AND ch.expires_at > clock_timestamp()) AS verification_pending
         FROM whatsapp_contact wc
         LEFT JOIN whatsapp_verification_challenge ch ON ch.subject_id = wc.subject_id
         WHERE wc.subject_id = $1`,
        [owner],
      );
      if (!result.rows.length) return response.status(200).json({ contact: null });
      const contact = result.rows[0];
      return response.status(200).json({
        contact: {
          phone: maskedPhone(contact.phone_last_four),
          verified: contact.phone_verified_at !== null,
          consented: contact.consent_revoked_at === null,
          verificationPending: contact.verification_pending,
          consentedAt: contact.consent_granted_at,
          consentPolicyVersion: contact.consent_policy_version,
        },
      });
    } finally { client.release(); }
  }

  async function requestVerification(request: Request, response: Response) {
    const owner = subjectId(response);
    if (!owner) return response.status(403).json({ error: { code: "ROLE_REQUIRED", message: "A customer or merchant account is required." } });
    const parsed = z.object({ phoneE164: phoneSchema, consent: z.literal(true) }).strict().safeParse(request.body);
    if (!parsed.success) return invalid(response);
    const { phoneE164 } = parsed.data;
    const phoneHmac = phoneLookupHmac(config.hmacSecret, phoneE164);
    const encrypted = encryptPhone(phoneE164, owner, config.encryptionKey);
    const now = new Date();
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const challengeDigest = codeHmac(config.hmacSecret, owner, phoneHmac, code);
    const challengeExpiresAt = new Date(now.getTime() + challengeLifetimeMs);
    const outcome = await inTransaction(pool, async (client) => {
      const identity = await client.query<{ status: string }>(
        "SELECT status FROM identity_subject WHERE id = $1 FOR UPDATE",
        [owner],
      );
      if (identity.rows[0]?.status !== "active") return { status: 403 as const, reason: "ACCOUNT_UNAVAILABLE" };

      const current = await client.query<{
        phone_hmac: Buffer;
        phone_verified_at: Date | null;
        consent_revoked_at: Date | null;
      }>("SELECT phone_hmac, phone_verified_at, consent_revoked_at FROM whatsapp_contact WHERE subject_id = $1 FOR UPDATE", [owner]);
      const samePhone = current.rows.length > 0 && equalDigest(current.rows[0].phone_hmac, phoneHmac);
      if (samePhone && current.rows[0].phone_verified_at && current.rows[0].consent_revoked_at === null) {
        return { status: 200 as const, verified: true, lastFour: phoneE164.slice(-4) };
      }

      const previousChallenge = await client.query<{ last_sent_at: Date }>(
        "SELECT last_sent_at FROM whatsapp_verification_challenge WHERE subject_id = $1 FOR UPDATE",
        [owner],
      );
      if (previousChallenge.rows[0] && now.getTime() - new Date(previousChallenge.rows[0].last_sent_at).getTime() < resendDelayMs) {
        return { status: 429 as const, reason: "RESEND_TOO_SOON" };
      }

      await client.query(
        `INSERT INTO whatsapp_contact
           (subject_id, phone_ciphertext, phone_iv, phone_auth_tag, phone_hmac, phone_last_four,
            phone_verified_at, consent_granted_at, consent_policy_version, consent_revoked_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, NULL, $7)
         ON CONFLICT (subject_id) DO UPDATE SET
           phone_ciphertext = EXCLUDED.phone_ciphertext,
           phone_iv = EXCLUDED.phone_iv,
           phone_auth_tag = EXCLUDED.phone_auth_tag,
           phone_verified_at = CASE WHEN whatsapp_contact.phone_hmac = EXCLUDED.phone_hmac THEN whatsapp_contact.phone_verified_at ELSE NULL END,
           phone_hmac = EXCLUDED.phone_hmac,
           phone_last_four = EXCLUDED.phone_last_four,
           consent_granted_at = EXCLUDED.consent_granted_at,
           consent_policy_version = EXCLUDED.consent_policy_version,
           consent_revoked_at = NULL,
           updated_at = EXCLUDED.updated_at`,
        [owner, encrypted.ciphertext, encrypted.iv, encrypted.authTag, phoneHmac, phoneE164.slice(-4), now, transactionalWhatsappPolicyVersion],
      );

      if (current.rows.length && !samePhone && current.rows[0].consent_revoked_at === null) {
        await client.query(
          `INSERT INTO whatsapp_consent_event (id, subject_id, event_type, phone_hmac, consent_policy_version)
           VALUES ($1, $2, 'consent_revoked', $3, $4)`,
          [randomUUID(), owner, current.rows[0].phone_hmac, transactionalWhatsappPolicyVersion],
        );
      }
      const eventType = current.rows.length && !samePhone ? "phone_changed" : "consent_granted";
      await client.query(
        `INSERT INTO whatsapp_consent_event (id, subject_id, event_type, phone_hmac, consent_policy_version)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), owner, eventType, phoneHmac, transactionalWhatsappPolicyVersion],
      );
      await client.query(
        `INSERT INTO whatsapp_verification_challenge (subject_id, phone_hmac, code_hmac, attempt_count, last_sent_at, expires_at, consumed_at)
          VALUES ($1, $2, $3, 0, $4, $5, NULL)
         ON CONFLICT (subject_id) DO UPDATE SET
           phone_hmac = EXCLUDED.phone_hmac, code_hmac = EXCLUDED.code_hmac, attempt_count = 0,
           last_sent_at = EXCLUDED.last_sent_at, expires_at = EXCLUDED.expires_at, consumed_at = NULL`,
        [owner, phoneHmac, challengeDigest, now, challengeExpiresAt],
      );
      return { status: 202 as const, lastFour: phoneE164.slice(-4), challengeDigest };
    });

    if (outcome.status === 403) return response.status(403).json({ error: { code: outcome.reason, message: "This account cannot update messaging preferences." } });
    if (outcome.status === 429) return response.status(429).json({ error: { code: "RATE_LIMITED", message: "Wait before requesting another verification code." } });
    if (outcome.status === 200) return response.status(200).json({ contact: { phone: maskedPhone(outcome.lastFour), verified: true, consented: true } });

    let verificationSent = false;
    try {
      verificationSent = await inTransaction(pool, async (client) => {
        const identity = await client.query<{ status: string }>("SELECT status FROM identity_subject WHERE id = $1 FOR SHARE", [owner]);
        const contact = await client.query<{ phone_hmac: Buffer; consent_revoked_at: Date | null }>(
          "SELECT phone_hmac, consent_revoked_at FROM whatsapp_contact WHERE subject_id = $1 FOR SHARE",
          [owner],
        );
        const challenge = await client.query<{ phone_hmac: Buffer; code_hmac: Buffer; consumed_at: Date | null }>(
          "SELECT phone_hmac, code_hmac, consumed_at FROM whatsapp_verification_challenge WHERE subject_id = $1 FOR SHARE",
          [owner],
        );
        if (identity.rows[0]?.status !== "active" || !contact.rows[0] || contact.rows[0].consent_revoked_at !== null ||
            !challenge.rows[0] || challenge.rows[0].consumed_at || !equalDigest(contact.rows[0].phone_hmac, phoneHmac) ||
            !equalDigest(challenge.rows[0].phone_hmac, phoneHmac) || !equalDigest(challenge.rows[0].code_hmac, outcome.challengeDigest)) {
          return false;
        }
        await sendVerification(phoneE164, code);
        return true;
      });
    } catch {
      const client = await pool.connect();
      try {
        await client.query("UPDATE whatsapp_verification_challenge SET consumed_at = clock_timestamp() WHERE subject_id = $1 AND code_hmac = $2 AND consumed_at IS NULL", [owner, outcome.challengeDigest]);
      } finally { client.release(); }
      return response.status(503).json({ error: { code: "DELIVERY_UNAVAILABLE", message: "WhatsApp verification could not be sent. Please try again later." } });
    }
    if (!verificationSent) return response.status(409).json({ error: { code: "CONTACT_CHANGED", message: "The contact or consent changed. Start verification again." } });
    return response.status(202).json({
      contact: { phone: maskedPhone(outcome.lastFour), verified: false, consented: true },
      message: "A WhatsApp verification code was sent. Booking messages remain unavailable until verification succeeds.",
    });
  }

  async function verifyContact(request: Request, response: Response) {
    const owner = subjectId(response);
    if (!owner) return response.status(403).json({ error: { code: "ROLE_REQUIRED", message: "A customer or merchant account is required." } });
    const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).strict().safeParse(request.body);
    if (!parsed.success) return invalid(response);
    const result = await inTransaction(pool, async (client) => {
      const identity = await client.query<{ status: string }>(
        "SELECT status FROM identity_subject WHERE id = $1 FOR UPDATE",
        [owner],
      );
      if (identity.rows[0]?.status !== "active") return { status: 401 as const };
      const contact = await client.query<{
        phone_hmac: Buffer;
        phone_last_four: string;
        consent_revoked_at: Date | null;
      }>("SELECT phone_hmac, phone_last_four, consent_revoked_at FROM whatsapp_contact WHERE subject_id = $1 FOR UPDATE", [owner]);
      if (!contact.rows.length) return { status: 401 as const };
      const challenge = await client.query<{
        phone_hmac: Buffer;
        code_hmac: Buffer;
        attempt_count: number;
        expires_at: Date;
        consumed_at: Date | null;
      }>(
        "SELECT phone_hmac, code_hmac, attempt_count, expires_at, consumed_at FROM whatsapp_verification_challenge WHERE subject_id = $1 FOR UPDATE",
        [owner],
      );
      const row = challenge.rows[0];
      if (!row || row.consumed_at || row.expires_at.getTime() <= Date.now() || row.attempt_count >= 5 ||
          contact.rows[0].consent_revoked_at !== null || !equalDigest(row.phone_hmac, contact.rows[0].phone_hmac)) {
        return { status: 401 as const };
      }
      const candidate = codeHmac(config.hmacSecret, owner, row.phone_hmac, parsed.data.code);
      if (!equalDigest(row.code_hmac, candidate)) {
        await client.query(
          `UPDATE whatsapp_verification_challenge
           SET attempt_count = LEAST(attempt_count + 1, 5),
               consumed_at = CASE WHEN attempt_count >= 4 THEN clock_timestamp() ELSE consumed_at END
           WHERE subject_id = $1 AND consumed_at IS NULL`,
          [owner],
        );
        return { status: 401 as const };
      }
      const updated = await client.query(
        `UPDATE whatsapp_contact SET phone_verified_at = clock_timestamp(), updated_at = clock_timestamp()
         WHERE subject_id = $1 AND phone_hmac = $2 AND consent_revoked_at IS NULL`,
        [owner, row.phone_hmac],
      );
      if (updated.rowCount !== 1) return { status: 409 as const };
      await client.query("UPDATE whatsapp_verification_challenge SET consumed_at = clock_timestamp() WHERE subject_id = $1", [owner]);
      await client.query(
        `INSERT INTO whatsapp_consent_event (id, subject_id, event_type, phone_hmac, consent_policy_version)
         SELECT $1, $2, 'phone_verified', $3, consent_policy_version FROM whatsapp_contact WHERE subject_id = $2`,
        [randomUUID(), owner, row.phone_hmac],
      );
      return { status: 200 as const, lastFour: contact.rows[0].phone_last_four };
    });
    if (result.status === 401) return response.status(401).json({ error: { code: "INVALID_CODE", message: "The code is invalid, expired, or no longer applicable." } });
    if (result.status === 409) return response.status(409).json({ error: { code: "CONTACT_CHANGED", message: "The contact changed. Request a new verification code." } });
    return response.status(200).json({ contact: { phone: maskedPhone(result.lastFour), verified: true, consented: true } });
  }

  async function revokeConsent(request: Request, response: Response) {
    const owner = subjectId(response);
    if (!owner) return response.status(403).json({ error: { code: "ROLE_REQUIRED", message: "A customer or merchant account is required." } });
    const parsed = z.object({ confirm: z.literal(true) }).strict().safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: { code: "CONFIRMATION_REQUIRED", message: "Confirm that you want to stop WhatsApp updates." } });
    const client = await pool.connect();
    let destroyClient = false;
    try {
      await client.query("BEGIN");
      const identity = await client.query<{ status: string }>("SELECT status FROM identity_subject WHERE id = $1 FOR UPDATE", [owner]);
      if (identity.rows[0]?.status !== "active") {
        await client.query("COMMIT");
        return response.status(403).json({ error: { code: "ACCOUNT_UNAVAILABLE", message: "This account cannot update messaging preferences." } });
      }
      const contact = await client.query<{ phone_hmac: Buffer; consent_policy_version: string; consent_revoked_at: Date | null }>(
        "SELECT phone_hmac, consent_policy_version, consent_revoked_at FROM whatsapp_contact WHERE subject_id = $1 FOR UPDATE",
        [owner],
      );
      if (!contact.rows.length) {
        await client.query("COMMIT");
        return response.status(200).json({ consented: false });
      }
      if (contact.rows[0].consent_revoked_at === null) {
        await client.query("UPDATE whatsapp_contact SET consent_revoked_at = clock_timestamp(), updated_at = clock_timestamp() WHERE subject_id = $1", [owner]);
        await client.query("UPDATE whatsapp_verification_challenge SET consumed_at = clock_timestamp() WHERE subject_id = $1 AND consumed_at IS NULL", [owner]);
        await client.query(
          `INSERT INTO whatsapp_consent_event (id, subject_id, event_type, phone_hmac, consent_policy_version)
           VALUES ($1, $2, 'consent_revoked', $3, $4)`,
          [randomUUID(), owner, contact.rows[0].phone_hmac, contact.rows[0].consent_policy_version],
        );
      }
      await client.query("COMMIT");
      return response.status(200).json({ consented: false });
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { destroyClient = true; }
      throw error;
    } finally { client.release(destroyClient); }
  }

  return { getContact, requestVerification, verifyContact, revokeConsent };
}
