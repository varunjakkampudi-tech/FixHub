// @vitest-environment node
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApiApp } from "../app";

type StoredTicket = { id: string; subject_id: string; status: string; created_at: Date; booking_id?: string | null; subject?: string; description?: string; idempotency_key?: string; request_hash?: Buffer; response_text?: string | null; version?: number };

function fixture(role = "customer") {
  const owner = randomUUID();
  const ownedBooking = randomUUID();
  const tickets: StoredTicket[] = [];
  const history: unknown[][] = [];
  let identityStatus = "active";
  const visible = ({ subject_id: _owner, idempotency_key: _key, request_hash: _hash, ...row }: StoredTicket) => row;
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    if (sql.includes("FROM identity_session s")) return { rows: [{ subject_id: owner, roles: [role] }] };
    if (sql.includes("SELECT status FROM identity_subject")) return { rows: [{ status: identityStatus }] };
    if (sql.includes("FROM service_booking")) return { rows: values[0] === ownedBooking && values[1] === owner ? [{ id: ownedBooking }] : [] };
    if (sql.includes("INSERT INTO support_ticket_response")) { history.push(values); return { rows: [] }; }
    if (sql.includes("INSERT INTO support_ticket")) {
      if (tickets.some((row) => row.subject_id === values[1] && row.idempotency_key === values[5])) return { rows: [] };
      if (!Buffer.isBuffer(values[6])) throw new Error("Fixture expected a binary request hash");
      const row: StoredTicket = { id: String(values[0]), subject_id: String(values[1]), booking_id: values[2] === null ? null : String(values[2]), subject: String(values[3]), description: String(values[4]), idempotency_key: String(values[5]), request_hash: values[6], status: "open", response_text: null, version: 0, created_at: new Date("2026-10-16T12:00:00.000Z") };
      tickets.push(row); return { rows: [visible(row)] };
    }
    if (sql.includes("FROM support_ticket WHERE subject_id = $1 AND idempotency_key")) {
      const row = tickets.find((entry) => entry.subject_id === values[0] && entry.idempotency_key === values[1]);
      return { rows: row ? [{ ...visible(row), request_hash: row.request_hash }] : [] };
    }
    if (sql.includes("FROM support_ticket")) return { rows: tickets.filter((row) => (!values[0] || row.subject_id === values[0]) && (values[1] || row.status !== "resolved")).slice(0, 26).map(visible) };
    if (sql.includes("UPDATE support_ticket SET response_text")) {
      const row = tickets.find((entry) => entry.id === values[0] && entry.version === values[4]);
      if (!row) return { rows: [] };
      row.response_text = String(values[1]); row.status = String(values[2]); row.version = (row.version ?? 0) + 1;
      return { rows: [visible(row)] };
    }
    return { rows: [] };
  });
  const pool = { connect: vi.fn(async () => ({ query, release: vi.fn() } as unknown as PoolClient)) } as unknown as Pick<Pool, "connect">;
  const app = createApiApp({ environment: "test", databasePool: pool, marketplacePool: pool, authConfig: { hmacSecret: "support-test-only-secret-at-least-32-bytes", production: false, webOrigins: ["http://localhost:5173"] }, sendAuthEmail: async () => {} });
  const auth = (method: "get" | "post", url: string) => request(app)[method](url).set("Cookie", "fixhub_session=synthetic; fixhub_csrf=synthetic-csrf").set("x-csrf-token", "synthetic-csrf");
  const body = { subject: "Sample service issue", message: "Synthetic service follow-up details." };
  return { app, auth, body, owner, ownedBooking, tickets, history, query, setIdentityStatus: (status: string) => { identityStatus = status; } };
}

describe("private support request routes", () => {
  it("requires a session, CSRF and staff permission before accessing private support", async () => {
    const f = fixture();
    await request(f.app).get("/api/v1/support/requests").expect(401);
    await request(f.app).post("/api/v1/support/requests").set("Cookie", "fixhub_session=x; fixhub_csrf=x").send(f.body).expect(401);
    await f.auth("get", "/api/v1/support/inbox").expect(403);
    await f.auth("post", `/api/v1/support/requests/${randomUUID()}/response`).send({ response: "Synthetic reply", status: "resolved", expectedVersion: 0 }).expect(403);
    expect(f.tickets).toHaveLength(0);
  });

  it.each(["customer", "merchant"])("records %s requests and replays identical retries without disclosing hashes", async (role) => {
    const f = fixture(role); const key = randomUUID();
    const created = await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", key).send({ ...f.body, bookingId: f.ownedBooking }).expect(201);
    const replay = await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", key).send({ ...f.body, bookingId: f.ownedBooking }).expect(200);
    expect(replay.body.ticket.id).toBe(created.body.ticket.id);
    expect(replay.body.ticket).not.toHaveProperty("request_hash");
    expect(replay.headers["cache-control"]).toBe("no-store");
    await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", key).send({ ...f.body, message: "Different synthetic details." }).expect(409);
    expect(f.tickets).toHaveLength(1);
  });

  it("rejects foreign bookings, unknown fields and inactive account creation", async () => {
    const f = fixture();
    await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", randomUUID()).send({ ...f.body, bookingId: randomUUID() }).expect(404);
    await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", randomUUID()).send({ ...f.body, subject_id: randomUUID() }).expect(400);
    await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", randomUUID()).send({ ...f.body, message: "Synthetic invalid\u0000message" }).expect(400);
    f.setIdentityStatus("deletion_pending");
    await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", randomUUID()).send(f.body).expect(403);
    expect(f.tickets).toHaveLength(0);
  });

  it("scopes requester lists to their account and rejects malformed cursors", async () => {
    const f = fixture();
    f.tickets.push({ id: randomUUID(), subject_id: randomUUID(), status: "open", created_at: new Date() });
    const result = await f.auth("get", "/api/v1/support/requests").expect(200);
    expect(result.body.items).toEqual([]);
    expect(f.query).toHaveBeenCalledWith(expect.stringContaining("subject_id = $1"), [f.owner, true, null, null]);
    await f.auth("get", "/api/v1/support/requests?cursor=broken").expect(400);
  });

  it("paginates without putting private message text into the cursor", async () => {
    const f = fixture();
    for (let index = 0; index < 26; index++) f.tickets.push({ id: randomUUID(), subject_id: f.owner, description: "Synthetic private message", status: "open", created_at: new Date("2026-10-16T12:00:00.123Z") });
    const result = await f.auth("get", "/api/v1/support/requests").expect(200);
    expect(result.body.items).toHaveLength(25);
    const decoded = JSON.parse(Buffer.from(result.body.nextCursor, "base64url").toString());
    expect(Object.keys(decoded).sort()).toEqual(["at", "id"]);
    await f.auth("get", `/api/v1/support/requests?cursor=${result.body.nextCursor}`).expect(200);
    expect(f.query).toHaveBeenLastCalledWith(expect.any(String), [f.owner, true, decoded.at, decoded.id]);
  });

  it("records staff replies and history atomically and rejects stale versions", async () => {
    const f = fixture("support"); const id = randomUUID();
    f.tickets.push({ id, subject_id: randomUUID(), status: "open", response_text: null, version: 0, created_at: new Date() });
    await f.auth("get", "/api/v1/support/inbox").expect(200);
    const result = await f.auth("post", `/api/v1/support/requests/${id}/response`).send({ response: "Synthetic staff reply", status: "resolved", expectedVersion: 0 }).expect(200);
    expect(result.body.ticket.status).toBe("resolved");
    expect(result.body.ticket.version).toBe(1);
    expect(f.history).toHaveLength(1);
    await f.auth("post", `/api/v1/support/requests/${id}/response`).send({ response: "Invalid\u0000reply", status: "resolved", expectedVersion: 1 }).expect(400);
    await f.auth("post", `/api/v1/support/requests/${id}/response`).send({ response: "Stale conflicting reply", status: "resolved", expectedVersion: 0 }).expect(409);
    expect(f.history).toHaveLength(1);
    expect(f.query.mock.calls.some(([sql]) => sql === "COMMIT")).toBe(true);
  });

  it("bounds requester submissions per authenticated account", async () => {
    const f = fixture();
    for (let index = 0; index < 5; index++) await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", randomUUID()).send(f.body).expect(201);
    await f.auth("post", "/api/v1/support/requests").set("Idempotency-Key", randomUUID()).send(f.body).expect(429);
    expect(f.tickets).toHaveLength(5);
  });
});
