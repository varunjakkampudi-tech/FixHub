// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import type { Pool, PoolClient } from "pg";

import {
  decryptPhone,
  encryptPhone,
  phoneLookupHmac,
  whatsappContactEncryptionKeyFromEnvironment,
  createWhatsAppContactHandlers,
} from "../whatsapp-contact";

const contactConfig = { hmacSecret: "a-long-enough-test-secret-for-hmac", encryptionKey: Buffer.alloc(32, 7) };

function appFor(query: (sql: string, values: unknown[]) => Promise<{ rows: unknown[] }>, send = vi.fn(async (_recipient: string, _code: string) => {}), roles = ["customer"]) {
  const client = { query: vi.fn(query), release: vi.fn() } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
  const app = express();
  app.use(express.json());
  app.use((_req, res, next) => { res.locals.auth = { subjectId: "00000000-0000-4000-8000-000000000001", roles }; next(); });
  const handlers = createWhatsAppContactHandlers(pool, contactConfig, send);
  app.get("/contact", handlers.getContact);
  app.post("/verification", handlers.requestVerification);
  app.post("/verify", handlers.verifyContact);
  app.post("/revoke", handlers.revokeConsent);
  return { app, pool, client };
}

describe("WhatsApp contact protection primitives", () => {
  const key = Buffer.alloc(32, 7);
  const phone = "+919876543210";

  it("encrypts contacts with authenticated encryption and binds ciphertext to the account", () => {
    const encrypted = encryptPhone(phone, "subject-a", key);
    expect(encrypted.ciphertext.toString("utf8")).not.toContain(phone);
    expect(decryptPhone(encrypted, "subject-a", key)).toBe(phone);
    expect(() => decryptPhone(encrypted, "subject-b", key)).toThrow();
    expect(() => decryptPhone({ ...encrypted, authTag: Buffer.alloc(16) }, "subject-a", key)).toThrow();
  });

  it("creates a stable keyed lookup digest without exposing the phone number", () => {
    const digest = phoneLookupHmac("a-long-enough-test-secret-for-hmac", phone);
    expect(digest).toHaveLength(32);
    expect(digest.equals(phoneLookupHmac("a-long-enough-test-secret-for-hmac", phone))).toBe(true);
    expect(digest.equals(phoneLookupHmac("a-long-enough-test-secret-for-hmac", "+919876543211"))).toBe(false);
    expect(digest.equals(phoneLookupHmac("a-different-test-secret-long-enough", phone))).toBe(false);
  });

  it("accepts only canonical base64 encoding of a 32-byte environment key", () => {
    const encoded = key.toString("base64");
    expect(whatsappContactEncryptionKeyFromEnvironment({ WHATSAPP_CONTACT_ENCRYPTION_KEY: encoded })).toEqual(key);
    expect(whatsappContactEncryptionKeyFromEnvironment({})).toBeNull();
    expect(() => whatsappContactEncryptionKeyFromEnvironment({ WHATSAPP_CONTACT_ENCRYPTION_KEY: "not-a-key" })).toThrow();
  });

  it("returns only the masked contact and consent state", async () => {
    const fixture = appFor(async () => ({ rows: [{ phone_last_four: "3210", phone_verified_at: new Date(), consent_granted_at: new Date(), consent_policy_version: "transactional-whatsapp-v1", consent_revoked_at: null, verification_pending: false }] }));
    const response = await request(fixture.app).get("/contact");
    expect(response.status).toBe(200);
    expect(response.body.contact).toMatchObject({ phone: "•••• 3210", verified: true, consented: true, verificationPending: false });
    expect(JSON.stringify(response.body)).not.toContain(phone);
  });

  it("requires explicit consent and refuses unsupported roles before touching storage", async () => {
    const query = vi.fn(async () => ({ rows: [] }));
    const sender = vi.fn(async (_recipient: string, _code: string) => {});
    const fixture = appFor(query, sender, ["support"]);
    expect((await request(fixture.app).post("/verification").send({ phoneE164: phone, consent: true })).status).toBe(403);
    expect((await request(fixture.app).post("/verification").send({ phoneE164: phone, consent: false })).status).toBe(403);
    expect(fixture.pool.connect).not.toHaveBeenCalled();
    expect(sender).not.toHaveBeenCalled();
  });

  it("does not access storage for malformed contact or verification input", async () => {
    const fixture = appFor(async () => ({ rows: [] }));
    expect((await request(fixture.app).post("/verification").send({ phoneE164: "not-a-number", consent: true })).status).toBe(400);
    expect((await request(fixture.app).post("/verify").send({ code: "123" })).status).toBe(400);
    expect(fixture.pool.connect).not.toHaveBeenCalled();
  });

  it("stores only a code digest and sends only after consent is committed", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    const timeline: string[] = [];
    let storedCodeDigest: Buffer | undefined;
    const storedPhoneDigest = phoneLookupHmac(contactConfig.hmacSecret, phone);
    const query = async (sql: string, values: unknown[] = []) => {
      statements.push({ sql, values });
      timeline.push(sql === "COMMIT" ? "commit" : "query");
      if (sql.includes("SELECT status FROM identity_subject")) return { rows: [{ status: "active" }] };
      if (sql.includes("SELECT phone_hmac, phone_verified_at, consent_revoked_at")) return { rows: [] };
      if (sql.includes("SELECT last_sent_at FROM whatsapp_verification_challenge")) return { rows: [] };
      if (sql.includes("INSERT INTO whatsapp_verification_challenge")) storedCodeDigest = values[2] as Buffer;
      if (sql.includes("SELECT phone_hmac, consent_revoked_at FROM whatsapp_contact")) return { rows: [{ phone_hmac: storedPhoneDigest, consent_revoked_at: null }] };
      if (sql.includes("SELECT phone_hmac, code_hmac, consumed_at")) return { rows: [{ phone_hmac: storedPhoneDigest, code_hmac: storedCodeDigest, consumed_at: null }] };
      return { rows: [] };
    };
    const sender = vi.fn(async (_recipient: string, _code: string) => { timeline.push("send"); });
    const fixture = appFor(query, sender);
    const response = await request(fixture.app).post("/verification").send({ phoneE164: phone, consent: true });
    expect(response.status).toBe(202);
    expect(response.body.contact).toMatchObject({ phone: "•••• 3210", verified: false, consented: true });
    expect(sender).toHaveBeenCalledOnce();
    expect(sender.mock.calls[0][0]).toBe(phone);
    expect(sender.mock.calls[0][1]).toMatch(/^\d{6}$/);
    const challengeInsert = statements.find(({ sql }) => sql.includes("INSERT INTO whatsapp_verification_challenge"));
    expect(challengeInsert).toBeDefined();
    expect(challengeInsert?.values[2]).toBeInstanceOf(Buffer);
    expect((challengeInsert?.values[2] as Buffer).toString("utf8")).not.toBe(sender.mock.calls[0][1]);
    expect(statements.findIndex(({ sql }) => sql.includes("INSERT INTO whatsapp_verification_challenge"))).toBeLessThan(statements.findIndex(({ sql }) => sql === "COMMIT"));
    expect(timeline.indexOf("commit")).toBeLessThan(timeline.indexOf("send"));
  });

  it("does not expose provider errors and consumes only the failed challenge", async () => {
    const statements: Array<{ sql: string; values: unknown[] }> = [];
    let storedCodeDigest: Buffer | undefined;
    const storedPhoneDigest = phoneLookupHmac(contactConfig.hmacSecret, phone);
    const query = async (sql: string, values: unknown[] = []) => {
      statements.push({ sql, values });
      if (sql.includes("SELECT status FROM identity_subject")) return { rows: [{ status: "active" }] };
      if (sql.includes("SELECT phone_hmac, phone_verified_at, consent_revoked_at")) return { rows: [] };
      if (sql.includes("SELECT last_sent_at FROM whatsapp_verification_challenge")) return { rows: [] };
      if (sql.includes("INSERT INTO whatsapp_verification_challenge")) storedCodeDigest = values[2] as Buffer;
      if (sql.includes("SELECT phone_hmac, consent_revoked_at FROM whatsapp_contact")) return { rows: [{ phone_hmac: storedPhoneDigest, consent_revoked_at: null }] };
      if (sql.includes("SELECT phone_hmac, code_hmac, consumed_at")) return { rows: [{ phone_hmac: storedPhoneDigest, code_hmac: storedCodeDigest, consumed_at: null }] };
      return { rows: [] };
    };
    const sender = vi.fn(async () => { throw new Error("private provider response"); });
    const fixture = appFor(query, sender);
    const response = await request(fixture.app).post("/verification").send({ phoneE164: phone, consent: true });
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain("private provider response");
    const digest = statements.find(({ sql }) => sql.includes("INSERT INTO whatsapp_verification_challenge"))?.values[2];
    const consume = statements.find(({ sql }) => sql.includes("UPDATE whatsapp_verification_challenge SET consumed_at"));
    expect(digest).toBeInstanceOf(Buffer);
    expect(consume?.values[1]).toEqual(digest);
  });

  it("invalidates challenges when consent is withdrawn", async () => {
    const statements: string[] = [];
    const query = async (sql: string) => {
      statements.push(sql);
      if (sql.includes("SELECT status FROM identity_subject")) return { rows: [{ status: "active" }] };
      if (sql.includes("SELECT phone_hmac, consent_policy_version")) return { rows: [{ phone_hmac: Buffer.alloc(32), consent_policy_version: "transactional-whatsapp-v1", consent_revoked_at: null }] };
      return { rows: [] };
    };
    const fixture = appFor(query);
    expect((await request(fixture.app).post("/revoke").send({ confirm: true })).status).toBe(200);
    expect(statements.some((sql) => sql.includes("UPDATE whatsapp_verification_challenge SET consumed_at"))).toBe(true);
    expect(statements.some((sql) => sql.includes("event_type, phone_hmac") && sql.includes("consent_revoked"))).toBe(true);
  });
});
