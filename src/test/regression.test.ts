// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../../api/app";
import { defaultRepository } from "../../api/db/repository";
import { defaultAuthService } from "../../api/services/auth-service";

describe("Regression Test Suite (test:regression)", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("executes full dispute lifecycle: create, list, and admin resolve", async () => {
    // 1. Authenticate customer & admin
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    const admin = defaultRepository.users.get("usr-admin-001")!;
    const adminToken = defaultAuthService.generateToken(admin);

    // Create a completed booking for dispute
    const booking = {
      id: "bk-dispute-reg",
      bookingReference: "FIX-ELE-888888",
      customerId: customer.id,
      merchantId: "mch-001",
      category: "electrician",
      serviceTitle: "Wiring Inspection",
      description: "Test description",
      address: "Tanuku Main Road",
      latitude: 16.7565,
      longitude: 81.6812,
      scheduledType: "instant" as const,
      status: "completed" as const,
      inspectionFee: 149,
      laborCharge: 200,
      partsCharge: 0,
      platformFee: 50,
      discount: 0,
      totalAmount: 399,
      paymentMethod: "cash_on_completion" as const,
      paymentStatus: "paid" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    defaultRepository.bookings.set(booking.id, booking);

    // 2. Customer raises dispute
    const dispRes = await request(app)
      .post("/api/v1/disputes")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        bookingId: booking.id,
        reason: "Technician arrived 45 minutes late, requesting fee waiver",
        details: "Work was completed but scheduling SLA was violated.",
      })
      .expect(201);
    const disputeId = dispRes.body.dispute.id;

    // 3. Admin resolves dispute
    const resolveRes = await request(app)
      .post(`/api/v1/disputes/${disputeId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        resolutionNotes: "Fee refunded to customer demo balance",
      })
      .expect(200);

    expect(resolveRes.body.dispute.status).toBe("resolved");
    expect(resolveRes.body.dispute.resolutionNotes).toContain("Fee refunded");
  });

  it("handles quote rejection and status transition cleanly", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    const merchant = defaultRepository.users.get("usr-merch-001")!;
    const merchToken = defaultAuthService.generateToken(merchant);

    // Create booking
    const bRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        category: "plumbing",
        serviceTitle: "Kitchen tap leakage",
        description: "Severe water leak under kitchen sink",
        address: "Tanuku Market Yard",
        latitude: 16.7566,
        longitude: 81.6811,
      })
      .expect(201);
    const bookingId = bRes.body.booking.id;

    // Merchant accepts and submits quote
    await request(app)
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ merchantId: "mch-001" })
      .expect(200);

    const quoteRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({
        technicianId: "tch-001",
        items: [{ description: "Heavy copper pipe overhaul", amount: 900 }],
        laborAmount: 600,
        partsAmount: 300,
      })
      .expect(201);
    const quoteId = quoteRes.body.quote.id;

    // Customer rejects quote
    const rejectRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote/respond`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({ quoteId, accept: false })
      .expect(200);

    expect(rejectRes.body.booking.status).toBe("quote_rejected");
  });

  it("enforces payload limit boundary (rejects payloads > 32KB)", async () => {
    const hugePayload = "A".repeat(40 * 1024);
    const res = await request(app)
      .post("/api/v1/auth/request-otp")
      .set("Content-Type", "application/json")
      .send(`{"phone":"+919876543210","junk":"${hugePayload}"}`);
    expect([413, 400]).toContain(res.status);
  });
});
