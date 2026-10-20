import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageShell, PageTop, Notice, Modal } from "./shared";
import { useDemo } from "./demo-context";
import { useFixHub } from "./context";
import { rolePath } from "./demo-controls";
import { eventLabel } from "./demo-copy";
import { ct, type CommKey } from "./communications-copy";
import {
  preference,
  samplePhone,
  normalizePhone,
  maskPhone,
  initialOtp,
  startDemoVerification,
  checkDemoVerification,
  estimateMessageCost,
  whatsappAllowed,
  demoActionToken,
  events,
  type Template,
  type Delivery,
  type Message,
} from "./communications-model";
const OPTION_TE: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  queued: "క్యూలో ఉంది",
  accepted: "అంగీకరించబడింది",
  sent: "పంపబడింది",
  delivered: "చేరింది",
  read: "చదివారు",
  replied: "జవాబిచ్చారు",
  failed: "విఫలమైంది",
  suppressed: "నిలిపివేయబడింది",
  created: "సృష్టించబడింది",
  offer_reminder: "ఆఫర్ రిమైండర్",
  expired: "గడువు ముగిసింది",
  declined: "తిరస్కరించబడింది",
  closed: "మూసివేయబడింది",
  assigned: "కేటాయించబడింది",
  travel: "ప్రయాణంలో",
  arrived: "చేరుకున్నారు",
  quote: "కోట్",
  completed: "పూర్తయింది",
  cancelled: "రద్దు చేయబడింది",
};
export function PhoneVerification() {
  const demo = useDemo();
  const { locale } = useFixHub();
  const t = (k: CommKey) => ct(k, locale);
  const [persona, setPersona] = useState("sample-c1");
  const [phone, setPhone] = useState("");
  const [sample, setSample] = useState(true);
  const [otp, setOtp] = useState(initialOtp);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(0);
  const [channel, setChannel] = useState("sms");
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const valid = sample || !!normalizePhone(phone);
  const state =
    otp.expiresAt && now >= otp.expiresAt && ["pending", "incorrect"].includes(otp.state)
      ? "expired"
      : otp.state;
  return (
    <section className="min-w-0 space-y-4">
      <h2>{t("verify")}</h2>
      <Notice warning>{t("demoCode")}</Notice>
      <label className="form-label">
        {t("persona")}
        <select
          id="comm-persona"
          className="form-input mt-2"
          value={persona}
          onChange={(e) => {
            setPersona(e.target.value);
            setOtp(initialOtp);
            setCode("");
          }}
        >
          {demo.state.personas
            .filter((p) => !p.deactivated)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.role}
              </option>
            ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={sample}
          onChange={(e) => {
            setSample(e.target.checked);
            setOtp(initialOtp);
            setCode("");
          }}
        />
        {t("sample")}
      </label>
      {sample ? (
        <p>{samplePhone(persona)}</p>
      ) : (
        <label className="form-label">
          {t("phone")}
          <input
            id="comm-phone"
            className="form-input mt-2"
            inputMode="tel"
            autoComplete="off"
            maxLength={24}
            value={phone}
            placeholder="+91"
            onChange={(e) => {
              setPhone(e.target.value);
              setOtp(initialOtp);
              setCode("");
            }}
          />
          {phone && !valid && <span role="alert">{t("required")}</span>}
          <span>{maskPhone(phone)}</span>
        </label>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("status")}>
        <Button
          variant={channel === "sms" ? "default" : "outline"}
          onClick={() => setChannel("sms")}
        >
          SMS · DEMO
        </Button>
        <Button disabled variant="outline" title={t("blocked")}>
          WhatsApp OTP · {t("off")}
        </Button>
      </div>
      <Button
        disabled={!valid || otp.state === "verified"}
        onClick={() => {
          setOtp(startDemoVerification(otp, Date.now()));
          setCode("");
        }}
      >
        {otp.requests ? t("resend") : t("request")}
      </Button>
      <p role="status">
        {t(state as CommKey)}
        {otp.requests > 0 && ` · ${Math.max(0, Math.ceil((otp.cooldownUntil - now) / 1000))}s`}
      </p>
      {otp.requests > 0 && (
        <>
          <label className="form-label">
            {t("code")}
            <input
              className="form-input mt-2"
              id="comm-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={code.length !== 6 || state === "verified" || state === "cancelled"}
              onClick={() => {
                setOtp(checkDemoVerification(otp, code, Date.now()));
                setCode("");
              }}
            >
              {t("check")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOtp({ ...otp, state: "cancelled" });
                setCode("");
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOtp({ ...otp, state: "expired", expiresAt: 1 })}
            >
              {t("expire")}
            </Button>
            <Button variant="outline" onClick={() => setOtp({ ...otp, state: "timeout" })}>
              {t("timeout")}
            </Button>
          </div>
        </>
      )}
      {state === "verified" && (
        <Button asChild onClick={() => demo.login(persona)}>
          <Link
            to={rolePath(demo.state.personas.find((p) => p.id === persona)?.role ?? "customer")}
          >
            {t("continue")}
          </Link>
        </Button>
      )}
    </section>
  );
}
const links = [
  ["/communications", "inbox"],
  ["/communications/verify", "verify"],
  ["/communications/conversation", "conversation"],
  ["/communications/preferences", "preferences"],
  ["/admin/communications", "setup"],
  ["/admin/communications/templates", "templates"],
  ["/admin/communications/logs", "logs"],
  ["/admin/communications/costs", "costs"],
  ["/admin/communications/limits", "limits"],
  ["/admin/communications/consent", "consent"],
] as const;
export function CommunicationsPage({ page = "inbox" }: { page?: string }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const t = (k: CommKey) => ct(k, locale);
  const c = demo.state.communications;
  const admin = demo.persona?.role === "admin";
  const [feedback, setFeedback] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [channel, setChannel] = useState(page === "conversation" ? "whatsapp" : "");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");
  useEffect(() => {
    setChannel(page === "conversation" ? "whatsapp" : "");
    setSelected("");
  }, [page]);
  const [record, setRecord] = useState<Template | null>(null);
  const [confirm, setConfirm] = useState("");
  const [daily, setDaily] = useState(c.dailyCap);
  const [monthly, setMonthly] = useState(c.monthlyCap);
  const [rates, setRates] = useState(c.rates);
  const [text, setText] = useState(
    locale === "te-IN" ? "డెమో ఫిక్స్ హబ్ సేవా సమాచారం" : "DEMO FixHub service update",
  );
  const [purpose, setPurpose] = useState("created");
  const [policySms, setPolicySms] = useState(true);
  const [policyWa, setPolicyWa] = useState(true);
  const p = preference(c, demo.persona?.id ?? "");
  const [sms, setSms] = useState(p.sms);
  const [wa, setWa] = useState(p.whatsapp);
  const [quiet, setQuiet] = useState(p.quiet);
  useEffect(() => {
    setSms(p.sms);
    setWa(p.whatsapp);
    setQuiet(p.quiet);
  }, [demo.persona?.id, p.sms, p.whatsapp, p.quiet]);
  async function act(payload: Record<string, unknown>) {
    const result = await demo.act({ type: "communications", payload });
    setFeedback(
      t(
        result.ok
          ? "saved"
          : result.code === "closed" || result.code === "expired" || result.code === "stale"
            ? "stale"
            : "required",
      ),
    );
    return result;
  }
  const own = c.messages.filter((m) => admin || m.to === demo.persona?.id);
  const rows = own
    .filter(
      (m) =>
        (!city || m.cityId === city) &&
        (!channel || m.channel === channel) &&
        (!status || m.status === status) &&
        `${m.id} ${m.to} ${m.bookingId}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice()
    .reverse();
  const message = rows.find((m) => m.id === selected) ?? rows[0];
  const adminPage = ["setup", "templates", "logs", "costs", "limits", "consent"].includes(page);
  const allowed = page === "verify" || (!!demo.persona && (!adminPage || admin));
  const select = (
    label: CommKey,
    value: string,
    onChange: (v: string) => void,
    options: string[],
  ) => (
    <label className="form-label">
      {t(label)}
      <select className="form-input mt-2" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((v) => (
          <option key={v} value={v}>
            {locale === "te-IN" ? (OPTION_TE[v] ?? v) : v}
          </option>
        ))}
      </select>
    </label>
  );
  function MessageDetail({ m }: { m: Message }) {
    const b = demo.state.bookings.find((b) => b.id === m.bookingId);
    const permitted = whatsappAllowed(c, m, Date.now());
    const notification = demo.state.notifications.find(
      (n) => n.to === m.to && n.bookingId === m.bookingId,
    );
    async function accept(forged = false) {
      if (!b) return;
      const r = await demo.act({
        type: "communications",
        payload: {
          action: "reply",
          recordId: m.id,
          token: forged ? "DEMO-forged" : demoActionToken(m, b.expiresAt),
        },
      });
      if (r.code !== "review_required") {
        setFeedback(t("stale"));
        return;
      }
      const accepted = await demo.act({ type: "accept", bookingId: b.id });
      setFeedback(t(accepted.ok ? "saved" : "stale"));
    }
    return (
      <section className="min-w-0 space-y-4">
        <h2>{page === "conversation" ? t("conversation") : t("status")}</h2>
        <p className="break-words text-sm">{m.id}</p>
        <p>
          {samplePhone(m.to)} · {m.cityId} · {m.channel.toUpperCase()}
        </p>
        <p className="text-sm">
          {eventLabel(
            m.event === "offer_reminder"
              ? "created"
              : m.event === "otp" || m.event === "outage"
                ? "support"
                : m.event,
            locale,
          )}
        </p>
        <div className="border-l-4 border-primary bg-muted p-4">
          <p>
            {locale === "te-IN"
              ? "డెమో ఫిక్స్ హబ్: సేవా అభ్యర్థనలో మార్పు ఉంది. పూర్తి వివరాలు యాప్‌లో చూడండి."
              : "DEMO FixHub: your service request has an update. Review the details in FixHub."}
          </p>
          <p className="mt-2 text-sm">
            {m.bookingId} · {t(m.status)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{t("reply")}</p>
        {b && (
          <p>
            {locale === "te-IN" ? "బుకింగ్ స్థితి" : "Booking state"}:{" "}
            {b.merchantId
              ? locale === "te-IN"
                ? "వ్యాపారి అంగీకరించారు"
                : "merchant accepted"
              : locale === "te-IN"
                ? "స్పందన కోసం వేచి ఉంది"
                : "awaiting response"}
          </p>
        )}
        <p>
          {m.channel === "whatsapp"
            ? `${permitted.ok ? "DEMO OK" : "DEMO BLOCKED"} · ${permitted.reason}`
            : "SMS · DEMO"}
        </p>
        <p className="text-xs">
          {locale === "te-IN"
            ? "నిజమైన సేవా రసీదు లేదు; బుకింగ్ అంగీకారం వేరు."
            : "No provider receipt exists; booking acceptance is separate."}
        </p>
        <div className="flex flex-wrap gap-2">
          {(["accepted", "delivered", "read", "failed", "unknown"] as Delivery[]).map((s) => (
            <Button
              key={s}
              variant="outline"
              disabled={
                demo.busy ||
                m.status === "suppressed" ||
                (m.channel === "whatsapp" && !permitted.ok)
              }
              onClick={() => act({ action: "delivery", recordId: m.id, status: s })}
            >
              {t(s as CommKey)}
            </Button>
          ))}
          {m.status === "failed" && (
            <Button disabled={demo.busy} onClick={() => act({ action: "retry", recordId: m.id })}>
              {t("retry")}
            </Button>
          )}
          {m.channel === "whatsapp" && (
            <Button variant="outline" onClick={() => act({ action: "session", recordId: m.id })}>
              {t("window")}
            </Button>
          )}
        </div>
        {m.channel === "sms" && (
          <Button
            variant="outline"
            onClick={async () => {
              const r = await act({ action: "delivery", recordId: m.id, status: "failed" });
              if (r.ok) {
                const fallback = c.messages.find(
                  (x) =>
                    x.bookingId === m.bookingId &&
                    x.to === m.to &&
                    x.event === m.event &&
                    x.channel === "whatsapp",
                );
                if (fallback && whatsappAllowed(c, fallback, Date.now()).ok) {
                  await act({ action: "delivery", recordId: fallback.id, status: "accepted" });
                  setSelected(fallback.id);
                } else setFeedback(t("blocked"));
              }
            }}
          >
            {t("failure")}
          </Button>
        )}
        {b && (
          <Button asChild variant="outline">
            <Link
              to="/demo/bookings/$id"
              params={{ id: b.id }}
              onClick={() => {
                if (notification) demo.act({ type: "read" });
              }}
            >
              {t("review")}
            </Link>
          </Button>
        )}
        {b && m.channel === "whatsapp" && demo.persona?.role === "merchant" && !b.merchantId && (
          <div className="flex flex-wrap gap-3">
            <Button disabled={demo.busy || !permitted.ok} onClick={() => accept()}>
              {t("accept")}
            </Button>
            <Button variant="outline" onClick={() => accept(true)}>
              {t("invalid")}
            </Button>
          </div>
        )}
      </section>
    );
  }
  const cost = estimateMessageCost(c, "sms", text);
  const waCost = estimateMessageCost(c, "whatsapp", text);
  return (
    <PageShell>
      <main id="main" className="wrap pb-10">
        <PageTop title={t("title")} desc={t("boundary")} />
        <div className="grid gap-6 md:grid-cols-[160px_minmax(0,1fr)]">
          <nav aria-label={t("title")} className="flex flex-wrap gap-1 md:flex-col">
            {links
              .filter(
                ([, k]) =>
                  admin ||
                  !["setup", "templates", "logs", "costs", "limits", "consent"].includes(k),
              )
              .map(([to, k]) => (
                <Button
                  key={to}
                  asChild
                  variant={page === k ? "default" : "ghost"}
                  className="justify-start whitespace-normal"
                >
                  <Link to={to}>{t(k)}</Link>
                </Button>
              ))}
          </nav>
          <section className="min-w-0 space-y-5">
            {!allowed ? (
              <Notice warning>{t("blocked")}</Notice>
            ) : page === "verify" ? (
              <PhoneVerification />
            ) : page === "preferences" ? (
              <>
                <h2>{t("preferences")}</h2>
                {[
                  ["sms", sms, setSms],
                  ["whatsapp", wa, setWa],
                  ["quiet", quiet, setQuiet],
                ].map(([key, value, set]) => (
                  <label key={String(key)} className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-5"
                      checked={Boolean(value)}
                      onChange={(e) => (set as (v: boolean) => void)(e.target.checked)}
                    />
                    {t(key as CommKey)}
                  </label>
                ))}
                <Notice>{t("marketing")}</Notice>
                <Button
                  onClick={() =>
                    act({ action: "preferences", sms, whatsapp: wa, quiet, language: locale })
                  }
                >
                  {t("save")}
                </Button>
              </>
            ) : page === "setup" ? (
              <>
                <h2>Twilio Verify + Programmable Messaging · DEMO</h2>
                <Notice warning>{t("blocked")}</Notice>
                <h3>{t("paid")}</h3>
                <p>
                  {locale === "te-IN"
                    ? "నిజమైన ఖాతా అనుసంధానం లేదు. వాట్సాప్ శాండ్‌బాక్స్, నిజమైన పంపిణీ రెండూ నిలిపివేయబడ్డాయి."
                    : "No account connected. Both WhatsApp sandbox sends and production sends remain disabled."}
                </p>
                <Button asChild variant="outline">
                  <a href="/fixhub-communications-guide.md" download>
                    {t("guide")}
                  </a>
                </Button>
                <Button disabled>{t("paid")}</Button>
              </>
            ) : page === "templates" ? (
              <>
                <h2>{t("templates")}</h2>
                <Button
                  onClick={() =>
                    setRecord({
                      id: "DEMO-new",
                      language: locale === "te-IN" ? "te-IN" : "en-IN",
                      purpose: "created",
                      body: "DEMO FixHub service request update.",
                      approved: false,
                      archived: false,
                    })
                  }
                >
                  {t("new")}
                </Button>
                <div className="grid gap-4 lg:grid-cols-2">
                  {c.templates.map((r) => (
                    <article key={r.id} className="rounded-md border p-4">
                      <h3>{r.id}</h3>
                      <p>{r.body}</p>
                      <p>
                        {r.language} ·{" "}
                        {r.archived ? t("archive") : r.approved ? t("approved") : t("blocked")}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => setRecord({ ...r })}>
                          {t("save")}
                        </Button>
                        <Button variant="outline" onClick={() => setConfirm(r.id)}>
                          {t("archive")}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : page === "costs" ? (
              <>
                <h2>{t("costs")}</h2>
                <Notice warning>{t("unquoted")}</Notice>
                <Notice>{t("notice")}</Notice>
                <label className="form-label">
                  {t("text")}
                  <textarea
                    className="form-input mt-2"
                    maxLength={2000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </label>
                <p>
                  {cost.encoding} · {cost.units} · {cost.segments}{" "}
                  {locale === "te-IN" ? "భాగాలు" : "segments"}
                </p>
                <p>
                  SMS USD {cost.configured ? cost.usd.toFixed(4) : "—"} · WhatsApp USD{" "}
                  {waCost.configured ? waCost.usd.toFixed(4) : "—"} · INR{" "}
                  {cost.configured && cost.inr !== null ? cost.inr.toFixed(2) : "—"}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(rates).map(([key, value]) => (
                    <label key={key} className="form-label">
                      {locale === "te-IN"
                        ? (
                            {
                              smsUsd: "SMS భాగానికి USD",
                              metaUsd: "మెటా నమూనా USD",
                              verifyBaseUsd: "వెరిఫై ఆధార USD",
                              whatsappUsd: "వాట్సాప్ సేవా USD",
                              fx: "USD నుంచి INR అంచనా",
                              taxPercent: "పన్ను శాతం అంచనా",
                            } as Record<string, string>
                          )[key]
                        : (
                            {
                              smsUsd: "SMS per segment · USD hypothesis",
                              metaUsd: "Meta template charge · USD hypothesis",
                              verifyBaseUsd: "Successful Verify base · USD hypothesis",
                              whatsappUsd: "Twilio WhatsApp fee · USD hypothesis",
                              fx: "USD to INR · assumed exchange rate",
                              taxPercent: "Assumed tax percent",
                            } as Record<string, string>
                          )[key]}
                      <input
                        type="number"
                        min="0"
                        max={key === "fx" ? 1000 : 100}
                        step="0.001"
                        className="form-input mt-2"
                        value={value}
                        onChange={(e) => setRates({ ...rates, [key]: Number(e.target.value) })}
                      />
                    </label>
                  ))}
                </div>
                <Button onClick={() => act({ action: "rates", record: rates })}>{t("save")}</Button>
                <p>
                  Verify USD{" "}
                  {estimateMessageCost(c, "sms", text, true).configured
                    ? estimateMessageCost(c, "sms", text, true).usd.toFixed(4)
                    : "—"}{" "}
                  ·{" "}
                  {locale === "te-IN"
                    ? "విజయవంతమైన ధృవీకరణ + మాధ్యమం అంచనా"
                    : "successful verification + channel hypothesis"}
                </p>
                <p>
                  {c.messages.length} DEMO rows ·{" "}
                  {c.messages.filter((m) => m.status === "failed").length} {t("failed")}
                </p>
                {demo.state.registry.cities.map((city) => (
                  <p key={city.id}>
                    {city.names[locale]} · {c.messages.filter((m) => m.cityId === city.id).length}{" "}
                    DEMO
                  </p>
                ))}
              </>
            ) : page === "limits" ? (
              <>
                <h2>{t("limits")}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    [t("daily"), daily, setDaily],
                    [t("monthly"), monthly, setMonthly],
                  ].map(([label, value, set]) => (
                    <label className="form-label" key={String(label)}>
                      {String(label)}
                      <input
                        className="form-input mt-2"
                        type="number"
                        min="0"
                        max="100000"
                        value={Number(value)}
                        onChange={(e) => (set as (v: number) => void)(Number(e.target.value))}
                      />
                    </label>
                  ))}
                </div>
                <Button
                  onClick={() => act({ action: "limits", dailyCap: daily, monthlyCap: monthly })}
                >
                  {t("save")}
                </Button>
                {select("purpose", purpose, setPurpose, events)}
                <label className="flex min-h-11 gap-3">
                  <input
                    type="checkbox"
                    checked={policySms}
                    onChange={(e) => setPolicySms(e.target.checked)}
                  />
                  SMS
                </label>
                <label className="flex min-h-11 gap-3">
                  <input
                    type="checkbox"
                    checked={policyWa}
                    onChange={(e) => setPolicyWa(e.target.checked)}
                  />
                  WhatsApp
                </label>
                <Button
                  onClick={() =>
                    act({
                      action: "policy",
                      record: { event: purpose, sms: policySms, whatsapp: policyWa },
                    })
                  }
                >
                  {t("save")}
                </Button>
                <Notice>{t("paid")}</Notice>
              </>
            ) : page === "consent" ? (
              <>
                <h2>{t("consent")}</h2>
                {Object.entries(c.preferences).map(([id, p]) => (
                  <article key={id} className="border-b py-3">
                    <h3>{samplePhone(id)}</h3>
                    <p>
                      SMS {t(p.sms ? "on" : "off")} · WhatsApp {t(p.whatsapp ? "on" : "off")}
                    </p>
                  </article>
                ))}
                {c.audit
                  .slice()
                  .reverse()
                  .map((r) => (
                    <p className="break-words text-sm" key={r.id}>
                      {r.id} · {r.actor} · {r.action} · {new Date(r.at).toLocaleString(locale)}
                    </p>
                  ))}
              </>
            ) : (
              <>
                <h2>{t(page === "conversation" ? "conversation" : "inbox")}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="form-label">
                    {t("search")}
                    <input
                      className="form-input mt-2"
                      maxLength={100}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  {select("channel" as CommKey, channel, setChannel, ["sms", "whatsapp"])}
                  {select("status", status, setStatus, [
                    "queued",
                    "accepted",
                    "sent",
                    "delivered",
                    "read",
                    "replied",
                    "failed",
                    "suppressed",
                  ])}
                  <label className="form-label">
                    {locale === "te-IN" ? "నగరం" : "City"}
                    <select
                      className="form-input mt-2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option value="">—</option>
                      {demo.state.registry.cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.names[locale]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {!rows.length ? (
                  <Notice>{t("empty")}</Notice>
                ) : (
                  <div className="grid gap-6 md:grid-cols-[minmax(140px,.7fr)_minmax(0,1.3fr)]">
                    <div className="space-y-2 max-h-[650px] overflow-y-auto">
                      {rows.map((m) => (
                        <Button
                          key={m.id}
                          variant={message?.id === m.id ? "default" : "outline"}
                          className="h-auto min-h-14 w-full justify-start whitespace-normal text-left"
                          onClick={() => setSelected(m.id)}
                        >
                          {m.bookingId} · {m.channel} · {t(m.status)}
                        </Button>
                      ))}
                    </div>
                    {message && <MessageDetail m={message} />}
                  </div>
                )}
              </>
            )}
            {feedback && <p role="status">{feedback}</p>}
          </section>
        </div>
      </main>
      <Modal
        open={!!record}
        onOpenChange={(open) => {
          if (!open) setRecord(null);
        }}
        title={t("templates")}
        description={t("boundary")}
      >
        {record && (
          <div className="space-y-4">
            <label className="form-label">
              {t("id")}
              <input
                className="form-input mt-2"
                maxLength={100}
                value={record.id}
                onChange={(e) => setRecord({ ...record, id: e.target.value })}
              />
            </label>
            <label className="form-label">
              {t("body")}
              <textarea
                className="form-input mt-2"
                maxLength={1000}
                value={record.body}
                onChange={(e) => setRecord({ ...record, body: e.target.value })}
              />
            </label>
            {select(
              "language",
              record.language,
              (v) => setRecord({ ...record, language: v === "te-IN" ? "te-IN" : "en-IN" }),
              ["en-IN", "te-IN"],
            )}
            {select(
              "purpose",
              record.purpose,
              (v) => setRecord({ ...record, purpose: v as Template["purpose"] }),
              events,
            )}
            <label className="flex min-h-11 gap-3">
              <input
                type="checkbox"
                checked={record.approved}
                onChange={(e) => setRecord({ ...record, approved: e.target.checked })}
              />
              {t("approved")}
            </label>
            <Button
              onClick={async () => {
                const r = await act({ action: "template", record });
                if (r.ok) setRecord(null);
              }}
            >
              {t("save")}
            </Button>
          </div>
        )}
      </Modal>
      <Modal
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm("");
        }}
        title={t("archive")}
        description={t("boundary")}
      >
        <Button
          onClick={async () => {
            await act({ action: "delete_template", recordId: confirm });
            setConfirm("");
          }}
        >
          {t("archive")}
        </Button>
      </Modal>
    </PageShell>
  );
}
