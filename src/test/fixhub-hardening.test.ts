import { describe, expect, it } from "vitest";
import { seed, transition, type DemoState } from "../features/fixhub/demo-model";
import { cityForZone, eligibility } from "../features/fixhub/location-model";
import { rolePath } from "../features/fixhub/demo-controls";
import {
  checkDemoVerification,
  startDemoVerification,
  initialOtp,
  enqueueNotification,
} from "../features/fixhub/communications-model";
const now = 1792080000000;
function messages() {
  const s = seed(now);
  s.communications.preferences["sample-m1"] = {
    sms: true,
    whatsapp: true,
    quiet: false,
    marketing: false,
    updatedAt: now,
  };
  enqueueNotification(s, {
    id: "DEMO-hardening",
    to: "sample-m1",
    event: "created",
    bookingId: "SAMPLE-003",
    at: now,
    read: false,
  });
  const message = s.communications.messages.find((m) => m.channel === "sms");
  if (!message) throw new Error("Missing fixture");
  return { s, message };
}
function delivery(s: DemoState, id: string, recordId: string, status: string) {
  return transition(
    s,
    {
      id,
      actor: "sample-m1",
      type: "communications",
      payload: { action: "delivery", recordId, status },
    },
    now,
  );
}
describe("handoff hardening regressions", () => {
  it("opens an allowed demo home for operations and admin", () => {
    expect(rolePath("operations")).toBe("/admin/dispatch");
    expect(rolePath("admin")).toBe("/admin/dashboard");
  });
  it("does not verify an OTP after a throttle", () => {
    const pending = startDemoVerification(initialOtp, now);
    const limited = startDemoVerification(pending, now + 1);
    expect(checkDemoVerification(limited, "000000", now + 2)).toEqual(limited);
  });
  it("ignores delayed failure and unknown callbacks after delivery", () => {
    const { s, message } = messages();
    const delivered = delivery(s, "delivered", message.id, "delivered");
    for (const status of ["failed", "unknown", "sent"]) {
      const result = delivery(delivered.state, status, message.id, status);
      expect(result.code).toBe("stale");
      expect(result.state.communications.messages.find((m) => m.id === message.id)?.status).toBe(
        "delivered",
      );
      expect(result.state.communications.deadLetters).toEqual([]);
    }
  });
  it("retry respects pause and event channel policy", () => {
    const { s, message } = messages();
    const failed = delivery(s, "failed", message.id, "failed").state;
    const pref = failed.communications.preferences["sample-m1"];
    if (!pref) throw new Error("Missing preference");
    pref.quiet = true;
    const command = {
      id: "retry",
      actor: "sample-m1",
      type: "communications" as const,
      payload: { action: "retry", recordId: message.id },
    };
    expect(transition(failed, command, now).code).toBe("policy");
    pref.quiet = false;
    failed.communications.policy["created"] = { sms: false, whatsapp: true };
    expect(transition(failed, command, now).code).toBe("policy");
  });
  it("localized locality names and stable IDs produce the same eligibility", () => {
    const s = seed(now),
      merchant = s.merchants[0];
    if (!merchant) throw new Error("Missing merchant");
    const request = { category: "electrician" as const, zone: "Tanuku", slot: "morning" };
    expect(eligibility(s, merchant, { ...request, zone: "తణుకు" }, now)).toEqual(
      eligibility(s, merchant, request, now),
    );
    expect(eligibility(s, { ...merchant, zones: ["tanuku-center"] }, request, now)).toEqual(
      eligibility(s, merchant, request, now),
    );
    expect(cityForZone(s, "ఏలూరు కేంద్రం")).toBe("eluru");
  });
  it("cannot assign a deactivated technician", () => {
    const s = seed(now),
      booking = s.bookings[0],
      tech = s.personas.find((p) => p.id === "sample-t1");
    if (!booking || !tech) throw new Error("Missing fixture");
    booking.status = "accepted";
    booking.merchantId = "sample-m1";
    booking.technicianId = null;
    tech.deactivated = true;
    expect(
      transition(
        s,
        {
          id: "assign",
          actor: "sample-m1",
          type: "assign",
          bookingId: booking.id,
          payload: { technicianId: tech.id },
        },
        now,
      ).code,
    ).toBe("capacity");
  });
});
