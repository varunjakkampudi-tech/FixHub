// @vitest-environment node
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApiApp } from "../app";
import { authConfigFromEnvironment } from "../auth";

function authFixture() {
  const subjectId = randomUUID();
  const challenges: Array<{ id: string; digest: Buffer; consumed: boolean; attempts: number }> = [];
  let sentCode = "";
  let deletionPending = false;
  const sqlLog: string[] = [];
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    sqlLog.push(sql);
    if (sql.includes("INSERT INTO email_login_challenge")) {
      challenges.push({ id: String(values[0]), digest: values[2] as Buffer, consumed: false, attempts: 0 });
    }
    if (sql.includes("SELECT id, code_hmac, attempt_count FROM email_login_challenge")) {
      return { rows: challenges.filter((challenge) => !challenge.consumed).map(({ id, digest, attempts }) => ({ id, code_hmac: digest, attempt_count: attempts })) };
    }
    if (sql.includes("UPDATE email_login_challenge SET consumed_at = clock_timestamp() WHERE email_normalized")) challenges.forEach((challenge) => { challenge.consumed = true; });
    if (sql.includes("INSERT INTO identity_subject")) return { rows: [{ id: subjectId }] };
    if (sql.includes("UPDATE identity_subject SET status = 'deletion_pending'")) deletionPending = true;
    if (sql.includes("SELECT s.subject_id")) return { rows: deletionPending ? [] : [{ subject_id: subjectId, roles: ["customer"] }] };
    if (sql.includes("INSERT INTO privacy_request")) return { rows: [{ id: String(values[0]) }] };
    return { rows: [] };
  });
  const release = vi.fn();
  const client = { query, release } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
  const app = createApiApp({
    environment: "test",
    allowedOrigins: ["http://localhost:5173"],
    databasePool: pool,
    authConfig: { hmacSecret: "a-secure-test-secret-that-is-over-32-bytes", production: false, webOrigins: ["http://localhost:5173"] },
    sendAuthEmail: async (_email, code) => { sentCode = code; },
  });
  return { app, getSentCode: () => sentCode, query, sqlLog };
}

describe("email-code authentication", () => {
  it("rejects weak HMAC secrets and accepts a sufficiently long secret", () => {
    expect(() => authConfigFromEnvironment({ AUTH_HMAC_SECRET: "short" })).toThrow();
    expect(authConfigFromEnvironment({ AUTH_HMAC_SECRET: "01234567890123456789012345678901" })?.production).toBe(false);
  });

  it("issues generic code responses and creates customer-only sessions with CSRF protection", async () => {
    const fixture = authFixture();
    const issued = await request(fixture.app)
      .post("/api/v1/auth/code")
      .send({ email: "Customer@Example.Test" })
      .expect(202);
    expect(issued.body.message).not.toContain("Customer@Example.Test");
    expect(fixture.getSentCode()).toMatch(/^\d{6}$/);
    expect(JSON.stringify(issued.body)).not.toContain(fixture.getSentCode());
    expect(fixture.sqlLog.join(" ")).not.toContain("Customer@Example.Test");

    const verified = await request(fixture.app)
      .post("/api/v1/auth/verify")
      .send({ email: "customer@example.test", code: fixture.getSentCode() })
      .expect(200);
    expect(verified.body).toEqual({ authenticated: true, roles: ["customer"] });
    const cookieHeader = verified.headers["set-cookie"];
    const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain("SameSite=Lax");
    expect(cookies[0]).not.toContain(fixture.getSentCode());
    expect(fixture.sqlLog.some((sql) => sql.includes("INSERT INTO identity_role"))).toBe(true);
    expect(fixture.sqlLog.some((sql) => sql.includes("INSERT INTO identity_session"))).toBe(true);

    const csrfCookie = cookies.find((cookie) => cookie.startsWith("fixhub_csrf="))!;
    const csrf = decodeURIComponent(csrfCookie.split(";", 1)[0].split("=", 2)[1]);
    const sessionCookie = cookies.find((cookie) => cookie.startsWith("fixhub_session="))!;
    const me = await request(fixture.app)
      .get("/api/v1/auth/me")
      .set("Cookie", `${sessionCookie.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}`)
      .set("x-csrf-token", csrf)
      .expect(200);
    expect(me.body).toEqual({ authenticated: true, subjectId: expect.any(String), roles: ["customer"] });

    await request(fixture.app)
      .post("/api/v1/auth/logout")
      .set("Cookie", `${sessionCookie.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}`)
      .expect(401);
  });

  it("rejects malformed input without creating a challenge", async () => {
    const fixture = authFixture();
    const result = await request(fixture.app).post("/api/v1/auth/code").send({ email: "not-an-email", extra: "rejected" }).expect(400);
    expect(result.body.error.code).toBe("INVALID_INPUT");
    expect(fixture.sqlLog).toHaveLength(0);
  });

  it("accepts a still-valid code when overlapping sign-in emails arrive out of order", async () => {
    const fixture = authFixture();
    await request(fixture.app).post("/api/v1/auth/code").send({ email: "user@example.test" }).expect(202);
    const firstCode = fixture.getSentCode();
    await request(fixture.app).post("/api/v1/auth/code").send({ email: "user@example.test" }).expect(202);
    const lastCodeSent = fixture.getSentCode();
    expect(lastCodeSent).not.toBe(firstCode);

    await request(fixture.app).post("/api/v1/auth/verify")
      .send({ email: "user@example.test", code: firstCode })
      .expect(200);
    await request(fixture.app).post("/api/v1/auth/verify")
      .send({ email: "user@example.test", code: lastCodeSent })
      .expect(401);
  });

  it("records a deletion request, disables login and clears session cookies without claiming erasure", async () => {
    const fixture = authFixture();
    await request(fixture.app).post("/api/v1/auth/code").send({ email: "user@example.test" }).expect(202);
    const verified = await request(fixture.app).post("/api/v1/auth/verify").send({ email: "user@example.test", code: fixture.getSentCode() }).expect(200);
    const cookieHeader = verified.headers["set-cookie"];
    const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    const csrfCookie = cookies.find((cookie) => cookie.startsWith("fixhub_csrf="))!;
    const sessionCookie = cookies.find((cookie) => cookie.startsWith("fixhub_session="))!;
    const csrf = decodeURIComponent(csrfCookie.split(";", 1)[0].split("=", 2)[1]);
    const result = await request(fixture.app)
      .post("/api/v1/customer/account-deletion")
      .set("Cookie", `${sessionCookie.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}`)
      .set("x-csrf-token", csrf)
      .send({ confirm: true })
      .expect(202);
    expect(result.body).toMatchObject({ requestId: expect.any(String), status: "requested" });
    expect(result.body.message).toContain("not confirmation that all records have been deleted");
    const clearedCookies = result.headers["set-cookie"];
    expect((Array.isArray(clearedCookies) ? clearedCookies : [clearedCookies]).join(" ")).toContain("Max-Age=0");
    expect(fixture.sqlLog.some((sql) => sql.includes("UPDATE identity_subject SET status = 'deletion_pending'"))).toBe(true);
    expect(fixture.sqlLog.some((sql) => sql.includes("UPDATE identity_session SET revoked_at"))).toBe(true);
    await request(fixture.app)
      .get("/api/v1/auth/me")
      .set("Cookie", `${sessionCookie.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}`)
      .expect(401);
  });
});
