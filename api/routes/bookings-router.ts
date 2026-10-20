import { Router } from "express";
import { z } from "zod";
import { defaultRepository } from "../db/repository";
import { authenticate, requireRole } from "../middleware/auth-middleware";
import { defaultBookingService } from "../services/booking-service";
import { defaultDispatchService } from "../services/dispatch-service";

export const bookingsRouter = Router();

const createBookingSchema = z.object({
  category: z.enum(["electrician", "plumbing", "ac", "appliance"]),
  serviceTitle: z.string().min(3).max(150),
  description: z.string().min(5),
  address: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  scheduledType: z.enum(["instant", "scheduled"]).optional(),
  scheduledTime: z.string().optional(),
  paymentMethod: z.enum(["cash_on_completion", "online_upi", "online_card"]).optional(),
});

const assignTechSchema = z.object({
  technicianId: z.string(),
});

const progressSchema = z.object({
  status: z.enum(["on_the_way", "arrived"]),
});

const quoteSchema = z.object({
  technicianId: z.string(),
  items: z.array(z.object({ description: z.string(), amount: z.number() })),
  laborAmount: z.number().min(0),
  partsAmount: z.number().min(0),
});

const quoteRespondSchema = z.object({
  quoteId: z.string(),
  accept: z.boolean(),
});

const paymentSchema = z.object({
  paymentMethod: z
    .enum(["cash_on_completion", "online_upi", "online_card"])
    .default("cash_on_completion"),
});

const cancelSchema = z.object({
  reason: z.string().min(3),
});

// Create booking
bookingsRouter.post("/", authenticate, async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Invalid booking request fields." },
      requestId: req.id,
    });
  }

  try {
    const booking = await defaultBookingService.createBooking({
      ...parsed.data,
      customerId: req.user!.userId,
    });
    return res.status(201).json({ booking, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "BOOKING_CREATION_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

// List bookings for current user
bookingsRouter.get("/", authenticate, async (req, res) => {
  const bookings = await defaultBookingService.listBookings(req.user!.userId, req.user!.role);
  return res.status(200).json({ bookings, count: bookings.length, requestId: req.id });
});

// Get booking details
bookingsRouter.get("/:id", authenticate, (req, res) => {
  const id = String(req.params.id);
  const booking = defaultRepository.bookings.get(id);
  if (!booking) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Booking not found." },
      requestId: req.id,
    });
  }

  const merchant = booking.merchantId
    ? defaultRepository.merchants.get(booking.merchantId)
    : undefined;
  const technician = booking.technicianId
    ? defaultRepository.technicians.get(booking.technicianId)
    : undefined;
  const quotes = Array.from(defaultRepository.quotes.values()).filter(
    (q) => q.bookingId === booking.id,
  );

  return res.status(200).json({
    booking,
    merchant,
    technician,
    quotes,
    requestId: req.id,
  });
});

// Atomic First Acceptance (Dispatch Engine)
bookingsRouter.post(
  "/:id/accept",
  authenticate,
  requireRole("merchant", "admin"),
  async (req, res) => {
    const id = String(req.params.id);
    let merchantId = req.body.merchantId;
    if (!merchantId) {
      // Look up merchant for this user
      for (const m of defaultRepository.merchants.values()) {
        if (m.userId === req.user!.userId) {
          merchantId = m.id;
          break;
        }
      }
    }

    if (!merchantId) {
      return res.status(400).json({
        error: {
          code: "MERCHANT_REQUIRED",
          message: "Merchant ID not found for authenticated user.",
        },
        requestId: req.id,
      });
    }

    try {
      const booking = await defaultDispatchService.acceptBookingOffer(id, merchantId);
      return res
        .status(200)
        .json({ booking, message: "Booking accepted successfully.", requestId: req.id });
    } catch (err: any) {
      return res.status(409).json({
        error: { code: "ACCEPTANCE_CONFLICT", message: err.message },
        requestId: req.id,
      });
    }
  },
);

// Assign Technician
bookingsRouter.post(
  ["/:id/assign-technician", "/:id/assign"],
  authenticate,
  requireRole("merchant", "admin"),
  async (req, res) => {
    const id = String(req.params.id);
    const parsed = assignTechSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "technicianId is required." },
        requestId: req.id,
      });
    }

    const booking = defaultRepository.bookings.get(id);
    if (!booking)
      return res
        .status(404)
        .json({ error: { code: "NOT_FOUND", message: "Booking not found." }, requestId: req.id });

    try {
      const updated = await defaultBookingService.assignTechnician(
        id,
        booking.merchantId!,
        parsed.data.technicianId,
      );
      return res.status(200).json({ booking: updated, requestId: req.id });
    } catch (err: any) {
      return res.status(400).json({
        error: { code: "ASSIGNMENT_FAILED", message: err.message },
        requestId: req.id,
      });
    }
  },
);

// Technician progress (on the way / arrived)
bookingsRouter.post(
  ["/:id/progress", "/:id/status"],
  authenticate,
  requireRole("technician", "merchant", "admin"),
  async (req, res) => {
    const id = String(req.params.id);
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "status must be on_the_way or arrived." },
        requestId: req.id,
      });
    }

    try {
      const updated = await defaultBookingService.updateTechnicianProgress(id, parsed.data.status);
      return res.status(200).json({ booking: updated, requestId: req.id });
    } catch (err: any) {
      return res.status(400).json({
        error: { code: "PROGRESS_FAILED", message: err.message },
        requestId: req.id,
      });
    }
  },
);

// Submit quote
bookingsRouter.post(
  "/:id/quote",
  authenticate,
  requireRole("technician", "merchant", "admin"),
  async (req, res) => {
    const id = String(req.params.id);
    const parsed = quoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_INPUT",
          message: "Quote items, technicianId, labor and parts amount required.",
        },
        requestId: req.id,
      });
    }

    try {
      const quote = await defaultBookingService.submitQuote(
        id,
        parsed.data.technicianId,
        parsed.data.items,
        parsed.data.laborAmount,
        parsed.data.partsAmount,
      );
      return res.status(201).json({ quote, requestId: req.id });
    } catch (err: any) {
      return res.status(400).json({
        error: { code: "QUOTE_FAILED", message: err.message },
        requestId: req.id,
      });
    }
  },
);

// Customer respond to quote
bookingsRouter.post("/:id/quote/respond", authenticate, async (req, res) => {
  const parsed = quoteRespondSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "quoteId and accept (boolean) required." },
      requestId: req.id,
    });
  }

  try {
    const booking = await defaultBookingService.respondToQuote(
      parsed.data.quoteId,
      req.user!.userId,
      parsed.data.accept,
    );
    return res.status(200).json({ booking, requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "RESPONSE_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

// Complete work
bookingsRouter.post(
  "/:id/complete",
  authenticate,
  requireRole("technician", "merchant", "admin"),
  async (req, res) => {
    const id = String(req.params.id);
    try {
      const booking = await defaultBookingService.completeWork(id);
      return res.status(200).json({ booking, requestId: req.id });
    } catch (err: any) {
      return res.status(400).json({
        error: { code: "COMPLETION_FAILED", message: err.message },
        requestId: req.id,
      });
    }
  },
);

// Record Payment
bookingsRouter.post("/:id/payment", authenticate, async (req, res) => {
  const id = String(req.params.id);
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Invalid payment method." },
      requestId: req.id,
    });
  }

  try {
    const booking = await defaultBookingService.recordPayment(id, parsed.data.paymentMethod);
    return res
      .status(200)
      .json({ booking, message: "Payment recorded successfully.", requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "PAYMENT_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

// Cancel Booking
bookingsRouter.post("/:id/cancel", authenticate, async (req, res) => {
  const id = String(req.params.id);
  const parsed = cancelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "Cancellation reason required." },
      requestId: req.id,
    });
  }

  try {
    const booking = await defaultBookingService.cancelBooking(
      id,
      req.user!.userId,
      parsed.data.reason,
    );
    return res
      .status(200)
      .json({ booking, message: "Booking cancelled successfully.", requestId: req.id });
  } catch (err: any) {
    return res.status(400).json({
      error: { code: "CANCELLATION_FAILED", message: err.message },
      requestId: req.id,
    });
  }
});

// Get Invoice
bookingsRouter.get("/:id/invoice", authenticate, (req, res) => {
  const id = String(req.params.id);
  const booking = defaultRepository.bookings.get(id);
  if (!booking)
    return res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Booking not found." }, requestId: req.id });

  const invoice = {
    invoiceNumber: `INV-${booking.bookingReference}`,
    bookingReference: booking.bookingReference,
    serviceTitle: booking.serviceTitle,
    category: booking.category,
    currency: "INR",
    items: [
      {
        code: "inspection_fee",
        description: "Standard Inspection / Visit Fee",
        amount: booking.inspectionFee,
      },
      {
        code: "labor_charge",
        description: "Technician Labor & Service",
        amount: booking.laborCharge,
      },
      { code: "parts_charge", description: "Replacement Spare Parts", amount: booking.partsCharge },
      {
        code: "platform_fee",
        description: "Platform Facilitation & Insurance",
        amount: booking.platformFee,
      },
      {
        code: "discount",
        description: "Introductory Promotional Discount",
        amount: -booking.discount,
      },
    ],
    subtotal:
      booking.inspectionFee +
      booking.laborCharge +
      booking.partsCharge +
      booking.platformFee -
      booking.discount,
    taxes: 0,
    totalPayable: booking.totalAmount,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    paidAt: booking.paidAt,
  };

  return res.status(200).json({ invoice, requestId: req.id });
});
