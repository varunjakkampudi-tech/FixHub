// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { defaultRepository } from "../db/repository";
import { defaultAuthService } from "../services/auth-service";

describe("Smart Dispatch & Atomic First Acceptance", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("broadcasts booking offers to eligible nearby merchants", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const token = defaultAuthService.generateToken(customer);

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        category: "electrician",
        serviceTitle: "Ceiling Fan Regulator Repair",
        description: "Regulator knob broken and sparks when turned on.",
        address: "Near Sivalayam, Tanuku",
        latitude: 16.756,
        longitude: 81.681,
      })
      .expect(201);

    const booking = res.body.booking;
    expect(booking.status).toBe("offered");

    // Check offers created in repository
    const offers = Array.from(defaultRepository.bookingOffers.values()).filter(
      (o) => o.bookingId === booking.id
    );
    expect(offers.length).toBeGreaterThanOrEqual(1);
    expect(offers[0].status).toBe("offered");
  });

  it("prevents double-acceptance race condition when two merchants accept concurrently", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    // 1. Customer creates electrician booking
    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        category: "electrician",
        serviceTitle: "Switchboard Replacement",
        description: "Need main switchboard replaced with MCB.",
        address: "Clock Tower Center, Tanuku",
        latitude: 16.7565,
        longitude: 81.6812,
      })
      .expect(201);

    const bookingId = bookingRes.body.booking.id;

    // 2. Prepare tokens for two different merchants
    const merchantUser1 = defaultRepository.users.get("usr-merch-001")!;
    const token1 = defaultAuthService.generateToken(merchantUser1);

    // Create a second electrician merchant
    const merchantUser2 = defaultRepository.users.get("usr-merch-002")!;
    merchantUser2.role = "merchant";
    defaultRepository.merchants.get("mch-002")!.categories.push("electrician");
    const token2 = defaultAuthService.generateToken(merchantUser2);

    // 3. Fire concurrent acceptance requests simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/bookings/${bookingId}/accept`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ merchantId: "mch-001" }),
      request(app)
        .post(`/api/v1/bookings/${bookingId}/accept`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ merchantId: "mch-002" }),
    ]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly ONE must succeed (200) and the other must be rejected (409 Conflict)
    expect(statuses).toEqual([200, 409]);

    const winnerRes = res1.status === 200 ? res1 : res2;
    const loserRes = res1.status === 409 ? res1 : res2;

    expect(winnerRes.body.booking.status).toBe("accepted");
    expect(loserRes.body.error.code).toBe("ACCEPTANCE_CONFLICT");

    // Verify booking in DB has only ONE assigned merchant
    const finalBooking = defaultRepository.bookings.get(bookingId)!;
    expect(finalBooking.merchantId).toBeDefined();
    expect(["mch-001", "mch-002"]).toContain(finalBooking.merchantId);
  });
});
