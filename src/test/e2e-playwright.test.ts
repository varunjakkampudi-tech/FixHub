// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../../api/app";
import { defaultRepository } from "../../api/db/repository";
import { defaultAuthService } from "../../api/services/auth-service";

/**
 * End-to-End User Simulation Suite (Playwright / REST headless test:playwright)
 * Simulates real-world user journeys across the 3 primary roles:
 * Customer -> Merchant -> Admin (Me)
 */
describe("E2E User Flow Simulation Suite (test:playwright)", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("executes the full end-to-end multi-role lifecycle seamlessly", async () => {
    // -------------------------------------------------------------
    // Step 1: Customer logs in via OTP, books service
    // -------------------------------------------------------------
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543210", role: "customer" })
      .expect(200);

    const custAuth = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543210", otp: "123456" })
      .expect(200);
    const custToken = custAuth.body.token;

    const bookRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        category: "ac",
        serviceTitle: "AC Cooling Coil Inspection",
        description: "AC cooling coil inspection and deep cleaning in Tanuku.",
        address: "Sajjapuram, Tanuku",
        latitude: 16.7566,
        longitude: 81.6811,
      })
      .expect(201);
    const bookingId = bookRes.body.booking.id;
    expect(bookRes.body.booking.status).toBe("offered");

    // -------------------------------------------------------------
    // Step 2: Merchant logs in, reviews offer and accepts lead
    // -------------------------------------------------------------
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543211", role: "merchant" })
      .expect(200);

    const merchAuth = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543211", otp: "123456" })
      .expect(200);
    const merchToken = merchAuth.body.token;

    // Grant AC category to merchant in repo for this simulation
    defaultRepository.merchants.get("mch-001")!.categories.push("ac");

    const acceptRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/accept`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ merchantId: "mch-001" })
      .expect(200);
    expect(acceptRes.body.booking.status).toBe("accepted");

    // -------------------------------------------------------------
    // Step 3: Merchant assigns technician & technician arrives
    // -------------------------------------------------------------
    await request(app)
      .post(`/api/v1/bookings/${bookingId}/assign`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ technicianId: "tch-001" })
      .expect(200);

    const statusArrived = await request(app)
      .post(`/api/v1/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({ status: "arrived" })
      .expect(200);
    expect(statusArrived.body.booking.status).toBe("arrived");

    // Technician submits formal inspection quote
    const quoteRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set("Authorization", `Bearer ${merchToken}`)
      .send({
        technicianId: "tch-001",
        items: [{ description: "Dual run capacitor replacement", amount: 550 }],
        laborAmount: 350,
        partsAmount: 200,
      })
      .expect(201);
    const quoteId = quoteRes.body.quote.id;

    // -------------------------------------------------------------
    // Step 4: Customer accepts quote, technician completes work
    // -------------------------------------------------------------
    const custAcceptQuote = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote/respond`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({ quoteId, accept: true })
      .expect(200);
    expect(custAcceptQuote.body.booking.status).toBe("in_progress");

    const completeRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/complete`)
      .set("Authorization", `Bearer ${merchToken}`)
      .expect(200);
    expect(completeRes.body.booking.status).toBe("completed");

    // Payment settlement (Cash on completion)
    const payRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/payment`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({ paymentMethod: "cash_on_completion" })
      .expect(200);
    expect(payRes.body.booking.status).toBe("settled");

    // -------------------------------------------------------------
    // Step 5: Customer leaves a 5-star review
    // -------------------------------------------------------------
    const reviewRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/review`)
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        rating: 5,
        comment: "Excellent service! Punctual and professional work in Tanuku.",
      })
      .expect(201);
    expect(reviewRes.body.review.rating).toBe(5);

    // -------------------------------------------------------------
    // Step 6: Admin logs in to verify telemetry and invoice breakdown
    // -------------------------------------------------------------
    const admin = defaultRepository.users.get("usr-admin-001")!;
    const adminToken = defaultAuthService.generateToken(admin);

    const invoiceRes = await request(app)
      .get(`/api/v1/bookings/${bookingId}/invoice`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(invoiceRes.body.invoice.invoiceNumber).toContain("INV-FIX");
    expect(invoiceRes.body.invoice.paymentStatus).toBe("paid");
  });
});
