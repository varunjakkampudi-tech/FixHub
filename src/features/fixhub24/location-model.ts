import { z } from "zod";
import type { Booking, Category, DemoState, Merchant, Rates } from "./demo-model";

export type Names = { "en-IN": string; "te-IN": string; "hi-IN": string };
export type City = {
  id: string;
  names: Names;
  status: "active" | "paused" | "coming-soon" | "archived";
  launch: "planned" | "future-demo";
  center: [number, number];
  fixture: true;
};
export type Locality = {
  id: string;
  cityId: string;
  names: Names;
  status: City["status"];
  center: [number, number];
  fixture: true;
};
export type ServiceArea = {
  id: string;
  cityId: string;
  localityId: string;
  serviceIds: string[];
  active: boolean;
  radiusKm: number;
  center: [number, number];
  fixture: true;
};
export type CatalogCategory = { id: string; names: Names; archived: boolean };
export type CatalogService = {
  id: string;
  categoryId: string;
  pricingCategory: Category;
  names: Names;
  description: Names;
  cityIds: string[];
  archived: boolean;
};
export type SampleAddress = {
  id: string;
  customerId: string;
  label: "Home" | "Work" | "Other";
  house: string;
  street: string;
  landmark: string;
  localityId: string;
  cityId: string;
  state: string;
  pin: string;
  instructions: string;
  lat: number;
  lng: number;
  accuracy?: number | undefined;
  confirmedAt: number;
  preferred: boolean;
  consent: true;
  mode: "demo" | "gps";
};
export type Registry = {
  cities: City[];
  localities: Locality[];
  areas: ServiceArea[];
  categories: CatalogCategory[];
  services: CatalogService[];
  addresses: SampleAddress[];
  cityRates: Record<string, Rates>;
  history: {
    at: number;
    actor: string;
    entity: string;
    id: string;
    before: unknown;
    after: unknown;
    reason: string;
  }[];
};
const names = (en: string, te: string): Names => ({ "en-IN": en, "te-IN": te, "hi-IN": en });
export function registrySeed(): Registry {
  const cities: City[] = [
    {
      id: "tanuku",
      names: names("Tanuku", "తణుకు"),
      launch: "planned",
      status: "active",
      center: [16.75, 81.68],
      fixture: true,
    },
    {
      id: "eluru",
      names: names("Eluru", "ఏలూరు"),
      launch: "future-demo",
      status: "active",
      center: [16.71, 81.1],
      fixture: true,
    },
    {
      id: "bhimavaram",
      names: names("Bhimavaram", "భీమవరం"),
      launch: "future-demo",
      status: "active",
      center: [16.54, 81.52],
      fixture: true,
    },
  ];
  const localities: Locality[] = [
    {
      id: "tanuku-center",
      cityId: "tanuku",
      names: names("Tanuku", "తణుకు"),
      status: "active",
      center: [16.75, 81.68],
      fixture: true,
    },
    {
      id: "velpur",
      cityId: "tanuku",
      names: names("Velpur", "వేల్పూరు"),
      status: "active",
      center: [16.76, 81.7],
      fixture: true,
    },
    {
      id: "undrajavaram",
      cityId: "tanuku",
      names: names("Undrajavaram", "ఉండ్రాజవరం"),
      status: "active",
      center: [16.78, 81.69],
      fixture: true,
    },
    {
      id: "eluru-center",
      cityId: "eluru",
      names: names("Eluru Center", "ఏలూరు కేంద్రం"),
      status: "active",
      center: [16.71, 81.1],
      fixture: true,
    },
    {
      id: "eluru-outskirts",
      cityId: "eluru",
      names: names("Eluru Outskirts", "ఏలూరు శివారు"),
      status: "coming-soon",
      center: [16.75, 81.15],
      fixture: true,
    },
    {
      id: "bhimavaram-center",
      cityId: "bhimavaram",
      names: names("Bhimavaram Center", "భీమవరం కేంద్రం"),
      status: "active",
      center: [16.54, 81.52],
      fixture: true,
    },
    {
      id: "bhimavaram-outskirts",
      cityId: "bhimavaram",
      names: names("Bhimavaram Outskirts", "భీమవరం శివారు"),
      status: "coming-soon",
      center: [16.58, 81.57],
      fixture: true,
    },
  ];
  const categories = [
    ["electrician", "Electrical", "విద్యుత్ సేవలు"],
    ["plumbing", "Plumbing", "ప్లంబింగ్"],
    ["ac", "AC service", "ఏసీ సేవ"],
    ["appliance", "Appliance repair", "గృహోపకరణాల మరమ్మతు"],
  ].map(([id, en, te]) => ({ id: id ?? "", names: names(en ?? "", te ?? ""), archived: false }));
  const services: CatalogService[] = categories.map((c) => ({
    id: c.id,
    categoryId: c.id,
    pricingCategory: c.id as Category,
    names: c.names,
    description: names(
      "SAMPLE inspection and repair · final work requires approval",
      "నమూనా తనిఖీ, మరమ్మతు · పనికి తుది ఆమోదం అవసరం",
    ),
    cityIds:
      c.id === "ac"
        ? ["tanuku", "eluru"]
        : c.id === "appliance"
          ? ["tanuku", "bhimavaram"]
          : ["tanuku", "eluru", "bhimavaram"],
    archived: false,
  }));
  return {
    cities,
    localities,
    categories,
    services,
    areas: localities.map((l) => ({
      id: `area-${l.id}`,
      cityId: l.cityId,
      localityId: l.id,
      serviceIds: services.filter((s) => s.cityIds.includes(l.cityId)).map((s) => s.id),
      active: l.status === "active",
      radiusKm: 3,
      center: l.center,
      fixture: true,
    })),
    addresses: [],
    cityRates: {},
    history: [],
  };
}
export function cityForZone(s: DemoState, zone: string) {
  return (
    s.registry.localities.find((l) => l.id === zone || Object.values(l.names).includes(zone))
      ?.cityId ?? "tanuku"
  );
}
export function ratesFor(s: DemoState, cityId: string, serviceId: string, category: Category) {
  return s.registry.cityRates[`${cityId}:${serviceId}`] ?? s.policy[category];
}
export function enabledServices(s: DemoState, cityId: string) {
  if (s.registry.cities.find((c) => c.id === cityId)?.status !== "active") return [];
  return s.registry.services.filter(
    (v) =>
      !v.archived &&
      v.cityIds.includes(cityId) &&
      !s.registry.categories.find((c) => c.id === v.categoryId)?.archived,
  );
}
export type EligibilityReason =
  | "city_paused"
  | "service_disabled"
  | "outside_area"
  | "verification"
  | "offline"
  | "capacity"
  | "hours"
  | "blackout"
  | "schedule"
  | "staff";
export function distanceKm(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const x =
    Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 +
    Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function eligibility(
  s: DemoState,
  m: Merchant,
  request: {
    category: Category;
    zone: string;
    slot: string;
    date?: string | undefined;
    serviceId?: string | undefined;
    location?: SampleAddress | undefined;
  },
  now = Date.now(),
): EligibilityReason[] {
  const reasons: EligibilityReason[] = [];
  const cityId = request.location?.cityId ?? cityForZone(s, request.zone);
  const locality = s.registry.localities.find(
    (l) =>
      l.id === request.location?.localityId ||
      l.id === request.zone ||
      Object.values(l.names).includes(request.zone),
  );
  const serviceId = request.serviceId ?? request.category;
  if (s.registry.cities.find((c) => c.id === cityId)?.status !== "active")
    reasons.push("city_paused");
  if (
    !enabledServices(s, cityId).some((v) => v.id === serviceId) ||
    !m.skills.includes(request.category) ||
    !(m.serviceIds ?? m.skills).includes(serviceId)
  )
    reasons.push("service_disabled");
  const areas = s.registry.areas.filter(
    (a) =>
      a.active &&
      a.cityId === cityId &&
      a.localityId === locality?.id &&
      a.serviceIds.includes(serviceId),
  );
  if (
    !locality ||
    locality.status !== "active" ||
    !m.zones.some((zone) => zone === locality.id || Object.values(locality.names).includes(zone)) ||
    !(m.cityIds ?? ["tanuku"]).includes(cityId) ||
    !areas.some(
      (a) =>
        !request.location ||
        distanceKm(a.center, [request.location.lat, request.location.lng]) <=
          Math.min(a.radiusKm, m.travelRadiusKm ?? 3),
    )
  )
    reasons.push("outside_area");
  if (
    m.status === "pending" ||
    m.status === "suspended" ||
    (m.verification !== undefined && m.verification !== "approved")
  )
    reasons.push("verification");
  if (m.status === "unavailable") reasons.push("offline");
  const active = s.bookings.filter(
    (b) =>
      b.merchantId === m.id && !["complete", "cancelled", "expired", "disputed"].includes(b.status),
  );
  if (active.length >= m.capacity) reasons.push("capacity");
  const hour = request.slot === "evening" ? 18 : request.slot === "afternoon" ? 14 : 10;
  const [open, close] = m.hours.split("–").map((v) => Number(v.split(":")[0]));
  if (
    !Number.isFinite(open) ||
    !Number.isFinite(close) ||
    hour < (open ?? 0) ||
    hour >= (close ?? 24)
  )
    reasons.push("hours");
  if (request.date) {
    const day = new Date(request.date + "T12:00:00").getDay();
    if (
      !Number.isFinite(day) ||
      request.date < new Date(now).toLocaleDateString("en-CA") ||
      !(m.workDays ?? [0, 1, 2, 3, 4, 5, 6]).includes(day)
    )
      reasons.push("schedule");
    if (m.blackouts?.includes(request.date)) reasons.push("blackout");
    const staff = s.personas.filter(
      (p) => p.role === "technician" && p.merchantId === m.id && !p.unavailable && !p.deactivated,
    );
    if (
      !staff.some(
        (t) =>
          !active.some(
            (b) => b.technicianId === t.id && b.date === request.date && b.slot === request.slot,
          ),
      )
    )
      reasons.push("staff");
  }
  return reasons;
}
export function offerState(b: Booking, merchantId: string) {
  if (b.merchantId === merchantId) return b.status;
  if (b.merchantId) return "closed";
  if (b.declined.includes(merchantId)) return "declined";
  if (["expired", "cancelled", "no_availability"].includes(b.status)) return b.status;
  return b.viewed?.includes(merchantId) ? "viewed" : "offered";
}
const text = z.string().trim().min(1).max(120);
const bilingual = z.object({ "en-IN": text, "te-IN": text, "hi-IN": z.string().max(120) });
const coordinate = z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]);
export const addressSchema = z.object({
  id: text,
  customerId: text,
  label: z.enum(["Home", "Work", "Other"]),
  house: text,
  street: text,
  landmark: z.string().max(120),
  localityId: text,
  cityId: text,
  state: z.literal("Andhra Pradesh"),
  pin: z.string().regex(/^[1-9]\d{5}$/),
  instructions: z.string().max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
  confirmedAt: z.number().nonnegative(),
  preferred: z.boolean(),
  consent: z.literal(true),
  mode: z.enum(["demo", "gps"]),
});
export const entitySchemas = {
  cities: z.object({
    id: text,
    names: bilingual,
    status: z.enum(["active", "paused", "coming-soon", "archived"]),
    launch: z.enum(["planned", "future-demo"]),
    center: coordinate,
    fixture: z.literal(true),
  }),
  localities: z.object({
    id: text,
    cityId: text,
    names: bilingual,
    status: z.enum(["active", "paused", "coming-soon", "archived"]),
    center: coordinate,
    fixture: z.literal(true),
  }),
  areas: z.object({
    id: text,
    cityId: text,
    localityId: text,
    serviceIds: z.array(text).max(50),
    active: z.boolean(),
    radiusKm: z.number().positive().max(30),
    center: coordinate,
    fixture: z.literal(true),
  }),
  categories: z.object({ id: text, names: bilingual, archived: z.boolean() }),
  services: z.object({
    id: text,
    categoryId: text,
    pricingCategory: z.enum(["electrician", "plumbing", "ac", "appliance"]),
    names: bilingual,
    description: bilingual,
    cityIds: z.array(text).max(20),
    archived: z.boolean(),
  }),
};
export type Entity = keyof typeof entitySchemas;
export function formattedAddress(
  a: SampleAddress,
  s: DemoState,
  locale: "en-IN" | "te-IN" | "hi-IN",
) {
  return [
    a.house,
    a.street,
    a.landmark,
    s.registry.localities.find((l) => l.id === a.localityId)?.names[locale],
    s.registry.cities.find((c) => c.id === a.cityId)?.names[locale],
    locale === "te-IN" ? "ఆంధ్రప్రదేశ్" : a.state,
    a.pin,
  ]
    .filter(Boolean)
    .join(", ");
}

const placeSeed = registrySeed();
/** Display-only: swap known English city/locality names for the active locale. */
export function placeLabel(text: string, locale: string) {
  if (locale !== "te-IN" || !text) return text;
  let out = text;
  for (const p of [...placeSeed.localities, ...placeSeed.cities].sort(
    (a, b) => b.names["en-IN"].length - a.names["en-IN"].length,
  ))
    out = out.split(p.names["en-IN"]).join(p.names["te-IN"]);
  return out;
}
