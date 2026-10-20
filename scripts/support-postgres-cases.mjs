// Called only by the isolated synthetic PostgreSQL proof runner. No external email/provider calls.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { createApiApp } from "../api/app.ts";

export async function verifySupportRequests(pool, foreignBookingId) {
  const codes = new Map();
  const app = createApiApp({
    environment: "test",
    databasePool: pool,
    marketplacePool: pool,
    authConfig: {
      hmacSecret: "isolated-support-proof-only-secret-over-32-bytes",
      production: false,
      webOrigins: [],
    },
    sendAuthEmail: async (email, code) => {
      codes.set(email, code);
    },
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const http = request(server);
  const call = (method, url) => http[method](url).timeout({ response: 3000, deadline: 5000 });
  try {
    async function login(email) {
      await call("post", "/api/v1/auth/code").send({ email }).expect(202);
      const result = await call("post", "/api/v1/auth/verify")
        .send({ email, code: codes.get(email) })
        .expect(200);
      const cookies = result.headers["set-cookie"];
      const csrfCookie = cookies.find((value) => value.startsWith("fixhub24_csrf="));
      const csrf = decodeURIComponent(csrfCookie.split(";", 1)[0].split("=", 2)[1]);
      return (method, url) =>
        call(method, url)
          .set("Cookie", cookies.map((value) => value.split(";", 1)[0]).join("; "))
          .set("x-csrf-token", csrf);
    }
    const ownerEmail = "support.owner@example.invalid";
    const owner = await login(ownerEmail);
    const other = await login("support.other@example.invalid");
    const staffEmail = "support.staff@example.invalid";
    const staff = await login(staffEmail);
    await pool.query(
      "INSERT INTO identity_role (subject_id, role) SELECT id, 'support' FROM identity_subject WHERE email_normalized = $1",
      [staffEmail],
    );

    await call("get", "/api/v1/support/requests").expect(401);
    await owner("get", "/api/v1/support/inbox").expect(403);
    const body = {
      subject: "Synthetic support proof",
      message: "Synthetic request with no real participant data.",
    };
    const key = randomUUID();
    const pair = await Promise.all(
      [0, 1].map(() =>
        owner("post", "/api/v1/support/requests").set("Idempotency-Key", key).send(body),
      ),
    );
    assert.deepEqual(pair.map((result) => result.status).sort(), [200, 201]);
    const id = pair[0].body.ticket.id;
    assert.equal(id, pair[1].body.ticket.id);
    await owner("post", "/api/v1/support/requests")
      .set("Idempotency-Key", key)
      .send({ ...body, message: "Different synthetic message content." })
      .expect(409);
    await owner("post", "/api/v1/support/requests")
      .set("Idempotency-Key", randomUUID())
      .send({ ...body, bookingId: foreignBookingId })
      .expect(404);
    assert.equal((await other("get", "/api/v1/support/requests").expect(200)).body.items.length, 0);

    const replies = await Promise.all(
      ["First synthetic reply", "Concurrent synthetic reply"].map((response) =>
        staff("post", `/api/v1/support/requests/${id}/response`).send({
          response,
          status: "resolved",
          expectedVersion: 0,
        }),
      ),
    );
    assert.deepEqual(replies.map((result) => result.status).sort(), [200, 409]);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM support_ticket_response WHERE ticket_id = $1",
          [id],
        )
      ).rows[0].count,
      1,
    );
    const mine = (await owner("get", "/api/v1/support/requests").expect(200)).body.items[0];
    assert.equal(mine.status, "resolved");
    assert.ok(mine.response_text.includes("synthetic reply"));
    await staff("post", `/api/v1/support/requests/${id}/response`)
      .send({
        response: "Second retained synthetic reply",
        status: "in_review",
        expectedVersion: 1,
      })
      .expect(200);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM support_ticket_response WHERE ticket_id = $1",
          [id],
        )
      ).rows[0].count,
      2,
    );

    await pool.query(`CREATE FUNCTION reject_synthetic_support_reply() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.response_text = 'Synthetic rollback proof' THEN RAISE EXCEPTION 'Synthetic reply failure'; END IF; RETURN NEW; END; $$;
      CREATE TRIGGER reject_synthetic_support_reply BEFORE INSERT ON support_ticket_response FOR EACH ROW EXECUTE FUNCTION reject_synthetic_support_reply()`);
    await staff("post", `/api/v1/support/requests/${id}/response`)
      .send({ response: "Synthetic rollback proof", status: "resolved", expectedVersion: 2 })
      .expect(500);
    const unchanged = (
      await pool.query("SELECT version, status FROM support_ticket WHERE id = $1", [id])
    ).rows[0];
    assert.equal(unchanged.version, 2);
    assert.equal(unchanged.status, "in_review");
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS count FROM support_ticket_response WHERE ticket_id = $1",
          [id],
        )
      ).rows[0].count,
      2,
    );
    await pool.query(
      "DROP TRIGGER reject_synthetic_support_reply ON support_ticket_response; DROP FUNCTION reject_synthetic_support_reply()",
    );

    const ownerId = (
      await pool.query("SELECT id FROM identity_subject WHERE email_normalized = $1", [ownerEmail])
    ).rows[0].id;
    for (let index = 0; index < 26; index++)
      await pool.query(
        "INSERT INTO support_ticket (id, subject_id, subject, description, idempotency_key, request_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          randomUUID(),
          ownerId,
          "Synthetic pagination",
          "Synthetic page record with no real data",
          randomUUID(),
          Buffer.alloc(32),
          "2026-10-16T12:00:00.123Z",
        ],
      );
    const first = (await owner("get", "/api/v1/support/requests").expect(200)).body;
    const second = (
      await owner("get", `/api/v1/support/requests?cursor=${first.nextCursor}`).expect(200)
    ).body;
    assert.equal(first.items.length, 25);
    assert.equal(second.items.length, 2);
    assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.items, ...second.items].map((ticket) => ticket.id)).size, 27);
    assert.equal((await other("get", "/api/v1/support/requests").expect(200)).body.items.length, 0);
    await pool.query(
      "DELETE FROM identity_role WHERE subject_id = (SELECT id FROM identity_subject WHERE email_normalized = $1) AND role = 'support'",
      [staffEmail],
    );
    await staff("get", "/api/v1/support/inbox").expect(403);
    return {
      concurrentCreateSingleTicket: true,
      ownerIsolation: true,
      foreignBookingRejected: true,
      concurrentReplySingleWinner: true,
      retainedReplies: 2,
      replyFailureRollsBack: true,
      paginatedDistinctRequests: 27,
      revokedStaffDenied: true,
    };
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
