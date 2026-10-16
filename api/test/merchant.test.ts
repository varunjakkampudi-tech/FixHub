// @vitest-environment node
import { createHmac, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApiApp } from "../app";

function merchantApp(initialRole: "merchant" | "customer" = "merchant", initialJobStatus: "accepted" | "in_progress" = "accepted") {
  const merchantId = randomUUID();
  const offerId = randomUUID();
  const bookingId = randomUUID();
  let codeHash: Buffer;
  const codeSecret = "merchant-test-hmac-secret-that-is-long-enough-32-bytes";
  const sql: string[] = [];
  const assignmentValues: unknown[] = [];
  const query = vi.fn(async (statement: string, values: unknown[] = []) => {
    sql.push(statement);
    if (statement.includes("SELECT count(*)::text AS count FROM email_login_challenge")) return { rows: [{ count: "0" }] };
    if (statement.includes("INSERT INTO email_login_challenge")) {
      const challengeId = String(values[0]);
      const email = String(values[1]);
      const code = "123456";
      codeHash = createHmac("sha256", codeSecret).update(`login-code:${challengeId}:${email}\0${code}`).digest();
      return { rows: [] };
    }
    if (statement.includes("SELECT id, code_hmac, attempt_count FROM email_login_challenge")) {
      const insert = sql.find((entry) => entry.includes("INSERT INTO email_login_challenge"));
      const insertParams = query.mock.calls.find(([entry]) => entry === insert)?.[1] as unknown[];
      return { rows: [{ id: String(insertParams[0]), code_hmac: codeHash, attempt_count: 0 }] };
    }
    if (statement.includes("SELECT role FROM identity_role")) return { rows: [{ role: initialRole }] };
    if (statement.includes("INSERT INTO identity_subject")) return { rows: [{ id: merchantId }] };
    if (statement.includes("SELECT s.subject_id")) return { rows: [{ subject_id: merchantId, roles: [initialRole] }] };
    if (statement.includes("INSERT INTO request_idempotency")) return { rows: [{ idempotency_key: values[2] }] };
    if (statement.includes("SELECT booking_id FROM booking_offer WHERE id")) return { rows: [{ booking_id: bookingId }] };
    if (statement.includes("SELECT id, status, merchant_id FROM service_booking")) return { rows: [{ id: bookingId, status: "offered", merchant_id: null }] };
    if (statement.includes("FROM booking_offer WHERE id = $1 AND merchant_id = $2 FOR UPDATE")) return { rows: [{ status: "pending", expires_at: new Date(Date.now() + 60_000), is_expired: false, visit_price_paise: 40000, labor_price_paise: 45000 }] };
    if (statement.includes("SELECT verification_status, accepting_jobs FROM merchant_profile")) return { rows: [{ verification_status: "verified", accepting_jobs: true }] };
    if (statement.includes("SELECT status FROM service_booking WHERE id = $1 AND merchant_id = $2 FOR UPDATE")) return { rows: [{ status: initialJobStatus }] };
    if (statement.includes("SELECT verification_status FROM merchant_profile")) return { rows: [{ verification_status: "verified" }] };
    if (statement.includes("UPDATE service_booking SET status = 'in_progress'")) return { rows: [{ id: bookingId }] };
    if (statement.includes("UPDATE booking_offer") && statement.includes("expires_at > clock_timestamp()")) return { rows: [{ id: String(values[0]) }] };
    if (statement.includes("UPDATE service_booking SET merchant_id")) { assignmentValues.push(...values); return { rows: [{ id: bookingId }] }; }
    if (statement.includes("SELECT request_hash, response_body FROM request_idempotency")) return { rows: [] };
    return { rows: [] };
  });
  const client = { query, release: vi.fn() } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
  const app = createApiApp({
    environment: "test",
    allowedOrigins: ["http://localhost:5173"],
    databasePool: pool,
    marketplacePool: pool,
    authConfig: { hmacSecret: codeSecret, production: false, webOrigins: [] },
    sendAuthEmail: async () => undefined,
  });
  return { app, merchantId, offerId, bookingId, sql, assignmentValues };
}

async function signInAsMerchant(app: ReturnType<typeof merchantApp>["app"]) {
  await request(app).post("/api/v1/auth/code").send({ email: "merchant@example.test" }).expect(202);
  const verified = await request(app).post("/api/v1/auth/verify")
    .send({ email: "merchant@example.test", code: "123456" }).expect(200);
  const setCookie = verified.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("fixhub_session="))!;
  const csrfCookie = cookies.find((cookie) => cookie.startsWith("fixhub_csrf="))!;
  return { cookie: `${sessionCookie.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}` };
}

describe("merchant offer workflow", () => {
  it("lets a provisioned merchant read and accept only its own offer, then commits one assignment event", async () => {
    const fixture = merchantApp();
    const session = await signInAsMerchant(fixture.app);
    const offers = await request(fixture.app).get("/api/v1/merchant/offers").set("Cookie", session.cookie).expect(200);
    expect(offers.body.items).toEqual([]);

    const response = await request(fixture.app)
      .post(`/api/v1/merchant/offers/${fixture.offerId}/response`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", decodeURIComponent(session.cookie.split("fixhub_csrf=")[1].split(";")[0]))
      .set("Idempotency-Key", "merchant-response-0001")
      .send({ decision: "accept" })
      .expect(200);
    expect(response.body.offer).toEqual({ id: fixture.offerId, bookingId: fixture.bookingId, status: "accepted" });
    expect(fixture.sql.some((statement) => statement.includes("WHERE id = $2 AND merchant_id IS NULL AND status = 'offered'"))).toBe(true);
    expect(fixture.sql.some((statement) => statement.includes("status = $3") && statement.includes("expires_at > clock_timestamp()"))).toBe(true);
    expect(fixture.assignmentValues).toEqual([fixture.merchantId, fixture.bookingId, 40000, 45000]);
    expect(fixture.sql.some((statement) => statement.includes("customer.booking_accepted"))).toBe(true);
    expect(fixture.sql.some((statement) => statement.includes("SET status = 'cancelled'"))).toBe(true);
  });

  it("rejects customer accounts from merchant offer endpoints", async () => {
    const fixture = merchantApp("customer");
    const session = await signInAsMerchant(fixture.app);
    await request(fixture.app).get("/api/v1/merchant/offers").set("Cookie", session.cookie).expect(403);
  });

  it("lets only an assigned verified merchant start an accepted job and emits a future notification event", async () => {
    const fixture = merchantApp();
    const session = await signInAsMerchant(fixture.app);
    const csrf = decodeURIComponent(session.cookie.split("fixhub_csrf=")[1].split(";")[0]);
    const response = await request(fixture.app)
      .post(`/api/v1/merchant/jobs/${fixture.bookingId}/start`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", csrf)
      .set("Idempotency-Key", "merchant-start-job-0001")
      .expect(200);
    expect(response.body.job).toEqual({ id: fixture.bookingId, status: "in_progress" });
    expect(fixture.sql.some((statement) => statement.includes("WHERE id = $1 AND merchant_id = $2 FOR UPDATE"))).toBe(true);
    expect(fixture.sql.some((statement) => statement.includes("customer.booking_in_progress"))).toBe(true);
  });

  it("replays a start action as successful when the assigned job is already in progress under a new key", async () => {
    const fixture = merchantApp("merchant", "in_progress");
    const session = await signInAsMerchant(fixture.app);
    const csrf = decodeURIComponent(session.cookie.split("fixhub_csrf=")[1].split(";")[0]);
    const response = await request(fixture.app)
      .post(`/api/v1/merchant/jobs/${fixture.bookingId}/start`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", csrf)
      .set("Idempotency-Key", "merchant-start-new-key-001")
      .expect(200);
    expect(response.body.job).toEqual({ id: fixture.bookingId, status: "in_progress" });
    expect(fixture.sql.some((statement) => statement.includes("SET status = 'in_progress'"))).toBe(false);
  });
});
