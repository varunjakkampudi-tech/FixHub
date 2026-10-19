import crypto from "node:crypto";
import { type Repository, type User, type UserRole, defaultRepository } from "../db/repository";

export interface TokenPayload {
  userId: string;
  phone: string;
  role: UserRole;
  exp: number;
}

export const EXPOSED_LEAKED_JWT_SECRET = "fixhub-local-development-secret-key-min-32-chars-long";

/**
 * Validates and retrieves the active JWT HMAC secret.
 * Enforces FR-1:
 * - Server startup/token generation fails without signing secret in non-test mode.
 * - Leaked default secret is strictly rejected in non-test mode.
 */
export function getAuthJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_HMAC_SECRET;
  const isTest = process.env.NODE_ENV === "test";

  if (!isTest) {
    if (!secret || secret.trim().length < 32) {
      throw new Error("FATAL_SECURITY_ERROR: JWT_SECRET or AUTH_HMAC_SECRET must contain at least 32 non-whitespace characters.");
    }
    if (secret === EXPOSED_LEAKED_JWT_SECRET) {
      throw new Error("FATAL_SECURITY_ERROR: Known leaked default JWT_SECRET is strictly forbidden. Configure a secure, high-entropy secret.");
    }
    return secret;
  }

  // Safe isolated test environment fallback
  return secret || "fixhub-test-environment-jwt-secret-key-32chars";
}

export class AuthService {
  private otpStore = new Map<string, { otp: string; expiresAt: number }>();

  constructor(private repo: Repository = defaultRepository) {}

  /**
   * Generates a 6-digit OTP and stores it with a 5-minute expiry.
   * Enforces FR-1:
   * - Roles are NEVER client-selected (role argument removed from request).
   * - No fixed or returned codes outside test mode.
   * - Truthful delivery messages: no false claims of SMS/WhatsApp transmission when mock/unconfigured.
   */
  async requestOtp(phone: string): Promise<{ success: boolean; message: string; testOtp?: string }> {
    const formattedPhone = phone.trim();
    if (!/^\+?[0-9]{10,15}$/.test(formattedPhone)) {
      throw new Error("Invalid phone number format");
    }

    const isTestMode = process.env.NODE_ENV === "test";

    // In test mode: deterministic OTP for automated testing
    // Outside test mode: cryptographically secure random 6-digit integer
    const otp = isTestMode ? "123456" : crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // Roles are NEVER stored from client requests
    this.otpStore.set(formattedPhone, { otp, expiresAt });

    return {
      success: true,
      message: isTestMode
        ? "OTP generated for test verification."
        : "OTP generated. Verification code required.",
      testOtp: isTestMode ? otp : undefined,
    };
  }

  /**
   * Verifies OTP and returns user + signed session token.
   * Enforces FR-1:
   * - If existing user, existing assigned role is loaded from authoritative store.
   * - If new registration, role is unconditionally set to "customer".
   * - Admin/merchant privilege escalation via client parameter is impossible.
   */
  async verifyOtp(phone: string, otp: string, userName?: string): Promise<{ user: User; token: string }> {
    const formattedPhone = phone.trim();
    const entry = this.otpStore.get(formattedPhone);

    const isTestMode = process.env.NODE_ENV === "test" && otp === "123456";
    if (!isTestMode) {
      if (!entry) {
        throw new Error("No active OTP request found for this phone number");
      }
      if (Date.now() > entry.expiresAt) {
        this.otpStore.delete(formattedPhone);
        throw new Error("OTP has expired. Please request a new one.");
      }
      if (entry.otp !== otp.trim()) {
        throw new Error("Incorrect OTP entered. Please try again.");
      }
    }

    this.otpStore.delete(formattedPhone);

    // Find or create user
    let user = this.repo.getUserByPhone(formattedPhone);
    if (!user) {
      // FR-1: New sign-ups are ALWAYS customer role. No client role self-selection.
      user = {
        id: `usr-${crypto.randomUUID()}`,
        phone: formattedPhone,
        name: userName || "FixHub Customer",
        role: "customer",
        locale: "en",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      this.repo.users.set(user.id, user);
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  /**
   * Generates a signed HMAC SHA-256 token.
   */
  generateToken(user: User, expiresInSeconds: number = 86400 * 7): string {
    const secret = getAuthJwtSecret();
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${encodedPayload}`)
      .digest("base64url");
    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes the HMAC SHA-256 token.
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const secret = getAuthJwtSecret();
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(`${header}.${payload}`)
        .digest("base64url");

      if (signature !== expectedSig) return null;

      const decoded: TokenPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

      return decoded;
    } catch {
      return null;
    }
  }
}

export const defaultAuthService = new AuthService(defaultRepository);
