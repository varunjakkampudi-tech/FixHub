export type UserRole = "customer" | "merchant" | "technician" | "admin";
export type BookingStatus =
  | "requested"
  | "offered"
  | "accepted"
  | "technician_assigned"
  | "on_the_way"
  | "arrived"
  | "quote_pending"
  | "quote_accepted"
  | "quote_rejected"
  | "in_progress"
  | "completed"
  | "payment_pending"
  | "settled"
  | "cancelled"
  | "disputed";

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: UserRole;
  locale: "en" | "te";
  isActive: boolean;
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  categories: string[];
  coverageZones: string[];
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  totalReviews: number;
  totalJobs: number;
  kycStatus: "pending" | "verified" | "rejected";
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Technician {
  id: string;
  merchantId: string;
  userId?: string;
  name: string;
  phone: string;
  skills: string[];
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  customerId: string;
  merchantId?: string;
  technicianId?: string;
  category: string;
  serviceTitle: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  scheduledType: "instant" | "scheduled";
  scheduledTime?: string;
  status: BookingStatus;
  inspectionFee: number;
  laborCharge: number;
  partsCharge: number;
  platformFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: "cash_on_completion" | "online_upi" | "online_card";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paidAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingOffer {
  id: string;
  bookingId: string;
  merchantId: string;
  status: "offered" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  bookingId: string;
  technicianId: string;
  items: Array<{ description: string; amount: number }>;
  laborAmount: number;
  partsAmount: number;
  totalAmount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  merchantId: string;
  technicianId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  disputeReference: string;
  bookingId: string;
  raisedBy: string;
  reason: string;
  details: string;
  status: "open" | "under_review" | "resolved" | "closed";
  resolutionNotes?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: "whatsapp" | "sms" | "push" | "in_app";
  status: "queued" | "sent" | "delivered" | "read";
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface OutboxEvent {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "pending" | "published" | "failed";
  createdAt: string;
}

export interface OtpChallenge {
  id: string;
  phone: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  channel: "sms" | "whatsapp" | "outbox_dev";
  dispatchedAt: string;
  messageId?: string;
  consumed: boolean;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Fictional demo accounts are seeded only for automated tests or an explicit local demonstration. */
function seedsDemoAccounts(): boolean {
  return process.env.NODE_ENV === "test" || process.env.FIXHUB24_LOCAL_DEMO_SEED === "true";
}

export class Repository {
  public users = new Map<string, User>();
  public merchants = new Map<string, Merchant>();
  public technicians = new Map<string, Technician>();
  public bookings = new Map<string, Booking>();
  public bookingOffers = new Map<string, BookingOffer>();
  public quotes = new Map<string, Quote>();
  public reviews = new Map<string, Review>();
  public disputes = new Map<string, Dispute>();
  public notifications = new Map<string, Notification>();
  public outboxEvents = new Map<string, OutboxEvent>();
  public otpChallenges = new Map<string, OtpChallenge>();

  constructor() {
    this.seedInitialData();
  }

  public reset(): void {
    this.users.clear();
    this.merchants.clear();
    this.technicians.clear();
    this.bookings.clear();
    this.bookingOffers.clear();
    this.quotes.clear();
    this.reviews.clear();
    this.disputes.clear();
    this.notifications.clear();
    this.outboxEvents.clear();
    this.otpChallenges.clear();
    this.seedInitialData();
  }

  private seedInitialData(): void {
    if (!seedsDemoAccounts()) return;

    // 1. Admin Users (Operational + Test)
    const adminUser: User = {
      id: "usr-admin-001",
      phone: "+919999999999",
      name: "FixHub24 Platform Operations",
      email: "ops@fixhub.in",
      role: "admin",
      locale: "en",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    const adminUserAlt: User = {
      id: "usr-admin-002",
      phone: "+919900000001",
      name: "FixHub24 Operations Lead",
      email: "lead.ops@fixhub.in",
      role: "admin",
      locale: "en",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminUserAlt.id, adminUserAlt);

    // 2. Customer User
    const customerUser: User = {
      id: "usr-cust-001",
      phone: "+919876543210",
      name: "Ramesh Varma",
      email: "ramesh.varma@example.in",
      role: "customer",
      locale: "te",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(customerUser.id, customerUser);

    // 3. Merchants in Tanuku (Test + Operational)
    const merchantUser1: User = {
      id: "usr-merch-001",
      phone: "+919876543211",
      name: "Suresh Electrical Works",
      email: "suresh.electric@example.in",
      role: "merchant",
      locale: "te",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(merchantUser1.id, merchantUser1);

    const merchantUser1Alt: User = {
      id: "usr-merch-001-alt",
      phone: "+919848011223",
      name: "Suresh Electrical Works (Direct)",
      email: "suresh.direct@example.in",
      role: "merchant",
      locale: "te",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(merchantUser1Alt.id, merchantUser1Alt);

    const merchant1: Merchant = {
      id: "mch-001",
      userId: merchantUser1.id,
      businessName: "Sri Lakshmi Electricals & Solar",
      description:
        "Certified electricians with 12+ years experience in domestic wiring and repairs.",
      categories: ["electrician", "ac"],
      coverageZones: ["Tanuku-Central", "Tanuku-East", "Tetali"],
      address: "Main Road, Near Clock Tower, Tanuku, AP 534211",
      latitude: 16.7565,
      longitude: 81.6812,
      rating: 4.85,
      totalReviews: 84,
      totalJobs: 132,
      kycStatus: "verified",
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.merchants.set(merchant1.id, merchant1);

    const tech1: Technician = {
      id: "tch-001",
      merchantId: merchant1.id,
      name: "K. Prasad Rao",
      phone: "+919848099881",
      skills: ["electrician", "fan-repair", "wiring", "ac-service"],
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.technicians.set(tech1.id, tech1);

    const merchantUser2: User = {
      id: "usr-merch-002",
      phone: "+919848033445",
      name: "Tanuku City Plumbing Works",
      email: "cityplumbing@example.in",
      role: "merchant",
      locale: "en",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(merchantUser2.id, merchantUser2);

    const merchant2: Merchant = {
      id: "mch-002",
      userId: merchantUser2.id,
      businessName: "Tanuku Premier Plumbing & Pipe Fitting",
      description:
        "Quick pipe leak fixes, bathroom fittings, motor installation, and sanitary work.",
      categories: ["plumbing"],
      coverageZones: ["Tanuku-Central", "Tanuku-West", "Rashtrapathy Road"],
      address: "Rashtrapathy Road, Tanuku, AP 534211",
      latitude: 16.758,
      longitude: 81.679,
      rating: 4.9,
      totalReviews: 62,
      totalJobs: 98,
      kycStatus: "verified",
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.merchants.set(merchant2.id, merchant2);

    const tech2: Technician = {
      id: "tch-002",
      merchantId: merchant2.id,
      name: "M. Satyanarayana",
      phone: "+919848099882",
      skills: ["plumbing", "pipe-leakage", "drainage-cleaning", "motor-fitting"],
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.technicians.set(tech2.id, tech2);

    const merchantUser3: User = {
      id: "usr-merch-003",
      phone: "+919848055667",
      name: "Godavari Appliance Care",
      email: "godavari.appliances@example.in",
      role: "merchant",
      locale: "te",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.users.set(merchantUser3.id, merchantUser3);

    const merchant3: Merchant = {
      id: "mch-003",
      userId: merchantUser3.id,
      businessName: "Godavari Appliance & AC Care",
      description: "Washing machine, refrigerator, microwave and AC servicing experts.",
      categories: ["appliance", "ac"],
      coverageZones: ["Tanuku-Central", "Old Town", "Tanuku-East"],
      address: "Old Town Market, Tanuku, AP 534211",
      latitude: 16.752,
      longitude: 81.685,
      rating: 4.78,
      totalReviews: 45,
      totalJobs: 79,
      kycStatus: "verified",
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.merchants.set(merchant3.id, merchant3);

    const tech3: Technician = {
      id: "tch-003",
      merchantId: merchant3.id,
      name: "V. Venkat",
      phone: "+919848099883",
      skills: ["appliance", "washing-machine", "fridge-repair", "ac-gas-charge"],
      isAvailable: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.technicians.set(tech3.id, tech3);
  }

  // User queries
  getUserByPhone(phone: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.phone === phone) return user;
    }
    return undefined;
  }

  // Merchant queries
  findMerchantsByCategoryAndLocation(
    category: string,
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 10,
  ): Array<Merchant & { distanceKm: number }> {
    const results: Array<Merchant & { distanceKm: number }> = [];
    for (const merchant of this.merchants.values()) {
      if (!merchant.isActive || !merchant.isAvailable || merchant.kycStatus !== "verified") {
        continue;
      }
      if (merchant.categories.includes(category)) {
        const dist = calculateDistanceKm(
          latitude,
          longitude,
          merchant.latitude,
          merchant.longitude,
        );
        if (dist <= maxDistanceKm) {
          results.push({ ...merchant, distanceKm: Math.round(dist * 100) / 100 });
        }
      }
    }
    // Sort by distance ascending, then rating descending
    return results.sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating);
  }
}

export const defaultRepository = new Repository();
