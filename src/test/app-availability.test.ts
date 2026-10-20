import { describe, expect, it } from "vitest";

import { seed } from "@/features/fixhub/demo-model";
import { eligibleMerchants } from "@/features/fixhub/provider-availability";

describe("customer demo provider availability", () => {
  it("hides full-capacity providers and providers with active work at capacity", () => {
    const state = seed(Date.parse("2026-10-16T09:00:00Z"));
    const firstBooking = state.bookings[0];
    const firstMerchant = state.merchants.find((merchant) => merchant.id === "sample-m1");
    if (!firstBooking || !firstMerchant) throw new Error("Expected sample marketplace fixtures");

    firstMerchant.capacity = 1;
    state.bookings = [
      {
        ...firstBooking,
        id: "active-capacity-fixture",
        merchantId: firstMerchant.id,
        status: "accepted",
      },
    ];

    const providers = eligibleMerchants(state, "tanuku", "electrician", "2026-10-16").map(
      (merchant) => merchant.id,
    );
    expect(providers).not.toContain("sample-m1");
    expect(providers).not.toContain("sample-m8");
    expect(providers).toContain("sample-m2");
  });

  it("releases capacity when a booking is terminal", () => {
    const state = seed(Date.parse("2026-10-16T09:00:00Z"));
    const firstBooking = state.bookings[0];
    const firstMerchant = state.merchants.find((merchant) => merchant.id === "sample-m1");
    if (!firstBooking || !firstMerchant) throw new Error("Expected sample marketplace fixtures");

    firstMerchant.capacity = 1;
    state.bookings = [
      {
        ...firstBooking,
        id: "completed-capacity-fixture",
        merchantId: firstMerchant.id,
        status: "complete",
      },
    ];

    expect(
      eligibleMerchants(state, "tanuku", "electrician", "2026-10-16").map(
        (merchant) => merchant.id,
      ),
    ).toContain("sample-m1");
  });

  it("honors merchant workdays and date-specific blackouts", () => {
    const state = seed(Date.parse("2026-10-16T09:00:00Z"));
    const first = state.merchants.find((merchant) => merchant.id === "sample-m1");
    const second = state.merchants.find((merchant) => merchant.id === "sample-m2");
    if (!first || !second) throw new Error("Expected sample marketplace fixtures");

    first.workDays = [0];
    second.blackouts = ["2026-10-16"];

    const providers = eligibleMerchants(state, "tanuku", "electrician", "2026-10-16").map(
      (merchant) => merchant.id,
    );
    expect(providers).not.toContain(first.id);
    expect(providers).not.toContain(second.id);
    expect(eligibleMerchants(state, "tanuku", "electrician", "not-a-date")).toEqual([]);
  });
});
