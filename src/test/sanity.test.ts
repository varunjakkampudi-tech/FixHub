// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../../api/app";
import { defaultRepository } from "../../api/db/repository";

describe("Sanity Test Suite (test:sanity)", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("authenticates the 3 primary roles via OTP flow (Customer, Merchant, Admin)", async () => {
    // 1. Customer (+919876543210 is seeded as usr-cust-001)
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543210", role: "customer" })
      .expect(200);

    const custVerify = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543210", otp: "123456" })
      .expect(200);

    expect(custVerify.body.user.role).toBe("customer");
    expect(custVerify.body.token).toBeDefined();

    // 2. Merchant (+919876543211 is seeded as usr-merch-001)
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543211", role: "merchant" })
      .expect(200);

    const merchVerify = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543211", otp: "123456" })
      .expect(200);

    expect(merchVerify.body.user.role).toBe("merchant");

    // 3. Admin (Me) (+919999999999 is seeded as usr-admin-001)
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919999999999", role: "admin" })
      .expect(200);

    const adminVerify = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919999999999", otp: "123456" })
      .expect(200);

    expect(adminVerify.body.user.role).toBe("admin");
  });

  it("checks merchant directory is populated and active", async () => {
    const res = await request(app).get("/api/v1/merchants");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.merchants)).toBe(true);
    expect(res.body.merchants.length).toBeGreaterThan(0);
    const m = res.body.merchants[0];
    expect(m).toHaveProperty("id");
    expect(m).toHaveProperty("businessName");
    expect(m).toHaveProperty("categories");
  });
});
