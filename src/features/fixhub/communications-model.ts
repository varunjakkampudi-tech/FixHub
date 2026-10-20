import { z } from "zod";
import type { DemoState, Notification } from "./demo-model";
export type Channel = "sms" | "whatsapp";
export type Delivery =
  | "queued"
  | "accepted"
  | "sent"
  | "delivered"
  | "read"
  | "replied"
  | "failed"
  | "unknown"
  | "suppressed";
export type CommEvent = Notification["event"] | "offer_reminder" | "otp" | "outage";
export type Preference = {
  sms: boolean;
  whatsapp: boolean;
  marketing: false;
  quiet: boolean;
  updatedAt: number;
  language?: "en-IN" | "te-IN";
};
export type Message = {
  id: string;
  to: string;
  channel: Channel;
  event: CommEvent;
  bookingId: string;
  cityId: string;
  language: "en-IN" | "te-IN";
  status: Delivery;
  attempts: number;
  at: number;
  providerReceipt: null;
  error: string;
  templateId: string;
  sessionUntil: number;
};
export type Template = {
  id: string;
  language: "en-IN" | "te-IN";
  purpose: CommEvent;
  body: string;
  approved: boolean;
  archived: boolean;
};
export type CommState = {
  schema: 1;
  preferences: Record<string, Preference>;
  messages: Message[];
  templates: Template[];
  audit: { id: string; actor: string; action: string; at: number }[];
  dailyCap: number;
  monthlyCap: number;
  paidEnabled: false;
  mode: "demo";
  rates: {
    smsUsd: number;
    metaUsd: number;
    verifyBaseUsd: number;
    whatsappUsd: number;
    fx: number;
    taxPercent: number;
  };
  policy: Record<string, { sms: boolean; whatsapp: boolean }>;
  deadLetters: string[];
};
export const events: CommEvent[] = [
  "otp",
  "created",
  "offer_reminder",
  "expired",
  "accepted",
  "declined",
  "closed",
  "assigned",
  "travel",
  "arrived",
  "rescheduled",
  "inspection",
  "quoted",
  "approved",
  "rejected",
  "started",
  "complete",
  "cancelled",
  "disputed",
  "support",
  "outage",
  "no_availability",
];
export function communicationsSeed(): CommState {
  return {
    schema: 1,
    preferences: {},
    messages: [],
    audit: [],
    dailyCap: 50,
    monthlyCap: 500,
    paidEnabled: false,
    mode: "demo",
    rates: { smsUsd: 0, metaUsd: 0, verifyBaseUsd: 0, whatsappUsd: 0, fx: 0, taxPercent: 0 },
    policy: {},
    deadLetters: [],
    templates: events.flatMap((purpose) =>
      (["en-IN", "te-IN"] as const).map((language) => ({
        id: `DEMO-${purpose}-${language}`,
        language,
        purpose,
        body:
          language === "en-IN"
            ? "DEMO FixHub: your service request has an update. Review it in FixHub."
            : "డెమో ఫిక్స్ హబ్: మీ సేవా అభ్యర్థనలో మార్పు ఉంది. ఫిక్స్ హబ్‌లో చూడండి.",
        approved: true,
        archived: false,
      })),
    ),
  };
}
export function preference(c: CommState, id: string): Preference {
  return (
    c.preferences[id] ?? {
      sms: false,
      whatsapp: false,
      marketing: false,
      quiet: false,
      updatedAt: 0,
    }
  );
}
// Fictional tokens deliberately cannot be interpreted as deliverable phone numbers.
export function samplePhone(id: string) {
  return `+91 DEMO ${id.replace("sample-", "").toUpperCase()}`;
}
export function normalizePhone(input: string) {
  const s = input.trim().replace(/[\s()-]/g, "");
  const v = /^\d{10}$/.test(s) ? `+91${s}` : s;
  return /^\+[1-9]\d{7,14}$/.test(v) ? v : null;
}
export function maskPhone(input: string) {
  const n = normalizePhone(input);
  return n
    ? `${n.startsWith("+91") ? "+91" : n.slice(0, 3)} •••••• ${n.slice(-2)}`
    : "+91 DEMO ••••";
}
export type Otp = {
  state:
    | "idle"
    | "pending"
    | "verified"
    | "incorrect"
    | "expired"
    | "cancelled"
    | "timeout"
    | "rate_limited";
  requestedAt: number;
  expiresAt: number;
  requests: number;
  attempts: number;
  cooldownUntil: number;
};
export const initialOtp: Otp = {
  state: "idle",
  requestedAt: 0,
  expiresAt: 0,
  requests: 0,
  attempts: 0,
  cooldownUntil: 0,
};
export function startDemoVerification(old: Otp, now: number): Otp {
  if (now < old.cooldownUntil || old.requests >= 3) return { ...old, state: "rate_limited" };
  return {
    state: "pending",
    requestedAt: now,
    expiresAt: now + 120000,
    requests: old.requests + 1,
    attempts: 0,
    cooldownUntil: now + 30000,
  };
}
export function checkDemoVerification(old: Otp, code: string, now: number): Otp {
  if (
    ["cancelled", "timeout", "verified", "idle", "rate_limited"].includes(old.state) ||
    !old.expiresAt
  )
    return old;
  if (now >= old.expiresAt) return { ...old, state: "expired" };
  if (old.attempts >= 5) return { ...old, state: "rate_limited" };
  return {
    ...old,
    state: code === "000000" ? "verified" : "incorrect",
    attempts: old.attempts + 1,
  };
}
// GSM-7 includes the extension table; extension characters consume two septets.
const basic =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const extension = "^{}\\[~]|€";
export function smsSegments(text: string) {
  const gsm = [...text].every((x) => basic.includes(x) || extension.includes(x));
  const units = gsm
    ? [...text].reduce((n, c) => n + (extension.includes(c) ? 2 : 1), 0)
    : text.length;
  const single = gsm ? 160 : 70,
    multi = gsm ? 153 : 67;
  return {
    encoding: gsm ? "GSM-7" : "Unicode",
    units,
    segments: units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi),
  };
}
export function estimateMessageCost(c: CommState, channel: Channel, text: string, verify = false) {
  const segment = smsSegments(text);
  const channelFee =
    channel === "sms" ? segment.segments * c.rates.smsUsd : c.rates.whatsappUsd + c.rates.metaUsd;
  const configured = channel === "sms" ? c.rates.smsUsd > 0 : c.rates.whatsappUsd > 0;
  const usd = channelFee + (verify ? c.rates.verifyBaseUsd : 0);
  return {
    ...segment,
    configured: configured && (!verify || c.rates.verifyBaseUsd > 0),
    usd,
    inr:
      c.rates.fx > 0
        ? Math.round(usd * c.rates.fx * (1 + c.rates.taxPercent / 100) * 100) / 100
        : null,
  };
}
export function enqueueNotification(s: DemoState, n: Notification) {
  const c = s.communications;
  const pref = preference(c, n.to);
  const booking = s.bookings.find((b) => b.id === n.bookingId);
  const policy = c.policy[n.event] ?? { sms: true, whatsapp: true };
  for (const channel of ["whatsapp", "sms"] as const) {
    const id = `DEMO-message-${n.id}-${channel}`;
    if (c.messages.some((m) => m.id === id)) continue;
    const allowed = pref[channel] && policy[channel];
    const day = c.messages.filter(
      (m) => m.to === n.to && m.at >= n.at - 86400000 && m.status !== "suppressed",
    ).length;
    const month = c.messages.filter(
      (m) => m.at >= n.at - 30 * 86400000 && m.status !== "suppressed",
    ).length;
    const template = c.templates.find(
      (t) =>
        t.language === (pref.language ?? "en-IN") &&
        t.purpose === n.event &&
        !t.archived &&
        t.approved,
    );
    c.messages.push({
      id,
      to: n.to,
      channel,
      event: n.event,
      bookingId: n.bookingId,
      cityId: booking?.cityId ?? "tanuku",
      language: pref.language ?? "en-IN",
      status:
        !allowed || pref.quiet || day >= c.dailyCap || month >= c.monthlyCap
          ? "suppressed"
          : "queued",
      error: !allowed
        ? "consent"
        : pref.quiet
          ? "quiet"
          : day >= c.dailyCap || month >= c.monthlyCap
            ? "limit"
            : "",
      attempts: 0,
      at: n.at,
      providerReceipt: null,
      templateId: channel === "whatsapp" ? (template?.id ?? "") : "",
      sessionUntil: 0,
    });
  }
}
const payloadSchema = z.object({
  language: z.enum(["en-IN", "te-IN"]).optional(),
  action: z.enum([
    "preferences",
    "delivery",
    "retry",
    "session",
    "template",
    "delete_template",
    "limits",
    "policy",
    "rates",
    "reply",
  ]),
  recordId: z.string().max(160).optional(),
  status: z
    .enum(["accepted", "sent", "delivered", "read", "replied", "failed", "unknown"])
    .optional(),
  sms: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  quiet: z.boolean().optional(),
  dailyCap: z.number().int().min(0).max(10000).optional(),
  monthlyCap: z.number().int().min(0).max(100000).optional(),
  record: z.unknown().optional(),
  token: z.string().max(200).optional(),
});
export function mutateCommunications(
  s: DemoState,
  actorId: string,
  payload: Record<string, unknown>,
  now: number,
) {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) return "required";
  const p = parsed.data;
  const actor = s.personas.find((x) => x.id === actorId);
  if (!actor) return "session";
  const c = s.communications;
  const admin = actor.role === "admin";
  const m = c.messages.find((x) => x.id === p.recordId);
  if (p.action === "preferences") {
    c.preferences[actorId] = {
      sms: p.sms ?? false,
      whatsapp: p.whatsapp ?? false,
      marketing: false,
      quiet: p.quiet ?? false,
      updatedAt: now,
      ...(p.language ? { language: p.language } : {}),
    };
    c.messages
      .filter(
        (m) =>
          m.to === actorId &&
          m.status === "queued" &&
          (!preference(c, actorId)[m.channel] || p.quiet),
      )
      .forEach((m) => {
        m.status = "suppressed";
        m.error = "consent";
      });
  } else if (["delivery", "retry", "session", "reply"].includes(p.action)) {
    if (!m) return "not_found";
    if (!admin && m.to !== actorId) return "permission";
    if (p.action === "delivery") {
      if (!p.status || m.status === "suppressed") return "status";
      if (!preference(c, m.to)[m.channel]) return "consent";
      if (m.channel === "whatsapp" && !whatsappAllowed(c, m, now).ok) return "template_required";
      const ranks: Partial<Record<Delivery, number>> = {
        queued: 0,
        accepted: 1,
        sent: 2,
        delivered: 3,
        read: 4,
        replied: 5,
      };
      // Late failure/unknown callbacks cannot erase a confirmed delivery or reply.
      if (
        (["failed", "unknown"].includes(p.status) && (ranks[m.status] ?? -1) >= 3) ||
        (!["failed", "unknown"].includes(p.status) &&
          (ranks[p.status] ?? -1) < (ranks[m.status] ?? -1))
      )
        return "stale";
      if (m.status === "failed") return "status";
      m.status = p.status;
      m.attempts = Math.max(1, m.attempts);
      m.error = p.status === "failed" ? "DEMO delivery failure" : "";
      if (p.status === "failed") c.deadLetters.push(m.id);
    } else if (p.action === "retry") {
      if (m.status !== "failed" || m.attempts >= 3) return "rate_limited";
      if (!preference(c, m.to)[m.channel]) return "consent";
      if (preference(c, m.to).quiet || !(c.policy[m.event]?.[m.channel] ?? true)) return "policy";
      m.status = "queued";
      m.error = "";
      m.attempts++;
      c.deadLetters = c.deadLetters.filter((id) => id !== m.id);
    } else if (p.action === "session") {
      m.sessionUntil = now + 86400000;
    } else {
      if (m.channel !== "whatsapp" || m.to !== actorId) return "permission";
      const b = s.bookings.find((x) => x.id === m.bookingId);
      if (!b || actor.role !== "merchant" || !b.offers.includes(actor.merchantId ?? ""))
        return "permission";
      if (now > b.expiresAt || p.token !== demoActionToken(m, b.expiresAt)) return "expired";
      if (b.merchantId) return "closed";
      return "review_required";
    }
  } else {
    if (!admin) return "permission";
    if (p.action === "limits") {
      c.dailyCap = p.dailyCap ?? c.dailyCap;
      c.monthlyCap = p.monthlyCap ?? c.monthlyCap;
    }
    if (p.action === "template") {
      const r = z
        .object({
          id: z
            .string()
            .regex(/^DEMO-[a-zA-Z0-9_-]+$/)
            .max(100),
          language: z.enum(["en-IN", "te-IN"]),
          purpose: z.enum(events as [CommEvent, ...CommEvent[]]),
          body: z.string().trim().min(10).max(1000),
          approved: z.boolean(),
          archived: z.boolean(),
        })
        .safeParse(p.record);
      if (!r.success) return "required";
      const index = c.templates.findIndex((t) => t.id === r.data.id);
      if (index < 0) c.templates.push(r.data);
      else c.templates[index] = r.data;
    }
    if (p.action === "delete_template") {
      const index = c.templates.findIndex((t) => t.id === p.recordId);
      if (index < 0) return "not_found";
      if (c.messages.some((m) => m.templateId === p.recordId)) {
        const t = c.templates[index];
        if (t) t.archived = true;
      } else c.templates.splice(index, 1);
    }
    if (p.action === "rates") {
      const r = z
        .object({
          smsUsd: z.number().min(0).max(100),
          metaUsd: z.number().min(0).max(100),
          verifyBaseUsd: z.number().min(0).max(100),
          whatsappUsd: z.number().min(0).max(100),
          fx: z.number().min(0).max(1000),
          taxPercent: z.number().min(0).max(100),
        })
        .safeParse(p.record);
      if (!r.success) return "required";
      c.rates = r.data;
    }
    if (p.action === "policy") {
      const r = z
        .object({
          event: z.enum(events as [CommEvent, ...CommEvent[]]),
          sms: z.boolean(),
          whatsapp: z.boolean(),
        })
        .safeParse(p.record);
      if (!r.success) return "required";
      c.policy[r.data.event] = { sms: r.data.sms, whatsapp: r.data.whatsapp };
    }
  }
  c.audit.push({
    id: `DEMO-comm-audit-${c.audit.length + 1}`,
    actor: actorId,
    action: p.action,
    at: now,
  });
  return "ok";
}
export function demoActionToken(m: Message, expiry: number) {
  return `DEMO-only:${m.id}:${m.to}:${expiry}`;
}
export function whatsappAllowed(c: CommState, m: Message, now: number) {
  if (!preference(c, m.to).whatsapp) return { ok: false, reason: "consent" };
  if (m.sessionUntil > now) return { ok: true, reason: "session" };
  const t = c.templates.find(
    (t) =>
      t.id === m.templateId && t.language === m.language && t.purpose === m.event && !t.archived,
  );
  return { ok: !!t?.approved, reason: t?.approved ? "template" : "template_required" };
}
export interface MessagingProvider {
  startPhoneVerification(input: {
    phone: string;
    channel: "sms" | "whatsapp";
  }): Promise<{ status: "pending" | "blocked" }>;
  checkPhoneVerification(input: {
    phone: string;
    code: string;
  }): Promise<{ status: "approved" | "blocked" }>;
  sendSms(input: { to: string; body: string }): Promise<{ status: "blocked" }>;
  sendWhatsAppTemplate(input: { to: string; contentSid: string }): Promise<{ status: "blocked" }>;
  sendWhatsAppSessionReply(input: { to: string; body: string }): Promise<{ status: "blocked" }>;
  handleInboundWhatsApp(input: unknown): Promise<{ status: "blocked" }>;
  handleTwilioStatusCallback(input: unknown): Promise<{ status: "blocked" }>;
  getMessageStatus(id: string): Promise<{ status: "blocked" }>;
  estimateMessageCost(text: string): ReturnType<typeof smsSegments>;
}
