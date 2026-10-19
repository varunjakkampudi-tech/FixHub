import crypto from "node:crypto";
import { type Repository, type Review, defaultRepository } from "../db/repository";

export class ReviewService {
  constructor(private repo: Repository = defaultRepository) {}

  async createReview(
    bookingId: string,
    customerId: string,
    rating: number,
    comment?: string
  ): Promise<Review> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.customerId !== customerId) throw new Error("Unauthorized to review this booking");
    if (booking.status !== "settled" && booking.status !== "completed") {
      throw new Error("Can only review completed or settled bookings");
    }
    if (!booking.merchantId) throw new Error("No merchant associated with booking");

    const review: Review = {
      id: `rev-${crypto.randomUUID()}`,
      bookingId,
      customerId,
      merchantId: booking.merchantId,
      technicianId: booking.technicianId,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment,
      createdAt: new Date().toISOString(),
    };

    this.repo.reviews.set(review.id, review);

    // Recompute merchant average rating
    const merchant = this.repo.merchants.get(booking.merchantId);
    if (merchant) {
      const currentScoreSum = merchant.rating * merchant.totalReviews;
      merchant.totalReviews += 1;
      merchant.rating = Math.round(((currentScoreSum + review.rating) / merchant.totalReviews) * 100) / 100;
    }

    return review;
  }

  async listReviewsForMerchant(merchantId: string): Promise<Review[]> {
    return Array.from(this.repo.reviews.values())
      .filter((r) => r.merchantId === merchantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const defaultReviewService = new ReviewService(defaultRepository);
