// @vitest-environment node
import type { Pool, PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

import { createNotificationOutboxDispatcher } from "../notification-outbox";
import { encryptPhone } from "../whatsapp-contact";

const key = Buffer.alloc(32, 9);
const recipientId = "00000000-0000-4000-8000-000000000002";
const bookingId = "00000000-0000-4000-8000-000000000003";
const offerId = "00000000-0000-4000-8000-000000000004";
const event = {
  id: "00000000-0000-4000-8000-000000000005",
  event_type: "merchant.booking_offer",
  payload: { bookingId, offerId, merchantId: recipientId },
  attempt_count: 1,
  claim_token: "00000000-0000-4000-8000-000000000006",
};

function fixture(options: { eligible?: boolean; contact?: boolean; send?: () => Promise<{ messageSid: string; status: string }>; empty?: boolean; rateCapped?: boolean; resolutionError?: boolean } = {}) {
  const encrypted = encryptPhone("+919876543210", recipientId, key);
  const statements: string[] = [];
  let claimed = false;
  const query = vi.fn(async (sql: string) => {
    statements.push(sql);
    if (sql.startsWith("WITH candidate")) {
      if (options.empty || claimed) return { rows: [] };
      claimed = true;
      return { rows: [event] };
    }
    if (sql.startsWith("SELECT count(*)::int AS attempts")) return { rows: [{ attempts: options.rateCapped ? 12 : 0 }] };
    if (sql.includes("FROM booking_offer o")) {
      if (options.resolutionError) throw new Error("transient database error");
      return { rows: options.eligible === false ? [] : [{ recipientId, label: "New service request", service: "Plumbing", locality: "Tanuku" }] };
    }
    if (sql.startsWith("SELECT status FROM identity_subject")) return { rows: [{ status: "active" }] };
    if (sql.startsWith("SELECT phone_ciphertext")) return { rows: options.contact === false ? [] : [{ phone_ciphertext: encrypted.ciphertext, phone_iv: encrypted.iv, phone_auth_tag: encrypted.authTag, phone_verified_at: new Date(), consent_revoked_at: null }] };
    if (sql.startsWith("UPDATE transactional_outbox")) return { rows: [], rowCount: 1 };
    return { rows: [], rowCount: 1 };
  });
  const pool = { connect: vi.fn(async () => ({ query, release: vi.fn() } as unknown as PoolClient)) } as unknown as Pick<Pool, "connect">;
  const send = options.send ?? vi.fn(async () => ({ messageSid: `SM${"a".repeat(32)}`, status: "queued" }));
  return { dispatcher: createNotificationOutboxDispatcher(pool, key, send), send, statements };
}

describe("consent-aware transactional notification outbox", () => {
  it("sends only a current eligible event to a verified, consented contact", async () => {
    const test = fixture();
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 1, suppressed: 0, failed: 0, retry: 0 });
    expect(test.send).toHaveBeenCalledWith("+919876543210", { "1": "New service request", "2": "Plumbing", "3": "Tanuku" });
    expect(test.statements.some((sql) => sql.includes("FOR SHARE"))).toBe(true);
    expect(test.statements.some((sql) => sql.includes("claim_token = $2"))).toBe(true);
  });

  it("suppresses stale events and missing-consent contacts without sending", async () => {
    const stale = fixture({ eligible: false });
    await expect(stale.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(stale.send).not.toHaveBeenCalled();

    const noContact = fixture({ contact: false });
    await expect(noContact.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(noContact.send).not.toHaveBeenCalled();
  });

  it("retries provider failures with bounded exponential delay and redacted error state", async () => {
    const send = vi.fn(async () => { throw new Error("private provider response"); });
    const test = fixture({ send });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 0, retry: 1 });
    expect(test.statements.some((sql) => sql.includes("last_error_code"))).toBe(true);
    expect(JSON.stringify(test.statements)).not.toContain("private provider response");
  });

  it("does no work when the queue is empty", async () => {
    const test = fixture({ empty: true });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 0, retry: 0 });
    expect(test.send).not.toHaveBeenCalled();
  });

  it("enforces the shared provider request ceiling before claiming more work", async () => {
    const test = fixture({ rateCapped: true });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 0, retry: 0 });
    expect(test.send).not.toHaveBeenCalled();
    expect(test.statements.some((sql) => sql.startsWith("WITH candidate"))).toBe(false);
  });

  it("retries transient database failures instead of discarding the notification", async () => {
    const test = fixture({ resolutionError: true });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 0, retry: 1 });
    expect(test.statements.some((sql) => sql.includes("SET status = $3"))).toBe(true);
    expect(test.send).not.toHaveBeenCalled();
  });
});
