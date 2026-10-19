import crypto from "node:crypto";
import { type Booking, type Quote, type Repository, defaultRepository } from "../db/repository";
import { type DispatchService, defaultDispatchService } from "./dispatch-service";

export interface CreateBookingInput {
  customerId: string;
  category: "electrician" | "plumbing" | "ac" | "appliance";
  serviceTitle: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  scheduledType?: "instant" | "scheduled";
  scheduledTime?: string;
  paymentMethod?: "cash_on_completion" | "online_upi" | "online_card";
}

export class BookingService {
  constructor(
    private repo: Repository = defaultRepository,
    private dispatch: DispatchService = defaultDispatchService
  ) {}

  /**
   * Creates a new booking and automatically broadcasts offers to eligible merchants.
   */
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const bookingId = `bk-${crypto.randomUUID()}`;
    const timestamp = Date.now().toString().slice(-6);
    const bookingReference = `FIX-${input.category.slice(0, 3).toUpperCase()}-${timestamp}`;

    // Standard inspection charges in Tanuku
    const baseInspectionRates: Record<string, number> = {
      electrician: 149,
      plumbing: 149,
      ac: 249,
      appliance: 199,
    };

    const inspectionFee = baseInspectionRates[input.category] ?? 149;
    const platformFee = 50;
    const totalAmount = inspectionFee + platformFee;

    const booking: Booking = {
      id: bookingId,
      bookingReference,
      customerId: input.customerId,
      category: input.category,
      serviceTitle: input.serviceTitle,
      description: input.description,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      scheduledType: input.scheduledType ?? "instant",
      scheduledTime: input.scheduledTime,
      status: "requested",
      inspectionFee,
      laborCharge: 0,
      partsCharge: 0,
      platformFee,
      discount: 0,
      totalAmount,
      paymentMethod: input.paymentMethod ?? "cash_on_completion",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.repo.bookings.set(booking.id, booking);

    // Auto-broadcast to eligible providers
    await this.dispatch.broadcastOffers(booking.id);

    return booking;
  }

  /**
   * Retrieves bookings filtered by user and role.
   */
  async listBookings(userId: string, role: string): Promise<Booking[]> {
    const all = Array.from(this.repo.bookings.values());

    if (role === "admin") {
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    if (role === "customer") {
      return all.filter((b) => b.customerId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    if (role === "merchant") {
      // Find merchant for this user
      let merchantId: string | undefined;
      for (const m of this.repo.merchants.values()) {
        if (m.userId === userId) {
          merchantId = m.id;
          break;
        }
      }
      return all
        .filter((b) => b.merchantId === merchantId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    if (role === "technician") {
      let technicianId: string | undefined;
      for (const t of this.repo.technicians.values()) {
        if (t.userId === userId) {
          technicianId = t.id;
          break;
        }
      }
      return all
        .filter((b) => b.technicianId === technicianId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return [];
  }

  /**
   * Assigns a technician from merchant's staff to the accepted booking.
   */
  async assignTechnician(bookingId: string, merchantId: string, technicianId: string): Promise<Booking> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.merchantId !== merchantId) throw new Error("Unauthorized: booking not assigned to this merchant");

    const tech = this.repo.technicians.get(technicianId);
    if (!tech || tech.merchantId !== merchantId) throw new Error("Invalid technician selected");

    booking.technicianId = technicianId;
    booking.status = "technician_assigned";
    booking.updatedAt = new Date().toISOString();

    // Notify customer
    this.repo.notifications.set(`notif-${crypto.randomUUID()}`, {
      id: `notif-${crypto.randomUUID()}`,
      userId: booking.customerId,
      title: "Technician Assigned!",
      message: `${tech.name} (${tech.phone}) has been assigned to your service request.`,
      channel: "whatsapp",
      status: "sent",
      createdAt: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Technician marks on the way or arrived.
   */
  async updateTechnicianProgress(bookingId: string, status: "on_the_way" | "arrived"): Promise<Booking> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    booking.status = status;
    booking.updatedAt = new Date().toISOString();

    const tech = booking.technicianId ? this.repo.technicians.get(booking.technicianId) : undefined;
    const techName = tech ? tech.name : "Your technician";

    this.repo.notifications.set(`notif-${crypto.randomUUID()}`, {
      id: `notif-${crypto.randomUUID()}`,
      userId: booking.customerId,
      title: status === "on_the_way" ? "Technician On The Way!" : "Technician Arrived!",
      message:
        status === "on_the_way"
          ? `${techName} is on the way to your address: ${booking.address}`
          : `${techName} has arrived at your location. Please verify before work begins.`,
      channel: "whatsapp",
      status: "sent",
      createdAt: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Technician submits inspection quote.
   */
  async submitQuote(
    bookingId: string,
    technicianId: string,
    items: Array<{ description: string; amount: number }>,
    laborAmount: number,
    partsAmount: number
  ): Promise<Quote> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    const totalAmount = booking.inspectionFee + laborAmount + partsAmount + booking.platformFee;

    const quote: Quote = {
      id: `qt-${crypto.randomUUID()}`,
      bookingId,
      technicianId,
      items,
      laborAmount,
      partsAmount,
      totalAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.repo.quotes.set(quote.id, quote);
    booking.status = "quote_pending";
    booking.laborCharge = laborAmount;
    booking.partsCharge = partsAmount;
    booking.totalAmount = totalAmount;
    booking.updatedAt = new Date().toISOString();

    // Customer notification
    this.repo.notifications.set(`notif-${crypto.randomUUID()}`, {
      id: `notif-${crypto.randomUUID()}`,
      userId: booking.customerId,
      title: "New Service Quote Available",
      message: `Inspection complete. Total estimated bill: ₹${totalAmount}. Please review and accept in app.`,
      channel: "whatsapp",
      status: "sent",
      createdAt: new Date().toISOString(),
    });

    return quote;
  }

  /**
   * Customer accepts or declines quote.
   */
  async respondToQuote(quoteId: string, customerId: string, accept: boolean): Promise<Booking> {
    const quote = this.repo.quotes.get(quoteId);
    if (!quote) throw new Error("Quote not found");

    const booking = this.repo.bookings.get(quote.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.customerId !== customerId) throw new Error("Unauthorized");

    if (accept) {
      quote.status = "accepted";
      booking.status = "in_progress";
    } else {
      quote.status = "rejected";
      booking.status = "quote_rejected";
    }
    booking.updatedAt = new Date().toISOString();
    return booking;
  }

  /**
   * Technician marks work complete.
   */
  async completeWork(bookingId: string): Promise<Booking> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    booking.status = "completed";
    booking.updatedAt = new Date().toISOString();

    this.repo.notifications.set(`notif-${crypto.randomUUID()}`, {
      id: `notif-${crypto.randomUUID()}`,
      userId: booking.customerId,
      title: "Service Completed!",
      message: `Service work is complete. Total payable: ₹${booking.totalAmount}. Please pay the technician directly.`,
      channel: "whatsapp",
      status: "sent",
      createdAt: new Date().toISOString(),
    });

    return booking;
  }

  /**
   * Records payment settlement (Cash on completion or online UPI).
   */
  async recordPayment(bookingId: string, paymentMethod: "cash_on_completion" | "online_upi" | "online_card"): Promise<Booking> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    booking.paymentMethod = paymentMethod;
    booking.paymentStatus = "paid";
    booking.paidAt = new Date().toISOString();
    booking.status = "settled";
    booking.updatedAt = new Date().toISOString();

    // Increment merchant total jobs
    if (booking.merchantId) {
      const merchant = this.repo.merchants.get(booking.merchantId);
      if (merchant) {
        merchant.totalJobs += 1;
      }
    }

    return booking;
  }

  /**
   * Cancels a booking.
   */
  async cancelBooking(bookingId: string, cancelledByUserId: string, reason: string): Promise<Booking> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.status === "completed" || booking.status === "settled") {
      throw new Error("Cannot cancel a completed or settled service booking");
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason;
    booking.cancelledBy = cancelledByUserId;
    booking.updatedAt = new Date().toISOString();

    // Expire pending offers
    for (const off of this.repo.bookingOffers.values()) {
      if (off.bookingId === bookingId && off.status === "offered") {
        off.status = "expired";
      }
    }

    return booking;
  }
}

export const defaultBookingService = new BookingService(defaultRepository, defaultDispatchService);
