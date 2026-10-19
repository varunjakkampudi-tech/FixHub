// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { defaultRepository } from "../db/repository";

describe("Auth API", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("requests OTP with valid phone number", async () => {
    const res = await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543210", role: "customer" })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("OTP sent");
  });

  it("rejects invalid phone number formats", async () => {
    const res = await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "123" })
      .expect(400);

    expect(res.body.error.code).toBe("INVALID_INPUT");
  });

  it("verifies OTP and returns user profile and JWT token", async () => {
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543210" })
      .expect(200);

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543210", otp: "123456" })
      .expect(200);

    expect(verifyRes.body.user).toBeDefined();
    expect(verifyRes.body.user.phone).toBe("+919876543210");
    expect(verifyRes.body.token).toBeDefined();
    expect(typeof verifyRes.body.token).toBe("string");
  });

  it("rejects invalid OTP with 401 Unauthorized", async () => {
    await request(app)
      .post("/api/v1/auth/request-otp")
      .send({ phone: "+919876543219" })
      .expect(200);

    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543219", otp: "000000" })
      .expect(401);

    expect(verifyRes.body.error.code).toBe("AUTHENTICATION_FAILED");
  });

  it("retrieves current user profile when valid token provided", async () => {
    const verifyRes = await request(app)
      .post("/api/v1/auth/verify-otp")
      .send({ phone: "+919876543210", otp: "123456" })
      .expect(200);

    const token = verifyRes.body.token;

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.user.phone).toBe("+919876543210");
  });

  it("rejects unauthorized access to /me without token", async () => {
    const res = await request(app).get("/api/v1/auth/me").expect(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
