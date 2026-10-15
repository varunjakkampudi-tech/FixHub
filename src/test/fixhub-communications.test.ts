import { describe, it, expect } from "vitest";
import { seed, transition } from "../features/fixhub/demo-model";
import {
  initialOtp,
  startDemoVerification,
  checkDemoVerification,
  normalizePhone,
  maskPhone,
  smsSegments,
  estimateMessageCost,
  enqueueNotification,
  whatsappAllowed,
  demoActionToken,
} from "../features/fixhub/communications-model";
const now = 1792080000000;
describe("safe communications scenarios", () => {
  it("correct/incorrect OTP expires, cancels and throttles", () => {
    const o = startDemoVerification(initialOtp, now);
    expect(checkDemoVerification(o, "000000", now + 1).state).toBe("verified");
    expect(checkDemoVerification(o, "123456", now + 1).state).toBe("incorrect");
    expect(checkDemoVerification(o, "000000", now + 120000).state).toBe("expired");
    expect(checkDemoVerification({ ...o, state: "cancelled" }, "000000", now + 1).state).toBe(
      "cancelled",
    );
    expect(startDemoVerification(o, now + 1).state).toBe("rate_limited");
  });
  it("normalizes E164 and rejects malformed phone; masks details", () => {
    expect(normalizePhone("9000000000")).toBe("+919000000000");
    expect(normalizePhone("+1 (202) 555-0100")).toBe("+12025550100");
    expect(normalizePhone("bad")).toBeNull();
    expect(maskPhone("9000000000")).not.toContain("9000000000");
  });
  it("resend cap is deterministic", () => {
    let o = initialOtp;
    for (let i = 0; i < 3; i++) o = startDemoVerification(o, now + i * 31000);
    expect(startDemoVerification(o, now + 93000).state).toBe("rate_limited");
  });
  it("canonical booking event queues merchant channels and inbox; deduplicates", () => {
    const s = seed(now);
    s.communications.preferences["sample-m1"] = {
      sms: true,
      whatsapp: true,
      quiet: false,
      marketing: false,
      updatedAt: now,
    };
    const n = {
      id: "DEMO-test",
      to: "sample-m1",
      bookingId: "SAMPLE-003",
      event: "created" as const,
      at: now,
      read: false,
    };
    enqueueNotification(s, n);
    enqueueNotification(s, n);
    expect(s.communications.messages).toHaveLength(2);
    expect(
      s.communications.messages.every((m) => m.status === "queued" && m.providerReceipt === null),
    ).toBe(true);
  });
  it("delivery does not accept a booking; duplicate commands do not repeat", () => {
    const s = seed(now);
    s.communications.preferences["sample-m1"] = {
      sms: true,
      whatsapp: true,
      quiet: false,
      marketing: false,
      updatedAt: now,
    };
    enqueueNotification(s, {
      id: "DEMO-test",
      to: "sample-m1",
      bookingId: "SAMPLE-003",
      event: "created",
      at: now,
      read: false,
    });
    const m = s.communications.messages[0];
    if (!m) throw Error("missing");
    const command = {
      id: "delivery-test",
      actor: "sample-m1",
      type: "communications" as const,
      payload: { action: "delivery", recordId: m.id, status: "delivered" },
    };
    const r = transition(s, command, now);
    expect(r.ok).toBe(true);
    expect(r.state.bookings[2]?.merchantId).toBeNull();
    expect(transition(r.state, command, now).code).toBe("duplicate");
  });
  it("unread notifications and read remain shared and role-scoped", () => {
    const s = seed(now);
    s.notifications.push(
      { id: "a", to: "sample-c1", bookingId: "SAMPLE-001", event: "created", at: now, read: false },
      { id: "b", to: "sample-m1", bookingId: "SAMPLE-001", event: "created", at: now, read: false },
    );
    const r = transition(s, { id: "read", actor: "sample-c1", type: "read" }, now);
    expect(r.state.notifications[0]?.read).toBe(true);
    expect(r.state.notifications[1]?.read).toBe(false);
  });
  it("opt-out suppresses external sends, leaves in-app intact", () => {
    const s = seed(now);
    const n = {
      id: "b",
      to: "sample-c1",
      bookingId: "SAMPLE-001",
      event: "created" as const,
      at: now,
      read: false,
    };
    s.notifications.push(n);
    enqueueNotification(s, n);
    expect(s.communications.messages.every((m) => m.status === "suppressed")).toBe(true);
    expect(s.notifications).toHaveLength(1);
  });
  it("failure retry remains bounded and callbacks are monotonic", () => {
    const s = seed(now);
    s.communications.preferences["sample-m1"] = {
      sms: true,
      whatsapp: true,
      quiet: false,
      marketing: false,
      updatedAt: now,
    };
    enqueueNotification(s, {
      id: "b",
      to: "sample-m1",
      bookingId: "SAMPLE-003",
      event: "created",
      at: now,
      read: false,
    });
    const m = s.communications.messages[0];
    if (!m) throw Error("missing");
    let r = transition(
      s,
      {
        id: "fail",
        actor: "sample-m1",
        type: "communications",
        payload: { action: "delivery", recordId: m.id, status: "failed" },
      },
      now,
    );
    expect(r.state.communications.deadLetters).toContain(m.id);
    r = transition(
      r.state,
      {
        id: "retry",
        actor: "sample-m1",
        type: "communications",
        payload: { action: "retry", recordId: m.id },
      },
      now,
    );
    expect(r.state.communications.messages[0]?.status).toBe("queued");
    const delivered = transition(
      r.state,
      {
        id: "del",
        actor: "sample-m1",
        type: "communications",
        payload: { action: "delivery", recordId: m.id, status: "delivered" },
      },
      now,
    );
    expect(
      transition(
        delivered.state,
        {
          id: "stale",
          actor: "sample-m1",
          type: "communications",
          payload: { action: "delivery", recordId: m.id, status: "sent" },
        },
        now,
      ).ok,
    ).toBe(false);
  });
  it("WhatsApp requires template or session and rejects forged offer token", () => {
    const s = seed(now);
    s.communications.preferences["sample-m1"] = {
      sms: true,
      whatsapp: true,
      quiet: false,
      marketing: false,
      updatedAt: now,
    };
    enqueueNotification(s, {
      id: "b",
      to: "sample-m1",
      bookingId: "SAMPLE-003",
      event: "created",
      at: now,
      read: false,
    });
    const m = s.communications.messages.find((m) => m.channel === "whatsapp");
    if (!m) throw Error("missing");
    expect(whatsappAllowed(s.communications, m, now).ok).toBe(true);
    m.templateId = "missing";
    expect(whatsappAllowed(s.communications, m, now).ok).toBe(false);
    m.sessionUntil = now + 1000;
    expect(whatsappAllowed(s.communications, m, now).ok).toBe(true);
    const b = s.bookings[2];
    if (!b) throw Error("missing");
    expect(
      transition(
        s,
        {
          id: "forged",
          actor: "sample-m1",
          type: "communications",
          payload: { action: "reply", recordId: m.id, token: "forged" },
        },
        now,
      ).ok,
    ).toBe(false);
    expect(
      transition(
        s,
        {
          id: "valid",
          actor: "sample-m1",
          type: "communications",
          payload: { action: "reply", recordId: m.id, token: demoActionToken(m, b.expiresAt) },
        },
        now,
      ).code,
    ).toBe("review_required");
    expect(b.merchantId).toBeNull();
  });
  it("Unicode segments and costs do not alter service-price arithmetic", () => {
    expect(smsSegments("a".repeat(161)).segments).toBe(2);
    expect(smsSegments("అ".repeat(71)).segments).toBe(2);
    expect(smsSegments("^".repeat(81)).segments).toBe(2);
    const s = seed(now);
    expect(estimateMessageCost(s.communications, "sms", "test").configured).toBe(false);
    s.communications.rates.smsUsd = 0.1;
    expect(estimateMessageCost(s.communications, "sms", "అ".repeat(71)).usd).toBe(0.2);
    expect(s.bookings[0]?.estimate.total).toBe(799);
  });
});
