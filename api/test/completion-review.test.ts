// @vitest-environment node
import { createHmac, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApiApp } from "../app";

function customerApp(initialStatus: "accepted" | "in_progress" = "in_progress") {
  const customerId = randomUUID();
  const bookingId = randomUUID();
  const merchantId = randomUUID();
  const secret = "customer-lifecycle-test-hmac-secret-is-at-least-32-bytes";
  const idempotency = new Map<string, { hash: Buffer; body?: unknown }>();
  const sql: string[] = [];
  let bookingStatus: string = initialStatus;
  let challengeId = "";
  let codeHash: Buffer;
  let review: { id: string; rating: number; comment: string } | undefined;
  const query = vi.fn(async (statement: string, values: unknown[] = []) => {
    sql.push(statement);
    if (statement.includes("SELECT count(*)::text AS count FROM email_login_challenge")) return { rows: [{ count: "0" }] };
    if (statement.includes("INSERT INTO email_login_challenge")) {
      challengeId = String(values[0]);
      codeHash = createHmac("sha256", secret).update(`login-code:${challengeId}:customer@example.test\0${"123456"}`).digest();
      return { rows: [] };
    }
    if (statement.includes("SELECT id, code_hmac, attempt_count FROM email_login_challenge")) return { rows: [{ id: challengeId, code_hmac: codeHash, attempt_count: 0 }] };
    if (statement.includes("INSERT INTO identity_subject")) return { rows: [{ id: customerId }] };
    if (statement.includes("SELECT role FROM identity_role")) return { rows: [] };
    if (statement.includes("SELECT s.subject_id")) return { rows: [{ subject_id: customerId, roles: ["customer"] }] };
    if (statement.includes("INSERT INTO request_idempotency")) {
      const key = `${values[0]}:${values[1]}:${values[2]}`;
      if (idempotency.has(key)) return { rows: [] };
      idempotency.set(key, { hash: values[3] as Buffer });
      return { rows: [{ idempotency_key: values[2] }] };
    }
    if (statement.includes("SELECT request_hash, response_body FROM request_idempotency")) {
      const saved = idempotency.get(`${values[0]}:${values[1]}:${values[2]}`);
      return { rows: saved ? [{ request_hash: saved.hash, response_body: saved.body }] : [] };
    }
    if (statement.includes("DELETE FROM request_idempotency")) {
      idempotency.delete(`${values[0]}:${values[1]}:${values[2]}`);
      return { rows: [] };
    }
    if (statement.includes("SELECT status, merchant_id FROM service_booking WHERE id = $1 AND customer_id = $2 FOR UPDATE")) {
      return String(values[0]) === bookingId && String(values[1]) === customerId ? { rows: [{ status: bookingStatus, merchant_id: merchantId }] } : { rows: [] };
    }
    if (statement.includes("UPDATE service_booking SET status = 'completed'")) { bookingStatus = "completed"; return { rows: [] }; }
    if (statement.includes("INSERT INTO booking_review")) {
      if (review) return { rows: [] };
      review = { id: String(values[0]), rating: Number(values[4]), comment: String(values[5]) };
      return { rows: [review] };
    }
    if (statement.includes("UPDATE request_idempotency SET response_body")) {
      idempotency.get(`${values[0]}:${values[1]}:${values[2]}`)!.body = JSON.parse(String(values[3]));
    }
    return { rows: [] };
  });
  const client = { query, release: vi.fn() } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
  const app = createApiApp({
    environment: "test",
    allowedOrigins: ["http://localhost:5173"],
    databasePool: pool,
    marketplacePool: pool,
    authConfig: { hmacSecret: secret, production: false, webOrigins: [] },
    sendAuthEmail: async () => undefined,
  });
  return { app, bookingId, sql, getStatus: () => bookingStatus };
}

async function signIn(app: ReturnType<typeof customerApp>["app"]) {
  await request(app).post("/api/v1/auth/code").send({ email: "customer@example.test" }).expect(202);
  const verified = await request(app).post("/api/v1/auth/verify").send({ email: "customer@example.test", code: "123456" }).expect(200);
  const header = verified.headers["set-cookie"];
  const cookies = Array.isArray(header) ? header : [header ?? ""];
  const session = cookies.find((value) => value.startsWith("fixhub_session="))!;
  const csrfCookie = cookies.find((value) => value.startsWith("fixhub_csrf="))!;
  return { cookie: `${session.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}`, csrf: decodeURIComponent(csrfCookie.split(";", 1)[0].split("=", 2)[1]) };
}

describe("customer completion and rating lifecycle", () => {
  it("requires in-progress state, records customer-confirmed completion and allows one idempotent rating", async () => {
    const fixture = customerApp();
    const session = await signIn(fixture.app);
    const complete = () => request(fixture.app)
      .post(`/api/v1/customer/bookings/${fixture.bookingId}/complete`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", session.csrf)
      .set("Idempotency-Key", "customer-complete-job-001")
      .send({ confirm: true });

    const completed = await complete().expect(200);
    expect(completed.body.booking).toEqual({ id: fixture.bookingId, status: "completed", reviewAllowed: true });
    expect(fixture.getStatus()).toBe("completed");
    expect(fixture.sql.some((statement) => statement.includes("merchant.booking_completed"))).toBe(true);
    expect((await complete().expect(200)).body).toEqual(completed.body);
    await request(fixture.app)
      .post(`/api/v1/customer/bookings/${fixture.bookingId}/complete`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", session.csrf)
      .set("Idempotency-Key", "customer-complete-new-key")
      .send({ confirm: true })
      .expect(200);
    expect(fixture.sql.filter((statement) => statement.includes("SET status = 'completed'")).length).toBe(1);

    const review = () => request(fixture.app)
      .post(`/api/v1/customer/bookings/${fixture.bookingId}/review`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", session.csrf)
      .set("Idempotency-Key", "customer-rating-job-0001")
      .send({ rating: 5, comment: "Arrived on time" });
    const submitted = await review().expect(201);
    expect(submitted.body.review).toMatchObject({ rating: 5, comment: "Arrived on time" });
    expect((await review().expect(200)).body).toEqual(submitted.body);
  });

  it("does not allow completion or reviews before the required state", async () => {
    const fixture = customerApp("accepted");
    const session = await signIn(fixture.app);
    await request(fixture.app)
      .post(`/api/v1/customer/bookings/${fixture.bookingId}/complete`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", session.csrf)
      .set("Idempotency-Key", "customer-complete-job-002")
      .send({ confirm: true })
      .expect(409);
    await request(fixture.app)
      .post(`/api/v1/customer/bookings/${fixture.bookingId}/review`)
      .set("Cookie", session.cookie)
      .set("x-csrf-token", session.csrf)
      .set("Idempotency-Key", "customer-rating-job-0002")
      .send({ rating: 5 })
      .expect(409);
    expect(fixture.getStatus()).toBe("accepted");
  });
});
