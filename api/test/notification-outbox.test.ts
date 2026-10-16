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
  aggregate_id: bookingId,
  event_type: "merchant.booking_offer",
  payload: { bookingId, offerId, merchantId: recipientId },
  attempt_count: 1,
  claim_token: "00000000-0000-4000-8000-000000000006",
};

function fixture(options: { eligible?: boolean; offers?: { status: "pending" | "expired" }[]; contact?: boolean; identityActive?: boolean; phoneVerified?: boolean; consentRevoked?: boolean; consentPolicyVersion?: string; send?: (recipient: string, variables: Record<string, string>) => Promise<{ messageSid: string; status: string }>; empty?: boolean; rateCapped?: boolean; resolutionError?: boolean; eventType?: string; transitionedBeforeDelivery?: boolean; commitFailureAfterSend?: boolean; failUncertainUpdate?: boolean; staleLeaseAfterMarker?: boolean; payloadBookingId?: string } = {}) {
  const encrypted = encryptPhone("+919876543210", recipientId, key);
  const bookingOffers = options.offers ?? [{ status: "pending" as const }];
  const statements: string[] = [];
  const queryRecords: { sql: string; values: unknown[] }[] = [];
  const timeline: string[] = [];
  let bookingLockHeld = false;
  let bookingState = { status: "offered", merchant_id: null as string | null };
  let releaseBookingLock!: () => void;
  const bookingLockReleased = new Promise<void>((resolve) => { releaseBookingLock = resolve; });
  let claimed = false;
  let commitFailureTriggered = false;
  let providerAttemptStarted = false;
  let outboxStatus = "pending";
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    statements.push(sql);
    queryRecords.push({ sql, values });
    timeline.push(sql);
    if (sql === "COMMIT" && options.commitFailureAfterSend && timeline.includes("SEND") && !commitFailureTriggered) {
      commitFailureTriggered = true;
      throw new Error("simulated commit failure");
    }
    if (sql.startsWith("WITH candidate")) {
      if (options.empty || claimed || ["sent", "failed", "suppressed", "uncertain"].includes(outboxStatus) || providerAttemptStarted) return { rows: [] };
      claimed = true;
      outboxStatus = "processing";
      return { rows: [{ ...event, event_type: options.eventType ?? event.event_type,
        payload: options.payloadBookingId ? { ...event.payload, bookingId: options.payloadBookingId } : event.payload }] };
    }
    if (sql.startsWith("SELECT count(*)::int AS attempts")) return { rows: [{ attempts: options.rateCapped ? 12 : 0 }] };
    if (sql.includes("FROM booking_offer o") && sql.includes("JOIN merchant_profile m")) {
      if (options.resolutionError) throw new Error("transient database error");
      return { rows: options.eligible === false ? [] : [{ recipientId, label: "New service request", service: "Plumbing", locality: "Tanuku" }] };
    }
    if (sql.includes("FROM booking_offer WHERE id = $1 AND booking_id = $2 AND merchant_id = $3 FOR SHARE")) {
      const active = bookingOffers.some((offer) => offer.status === "pending");
      return { rows: options.eligible === false || !active ? [] : [{ status: "pending", active: true }] };
    }
    if (sql.includes("FROM merchant_profile WHERE subject_id = $1 FOR SHARE")) {
      return { rows: options.eligible === false ? [] : [{ verification_status: "verified", accepting_jobs: true }] };
    }
    if (sql.includes("FROM service_booking b")) {
      if (options.resolutionError) throw new Error("transient database error");
      const requiresPendingOffer = sql.includes("booking_offer");
      const hasPendingOffer = bookingOffers.some((offer) => offer.status === "pending");
      return { rows: options.eligible === false || (requiresPendingOffer && !hasPendingOffer) ? [] : [{ recipientId, label: "Your request is recorded. No provider is assigned yet.", service: "", locality: "" }] };
    }
    if (sql.includes("FROM service_booking WHERE id = $1 FOR SHARE")) {
      bookingLockHeld = true;
      const transitioned = options.eligible === false || options.transitionedBeforeDelivery;
      if (transitioned) bookingState = { status: "accepted", merchant_id: recipientId };
      return { rows: [bookingState] };
    }
    if (sql === "COMMIT" && bookingLockHeld) {
      bookingLockHeld = false;
      releaseBookingLock();
    }
    if (sql.startsWith("SELECT status FROM identity_subject")) return { rows: [{ status: options.identityActive === false ? "suspended" : "active" }] };
    if (sql.startsWith("SELECT phone_ciphertext")) return { rows: options.contact === false ? [] : [{
      phone_ciphertext: encrypted.ciphertext,
      phone_iv: encrypted.iv,
      phone_auth_tag: encrypted.authTag,
      phone_verified_at: options.phoneVerified === false ? null : new Date(),
      consent_policy_version: options.consentPolicyVersion ?? "transactional-whatsapp-v1",
      consent_revoked_at: options.consentRevoked ? new Date() : null,
    }] };
    if (sql.includes("SET status = 'uncertain'") && sql.includes("provider_attempt_started_at IS NOT NULL")) {
      if (options.staleLeaseAfterMarker && providerAttemptStarted) outboxStatus = "uncertain";
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("SET provider_attempt_started_at = clock_timestamp()")) {
      providerAttemptStarted = true;
      return { rows: [{ id: event.id }], rowCount: 1 };
    }
    if (sql.includes("SET status = 'sent'")) {
      if (outboxStatus === "uncertain") return { rows: [], rowCount: 0 };
      outboxStatus = "sent";
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith("UPDATE transactional_outbox")) {
      if (options.failUncertainUpdate && values[2] === "uncertain") throw new Error("simulated quarantine write failure");
      if (outboxStatus === "uncertain") return { rows: [], rowCount: 0 };
      outboxStatus = String(values[2] ?? outboxStatus);
      return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  });
  const pool = { connect: vi.fn(async () => ({ query, release: vi.fn() } as unknown as PoolClient)) } as unknown as Pick<Pool, "connect">;
  const send = options.send ?? vi.fn(async () => ({ messageSid: `SM${"a".repeat(32)}`, status: "queued" }));
  const orderedSend = (to: string, variables: Record<string, string>) => {
    timeline.push("SEND");
    return send(to, variables);
  };
  return {
    dispatcher: createNotificationOutboxDispatcher(pool, key, orderedSend), send, statements, queryRecords, timeline, bookingLockReleased,
    bookingOffers,
    getOutboxStatus: () => outboxStatus,
    hasDurableProviderAttempt: () => providerAttemptStarted,
    createPeerDispatcher: (peerSend: (recipient: string, variables: Record<string, string>) => Promise<{ messageSid: string; status: string }>) => createNotificationOutboxDispatcher(pool, key, peerSend),
    isBookingLockHeld: () => bookingLockHeld,
    async acceptBooking() {
      if (bookingLockHeld) await bookingLockReleased;
      bookingState = { status: "accepted", merchant_id: recipientId };
      return bookingState;
    },
  };
}

describe("consent-aware transactional notification outbox", () => {
  it("sends only a current eligible event to a verified, consented contact", async () => {
    const test = fixture();
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 1, suppressed: 0, failed: 0, retry: 0 });
    expect(test.send).toHaveBeenCalledWith("+919876543210", { "1": "New service request", "2": "Plumbing", "3": "Tanuku" });
    expect(test.statements.some((sql) => sql.includes("FOR SHARE"))).toBe(true);
    expect(test.statements.some((sql) => sql.includes("claim_token = $2"))).toBe(true);
  });

  it("confirms a current booking using the canonical safe status copy", async () => {
    const test = fixture({ eventType: "request.created", offers: [{ status: "expired" }] });
    expect(test.bookingOffers).toEqual([{ status: "expired" }]);
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 1, suppressed: 0, failed: 0, retry: 0 });
    expect(test.send).toHaveBeenCalledWith("+919876543210", { "1": "Your request is recorded. No provider is assigned yet.", "2": "", "3": "" });
    const resolutionQuery = test.statements.find((sql) => sql.includes("FROM service_booking b"));
    expect(resolutionQuery).toContain("b.customer_id AS \"recipientId\"");
    expect(resolutionQuery).not.toContain("booking_offer");
    expect(test.statements.some((sql) => sql.includes("FROM booking_offer"))).toBe(false);
    expect(test.statements.some((sql) => sql.includes("FROM service_booking WHERE id = $1 FOR SHARE"))).toBe(true);
    expect(test.queryRecords.find((record) => record.sql.includes("FROM service_booking WHERE id = $1 FOR SHARE"))?.values).toEqual([bookingId]);

    const stale = fixture({ eventType: "request.created", eligible: false });
    await expect(stale.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(stale.send).not.toHaveBeenCalled();

    const transitionedDuringResolution = fixture({ eventType: "request.created", transitionedBeforeDelivery: true });
    await expect(transitionedDuringResolution.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(transitionedDuringResolution.send).not.toHaveBeenCalled();

    let notifySendStarted!: () => void;
    let releaseSend!: () => void;
    const sendStarted = new Promise<void>((resolve) => { notifySendStarted = resolve; });
    const sendGate = new Promise<void>((resolve) => { releaseSend = resolve; });
    const blockedSend = vi.fn(async () => {
      notifySendStarted();
      await sendGate;
      return { messageSid: `SM${"b".repeat(32)}`, status: "queued" };
    });
    const concurrent = fixture({ eventType: "request.created", send: blockedSend });
    const dispatch = concurrent.dispatcher.dispatchBatch();
    await sendStarted;
    expect(concurrent.isBookingLockHeld()).toBe(true);
    let assignmentCommitted = false;
    const simulatedAssignment = concurrent.acceptBooking().then(() => { assignmentCommitted = true; });
    await Promise.resolve();
    expect(assignmentCommitted).toBe(false);
    releaseSend();
    await expect(dispatch).resolves.toEqual({ sent: 1, suppressed: 0, failed: 0, retry: 0 });
    await simulatedAssignment;
    expect(assignmentCommitted).toBe(true);
    expect(concurrent.timeline.indexOf("BEGIN")).toBeLessThan(concurrent.timeline.indexOf("SEND"));
    expect(concurrent.timeline.findIndex((statement) => statement.includes("FROM service_booking WHERE id = $1 FOR SHARE"))).toBeLessThan(concurrent.timeline.indexOf("SEND"));
    expect(concurrent.timeline.indexOf("SEND")).toBeLessThan(concurrent.timeline.lastIndexOf("COMMIT"));
    expect((await concurrent.acceptBooking()).status).toBe("accepted");

    const oldConsent = fixture({ eventType: "request.created", consentPolicyVersion: "legacy-unscoped-consent" });
    await expect(oldConsent.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(oldConsent.send).not.toHaveBeenCalled();

    for (const options of [
      { phoneVerified: false },
      { consentRevoked: true },
      { identityActive: false },
    ]) {
      const denied = fixture({ eventType: "request.created", ...options });
      await expect(denied.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
      expect(denied.send).not.toHaveBeenCalled();
    }
  });

  it("suppresses stale events and missing-consent contacts without sending", async () => {
    const stale = fixture({ eligible: false });
    await expect(stale.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(stale.send).not.toHaveBeenCalled();

    const noContact = fixture({ contact: false });
    await expect(noContact.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(noContact.send).not.toHaveBeenCalled();
  });

  it("binds delivery locks to the outbox aggregate and revalidates merchant offers", async () => {
    const mismatched = fixture({ payloadBookingId: "00000000-0000-4000-8000-000000000099" });
    await expect(mismatched.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(mismatched.send).not.toHaveBeenCalled();

    const expired = fixture({ offers: [{ status: "expired" }] });
    await expect(expired.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(expired.send).not.toHaveBeenCalled();

    const transitioned = fixture({ transitionedBeforeDelivery: true });
    await expect(transitioned.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 1, failed: 0, retry: 0 });
    expect(transitioned.send).not.toHaveBeenCalled();
    expect(transitioned.timeline.some((sql) => sql.includes("FROM booking_offer WHERE id = $1 AND booking_id = $2 AND merchant_id = $3 FOR SHARE"))).toBe(false);
  });

  it("quarantines ambiguous provider failures instead of automatically resending", async () => {
    const send = vi.fn(async () => { throw new Error("private provider response"); });
    const test = fixture({ send });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 1, retry: 0 });
    expect(test.queryRecords.some(({ sql, values }) => sql.includes("last_error_code") && values.includes("provider_outcome_unknown"))).toBe(true);
    expect(JSON.stringify(test.statements)).not.toContain("private provider response");
  });

  it("keeps provider-started attempts out of lease recovery when quarantine persistence fails", async () => {
    const send = vi.fn(async () => { throw new Error("provider response timed out"); });
    const test = fixture({ send, failUncertainUpdate: true, staleLeaseAfterMarker: true });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 1, retry: 0 });
    expect(test.hasDurableProviderAttempt()).toBe(true);
    expect(test.getOutboxStatus()).toBe("uncertain");

    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 0, retry: 0 });
    expect(test.getOutboxStatus()).toBe("uncertain");
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("does not lease-reclaim a provider attempt that outlives its lease", async () => {
    let notifySendStarted!: () => void;
    let releaseSend!: () => void;
    const sendStarted = new Promise<void>((resolve) => { notifySendStarted = resolve; });
    const sendGate = new Promise<void>((resolve) => { releaseSend = resolve; });
    const send = vi.fn(async () => {
      notifySendStarted();
      await sendGate;
      return { messageSid: `SM${"c".repeat(32)}`, status: "queued" };
    });
    const test = fixture({ eventType: "request.created", send, staleLeaseAfterMarker: true });
    const dispatch = test.dispatcher.dispatchBatch();
    await sendStarted;
    expect(test.hasDurableProviderAttempt()).toBe(true);

    const peerSend = vi.fn(async () => ({ messageSid: `SM${"d".repeat(32)}`, status: "queued" }));
    const peer = test.createPeerDispatcher(peerSend);
    await expect(peer.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 0, retry: 0 });
    expect(peerSend).not.toHaveBeenCalled();
    releaseSend();
    await expect(dispatch).resolves.toEqual({ sent: 0, suppressed: 0, failed: 1, retry: 0 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(test.getOutboxStatus()).toBe("uncertain");
  });

  it("does not automatically resend when the provider accepted but the sent state could not be committed", async () => {
    const test = fixture({ commitFailureAfterSend: true });
    await expect(test.dispatcher.dispatchBatch()).resolves.toEqual({ sent: 0, suppressed: 0, failed: 1, retry: 0 });
    expect(test.send).toHaveBeenCalledTimes(1);
    expect(test.queryRecords.some(({ sql, values }) => sql.includes("last_error_code") && values.includes("provider_outcome_unknown"))).toBe(true);
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
