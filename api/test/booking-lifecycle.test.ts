// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { defaultRepository } from "../db/repository";
import { defaultAuthService } from "../services/auth-service";

describe("Complete Booking & Service Lifecycle", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("completes full end-to-end service lifecycle from request to settlement and review", async () => {
    // Users & Tokens
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    const merchantUser = defaultRepository.users.get("usr-merch-001")!;
    const merchToken = defaultAuthService.generateToken(merchantUser);

    // 1. Customer creates booking
    const createRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        category: "electrician",
        serviceTitle: "Main Board Short Circuit Repair",
        description: "Power cut in living room and burning smell from MCB.",
        address: "Near Tanuku Head Post Office, Tanuku",
        latitude: 16.7565,
        longitude: 81.6812,
      })
      .expect(201);

    const bookingId = createRes.body.booking.id;
    expect(createRes.body.booking.status).toBe("offered");

    // 2. Merchant accepts booking
    const acceptRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ merchantId: "mch-001" })
      .expect(200);

    expect(acceptRes.body.booking.status).toBe("accepted");
    expect(acceptRes.body.booking.merchantId).toBe("mch-001");

    // 3. Merchant assigns technician
    const assignRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/assign-technician`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ technicianId: "tch-001" })
      .expect(200);

    expect(assignRes.body.booking.status).toBe("technician_assigned");
    expect(assignRes.body.booking.technicianId).toBe("tch-001");

    // 4. Technician marks on the way & arrived
    await request(app)
      .post(`/api/v1/bookings/${bookingId}/progress`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ status: "on_the_way" })
      .expect(200);

    const arrivedRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/progress`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ status: "arrived" })
      .expect(200);

    expect(arrivedRes.body.booking.status).toBe("arrived");

    // 5. Technician submits inspection quote
    const quoteRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({
        technicianId: "tch-001",
        items: [
          { description: "63A 2-Pole MCB Replacement", amount: 450 },
          { description: "Short circuit wiring labor", amount: 250 },
        ],
        laborAmount: 250,
        partsAmount: 450,
      })
      .expect(201);

    const quoteId = quoteRes.body.quote.id;
    expect(quoteRes.body.quote.totalAmount).toBe(149 + 250 + 450 + 50); // Inspection + Labor + Parts + Platform fee

    // 6. Customer accepts quote
    const quoteRespondRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote/respond`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({ quoteId, accept: true })
      .expect(200);

    expect(quoteRespondRes.body.booking.status).toBe("in_progress");

    // 7. Technician completes work
    const completeRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/complete`)
      .set("Authorization", `Bearer ${merchToken}`)
      .expect(200);

    expect(completeRes.body.booking.status).toBe("completed");

    // 8. Payment settlement (Cash on completion)
    const paymentRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/payment`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({ paymentMethod: "cash_on_completion" })
      .expect(200);

    expect(paymentRes.body.booking.status).toBe("settled");
    expect(paymentRes.body.booking.paymentStatus).toBe("paid");

    // 9. Customer retrieves invoice breakdown
    const invoiceRes = await request(app)
      .get(`/api/v1/bookings/${bookingId}/invoice`)
      .set("Authorization", `Bearer ${custToken}`)
      .expect(200);

    expect(invoiceRes.body.invoice.invoiceNumber).toContain("INV-FIX");
    expect(invoiceRes.body.invoice.paymentStatus).toBe("paid");
    expect(invoiceRes.body.invoice.items.length).toBeGreaterThanOrEqual(4);

    // 10. Customer rates and reviews
    const reviewRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        rating: 5,
        comment: "Excellent timely work by Prasad Rao. Problem solved professionally.",
      })
      .expect(201);

    expect(reviewRes.body.review.rating).toBe(5);

    // Verify merchant rating was updated
    const merchantProfile = await request(app).get("/api/v1/merchants/mch-001").expect(200);
    expect(merchantProfile.body.merchant.totalReviews).toBeGreaterThanOrEqual(85);
  });

  it("allows cancellation before work completion", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    const createRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        category: "plumbing",
        serviceTitle: "Kitchen Sink Blockage",
        description: "Water backing up into sink.",
        address: "Rashtrapathy Road, Tanuku",
        latitude: 16.758,
        longitude: 81.679,
      })
      .expect(201);

    const bookingId = createRes.body.booking.id;

    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({ reason: "Issue was resolved by family plumber." })
      .expect(200);

    expect(cancelRes.body.booking.status).toBe("cancelled");
    expect(cancelRes.body.booking.cancellationReason).toContain("resolved by family plumber");
  });
});
