import crypto from "node:crypto";
import { type Booking, type BookingOffer, type Repository, defaultRepository } from "../db/repository";
import { type DistributedLock, defaultDistributedLock } from "../redis/lock";

export interface DispatchResult {
  bookingId: string;
  offersCreated: number;
  eligibleMerchants: Array<{ id: string; name: string; distanceKm: number }>;
}

export class DispatchService {
  constructor(
    private repo: Repository = defaultRepository,
    private lock: DistributedLock = defaultDistributedLock
  ) {}

  /**
   * Broadcasts booking offers to eligible verified merchants in Tanuku within radius.
   */
  async broadcastOffers(bookingId: string, radiusKm: number = 8): Promise<DispatchResult> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    const eligible = this.repo.findMerchantsByCategoryAndLocation(
      booking.category,
      booking.latitude,
      booking.longitude,
      radiusKm
    );

    let offersCreated = 0;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5-minute offer window

    for (const merchant of eligible) {
      // Check if offer already exists
      let alreadyOffered = false;
      for (const off of this.repo.bookingOffers.values()) {
        if (off.bookingId === bookingId && off.merchantId === merchant.id) {
          alreadyOffered = true;
          break;
        }
      }

      if (!alreadyOffered) {
        const offer: BookingOffer = {
          id: `off-${crypto.randomUUID()}`,
          bookingId,
          merchantId: merchant.id,
          status: "offered",
          expiresAt,
          createdAt: new Date().toISOString(),
        };
        this.repo.bookingOffers.set(offer.id, offer);
        offersCreated++;

        // In-app notification to merchant
        this.repo.notifications.set(`notif-${crypto.randomUUID()}`, {
          id: `notif-${crypto.randomUUID()}`,
          userId: merchant.userId,
          title: "New Service Request Available!",
          message: `New ${booking.category} request near ${booking.address}. Inspect and accept now.`,
          channel: "in_app",
          status: "sent",
          metadata: { bookingId, offerId: offer.id },
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (offersCreated > 0) {
      booking.status = "offered";
      booking.updatedAt = new Date().toISOString();
    }

    return {
      bookingId,
      offersCreated,
      eligibleMerchants: eligible.map((m) => ({ id: m.id, name: m.businessName, distanceKm: m.distanceKm })),
    };
  }

  /**
   * Atomic First Acceptance using DistributedLock (Redlock pattern).
   * Prevents race conditions and double assignment when multiple merchants accept concurrently.
   */
  async acceptBookingOffer(bookingId: string, merchantId: string): Promise<Booking> {
    const lockKey = `booking-dispatch:${bookingId}`;

    return await this.lock.withLock(lockKey, 5000, async () => {
      const booking = this.repo.bookings.get(bookingId);
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      // Check if booking is still available for acceptance
      if (booking.status !== "offered" && booking.status !== "requested") {
        throw new Error(`Booking ${booking.bookingReference} is no longer available (current status: ${booking.status})`);
      }

      const merchant = this.repo.merchants.get(merchantId);
      if (!merchant) {
        throw new Error(`Merchant not found: ${merchantId}`);
      }

      // 1. Assign merchant to booking
      booking.merchantId = merchantId;
      booking.status = "accepted";
      booking.updatedAt = new Date().toISOString();

      // 2. Mark winning offer as accepted and expire all other offers
      for (const offer of this.repo.bookingOffers.values()) {
        if (offer.bookingId === bookingId) {
          if (offer.merchantId === merchantId) {
            offer.status = "accepted";
          } else if (offer.status === "offered") {
            offer.status = "expired";
          }
        }
      }

      // 3. Customer notification
      this.repo.notifications.set(`notif-${crypto.randomUUID()}`, {
        id: `notif-${crypto.randomUUID()}`,
        userId: booking.customerId,
        title: "Booking Accepted!",
        message: `${merchant.businessName} has accepted your service request for ${booking.category}.`,
        channel: "whatsapp",
        status: "sent",
        metadata: { bookingId: booking.id, merchantId },
        createdAt: new Date().toISOString(),
      });

      // 4. Record transactional outbox event
      this.repo.outboxEvents.set(`outbox-${crypto.randomUUID()}`, {
        id: `outbox-${crypto.randomUUID()}`,
        aggregateType: "booking",
        aggregateId: booking.id,
        eventType: "BOOKING_ACCEPTED",
        payload: {
          bookingId: booking.id,
          bookingReference: booking.bookingReference,
          merchantId,
          acceptedAt: booking.updatedAt,
        },
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      return booking;
    });
  }
}

export const defaultDispatchService = new DispatchService(defaultRepository, defaultDistributedLock);
