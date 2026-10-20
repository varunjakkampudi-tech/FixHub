import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth-middleware";
import { defaultReviewService } from "../services/review-service";

export const reviewsRouter = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRouter.post("/bookings/:id/review", authenticate, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Rating must be an integer between 1 and 5." },
      requestId: req.id,
    });
  }

  try {
    const id = String(req.params.id);
    const review = await defaultReviewService.createReview(
      id,
      req.user!.userId,
      parsed.data.rating,
      parsed.data.comment,
    );
    return res.status(201).json({ review, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "REVIEW_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

reviewsRouter.get("/merchants/:id/reviews", async (req, res) => {
  const id = String(req.params.id);
  const reviews = await defaultReviewService.listReviewsForMerchant(id);
  return res.status(200).json({ reviews, count: reviews.length, requestId: req.id });
});
