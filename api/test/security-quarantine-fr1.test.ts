// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../app";
import { Repository, defaultRepository } from "../db/repository";
import { AuthService, getAuthJwtSecret, EXPOSED_LEAKED_JWT_SECRET } from "../services/auth-service";

describe("FR-1 Security Quarantine & Defect Remediation Suite", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });
  const originalEnv = { ...process.env };

  beforeEach(() => {
    defaultRepository.reset();
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("Defect 1: Role Self-Assignment Prevention", () => {
    it("prevents unauthenticated callers from self-assigning admin or merchant roles", async () => {
      const newPhone = "+919123456789";

      // Attempt to self-assign "admin"
      await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: newPhone, role: "admin" })
        .expect(200);

      const verifyRes = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({ phone: newPhone, otp: "123456" })
        .expect(200);

      // Must be customer, NEVER admin
      expect(verifyRes.body.user.role).toBe("customer");
      expect(verifyRes.body.user.role).not.toBe("admin");
    });

    it("preserves authoritative roles for pre-seeded users and denies alteration via request parameter", async () => {
      // Seeded admin: +919999999999
      await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: "+919999999999", role: "customer" }) // Attacker attempts to downgrade admin
        .expect(200);

      const verifyAdmin = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({ phone: "+919999999999", otp: "123456" })
        .expect(200);

      expect(verifyAdmin.body.user.role).toBe("admin");

      // Seeded merchant: +919876543211
      await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: "+919876543211", role: "admin" }) // Attacker attempts to upgrade merchant to admin
        .expect(200);

      const verifyMerch = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({ phone: "+919876543211", otp: "123456" })
        .expect(200);

      expect(verifyMerch.body.user.role).toBe("merchant");
      expect(verifyMerch.body.user.role).not.toBe("admin");
    });
  });

  describe("Defect 2: No Fixed or Returned Codes Outside Test Mode", () => {
    it("never returns testOtp in non-test environment", async () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "production-super-secret-key-that-has-at-least-32-chars!!";

      const authService = new AuthService(defaultRepository);
      const res = await authService.requestOtp("+919876543210");

      expect(res.success).toBe(true);
      expect(res.testOtp).toBeUndefined();
    });

    it("does not generate fixed 123456 for phone numbers ending in 0000 outside test mode", async () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "production-super-secret-key-that-has-at-least-32-chars!!";

      const authService = new AuthService(defaultRepository);
      const res = await authService.requestOtp("+919876540000");

      expect(res.testOtp).toBeUndefined();

      // Trying 123456 should fail
      await expect(authService.verifyOtp("+919876540000", "123456")).rejects.toThrow(
        "Incorrect OTP entered. Please try again.",
      );
    });
  });

  describe("Defect 3: Default JWT Signing Secret Enforcement", () => {
    it("fails when NODE_ENV is production and JWT_SECRET is unset or empty", () => {
      process.env.NODE_ENV = "production";
      delete process.env.JWT_SECRET;
      delete process.env.AUTH_HMAC_SECRET;

      expect(() => getAuthJwtSecret()).toThrow(/FATAL_SECURITY_ERROR/);
    });

    it("strictly rejects the exposed leaked default JWT secret in non-test environments", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = EXPOSED_LEAKED_JWT_SECRET;

      expect(() => getAuthJwtSecret()).toThrow(
        /Known leaked default JWT_SECRET is strictly forbidden/,
      );
    });

    it("rejects secrets shorter than 32 characters in non-test environments", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "too-short-secret";

      expect(() => getAuthJwtSecret()).toThrow(/must contain at least 32/);
    });

    it("accepts a high-entropy secret >= 32 characters in production", () => {
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "valid-cryptographically-secure-production-secret-min-32-bytes";

      expect(getAuthJwtSecret()).toBe(
        "valid-cryptographically-secure-production-secret-min-32-bytes",
      );
    });

    it("rejects tokens forged using the leaked fallback secret when a valid secret is configured", () => {
      // Attacker uses leaked secret to forge admin token
      process.env.NODE_ENV = "test";
      process.env.JWT_SECRET = EXPOSED_LEAKED_JWT_SECRET;
      const attackerAuth = new AuthService(defaultRepository);
      const forgedAdminToken = attackerAuth.generateToken({
        id: "usr-hacker-001",
        phone: "+919999999999",
        name: "Attacker",
        role: "admin",
        locale: "en",
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      // System configured with real secret
      process.env.JWT_SECRET = "real-production-secret-with-proper-length-and-entropy-32b";
      const serverAuth = new AuthService(defaultRepository);
      const verified = serverAuth.verifyToken(forgedAdminToken);

      expect(verified).toBeNull();
    });

    it("rejects a token whose signature has been altered in place", () => {
      process.env.NODE_ENV = "test";
      process.env.JWT_SECRET = "real-production-secret-with-proper-length-and-entropy-32b";
      const auth = new AuthService(defaultRepository);
      const token = auth.generateToken({
        id: "usr-tamper-001",
        phone: "+919999999998",
        name: "Tamper",
        role: "customer",
        locale: "en",
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      const [header, payload, signature] = token.split(".");
      const alteredSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;

      expect(auth.verifyToken(`${header}.${payload}.${alteredSignature}`)).toBeNull();
      expect(auth.verifyToken(token)).not.toBeNull();
    });
  });

  describe("Defect 4: Truthful Delivery Status Messages", () => {
    it("never makes false claims of delivery via SMS or WhatsApp", async () => {
      const authService = new AuthService(defaultRepository);

      // In test mode
      process.env.NODE_ENV = "test";
      const testRes = await authService.requestOtp("+919876543210");
      expect(testRes.message).not.toContain("SMS and WhatsApp");
      expect(testRes.message).toContain("test verification");

      // In non-test mode
      process.env.NODE_ENV = "production";
      process.env.JWT_SECRET = "valid-cryptographically-secure-production-secret-min-32-bytes";
      const prodRes = await authService.requestOtp("+919876543210");
      expect(prodRes.message).not.toContain("SMS and WhatsApp");
      expect(prodRes.message).toContain("Verification code required");
    });
  });

  describe("Defect 5: Fictional privileged accounts are not seeded outside test mode", () => {
    it("seeds no accounts outside test mode unless local demo seeding is explicitly enabled", () => {
      process.env.NODE_ENV = "production";
      delete process.env.FIXHUB24_LOCAL_DEMO_SEED;
      expect(new Repository().users.size).toBe(0);

      process.env.FIXHUB24_LOCAL_DEMO_SEED = "true";
      expect(new Repository().users.get("usr-admin-001")?.role).toBe("admin");
    });
  });
});
