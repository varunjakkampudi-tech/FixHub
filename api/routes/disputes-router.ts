import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth-middleware";
import { defaultDisputeService } from "../services/dispute-service";

export const disputesRouter = Router();

const raiseDisputeSchema = z.object({
  bookingId: z.string(),
  reason: z.string().min(3),
  details: z.string().min(10),
});

const resolveDisputeSchema = z.object({
  resolutionNotes: z.string().min(5),
});

disputesRouter.post("/", authenticate, async (req, res) => {
  const parsed = raiseDisputeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "bookingId, reason, and details are required." },
      requestId: req.id,
    });
  }

  try {
    const dispute = await defaultDisputeService.raiseDispute(
      parsed.data.bookingId,
      req.user!.userId,
      parsed.data.reason,
      parsed.data.details
    );
    return res.status(201).json({ dispute, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "DISPUTE_CREATION_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

disputesRouter.get("/", authenticate, async (req, res) => {
  const disputes = await defaultDisputeService.listDisputes(req.user!.userId, req.user!.role);
  return res.status(200).json({ disputes, count: disputes.length, requestId: req.id });
});

disputesRouter.post("/:id/resolve", authenticate, requireRole("admin"), async (req, res) => {
  const parsed = resolveDisputeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "resolutionNotes required." },
      requestId: req.id,
    });
  }

  try {
    const id = String(req.params.id);
    const dispute = await defaultDisputeService.resolveDispute(
      id,
      req.user!.userId,
      parsed.data.resolutionNotes
    );
    return res.status(200).json({ dispute, message: "Dispute resolved successfully.", requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "RESOLVE_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});
