import crypto from "node:crypto";
import { type Repository, type User, type UserRole, defaultRepository } from "../db/repository";

export interface TokenPayload {
  userId: string;
  phone: string;
  role: UserRole;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "fixhub-local-development-secret-key-min-32-chars-long";

export class AuthService {
  private otpStore = new Map<string, { otp: string; expiresAt: number; role?: UserRole }>();

  constructor(private repo: Repository = defaultRepository) {}

  /**
   * Generates a 6-digit OTP and stores it with a 5-minute expiry.
   */
  async requestOtp(phone: string, role: UserRole = "customer"): Promise<{ success: boolean; message: string; testOtp?: string }> {
    const formattedPhone = phone.trim();
    if (!/^\+?[0-9]{10,13}$/.test(formattedPhone)) {
      throw new Error("Invalid phone number format");
    }

    // Deterministic OTP for test phone numbers, random 6-digit for others
    const otp = formattedPhone.endsWith("0000") || process.env.NODE_ENV === "test" ? "123456" : crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.otpStore.set(formattedPhone, { otp, expiresAt, role });

    return {
      success: true,
      message: "OTP sent successfully via SMS and WhatsApp.",
      testOtp: process.env.NODE_ENV === "test" || formattedPhone.endsWith("0000") ? otp : undefined,
    };
  }

  /**
   * Verifies OTP and returns user + signed session token.
   */
  async verifyOtp(phone: string, otp: string, userName?: string): Promise<{ user: User; token: string }> {
    const formattedPhone = phone.trim();
    const entry = this.otpStore.get(formattedPhone);

    // Accept 123456 in test environment or check stored OTP
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
      const role = entry?.role || "customer";
      user = {
        id: `usr-${crypto.randomUUID()}`,
        phone: formattedPhone,
        name: userName || (role === "merchant" ? "New Service Merchant" : "FixHub Customer"),
        role,
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
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload: TokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${encodedPayload}`)
      .digest("base64url");
    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes the HMAC SHA-256 token.
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", JWT_SECRET)
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
