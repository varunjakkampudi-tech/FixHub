import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth-middleware";
import { defaultMerchantService } from "../services/merchant-service";

export const merchantsRouter = Router();

const onboardingSchema = z.object({
  businessName: z.string().min(3).max(150),
  description: z.string().min(10),
  categories: z.array(z.string()).min(1),
  coverageZones: z.array(z.string()).min(1),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const technicianSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  skills: z.array(z.string()).min(1),
});

merchantsRouter.get("/", async (req, res) => {
  const category = req.query.category as string | undefined;
  const zone = req.query.zone as string | undefined;
  const activeOnly = req.query.activeOnly !== "false";

  const merchants = await defaultMerchantService.listMerchants({ category, zone, activeOnly });
  return res.status(200).json({ merchants, count: merchants.length, requestId: req.id });
});

merchantsRouter.get("/:id", async (req, res) => {
  const id = String(req.params.id);
  const data = await defaultMerchantService.getMerchant(id);
  if (!data) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Merchant not found." },
      requestId: req.id,
    });
  }
  return res.status(200).json({ ...data, requestId: req.id });
});

merchantsRouter.post("/onboarding", authenticate, async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Invalid merchant onboarding details." },
      requestId: req.id,
    });
  }

  try {
    const merchant = await defaultMerchantService.onboardMerchant({
      ...parsed.data,
      userId: req.user!.userId,
    });
    return res.status(201).json({ merchant, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "ONBOARDING_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

merchantsRouter.patch("/:id/availability", authenticate, requireRole("merchant", "admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "isAvailable must be boolean." },
      requestId: req.id,
    });
  }

  try {
    const merchant = await defaultMerchantService.setAvailability(id, parsed.data.isAvailable);
    return res.status(200).json({ merchant, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "UPDATE_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

merchantsRouter.post("/:id/technicians", authenticate, requireRole("merchant", "admin"), async (req, res) => {
  const id = String(req.params.id);
  const parsed = technicianSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Technician name, phone, and skills required." },
      requestId: req.id,
    });
  }

  try {
    const tech = await defaultMerchantService.addTechnician(
      id,
      parsed.data.name,
      parsed.data.phone,
      parsed.data.skills
    );
    return res.status(201).json({ technician: tech, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "CREATION_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});
