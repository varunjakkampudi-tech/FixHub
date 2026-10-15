import { describe, it, expect } from "vitest";
import {
  seed,
  transition,
  calculate,
  type DemoState,
  type Command,
} from "@/features/fixhub/demo-model";
import {
  eligibility,
  enabledServices,
  ratesFor,
  addressSchema,
  offerState,
  type SampleAddress,
} from "@/features/fixhub/location-model";
import { canOpenAssignedDirections, googleMapsDirectionsUrl } from "@/features/fixhub/map-adapter";
const now = Date.parse("2026-10-15T19:00:00Z");
function act(
  s: DemoState,
  type: Command["type"],
  payload: Record<string, unknown>,
  actor = "sample-admin",
  bookingId?: string,
) {
  return transition(
    s,
    { type, payload, actor, id: `test-${s.revision}-${type}`, ...(bookingId ? { bookingId } : {}) },
    now,
  );
}
function address(
  cityId = "tanuku",
  localityId = "tanuku-center",
  lat = 16.75,
  lng = 81.68,
): SampleAddress {
  return {
    id: "SAMPLE-ADDRESS",
    customerId: "sample-c1",
    label: "Home",
    house: "SAMPLE 1",
    street: "SAMPLE Street",
    landmark: "",
    cityId,
    localityId,
    state: "Andhra Pradesh",
    pin: "534211",
    instructions: "",
    lat,
    lng,
    confirmedAt: now,
    preferred: true,
    consent: true,
    mode: "demo",
  };
}
describe("three-city registry and precise sample location", () => {
  it("builds a keyless Google Maps directions URL and rejects invalid coordinates", () => {
    const url = new URL(googleMapsDirectionsUrl({ lat: 16.75, lng: 81.68 }));
    expect(url.origin).toBe("https://www.google.com");
    expect(url.pathname).toBe("/maps/dir/");
    expect(url.searchParams.get("api")).toBe("1");
    expect(url.searchParams.get("destination")).toBe("16.75,81.68");
    expect(url.searchParams.get("travelmode")).toBe("driving");
    expect(() => googleMapsDirectionsUrl({ lat: 91, lng: 0 })).toThrow(RangeError);
    expect(() => googleMapsDirectionsUrl({ lat: 0, lng: Number.NaN })).toThrow(RangeError);
  });
  it("exposes directions only to the assigned merchant or technician during an active job", () => {
    const s = seed(now);
    const booking = s.bookings.find((item) => item.id === "SAMPLE-005");
    const merchant = s.personas.find((item) => item.id === "sample-m1");
    const technician = s.personas.find((item) => item.id === "sample-t1");
    const otherMerchant = s.personas.find((item) => item.id === "sample-m2");
    const customer = s.personas.find((item) => item.id === "sample-c1");
    if (!booking || !merchant || !technician || !otherMerchant || !customer) throw Error();
    const withLocation = { ...booking, location: address() };
    expect(canOpenAssignedDirections(withLocation, merchant)).toBe(true);
    expect(canOpenAssignedDirections(withLocation, technician)).toBe(true);
    expect(canOpenAssignedDirections(withLocation, otherMerchant)).toBe(false);
    expect(canOpenAssignedDirections(withLocation, customer)).toBe(false);
    expect(canOpenAssignedDirections(withLocation, null)).toBe(false);
    expect(canOpenAssignedDirections({ ...withLocation, status: "complete" }, merchant)).toBe(false);
    expect(canOpenAssignedDirections({ ...booking, location: undefined }, merchant)).toBe(false);
  });
  it("limits city service visibility and explains unavailable coverage", () => {
    const s = seed(now);
    expect(enabledServices(s, "eluru").map((v) => v.id)).not.toContain("appliance");
    expect(enabledServices(s, "bhimavaram").map((v) => v.id)).not.toContain("ac");
    const m = s.merchants.find((m) => m.id === "sample-m4");
    if (!m) throw Error();
    expect(
      eligibility(
        s,
        m,
        { category: "ac", zone: "Eluru Center", slot: "morning", date: "2026-10-22" },
        now,
      ),
    ).toEqual([]);
    expect(
      eligibility(s, m, { category: "ac", zone: "Eluru Outskirts", slot: "morning" }, now),
    ).toContain("outside_area");
  });
  it("checks radius, verification, blackout, capacity, service and operating hours", () => {
    const s = seed(now);
    const m = s.merchants[0];
    if (!m) throw Error();
    const request = {
      category: "electrician" as const,
      zone: "Tanuku",
      slot: "morning",
      date: "2026-10-22",
      location: address(),
    };
    expect(eligibility(s, m, request, now)).toEqual([]);
    expect(eligibility(s, m, { ...request, location: { ...address(), lat: 17 } }, now)).toContain(
      "outside_area",
    );
    expect(eligibility(s, { ...m, verification: "pending" }, request, now)).toContain(
      "verification",
    );
    expect(eligibility(s, { ...m, capacity: 0 }, request, now)).toContain("capacity");
    expect(eligibility(s, { ...m, blackouts: [request.date] }, request, now)).toContain("blackout");
    expect(eligibility(s, { ...m, hours: "11:00–15:00" }, request, now)).toContain("hours");
  });
  it("validates India address fields and keeps snapshots after address deletion", () => {
    expect(addressSchema.safeParse({ ...address(), pin: "000000" }).success).toBe(false);
    let r = act(seed(now), "address", { address: address() }, "sample-c1");
    expect(r.ok).toBe(true);
    r = act(
      r.state,
      "create",
      {
        category: "electrician",
        serviceId: "electrician",
        zone: "Tanuku",
        location: address(),
        problem: "SAMPLE request",
        date: "2026-10-22",
        slot: "morning",
        priceVersion: 1,
        priceTotal: 799,
      },
      "sample-c1",
    );
    expect(r.ok).toBe(true);
    expect(r.state.bookings[0]?.offers).toEqual(["sample-m1", "sample-m2"]);
    r = act(r.state, "address", { action: "delete", addressId: "SAMPLE-ADDRESS" }, "sample-c1");
    expect(r.state.bookings[0]?.location?.house).toBe("SAMPLE 1");
    expect(r.state.registry.addresses).toHaveLength(0);
  });
  it("rejects stale address, wrong city/locality and another customer's location", () => {
    const s = seed(now);
    const a = address();
    s.registry.addresses = [a];
    const payload = {
      category: "electrician",
      zone: "Tanuku",
      problem: "SAMPLE",
      date: "2026-10-22",
      slot: "morning",
      priceVersion: 1,
      priceTotal: 799,
    };
    expect(
      act(s, "create", { ...payload, location: { ...a, confirmedAt: now - 90000000 } }, "sample-c1")
        .ok,
    ).toBe(false);
    expect(
      act(s, "create", { ...payload, zone: "Eluru Center", location: a }, "sample-c1").ok,
    ).toBe(false);
    expect(act(s, "address", { address: { ...a, customerId: "sample-c2" } }, "sample-c1").ok).toBe(
      false,
    );
  });
  it("audits city activation and guards referenced deletion without rewriting old leads", () => {
    const s = seed(now);
    const city = s.registry.cities[0];
    if (!city) throw Error();
    expect(
      act(s, "registry", {
        entity: "cities",
        recordId: city.id,
        action: "delete",
        reason: "SAMPLE deletion",
      }).code,
    ).toBe("referenced");
    const r = act(s, "registry", {
      entity: "cities",
      recordId: city.id,
      record: { ...city, status: "paused" },
      reason: "SAMPLE pause",
    });
    expect(r.ok).toBe(true);
    expect(enabledServices(r.state, "tanuku")).toEqual([]);
    expect(r.state.bookings).toEqual(s.bookings);
    expect(r.state.registry.history).toHaveLength(1);
  });
  it("supports validated service create/archive and enforces role isolation", () => {
    const s = seed(now);
    const source = s.registry.services[0];
    if (!source) throw Error();
    const record = {
      ...source,
      id: "sample-new-service",
      names: { "en-IN": "SAMPLE Wiring", "te-IN": "నమూనా వైరింగ్", "hi-IN": "" },
    };
    const payload = { entity: "services", recordId: record.id, record, reason: "SAMPLE add" };
    expect(act(s, "registry", payload, "sample-c1").code).toBe("permission");
    let r = act(s, "registry", payload);
    expect(enabledServices(r.state, "tanuku").some((v) => v.id === record.id)).toBe(true);
    r = act(r.state, "registry", { ...payload, record: { ...record, archived: true } });
    expect(enabledServices(r.state, "tanuku").some((v) => v.id === record.id)).toBe(false);
  });
  it("city-specific price versions affect new quotes only", () => {
    const s = seed(now);
    const old = s.bookings.map((b) => b.estimate.total);
    const r = act(s, "policy", {
      category: "electrician",
      cityId: "eluru",
      serviceId: "electrician",
      rates: { labor: 500 },
    });
    expect(r.ok).toBe(true);
    expect(calculate(ratesFor(r.state, "eluru", "electrician", "electrician")).total).toBe(849);
    expect(calculate(ratesFor(r.state, "tanuku", "electrician", "electrician")).total).toBe(799);
    expect(r.state.bookings.map((b) => b.estimate.total)).toEqual(old);
  });
  it("tracks viewed offers and closes a competing offer after acceptance", () => {
    const s = seed(now);
    let r = act(
      s,
      "create",
      {
        category: "electrician",
        zone: "Tanuku",
        problem: "SAMPLE",
        date: "2026-10-22",
        slot: "morning",
        priceVersion: 1,
        priceTotal: 799,
      },
      "sample-c1",
    );
    const id = r.bookingId ?? "";
    r = act(r.state, "view", {}, "sample-m2", id);
    const b = r.state.bookings[0];
    if (!b) throw Error();
    expect(offerState(b, "sample-m2")).toBe("viewed");
    r = act(r.state, "accept", {}, "sample-m1", id);
    const accepted = r.state.bookings[0];
    if (!accepted) throw Error();
    expect(offerState(accepted, "sample-m2")).toBe("closed");
    expect(act(r.state, "accept", {}, "sample-m2", id).code).toBe("conflict");
  });
});
