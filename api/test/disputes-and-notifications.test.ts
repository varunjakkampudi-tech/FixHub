// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { defaultRepository } from "../db/repository";
import { defaultAuthService } from "../services/auth-service";

describe("Disputes, Notifications & Webhooks API", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("raises, lists, and resolves a service dispute", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    const admin = defaultRepository.users.get("usr-admin-001")!;
    const adminToken = defaultAuthService.generateToken(admin);

    // Create a dummy booking for dispute
    const booking = {
      id: "bk-dispute-test",
      bookingReference: "FIX-ELE-999999",
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

    // 1. Customer raises dispute
    const raiseRes = await request(app)
      .post("/api/v1/disputes")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        bookingId: booking.id,
        reason: "Overcharged for minor wiring fix",
        details:
          "Technician spent only 5 minutes but charged 200 labor for just flipping the breaker.",
      })
      .expect(201);

    const disputeId = raiseRes.body.dispute.id;
    expect(raiseRes.body.dispute.status).toBe("open");

    // 2. Admin lists disputes
    const listRes = await request(app)
      .get("/api/v1/disputes")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(listRes.body.disputes.length).toBeGreaterThanOrEqual(1);

    // 3. Admin resolves dispute
    const resolveRes = await request(app)
      .post(`/api/v1/disputes/${disputeId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        resolutionNotes: "Settled with merchant. ₹100 credit refunded to customer.",
      })
      .expect(200);

    expect(resolveRes.body.dispute.status).toBe("resolved");
    expect(resolveRes.body.dispute.resolutionNotes).toContain("₹100 credit");
  });

  it("retrieves notifications and marks them as read", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    // Seed notification
    const notifId = "notif-test-123";
    defaultRepository.notifications.set(notifId, {
      id: notifId,
      userId: customer.id,
      title: "Welcome to FixHub Tanuku",
      message: "Find verified local electricians and plumbers.",
      channel: "in_app",
      status: "sent",
      createdAt: new Date().toISOString(),
    });

    const listRes = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${custToken}`)
      .expect(200);

    expect(listRes.body.notifications.length).toBeGreaterThanOrEqual(1);

    const readRes = await request(app)
      .post(`/api/v1/notifications/${notifId}/read`)
      .set("Authorization", `Bearer ${custToken}`)
      .expect(200);

    expect(readRes.body.notification.status).toBe("read");
  });

  it("handles WhatsApp Cloud API webhook challenge and event delivery", async () => {
    // Challenge verification (GET)
    const challengeRes = await request(app)
      .get(
        "/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_12345&hub.verify_token=fixhub-whatsapp-verify-token",
      )
      .expect(200);

    expect(challengeRes.text).toBe("test_challenge_12345");

    // Event delivery (POST)
    const eventRes = await request(app)
      .post("/api/v1/webhooks/whatsapp")
      .send({
        object: "whatsapp_business_account",
        entry: [{ id: "WHATSAPP_ID", changes: [] }],
      })
      .expect(200);

    expect(eventRes.body.status).toBe("received");
  });
});
