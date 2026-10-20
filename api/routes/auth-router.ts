import { Router } from "express";
import { z } from "zod";
import { defaultRepository } from "../db/repository";
import { authenticate } from "../middleware/auth-middleware";
import { defaultAuthService } from "../services/auth-service";

export const authRouter = Router();

const requestOtpSchema = z.object({
  phone: z.string().min(10).max(15),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().min(4).max(8),
  name: z.string().optional(),
});

authRouter.post("/request-otp", async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Invalid phone number format." },
      requestId: req.id,
    });
  }

  try {
    // FR-1: Roles are never client-selected. Client-provided role is strictly ignored.
    const result = await defaultAuthService.requestOtp(parsed.data.phone);
    return res.status(200).json({ ...result, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "OTP_REQUEST_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

authRouter.post("/verify-otp", async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Phone and OTP are required." },
      requestId: req.id,
    });
  }

  try {
    const result = await defaultAuthService.verifyOtp(
      parsed.data.phone,
      parsed.data.otp,
      parsed.data.name,
    );
    return res.status(200).json({ ...result, requestId: req.id });
  } catch (err: any) {
    return res.status(401).json({
      error: { code: "AUTHENTICATION_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

authRouter.get("/me", (req, res, next) => {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    authenticate(req, res, () => {
      const user = defaultRepository.users.get(req.user!.userId);
      if (!user) {
        return res.status(404).json({
          error: { code: "USER_NOT_FOUND", message: "User profile not found." },
          requestId: req.id,
        });
      }
      return res.status(200).json({ user, requestId: req.id });
    });
  } else {
    next();
  }
});
