import { describe, it, expect } from "vitest";
import {
  seed,
  transition,
  eligible,
  calculate,
  initialPolicy,
  fifthExample,
  money,
  scenarioSeed,
  type Command,
  type DemoState,
} from "@/features/fixhub/demo-model";
import { messages } from "@/features/fixhub/locales";
const now = Date.parse("2026-10-15T19:00:00Z");
function command(
  s: DemoState,
  type: Command["type"],
  actor: string,
  bookingId?: string,
  payload: Record<string, unknown> = {},
) {
  return transition(
    s,
    {
      id: `test-${s.revision}-${type}-${actor}`,
      type,
      actor,
      ...(bookingId ? { bookingId } : {}),
      payload,
    },
    now,
  );
}
function create(s = seed(now)) {
  const p = calculate(s.policy.electrician);
  return command(s, "create", "sample-c1", undefined, {
    category: "electrician",
    zone: "Tanuku",
    problem: "SAMPLE leaking connection",
    date: "2026-10-22",
    slot: "morning",
    priceVersion: p.rates.version,
    priceTotal: p.total,
  });
}
describe("demo pricing", () => {
  it("clearly distinguishes illustrative estimates from fixed quotes in both supported languages", () => {
    expect(messages.quoteNote[0]).toContain("illustrative estimate, not a fixed quote");
    expect(messages.quoteNote[0]).toContain("No payment is collected in this demo");
    expect(messages.quoteNote[1]).toContain("అంచనా మాత్రమే");
    expect(messages.quoteNote[1]).toContain("ఖరారు చేసిన కోట్ కాదు");
    expect(messages.quoteNote[1]).toContain("చెల్లింపు తీసుకోబడదు");
    expect(messages.faq1A[0]).toContain("illustrative category estimates");
    expect(messages.faq1A[1]).toContain("సూచనాత్మక అంచనాలు");
  });

  it("has five reproducible examples with separate customer and merchant totals", () => {
    expect(Object.values(initialPolicy).map((r) => calculate(r).total)).toEqual([
      799, 649, 1199, 999,
    ]);
    expect(calculate(fifthExample).total).toBe(949);
    const p = calculate({
      ...initialPolicy.electrician,
      fee: 20,
      commissionBps: 1000,
      discount: 50,
      taxConfigured: true,
      taxBps: 1800,
    });
    expect(p.gross).toBe(799);
    expect(p.deduction).toBe(79.9);
    expect(p.net).toBe(719.1);
    expect(p.tax).toBe(138.42);
    expect(p.total).toBe(907.42);
    expect(p.platformRevenue).toBe(49.9);
  });
  it("rounds currency and rejects invalid rates", () => {
    expect(calculate({ ...initialPolicy.plumbing, labor: 10.125 }).labor).toBe(10.13);
    expect(money(799)).toBe("₹799.00");
    expect(() => calculate({ ...initialPolicy.plumbing, discount: 99999 })).toThrow();
    expect(() => calculate({ ...initialPolicy.plumbing, commissionBps: 10001 })).toThrow();
  });
});
describe("cross-role state machine", () => {
  it("offers every eligible merchant only, then enforces first acceptance and assignment", () => {
    let r = create();
    expect(r.ok).toBe(true);
    const id = r.bookingId ?? "";
    const booking = r.state.bookings.find((item) => item.id === id);
    expect(booking).toBeDefined();
    const currentlyEligible = eligible(
      r.state,
      "electrician",
      "Tanuku",
      "morning",
      "2026-10-22",
      undefined,
      undefined,
      now,
    );
    expect(booking?.offers).toEqual(currentlyEligible);
    const created = r.state.notifications.filter(
      (notification) => notification.bookingId === id && notification.event === "created",
    );
    const merchantRecipients = created
      .map((notification) => notification.to)
      .filter((recipient) => r.state.merchants.some((merchant) => merchant.id === recipient));
    expect(merchantRecipients).toHaveLength(currentlyEligible.length);
    expect([...merchantRecipients].sort()).toEqual([...currentlyEligible].sort());
    expect(new Set(merchantRecipients).size).toBe(merchantRecipients.length);
    expect(created.map((notification) => notification.to)).toEqual(
      expect.arrayContaining(["sample-c1", "sample-ops", "sample-admin"]),
    );
    r = command(r.state, "accept", "sample-m1", id);
    expect(r.ok).toBe(true);
    const conflict = command(r.state, "accept", "sample-m2", id);
    expect(conflict.code).toBe("conflict");
    r = command(r.state, "assign", "sample-m1", id, { technicianId: "sample-t1" });
    expect(r.state.bookings[0]?.technicianId).toBe("sample-t1");
    expect(r.state.notifications.some((n) => n.to === "sample-t1" && n.event === "assigned")).toBe(
      true,
    );
  });
  it("runs travel, arrival, inspection, quote approval, work and completion with unchanged price", () => {
    let r = create();
    const id = r.bookingId ?? "";
    r = command(r.state, "accept", "sample-m1", id);
    r = command(r.state, "assign", "sample-m1", id, { technicianId: "sample-t1" });
    for (const status of ["travel", "arrived", "inspection"])
      r = command(r.state, "status", "sample-t1", id, { status });
    r = command(r.state, "quote", "sample-t1", id, { labor: 450, parts: 200 });
    expect(r.state.bookings[0]?.quote?.total).toBe(799);
    expect(command(r.state, "status", "sample-t1", id, { status: "in_progress" }).ok).toBe(false);
    r = command(r.state, "approve", "sample-c1", id, { quoteVersion: 1 });
    r = command(r.state, "status", "sample-t1", id, { status: "in_progress" });
    r = command(r.state, "status", "sample-t1", id, { status: "complete" });
    expect(r.ok).toBe(true);
    expect(r.state.bookings[0]?.status).toBe("complete");
    expect(r.state.bookings[0]?.approvedQuote?.total).toBe(799);
  });
  it("quote revision removes approval and rejects stale approval", () => {
    let r = create();
    const id = r.bookingId ?? "";
    r = command(r.state, "accept", "sample-m1", id);
    r = command(r.state, "assign", "sample-m1", id, { technicianId: "sample-t1" });
    for (const status of ["travel", "arrived", "inspection"])
      r = command(r.state, "status", "sample-t1", id, { status });
    r = command(r.state, "quote", "sample-t1", id, { labor: 450, parts: 200 });
    r = command(r.state, "approve", "sample-c1", id, { quoteVersion: 1 });
    r = command(r.state, "quote", "sample-t1", id, { labor: 600, parts: 200 });
    expect(r.state.bookings[0]?.approvedQuote).toBeNull();
    expect(command(r.state, "approve", "sample-c1", id, { quoteVersion: 1 }).code).toBe("conflict");
    expect(command(r.state, "status", "sample-t1", id, { status: "in_progress" }).ok).toBe(false);
  });
  it("decline keeps alternative merchant eligible and supports cancellation", () => {
    let r = create();
    const id = r.bookingId ?? "";
    r = command(r.state, "decline", "sample-m1", id);
    r = command(r.state, "accept", "sample-m2", id);
    expect(r.ok).toBe(true);
    r = command(r.state, "cancel", "sample-c1", id);
    expect(r.state.bookings[0]?.status).toBe("cancelled");
    expect(command(r.state, "accept", "sample-m1", id).ok).toBe(false);
  });
  it("guards duplicate commands, permissions, no availability and timeouts", () => {
    const s = seed(now);
    const p = calculate(s.policy.electrician);
    const c: Command = {
      id: "same-command",
      type: "create",
      actor: "sample-c1",
      payload: {
        category: "electrician",
        zone: "Tanuku",
        problem: "SAMPLE",
        date: "2026-10-22",
        slot: "morning",
        priceVersion: 1,
        priceTotal: p.total,
      },
    };
    const r = transition(s, c, now);
    expect(transition(r.state, c, now).state.bookings.length).toBe(13);
    expect(
      command(r.state, "policy", "sample-c1", undefined, {
        category: "electrician",
        rates: { fee: 100 },
      }).code,
    ).toBe("permission");
    expect(create(scenarioSeed("no-availability", now)).state.bookings[0]?.status).toBe(
      "no_availability",
    );
    expect(create(scenarioSeed("timeout", now)).code).toBe("timeout");
  });
  it("policy changes retain approved historical quote snapshots", () => {
    let s = seed(now);
    const old = s.bookings.find((b) => b.status === "complete")?.approvedQuote?.total;
    const r = command(s, "policy", "sample-admin", undefined, {
      category: "appliance",
      rates: { labor: 800 },
    });
    expect(r.ok).toBe(true);
    s = r.state;
    expect(s.bookings.find((b) => b.status === "complete")?.approvedQuote?.total).toBe(old);
    expect(s.policy.appliance.version).toBe(2);
  });
});
