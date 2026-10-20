import {
  communicationsSeed,
  enqueueNotification,
  mutateCommunications,
  type CommState,
} from "./communications-model";
import {
  registrySeed,
  eligibility,
  entitySchemas,
  addressSchema,
  ratesFor,
  type Registry,
  type SampleAddress,
  type Entity,
} from "./location-model";
import { z } from "zod";
export type Role = "customer" | "merchant" | "technician" | "operations" | "admin";
export type Category = "electrician" | "plumbing" | "ac" | "appliance";
export type Persona = {
  id: string;
  name: string;
  role: Role;
  merchantId?: string | undefined;
  unavailable?: boolean | undefined;
  deactivated?: boolean;
};
export type Merchant = {
  id: string;
  name: string;
  zones: string[];
  skills: Category[];
  status: "active" | "pending" | "suspended" | "unavailable";
  capacity: number;
  hours: string;
  catalog?: Partial<Record<Category, Rates>>;
  cityIds?: string[];
  serviceIds?: string[];
  verification?: "approved" | "pending" | "rejected" | "suspended";
  workDays?: number[];
  blackouts?: string[];
  travelRadiusKm?: number;
  owner?: string;
  consent?: boolean;
  lastActivity?: number;
};
export type Rates = {
  visit: number;
  labor: number;
  parts: number;
  fee: number;
  discount: number;
  commissionBps: number;
  taxBps: number;
  taxConfigured: boolean;
  version: number;
};
export type Price = {
  rates: Rates;
  visit: number;
  labor: number;
  parts: number;
  fee: number;
  discount: number;
  tax: number;
  total: number;
  gross: number;
  deduction: number;
  net: number;
  platformRevenue: number;
};
export type Status =
  | "draft"
  | "matching"
  | "awaiting_response"
  | "accepted"
  | "scheduled"
  | "travel"
  | "arrived"
  | "inspection"
  | "awaiting_quote"
  | "quote_rejected"
  | "approved"
  | "in_progress"
  | "complete"
  | "cancelled"
  | "disputed"
  | "no_availability"
  | "expired";
export type Booking = {
  id: string;
  customerId: string;
  category: Category;
  zone: string;
  cityId?: string;
  cityName?: string;
  serviceId?: string;
  location?: SampleAddress | undefined;
  viewed?: string[];
  problem: string;
  date: string;
  slot: string;
  status: Status;
  merchantId: string | null;
  technicianId: string | null;
  offers: string[];
  declined: string[];
  expiresAt: number;
  estimate: Price;
  quote: Price | null;
  approvedQuote: Price | null;
  quoteVersion: number;
  timeline: { event: EventKey; at: number; actor: string }[];
  revision: number;
};
export type EventKey =
  | "created"
  | "accepted"
  | "declined"
  | "closed"
  | "assigned"
  | "travel"
  | "arrived"
  | "inspection"
  | "quoted"
  | "approved"
  | "rejected"
  | "started"
  | "complete"
  | "cancelled"
  | "disputed"
  | "expired"
  | "no_availability"
  | "rescheduled"
  | "policy"
  | "support";
export type Notification = {
  id: string;
  to: string;
  bookingId: string;
  event: EventKey;
  at: number;
  read: boolean;
};
export type Ticket = {
  id: string;
  bookingId: string;
  actor: string;
  message: string;
  status: string;
};
export type DemoState = {
  schema: 1;
  communications: CommState;
  registry: Registry;
  revision: number;
  policy: Record<Category, Rates>;
  bookings: Booking[];
  notifications: Notification[];
  audit: { id: string; event: EventKey; bookingId: string; actor: string; at: number }[];
  merchants: Merchant[];
  personas: Persona[];
  tickets: Ticket[];
  reviews: { id: string; bookingId: string; label: string }[];
  onboarding: Record<string, string>;
  commands: string[];
  sequence: number;
  scenario: string;
};
export type Command = {
  id: string;
  actor: string;
  type:
    | "communications"
    | "registry"
    | "address"
    | "merchant_edit"
    | "person_edit"
    | "ticket_edit"
    | "view"
    | "create"
    | "accept"
    | "decline"
    | "assign"
    | "status"
    | "quote"
    | "approve"
    | "reject"
    | "cancel"
    | "dispute"
    | "expire"
    | "read"
    | "policy"
    | "availability"
    | "onboard"
    | "support"
    | "reschedule";
  // Optional catalog rates are preview configuration, never approved platform policy.
  bookingId?: string;
  payload?: Record<string, unknown>;
};
export type Result = { state: DemoState; ok: boolean; code: string; bookingId?: string };
export const categoriesDemo: Category[] = ["electrician", "plumbing", "ac", "appliance"];
export const personas: Persona[] = [
  { id: "sample-c1", name: "SAMPLE Customer A", role: "customer" },
  { id: "sample-c2", name: "SAMPLE Customer B", role: "customer" },
  { id: "sample-m1", name: "SAMPLE Merchant A", role: "merchant", merchantId: "sample-m1" },
  { id: "sample-m2", name: "SAMPLE Merchant B", role: "merchant", merchantId: "sample-m2" },
  { id: "sample-m3", name: "SAMPLE Merchant C", role: "merchant", merchantId: "sample-m3" },
  { id: "sample-t1", name: "SAMPLE Technician A", role: "technician", merchantId: "sample-m1" },
  { id: "sample-t2", name: "SAMPLE Technician B", role: "technician", merchantId: "sample-m2" },
  { id: "sample-t3", name: "SAMPLE Technician C", role: "technician", merchantId: "sample-m3" },
  { id: "sample-ops", name: "SAMPLE Operations Agent", role: "operations" },
  { id: "sample-admin", name: "SAMPLE Super Admin", role: "admin" },
];
export const zones = ["Tanuku", "Velpur", "Undrajavaram"];
const rupee = (v: number) => Math.round(v * 100) / 100;
export function calculate(r: Rates): Price {
  for (const key of [
    "visit",
    "labor",
    "parts",
    "fee",
    "discount",
    "commissionBps",
    "taxBps",
  ] as const)
    if (!Number.isFinite(r[key]) || r[key] < 0) throw new Error("invalid_price");
  if (
    r.commissionBps > 10000 ||
    r.taxBps > 10000 ||
    r.discount > r.visit + r.labor + r.parts + r.fee
  )
    throw new Error("invalid_price");
  const visit = rupee(r.visit),
    labor = rupee(r.labor),
    parts = rupee(r.parts),
    fee = rupee(r.fee),
    discount = rupee(r.discount);
  const gross = rupee(visit + labor + parts);
  const base = rupee(gross + fee - discount);
  const tax = r.taxConfigured ? rupee((base * r.taxBps) / 10000) : 0;
  // Demo hypothesis: any discount is platform funded, not removed again from merchant earnings.
  const deduction = rupee((gross * r.commissionBps) / 10000),
    net = rupee(gross - deduction);
  return {
    rates: { ...r },
    visit,
    labor,
    parts,
    fee,
    discount,
    tax,
    total: rupee(base + tax),
    gross,
    deduction,
    net,
    platformRevenue: rupee(fee + deduction - discount),
  };
}
export function money(value: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
export const initialPolicy: Record<Category, Rates> = {
  electrician: {
    visit: 149,
    labor: 450,
    parts: 200,
    fee: 0,
    discount: 0,
    commissionBps: 0,
    taxBps: 0,
    taxConfigured: false,
    version: 1,
  },
  plumbing: {
    visit: 149,
    labor: 350,
    parts: 150,
    fee: 0,
    discount: 0,
    commissionBps: 0,
    taxBps: 0,
    taxConfigured: false,
    version: 1,
  },
  ac: {
    visit: 249,
    labor: 650,
    parts: 300,
    fee: 0,
    discount: 0,
    commissionBps: 0,
    taxBps: 0,
    taxConfigured: false,
    version: 1,
  },
  appliance: {
    visit: 199,
    labor: 550,
    parts: 250,
    fee: 0,
    discount: 0,
    commissionBps: 0,
    taxBps: 0,
    taxConfigured: false,
    version: 1,
  },
};
export const fifthExample: Rates = {
  ...initialPolicy.plumbing,
  labor: 600,
  parts: 300,
  discount: 100,
};
export function seed(now = Date.now()): DemoState {
  const merchants: Merchant[] = [
    {
      id: "sample-m1",
      name: "SAMPLE Spark & Flow",
      zones: ["Tanuku", "Velpur"],
      skills: ["electrician", "plumbing", "ac"],
      status: "active",
      capacity: 20,
      hours: "08:00–20:00",
    },
    {
      id: "sample-m2",
      name: "SAMPLE Home Care",
      zones: ["Tanuku", "Undrajavaram"],
      skills: ["electrician", "plumbing", "appliance"],
      status: "active",
      capacity: 20,
      hours: "08:00–20:00",
    },
    {
      id: "sample-m3",
      name: "SAMPLE Cooling Works",
      zones: ["Velpur", "Undrajavaram"],
      skills: ["ac", "appliance"],
      status: "pending",
      capacity: 3,
      hours: "09:00–18:00",
    },
  ];
  merchants.forEach((m, i) => {
    m.catalog = Object.fromEntries(
      m.skills.map((c) => [c, { ...initialPolicy[c], labor: initialPolicy[c].labor + i * 50 }]),
    ) as Partial<Record<Category, Rates>>;
  });
  merchants.forEach((m) => {
    m.cityIds = ["tanuku"];
    m.serviceIds = [...m.skills];
    m.verification = m.status === "pending" ? "pending" : "approved";
    m.workDays = [0, 1, 2, 3, 4, 5, 6];
    m.blackouts = [];
    m.travelRadiusKm = 3;
    m.owner = "SAMPLE Owner";
    m.consent = true;
    m.lastActivity = now;
  });
  merchants.push(
    {
      id: "sample-m4",
      name: "SAMPLE Eluru Care",
      zones: ["Eluru Center"],
      cityIds: ["eluru"],
      skills: ["electrician", "plumbing", "ac"],
      serviceIds: ["electrician", "plumbing", "ac"],
      status: "active",
      verification: "approved",
      capacity: 5,
      hours: "08:00–20:00",
      travelRadiusKm: 3,
    },
    {
      id: "sample-m5",
      name: "SAMPLE Bhimavaram Repairs",
      zones: ["Bhimavaram Center"],
      cityIds: ["bhimavaram"],
      skills: ["plumbing", "appliance"],
      serviceIds: ["plumbing", "appliance"],
      status: "active",
      verification: "approved",
      capacity: 5,
      hours: "08:00–20:00",
      travelRadiusKm: 3,
    },
    {
      id: "sample-m6",
      name: "SAMPLE Suspended",
      zones: ["Eluru Center"],
      cityIds: ["eluru"],
      skills: ["ac"],
      status: "suspended",
      capacity: 3,
      hours: "08:00–20:00",
    },
    {
      id: "sample-m7",
      name: "SAMPLE Offline",
      zones: ["Bhimavaram Center"],
      cityIds: ["bhimavaram"],
      skills: ["plumbing"],
      status: "unavailable",
      capacity: 3,
      hours: "08:00–20:00",
    },
    {
      id: "sample-m8",
      name: "SAMPLE Capacity Full",
      zones: ["Tanuku"],
      cityIds: ["tanuku"],
      skills: ["electrician"],
      status: "active",
      capacity: 0,
      hours: "08:00–20:00",
    },
  );
  const statuses: Status[] = [
    "draft",
    "matching",
    "awaiting_response",
    "accepted",
    "scheduled",
    "in_progress",
    "awaiting_quote",
    "complete",
    "cancelled",
    "disputed",
    "no_availability",
    "expired",
  ];
  const bookings = statuses.map((status, i): Booking => {
    const category = categoriesDemo[i % 4] ?? "electrician";
    const price = calculate(initialPolicy[category]);
    const assigned = [
      "accepted",
      "scheduled",
      "in_progress",
      "awaiting_quote",
      "complete",
      "disputed",
    ].includes(status);
    return {
      id: `SAMPLE-${String(i + 1).padStart(3, "0")}`,
      customerId: i % 2 ? "sample-c2" : "sample-c1",
      category,
      zone: "Tanuku",
      problem: `SAMPLE fixture ${i + 1} · ${category}`,
      date: "2026-10-20",
      slot: "morning",
      status,
      merchantId: assigned ? (category === "appliance" ? "sample-m2" : "sample-m1") : null,
      technicianId: assigned ? (category === "appliance" ? "sample-t2" : "sample-t1") : null,
      offers:
        category === "ac"
          ? ["sample-m1"]
          : category === "appliance"
            ? ["sample-m2"]
            : ["sample-m1", "sample-m2"],
      declined: [],
      expiresAt: now + 15 * 60 * 1000,
      estimate: price,
      quote: ["awaiting_quote", "complete", "in_progress"].includes(status) ? price : null,
      approvedQuote: ["complete", "in_progress"].includes(status) ? price : null,
      quoteVersion: 1,
      timeline: [{ event: "created", at: now - i * 60000, actor: "sample-c1" }],
      revision: 1,
    };
  });
  return {
    schema: 1,
    communications: communicationsSeed(),
    revision: 0,
    registry: registrySeed(),
    policy: structuredClone(initialPolicy),
    bookings,
    notifications: [],
    audit: [],
    merchants,
    personas: [
      ...structuredClone(personas),
      ...[4, 5, 6, 7, 8].flatMap((i) => [
        {
          id: `sample-m${i}`,
          name: `SAMPLE Merchant ${i}`,
          role: "merchant" as const,
          merchantId: `sample-m${i}`,
        },
        {
          id: `sample-t${i}`,
          name: `SAMPLE Technician ${i}`,
          role: "technician" as const,
          merchantId: `sample-m${i}`,
        },
      ]),
    ],
    tickets: [
      {
        id: "SAMPLE-TICKET-1",
        bookingId: "SAMPLE-010",
        actor: "sample-c2",
        message: "SAMPLE support case; no external message",
        status: "open",
      },
    ],
    reviews: [
      {
        id: "SAMPLE-REVIEW-1",
        bookingId: "SAMPLE-008",
        label: "DEMO review fixture · not a real testimonial",
      },
    ],
    onboarding: {},
    commands: [],
    sequence: 13,
    scenario: "normal",
  };
}
export function eligible(
  s: DemoState,
  category: Category,
  zone: string,
  slot = "morning",
  date?: string,
  serviceId?: string,
  location?: SampleAddress,
  now = Date.now(),
) {
  return s.merchants
    .filter(
      (m) =>
        eligibility(s, m, { category, zone, slot, date, serviceId, location }, now).length === 0,
    )
    .map((m) => m.id);
}
export function transition(input: DemoState, c: Command, now = Date.now()): Result {
  if (input.commands.includes(c.id))
    return {
      state: input,
      ok: true,
      code: "duplicate",
      ...(c.bookingId ? { bookingId: c.bookingId } : {}),
    };
  const s = structuredClone(input);
  s.communications ??= communicationsSeed();
  const actor = s.personas.find((p) => p.id === c.actor);
  if (!actor || actor.deactivated) return { state: input, ok: false, code: "session" };
  const p = c.payload ?? {};
  const ops = actor.role === "admin" || actor.role === "operations";
  const b = s.bookings.find((b) => b.id === c.bookingId);
  const fail = (code: string): Result => ({ state: input, ok: false, code });
  if (c.type === "communications") {
    const code = mutateCommunications(s, c.actor, p, now);
    if (code !== "ok") return fail(code);
    s.commands = [...s.commands.slice(-199), c.id];
    s.revision++;
    return { state: s, ok: true, code: "ok" };
  }
  const emit = (event: EventKey, booking: Booking | null, recipients: string[]) => {
    const id = `EV-${s.revision + 1}-${s.audit.length + 1}`;
    s.audit.push({ id, event, bookingId: booking?.id ?? "", actor: c.actor, at: now });
    booking?.timeline.push({ event, at: now, actor: c.actor });
    [...new Set([...recipients, "sample-ops", "sample-admin"])].forEach((to) =>
      s.notifications.push({
        id: `${id}-${to}`,
        to,
        bookingId: booking?.id ?? "",
        event,
        at: now,
        read: false,
      }),
    );
    s.notifications
      .filter((n) => n.id.startsWith(`${id}-`))
      .forEach((n) => enqueueNotification(s, n));
  };
  let createdId: string | undefined;
  if (c.type === "registry") {
    if (actor.role !== "admin") return fail("permission");
    const entity = String(p["entity"]) as Entity;
    if (!(entity in entitySchemas)) return fail("required");
    const rows = s.registry[entity] as Array<{ id: string }>;
    const id = String(p["recordId"] ?? "");
    const index = rows.findIndex((r) => r.id === id);
    const before = index >= 0 ? structuredClone(rows[index]) : null;
    const reason = String(p["reason"] ?? "").trim();
    if (!reason || reason.length > 300) return fail("required");
    if (p["action"] === "delete") {
      if (index < 0) return fail("not_found");
      const referenced =
        s.bookings.some((b) =>
          entity === "cities"
            ? b.cityId === id || b.location?.cityId === id || (!b.cityId && id === "tanuku")
            : entity === "services"
              ? (b.serviceId ?? b.category) === id
              : entity === "categories"
                ? b.category === id
                : b.location?.localityId === id,
        ) ||
        (entity === "cities" &&
          (s.registry.localities.some((l) => l.cityId === id) ||
            s.merchants.some((m) => m.cityIds?.includes(id)) ||
            s.registry.services.some((v) => v.cityIds.includes(id)))) ||
        (entity === "categories" && s.registry.services.some((v) => v.categoryId === id)) ||
        (entity === "localities" &&
          (s.registry.areas.some((a) => a.localityId === id) ||
            s.registry.addresses.some((a) => a.localityId === id))) ||
        (entity === "services" &&
          (s.registry.areas.some((a) => a.serviceIds.includes(id)) ||
            s.merchants.some((m) => m.serviceIds?.includes(id)))) ||
        (entity === "cities" && s.registry.addresses.some((a) => a.cityId === id));
      const area = entity === "areas" ? s.registry.areas.find((a) => a.id === id) : undefined;
      if (
        referenced ||
        (area &&
          s.bookings.some(
            (b) =>
              b.location?.localityId === area.localityId &&
              !["complete", "cancelled", "expired"].includes(b.status),
          ))
      )
        return fail("referenced");
      rows.splice(index, 1);
    } else {
      const parsed = entitySchemas[entity].safeParse(p["record"]);
      if (!parsed.success || parsed.data.id !== id) return fail("required");
      const record = parsed.data;
      if ("cityId" in record && !s.registry.cities.some((v) => v.id === record.cityId))
        return fail("required");
      if ("categoryId" in record && !s.registry.categories.some((v) => v.id === record.categoryId))
        return fail("required");
      if (
        "cityIds" in record &&
        (!Array.isArray(record.cityIds) ||
          !record.cityIds.every((v: unknown) => s.registry.cities.some((c) => c.id === v)))
      )
        return fail("required");
      if (
        "localityId" in record &&
        !s.registry.localities.some((v) => v.id === record.localityId && v.cityId === record.cityId)
      )
        return fail("required");
      if (
        "serviceIds" in record &&
        !record.serviceIds.every((v) => s.registry.services.some((service) => service.id === v))
      )
        return fail("required");
      if (index >= 0) rows[index] = record;
      else rows.push(record);
    }
    s.registry.history.unshift({
      at: now,
      actor: c.actor,
      entity,
      id,
      before,
      after: rows.find((r) => r.id === id) ?? null,
      reason,
    });
    emit("policy", null, [c.actor]);
  } else if (c.type === "address") {
    if (actor.role !== "customer") return fail("permission");
    if (p["action"] === "delete") {
      s.registry.addresses = s.registry.addresses.filter(
        (a) => !(a.id === p["addressId"] && a.customerId === actor.id),
      );
    } else {
      const parsed = addressSchema.safeParse(p["address"]);
      if (!parsed.success || parsed.data.customerId !== actor.id) return fail("required");
      const a = parsed.data;
      if (
        !s.registry.localities.some((l) => l.id === a.localityId && l.cityId === a.cityId) ||
        !s.registry.cities.some((city) => city.id === a.cityId)
      )
        return fail("required");
      if (s.registry.addresses.some((old) => old.id === a.id && old.customerId !== actor.id))
        return fail("permission");
      if (a.preferred)
        s.registry.addresses.forEach((old) => {
          if (old.customerId === actor.id) old.preferred = false;
        });
      s.registry.addresses = [
        ...s.registry.addresses.filter((old) => old.id !== a.id),
        { ...a, confirmedAt: now },
      ];
    }
  } else if (c.type === "merchant_edit") {
    if (actor.role !== "admin") return fail("permission");
    const parsed = z
      .object({
        id: z.string(),
        name: z.string().trim().min(1).max(100),
        status: z.enum(["active", "pending", "suspended", "unavailable"]),
        capacity: z.number().int().min(0).max(100),
        hours: z.string().regex(/^(?:[01]\d|2[0-3]):00–(?:[01]\d|2[0-3]):00$/),
        cityIds: z.array(z.string()),
        zones: z.array(z.string()),
        skills: z.array(z.enum(["electrician", "plumbing", "ac", "appliance"])),
        serviceIds: z.array(z.string()),
        workDays: z.array(z.number().int().min(0).max(6)),
        blackouts: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        travelRadiusKm: z.number().min(0.1).max(30),
        verification: z.enum(["approved", "pending", "rejected", "suspended"]),
      })
      .safeParse(p["record"]);
    const reason = String(p["reason"] ?? "").trim();
    if (!parsed.success || !reason || reason.length > 300) return fail("required");
    const m = parsed.data;
    if (
      !m.cityIds.every((id) => s.registry.cities.some((c) => c.id === id)) ||
      !m.zones.every((zone) =>
        s.registry.localities.some(
          (l) => l.names["en-IN"] === zone && m.cityIds.includes(l.cityId),
        ),
      ) ||
      !m.serviceIds.every((id) => s.registry.services.some((v) => v.id === id))
    )
      return fail("required");
    const index = s.merchants.findIndex((old) => old.id === m.id);
    const before = s.merchants[index] ?? null;
    const record = { ...before, ...m, name: `SAMPLE ${m.name.replace(/^SAMPLE\s*/, "")}` };
    if (index < 0) s.merchants.push(record);
    else s.merchants[index] = record;
    s.registry.history.unshift({
      at: now,
      actor: c.actor,
      entity: "merchants",
      id: m.id,
      before,
      after: record,
      reason,
    });
    emit("policy", null, [m.id]);
  } else if (c.type === "person_edit") {
    if (actor.role !== "admin") return fail("permission");
    const parsed = z
      .object({
        id: z.string().min(1).max(100),
        name: z.string().trim().min(1).max(100),
        role: z.enum(["customer", "merchant", "technician", "operations", "admin"]),
        merchantId: z.string().optional(),
        deactivated: z.boolean(),
        unavailable: z.boolean().optional(),
      })
      .safeParse(p["record"]);
    const reason = String(p["reason"] ?? "").trim();
    if (!parsed.success || !reason || reason.length > 300 || parsed.data.id === actor.id)
      return fail("required");
    const person = parsed.data;
    if (
      ["merchant", "technician"].includes(person.role) &&
      !s.merchants.some((m) => m.id === person.merchantId)
    )
      return fail("required");
    const i = s.personas.findIndex((v) => v.id === person.id),
      before = s.personas[i] ?? null;
    if (
      before &&
      s.bookings.some(
        (b) =>
          (b.customerId === before.id || b.technicianId === before.id) &&
          !["complete", "cancelled", "expired"].includes(b.status),
      ) &&
      before.role !== person.role
    )
      return fail("referenced");
    const after = { ...person, name: `SAMPLE ${person.name.replace(/^SAMPLE\s*/, "")}` };
    if (i < 0) s.personas.push(after);
    else s.personas[i] = after;
    s.registry.history.unshift({
      at: now,
      actor: c.actor,
      entity: "personas",
      id: person.id,
      before,
      after,
      reason,
    });
    emit("policy", null, [person.id]);
  } else if (c.type === "ticket_edit") {
    if (!ops) return fail("permission");
    const ticket = s.tickets.find((t) => t.id === p["ticketId"]);
    if (!ticket) return fail("not_found");
    if (!["open", "resolved"].includes(String(p["status"]))) return fail("required");
    ticket.status = String(p["status"]);
    emit("support", null, [ticket.actor]);
  } else if (c.type === "create") {
    if (actor.role !== "customer") return fail("permission");
    const category = String(p["category"]) as Category;
    const zone = String(p["zone"]);
    const problem = String(p["problem"] ?? "").trim(),
      date = String(p["date"] ?? ""),
      slot = String(p["slot"] ?? "morning");
    if (
      !categoriesDemo.includes(category) ||
      !s.registry.localities.some((l) => l.names["en-IN"] === zone || l.id === zone) ||
      !problem ||
      problem.length > 1000 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date < new Date(now).toLocaleDateString("en-CA") ||
      !["morning", "afternoon", "evening"].includes(slot)
    )
      return fail("required");
    if (s.scenario === "timeout") return fail("timeout");
    const serviceId = String(p["serviceId"] ?? category);
    const location = p["location"] ? addressSchema.safeParse(p["location"]) : null;
    if (
      location &&
      (!location.success ||
        location.data.customerId !== c.actor ||
        now - location.data.confirmedAt > 86400000 ||
        location.data.confirmedAt > now ||
        !s.registry.addresses.some((a) => a.id === location.data.id && a.customerId === c.actor))
    )
      return fail("required");
    const confirmed = location?.success ? location.data : undefined;
    if (p["serviceId"] && !confirmed) return fail("required");
    if (confirmed) {
      const stored = s.registry.addresses.find(
        (a) => a.id === confirmed.id && a.customerId === c.actor,
      );
      if (
        !stored ||
        ["house", "street", "localityId", "cityId", "pin", "lat", "lng", "confirmedAt"].some(
          (key) => stored[key as keyof SampleAddress] !== confirmed[key as keyof SampleAddress],
        )
      )
        return fail("required");
    }
    const cityId =
      confirmed?.cityId ??
      s.registry.localities.find((l) => l.names["en-IN"] === zone || l.id === zone)?.cityId ??
      "tanuku";
    if (
      confirmed &&
      !s.registry.localities.some(
        (l) => l.id === confirmed.localityId && l.names["en-IN"] === zone && l.cityId === cityId,
      )
    )
      return fail("required");
    const available =
      s.scenario === "no-availability"
        ? []
        : eligible(s, category, zone, slot, date, serviceId, confirmed, now);
    const price = calculate(ratesFor(s, cityId, serviceId, category));
    if (
      Number(p["priceVersion"]) !== price.rates.version ||
      Number(p["priceTotal"]) !== price.total
    )
      return fail("price_changed");
    createdId = `DEMO-${String(s.sequence++).padStart(3, "0")}`;
    const newBooking: Booking = {
      id: createdId,
      customerId: c.actor,
      category,
      zone,
      cityId,
      cityName: s.registry.cities.find((c) => c.id === cityId)?.names["en-IN"] ?? "SAMPLE City",
      serviceId,
      location: confirmed,
      viewed: [],
      problem,
      date,
      slot,
      status: available.length ? "awaiting_response" : "no_availability",
      merchantId: null,
      technicianId: null,
      offers: available,
      declined: [],
      expiresAt: now + (s.scenario === "expiry" ? 0 : 15 * 60 * 1000),
      estimate: price,
      quote: null,
      approvedQuote: null,
      quoteVersion: 0,
      timeline: [],
      revision: 1,
    };
    s.bookings.unshift(newBooking);
    emit(available.length ? "created" : "no_availability", newBooking, [c.actor, ...available]);
  } else if (c.type === "read") {
    s.notifications.forEach((n) => {
      if (n.to === c.actor) n.read = true;
    });
  } else if (c.type === "policy") {
    if (actor.role !== "admin") return fail("permission");
    const cat = String(p["category"]) as Category;
    if (!categoriesDemo.includes(cat)) return fail("required");
    const rates = {
      ...s.policy[cat],
      ...(p["rates"] as Partial<Rates>),
      version: s.policy[cat].version + 1,
    };
    try {
      calculate(rates);
    } catch {
      return fail("invalid_price");
    }
    if (p["cityId"]) {
      const cityId = String(p["cityId"]),
        serviceId = String(p["serviceId"] ?? cat);
      if (
        !s.registry.cities.some((v) => v.id === cityId) ||
        !s.registry.services.some((v) => v.id === serviceId)
      )
        return fail("required");
      rates.version =
        (s.registry.cityRates[`${cityId}:${serviceId}`]?.version ?? s.policy[cat].version) + 1;
      s.registry.cityRates[`${cityId}:${serviceId}`] = rates;
    } else s.policy[cat] = rates;
    emit("policy", null, [c.actor]);
  } else if (c.type === "availability") {
    if (!ops && actor.role !== "merchant" && actor.role !== "technician") return fail("permission");
    if (actor.role === "technician") {
      actor.unavailable = p["status"] === "unavailable";
      s.commands.push(c.id);
      s.revision++;
      return { state: s, ok: true, code: "ok" };
    }
    const id = ops ? String(p["merchantId"]) : actor.merchantId;
    const m = s.merchants.find((m) => m.id === id);
    if (!m) return fail("not_found");
    const status = String(p["status"]);
    if (!["active", "pending", "suspended", "unavailable"].includes(status))
      return fail("required");
    m.status = status as Merchant["status"];
    if (p["capacity"] !== undefined) {
      const v = Number(p["capacity"]);
      if (!Number.isInteger(v) || v < 0) return fail("required");
      m.capacity = v;
    }
  } else if (c.type === "onboard") {
    if (actor.role !== "merchant") return fail("permission");
    const prefix = `${actor.id}:`;
    for (const [key, value] of Object.entries(p)) s.onboarding[prefix + key] = String(value);
    const m = s.merchants.find((m) => m.id === actor.merchantId);
    if (m && p["business"]) m.name = `SAMPLE ${String(p["business"]).replace(/^SAMPLE\s*/, "")}`;
    if (m && p["services"] && categoriesDemo.includes(p["services"] as Category))
      m.skills = [p["services"] as Category];
    if (m && p["zone"] && zones.includes(String(p["zone"]))) m.zones = [String(p["zone"])];
    if (m && p["hours"]) {
      if (!/^\d{2}:00–\d{2}:00$/.test(String(p["hours"]))) return fail("required");
      m.hours = String(p["hours"]);
    }
    if (m && p["policy"]) {
      const amounts = String(p["policy"])
        .split("/")
        .map((x) => Number(x.trim()));
      if (amounts.length !== 3 || amounts.some((x) => !Number.isFinite(x) || x < 0))
        return fail("invalid_price");
      const category = m.skills[0] ?? "electrician";
      m.catalog = {
        ...m.catalog,
        [category]: {
          ...s.policy[category],
          visit: amounts[0] ?? 0,
          labor: amounts[1] ?? 0,
          parts: amounts[2] ?? 0,
        },
      };
    }
    if (p["submitted"] === "yes") {
      const m = s.merchants.find((m) => m.id === actor.merchantId);
      if (m) m.status = "pending";
    }
  } else {
    if (!b) return fail("not_found");
    const owner = b.customerId === c.actor;
    const merchant = b.merchantId === actor.merchantId && actor.role === "merchant";
    const tech = b.technicianId === c.actor && actor.role === "technician";
    const peers = [
      b.customerId,
      ...(b.merchantId ? [b.merchantId] : []),
      ...(b.technicianId ? [b.technicianId] : []),
    ];
    if (c.type === "view") {
      if (actor.role !== "merchant" || !actor.merchantId || !b.offers.includes(actor.merchantId))
        return fail("permission");
      b.viewed = [...new Set([...(b.viewed ?? []), actor.merchantId])];
    } else if (c.type === "accept" || c.type === "decline") {
      if (actor.role !== "merchant" || !actor.merchantId || !b.offers.includes(actor.merchantId))
        return fail("permission");
      if (b.merchantId) return fail("conflict");
      if (["cancelled", "expired", "no_availability"].includes(b.status) || b.expiresAt <= now)
        return fail("expired");
      if (!["awaiting_response", "matching"].includes(b.status)) return fail("status");
      if (b.declined.includes(actor.merchantId)) return fail("closed");
      if (
        !eligible(s, b.category, b.zone, b.slot, b.date, b.serviceId, b.location, now).includes(
          actor.merchantId,
        )
      )
        return fail("capacity");
      if (c.type === "decline") {
        b.declined.push(actor.merchantId);
        emit("declined", b, [b.customerId, actor.merchantId]);
        if (b.offers.every((id) => b.declined.includes(id))) {
          b.status = "no_availability";
          emit("no_availability", b, peers);
        }
      } else {
        b.merchantId = actor.merchantId;
        b.status = "accepted";
        emit("accepted", b, [b.customerId, actor.merchantId]);
        emit(
          "closed",
          b,
          b.offers.filter((id) => id !== actor.merchantId),
        );
      }
    } else if (c.type === "assign") {
      if (!merchant && !ops) return fail("permission");
      if (!["accepted", "scheduled"].includes(b.status)) return fail("status");
      const technician = s.personas.find(
        (t) =>
          t.id === p["technicianId"] && t.role === "technician" && t.merchantId === b.merchantId,
      );
      if (!technician || technician.deactivated) return fail("capacity");
      if (technician.unavailable) return fail("capacity");
      if (
        s.bookings.some(
          (job) =>
            job.id !== b.id &&
            job.technicianId === technician.id &&
            job.date === b.date &&
            job.slot === b.slot &&
            !["complete", "cancelled", "expired", "disputed"].includes(job.status),
        )
      )
        return fail("capacity");
      if (s.merchants.find((m) => m.id === b.merchantId)?.status !== "active")
        return fail("capacity");
      b.technicianId = technician.id;
      b.status = "scheduled";
      emit("assigned", b, [...peers, technician.id]);
    } else if (c.type === "status") {
      if (!tech) return fail("permission");
      if (actor.unavailable) return fail("capacity");
      if (s.scenario === "offline") return fail("offline");
      if (s.scenario === "status-error") return fail("status");
      if (s.merchants.find((m) => m.id === b.merchantId)?.status !== "active")
        return fail("capacity");
      const next: Record<string, Status> = {
        scheduled: "travel",
        travel: "arrived",
        arrived: "inspection",
        approved: "in_progress",
        in_progress: "complete",
      };
      const dest = String(p["status"]) as Status;
      if (next[b.status] !== dest) return fail("status");
      if (
        ["in_progress", "complete"].includes(dest) &&
        (!b.approvedQuote || b.approvedQuote.total !== b.quote?.total)
      )
        return fail("approval");
      b.status = dest;
      const event: EventKey =
        dest === "in_progress"
          ? "started"
          : dest === "complete"
            ? "complete"
            : dest === "travel"
              ? "travel"
              : dest === "arrived"
                ? "arrived"
                : "inspection";
      emit(event, b, peers);
    } else if (c.type === "quote") {
      if (!tech && !merchant) return fail("permission");
      if (!["inspection", "awaiting_quote", "quote_rejected", "approved"].includes(b.status))
        return fail("status");
      const rates = {
        ...(b.quote ?? b.estimate).rates,
        labor: Number(p["labor"]),
        parts: Number(p["parts"]),
        version: (b.quote ?? b.estimate).rates.version,
      };
      let price: Price;
      try {
        price = calculate(rates);
      } catch {
        return fail("invalid_price");
      }
      b.quote = price;
      b.quoteVersion++;
      b.approvedQuote = null;
      b.status = "awaiting_quote";
      emit("quoted", b, peers);
    } else if (c.type === "approve" || c.type === "reject") {
      if (!owner) return fail("permission");
      if (b.status !== "awaiting_quote" || !b.quote) return fail("status");
      if (Number(p["quoteVersion"]) !== b.quoteVersion) return fail("conflict");
      if (c.type === "approve") {
        b.approvedQuote = structuredClone(b.quote);
        b.status = "approved";
        emit("approved", b, peers);
      } else {
        b.status = "quote_rejected";
        emit("rejected", b, peers);
      }
    } else if (c.type === "cancel") {
      if (!owner && !ops && !merchant) return fail("permission");
      if (["complete", "cancelled", "disputed"].includes(b.status)) return fail("status");
      b.status = "cancelled";
      emit("cancelled", b, peers);
    } else if (c.type === "dispute" || c.type === "support") {
      if (!owner && !ops && !merchant && !tech) return fail("permission");
      const message = String(p["message"] ?? "").trim();
      if (!message) return fail("required");
      s.tickets.push({
        id: `SAMPLE-TICKET-${s.tickets.length + 1}`,
        bookingId: b.id,
        actor: c.actor,
        message,
        status: "open",
      });
      if (c.type === "dispute") {
        b.status = "disputed";
        emit("disputed", b, peers);
      } else emit("support", b, peers);
    } else if (c.type === "expire") {
      if (!ops) return fail("permission");
      if (b.merchantId || !["awaiting_response", "matching"].includes(b.status))
        return fail("status");
      b.status = "expired";
      b.expiresAt = now;
      emit("expired", b, peers);
    } else if (c.type === "reschedule") {
      if (
        !owner ||
        !["no_availability", "expired", "awaiting_response", "matching"].includes(b.status)
      )
        return fail("status");
      const date = String(p["date"]);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < new Date(now).toLocaleDateString("en-CA"))
        return fail("required");
      b.date = date;
      b.slot = String(p["slot"] ?? b.slot);
      b.offers = eligible(s, b.category, b.zone, b.slot, b.date, b.serviceId, b.location, now);
      b.declined = [];
      b.expiresAt = now + 900000;
      b.status = b.offers.length ? "awaiting_response" : "no_availability";
      emit("rescheduled", b, peers);
    }
    b.revision++;
  }
  s.commands = [...s.commands.slice(-199), c.id];
  s.revision++;
  return {
    state: s,
    ok: true,
    code: "ok",
    ...(createdId ? { bookingId: createdId } : c.bookingId ? { bookingId: c.bookingId } : {}),
  };
}
export function scenarioSeed(name: string, now = Date.now()): DemoState {
  const s = seed(now);
  s.scenario = name;
  if (name === "capacity") {
    s.merchants.forEach((m) => (m.capacity = 0));
  }
  if (name === "no-availability") s.merchants.forEach((m) => (m.status = "unavailable"));
  if (name === "competition" || name === "decline")
    s.bookings = s.bookings.filter((b) => !["awaiting_response", "matching"].includes(b.status));
  return s;
}
