import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell, PageTop, Notice, Modal } from "./shared";
import { useDemo } from "./demo-context";
import { useFixHub } from "./context";
import { dt, type DemoKey, categoryLabel, eventLabel, statusLabel } from "./demo-copy";
import { PriceBreakdown } from "./demo-price";
import {
  calculate,
  money,
  categoriesDemo,
  fifthExample,
  type Booking,
  type Role,
  type Rates,
  type Category,
  type Command,
  type Status,
} from "./demo-model";
import { rolePath } from "./demo-controls";
import { formattedAddress, offerState, placeLabel } from "./location-model";
import { lt } from "./location-copy";
import { canOpenAssignedDirections, googleMapsDirectionsUrl } from "./map-adapter";
const scenarioOptions: [string, DemoKey][] = [
  ["normal", "normal"],
  ["decline", "declineScenario"],
  ["competition", "competition"],
  ["no-availability", "noAvailability"],
  ["capacity", "capacity"],
  ["quote-increase", "quoteIncrease"],
  ["duplicate", "duplicate"],
  ["timeout", "timeout"],
  ["offline", "offline"],
  ["status-error", "statusError"],
  ["expiry", "expiryScenario"],
];
export function DemoPage() {
  const demo = useDemo();
  const { locale } = useFixHub();
  const d = (k: DemoKey) => dt(k, locale);
  const [scenario, setScenario] = useState("normal");
  const [confirm, setConfirm] = useState(false);
  return (
    <PageShell>
      <main id="main" className="wrap pb-10">
        <PageTop
          title={locale === "te-IN" ? "పూర్తి డెమో సేవా ప్రయాణం" : "End-to-End Demo"}
          desc={d("boundary")}
        />
        <div className="content-grid">
          <section>
            <h2>{d("signin")}</h2>
            <div className="demo-personas">
              {demo.state.personas
                .filter((p) => !p.deactivated)
                .map((p) => (
                  <Button
                    key={p.id}
                    variant={demo.persona?.id === p.id ? "default" : "outline"}
                    asChild
                    onClick={() => demo.login(p.id)}
                  >
                    <Link to={rolePath(p.role)}>
                      {p.name} · {d(p.role)}
                    </Link>
                  </Button>
                ))}
            </div>
            <h2 className="mt-8">{d("scenario")}</h2>
            <label htmlFor="demo-scenario" className="form-label">
              {d("scenario")}
            </label>
            <select
              id="demo-scenario"
              className="form-input"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            >
              {scenarioOptions.map(([value, key]) => (
                <option key={value} value={value}>
                  {d(key)}
                </option>
              ))}
            </select>
            <p className="my-3 text-sm">{d("scenarioHelp")}</p>
            <Button variant="outline" onClick={() => setConfirm(true)}>
              {d("reset")}
            </Button>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/customer/addresses">{lt("addresses", locale)}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/admin/cities">{lt("cities", locale)}</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="/fixhub-demo-guide.md" download>
                  {locale === "te-IN"
                    ? "డెమో మార్గదర్శిని, పరీక్షల నివేదిక"
                    : "Demo guide and test report"}
                </a>
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/communications/verify">
                  {locale === "te-IN" ? "డెమో ఫోన్ ధృవీకరణ" : "Demo phone verification"}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/communications/conversation">
                  {locale === "te-IN" ? "డెమో వాట్సాప్ సంభాషణ" : "Demo WhatsApp conversation"}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/communications/preferences">
                  {locale === "te-IN" ? "సందేశ అనుమతులు" : "Channel consent"}
                </Link>
              </Button>
            </div>
            <Notice>{d("remaining")}</Notice>
          </section>
          <aside className="summary-panel">
            <h2>{locale === "te-IN" ? "ఐదు నమూనా ధరలు" : "Five illustrative prices"}</h2>
            {[
              ...categoriesDemo.map((c) => ({
                label: categoryLabel(c, locale),
                rates: demo.state.policy[c],
              })),
              {
                label:
                  locale === "te-IN" ? "ప్లంబింగ్ · డెమో తగ్గింపు" : "Plumbing · demo discount",
                rates: fifthExample,
              },
            ].map((p, i) => (
              <div className="demo-price-row" key={i}>
                <span>{p.label}</span>
                <strong>{money(calculate(p.rates).total, locale)}</strong>
              </div>
            ))}
            <p>{d("priceNotice")}</p>
            <Button asChild variant="outline">
              <Link to="/admin/pricing">{d("policy")}</Link>
            </Button>
          </aside>
        </div>
        <Modal
          open={confirm}
          onOpenChange={setConfirm}
          title={d("reset")}
          description={d("scenarioHelp")}
        >
          <Button
            onClick={async () => {
              await demo.reset(scenario);
              setConfirm(false);
            }}
          >
            {d("reset")}
          </Button>
        </Modal>
      </main>
    </PageShell>
  );
}
export function DemoAuth({ mode = "sign-in" }: { mode?: string }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const navigate = useNavigate();
  const d = (k: DemoKey) => dt(k, locale);
  const [selected, setSelected] = useState("sample-c1");
  const [alias, setAlias] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const denied = mode.includes("denied") || mode.includes("suspended") || mode.includes("pending");
  const expired = mode.includes("expired");
  useEffect(() => {
    if (expired) demo.logout();
  }, [mode]);
  const otp = mode.includes("otp") || mode.includes("verification") || stage === 1;
  const recovery = mode.includes("password");
  const register = mode.includes("register") || mode.includes("sign-up");
  return (
    <PageShell>
      <main id="main" className="wrap">
        <div className="mx-auto max-w-lg pb-10">
          <PageTop
            title={d(
              denied
                ? "denied"
                : expired
                  ? "sessionExpired"
                  : recovery
                    ? mode.includes("reset")
                      ? "resetPassword"
                      : "forgot"
                    : register
                      ? "register"
                      : "signin",
            )}
            desc={d("registrationNotice")}
          />
          {demo.persona && (
            <Notice>
              {demo.persona.name} · {d(demo.persona.role)}
            </Notice>
          )}
          {denied ? (
            <Notice warning>{d("permission")}</Notice>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                if (otp) {
                  if (code !== "000000") {
                    setError(d("required"));
                    return;
                  }
                  demo.login(selected);
                  const p = demo.state.personas.find((p) => p.id === selected);
                  if (p) navigate({ to: rolePath(p.role) });
                } else if (recovery) {
                  if (!alias.trim()) {
                    setError(d("required"));
                    return;
                  }
                  setStage(2);
                } else if (register) {
                  if (!alias.trim()) {
                    setError(d("required"));
                    return;
                  }
                  setStage(1);
                } else {
                  demo.login(selected);
                  const p = demo.state.personas.find((p) => p.id === selected);
                  if (p) navigate({ to: rolePath(p.role) });
                }
              }}
            >
              {!recovery && (
                <div className="form-group">
                  <label htmlFor="auth-persona" className="form-label">
                    {d("signin")}
                  </label>
                  <select
                    id="auth-persona"
                    className="form-input"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {demo.state.personas
                      .filter((p) => !p.deactivated)
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name} · {d(p.role)}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              {(register || recovery) && !otp && (
                <div className="form-group">
                  <label htmlFor="fictional-alias" className="form-label">
                    {d("displayName")}
                  </label>
                  <input
                    id="fictional-alias"
                    className="form-input"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    autoComplete="off"
                    maxLength={60}
                  />
                </div>
              )}
              {recovery && <Notice>{d("recoveryNotice")}</Notice>}
              {otp && (
                <div className="form-group">
                  <Button asChild variant="outline">
                    <Link to="/communications/verify">
                      {locale === "te-IN"
                        ? "వివరణాత్మక డెమో ఫోన్ ధృవీకరణ"
                        : "Detailed DEMO phone verification"}
                    </Link>
                  </Button>
                  <label htmlFor="mock-otp" className="form-label">
                    {d("otp")}
                  </label>
                  <input
                    id="mock-otp"
                    className="form-input"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
              )}
              {error && (
                <div role="alert">
                  <Notice error>{error}</Notice>
                </div>
              )}
              {stage === 2 ? (
                <Notice>
                  {d("recoveryNotice")} · {d("ok")}
                </Notice>
              ) : (
                <Button type="submit" className="w-full">
                  {d(otp ? "verify" : "continue")}
                </Button>
              )}
              <div className="demo-action-row">
                <Button asChild variant="ghost">
                  <Link to="/register">{d("register")}</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/forgot-password">{d("forgot")}</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/reset-password">{d("resetPassword")}</Link>
                </Button>
              </div>
            </form>
          )}
          <Button asChild variant="outline">
            <Link to="/demo">{d("switcher")}</Link>
          </Button>
          {demo.persona && (
            <Button
              variant="ghost"
              onClick={() => {
                demo.logout();
                navigate({ to: "/sign-in" });
              }}
            >
              {d("signout")}
            </Button>
          )}
        </div>
      </main>
    </PageShell>
  );
}
function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const { persona } = useDemo();
  const { locale } = useFixHub();
  if (!persona || !(persona.role === role || (role === "admin" && persona.role === "operations")))
    return (
      <>
        <PageTop title={dt("signin", locale)} />
        <Notice warning>{dt("permission", locale)}</Notice>
        <Button asChild>
          <Link to="/sign-in">{dt("signin", locale)}</Link>
        </Button>
      </>
    );
  return <>{children}</>;
}
export function DemoNotifications({ showTitle = true }: { showTitle?: boolean }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const notes = demo.state.notifications.filter((n) => n.to === demo.persona?.id);
  return (
    <>
      {showTitle && <PageTop title={dt("notifications", locale)} />}
      <Button disabled={demo.busy || !demo.persona} onClick={() => demo.act({ type: "read" })}>
        {dt("read", locale)}
      </Button>
      <ul className="demo-notifications">
        {notes
          .slice()
          .reverse()
          .map((n) => (
            <li className={n.read ? "" : "unread"} key={n.id}>
              <strong>{eventLabel(n.event, locale)}</strong>
              <time>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(n.at)}
              </time>
              {n.bookingId && (
                <Link to="/demo/bookings/$id" params={{ id: n.bookingId }}>
                  {n.bookingId} · {dt("view", locale)}
                </Link>
              )}
            </li>
          ))}
      </ul>
      {!notes.length && <p>{dt("empty", locale)}</p>}
    </>
  );
}
export function DemoBookingDetail({ booking }: { booking: Booking }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const d = (k: DemoKey) => dt(k, locale);
  const [labor, setLabor] = useState(String((booking.quote ?? booking.estimate).labor));
  const [parts, setParts] = useState(String((booking.quote ?? booking.estimate).parts));
  const [tech, setTech] = useState(
    demo.state.personas.find((t) => t.role === "technician" && t.merchantId === booking.merchantId)
      ?.id ?? "",
  );
  const [issue, setIssue] = useState("");
  const [date, setDate] = useState(booking.date);
  const [confirm, setConfirm] = useState(false);
  const [action, setAction] = useState<Command["type"]>("cancel");
  const owner = booking.customerId === demo.persona?.id;
  const merchant = demo.persona?.role === "merchant";
  const myMerchant = merchant && booking.merchantId === demo.persona?.merchantId;
  const technician = demo.persona?.id === booking.technicianId;
  const ops = demo.persona?.role === "admin" || demo.persona?.role === "operations";
  const offered = merchant && booking.offers.includes(demo.persona?.merchantId ?? "");
  const pending =
    !booking.merchantId &&
    ["awaiting_response", "matching"].includes(booking.status) &&
    booking.expiresAt > Date.now() &&
    !booking.declined.includes(demo.persona?.merchantId ?? "");
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  const call = (type: Command["type"], payload: Record<string, unknown> = {}) =>
    demo.act({ type, bookingId: booking.id, payload });
  const next: Record<string, Status> = {
    scheduled: "travel",
    travel: "arrived",
    arrived: "inspection",
    approved: "in_progress",
    in_progress: "complete",
  };
  const visible = owner || myMerchant || offered || technician || ops;
  if (!visible) return <Notice warning>{d("permission")}</Notice>;
  return (
    <div className="content-grid demo-booking-detail">
      <section>
        <span className="status">
          {offered && !myMerchant
            ? lt(
                offerState(booking, demo.persona?.merchantId ?? "") as
                  | "closed"
                  | "offered"
                  | "viewed"
                  | "declined"
                  | "expired"
                  | "cancelled"
                  | "no_availability",
                locale,
              )
            : statusLabel(booking.status, locale)}{" "}
          · DEMO
        </span>
        <h2 className="mt-4">
          {booking.id} · {categoryLabel(booking.category, locale)}
        </h2>
        <p className="text-xs my-3">{lt("private", locale)}</p>
        {booking.location &&
          (owner || myMerchant || technician || demo.persona?.role === "admin") && (
            <div className="my-4">
              <strong>{lt("address", locale)}</strong>
              <p>{formattedAddress(booking.location, demo.state, locale)}</p>
              <p>
                {booking.location.lat}, {booking.location.lng} · SAMPLE
              </p>
              {canOpenAssignedDirections(booking, demo.persona) && (
                <div className="mt-3">
                  <Button asChild variant="outline">
                    <a
                      href={googleMapsDirectionsUrl(booking.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {dt("openDirections", locale)}
                    </a>
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {dt("directionsPrivacy", locale)}
                  </p>
                </div>
              )}
            </div>
          )}
        {offered && !booking.viewed?.includes(demo.persona?.merchantId ?? "") && (
          <Button variant="outline" onClick={() => call("view")}>
            {lt("viewedAction", locale)}
          </Button>
        )}
        <dl className="demo-details">
          <div>
            <dt>{d("zone")}</dt>
            <dd>{booking.zone} · SAMPLE</dd>
          </div>
          <div>
            <dt>{d("date")}</dt>
            <dd>
              {booking.date} ·{" "}
              {booking.slot === "morning"
                ? locale === "te-IN"
                  ? "ఉదయం"
                  : "Morning"
                : booking.slot === "afternoon"
                  ? locale === "te-IN"
                    ? "మధ్యాహ్నం"
                    : "Afternoon"
                  : locale === "te-IN"
                    ? "సాయంత్రం"
                    : "Evening"}
            </dd>
          </div>
          <div>
            <dt>{d("problem")}</dt>
            <dd>{booking.problem}</dd>
          </div>
          {booking.merchantId && (!merchant || myMerchant) && (
            <div>
              <dt>{d("merchant")}</dt>
              <dd>{demo.state.merchants.find((m) => m.id === booking.merchantId)?.name}</dd>
            </div>
          )}
          {booking.technicianId && (!merchant || myMerchant) && (
            <div>
              <dt>{d("technician")}</dt>
              <dd>{demo.state.personas.find((p) => p.id === booking.technicianId)?.name}</dd>
            </div>
          )}
        </dl>
        {offered && !booking.merchantId && (
          <p>
            {d("expiry")}:{" "}
            {new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(booking.expiresAt)}
          </p>
        )}
        {offered && !myMerchant && !pending && <Notice warning>{d("closed")}</Notice>}
        {offered && booking.merchantId && !myMerchant && (
          <Button variant="outline" disabled={demo.busy} onClick={() => call("accept")}>
            {locale === "te-IN" ? "పాత అంగీకారాన్ని పరీక్షించండి" : "Test stale acceptance"}
          </Button>
        )}
        {offered && !booking.merchantId && booking.expiresAt <= clock && (
          <Notice warning>{d("expired")}</Notice>
        )}
        {offered && pending && (
          <div className="demo-action-row">
            <Button disabled={demo.busy} onClick={() => call("accept")}>
              {d("accept")}
            </Button>
            <Button variant="outline" disabled={demo.busy} onClick={() => call("decline")}>
              {d("decline")}
            </Button>
          </div>
        )}
        {myMerchant && ["accepted", "scheduled"].includes(booking.status) && (
          <div className="form-group">
            <label htmlFor="assign-technician" className="form-label">
              {d("team")}
            </label>
            <select
              id="assign-technician"
              className="form-input"
              value={tech}
              onChange={(e) => setTech(e.target.value)}
            >
              <option value="">—</option>
              {demo.state.personas
                .filter(
                  (p) =>
                    p.role === "technician" &&
                    p.merchantId === booking.merchantId &&
                    !p.deactivated &&
                    !p.unavailable,
                )
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <Button
              disabled={demo.busy || !tech}
              onClick={() => call("assign", { technicianId: tech })}
            >
              {d("assign")}
            </Button>
          </div>
        )}
        {technician && next[booking.status] && (
          <Button
            className="demo-status-action"
            disabled={demo.busy}
            onClick={() => call("status", { status: next[booking.status] })}
          >
            {statusLabel(next[booking.status] ?? "travel", locale)}
          </Button>
        )}
        {(technician || myMerchant) &&
          ["inspection", "awaiting_quote", "quote_rejected", "approved"].includes(
            booking.status,
          ) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                call("quote", { labor: Number(labor), parts: Number(parts) });
              }}
            >
              <h3 className="my-4">{d("quote")}</h3>
              <div className="demo-form-pair">
                <label className="form-label">
                  {d("labor")}
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={labor}
                    onChange={(e) => setLabor(e.target.value)}
                  />
                </label>
                <label className="form-label">
                  {d("parts")}
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={parts}
                    onChange={(e) => setParts(e.target.value)}
                  />
                </label>
              </div>
              <Notice warning>{d("confirmed")}</Notice>
              <Button type="submit" disabled={demo.busy}>
                {d("quote")}
              </Button>
            </form>
          )}
        {owner && booking.status === "awaiting_quote" && (
          <div className="demo-action-row">
            <Button
              disabled={demo.busy}
              onClick={() => {
                setAction("approve");
                setConfirm(true);
              }}
            >
              {d("approve")}
            </Button>
            <Button
              variant="outline"
              disabled={demo.busy}
              onClick={() => call("reject", { quoteVersion: booking.quoteVersion })}
            >
              {d("reject")}
            </Button>
          </div>
        )}
        {owner &&
          ["no_availability", "expired", "matching", "awaiting_response"].includes(
            booking.status,
          ) && (
            <div className="form-group">
              <label htmlFor="demo-reschedule" className="form-label">
                {d("date")}
              </label>
              <input
                id="demo-reschedule"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={demo.busy}
                onClick={() => call("reschedule", { date })}
              >
                {d("reschedule")}
              </Button>
            </div>
          )}
        {(owner || myMerchant || ops) &&
          !["cancelled", "complete", "disputed"].includes(booking.status) && (
            <Button
              variant="outline"
              onClick={() => {
                setAction("cancel");
                setConfirm(true);
              }}
            >
              {d("cancel")}
            </Button>
          )}
        {ops && pending && (
          <Button variant="outline" disabled={demo.busy} onClick={() => call("expire")}>
            {d("expiryScenario")}
          </Button>
        )}
        <h3 className="mt-7">{d("timeline")}</h3>
        <ol className="demo-timeline">
          {booking.timeline.map((e, i) => (
            <li key={i}>
              <strong>{eventLabel(e.event, locale)}</strong>
              <span>
                {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(
                  e.at,
                )}{" "}
                · {offered && !myMerchant && e.actor !== demo.persona?.id ? "SAMPLE" : e.actor}
              </span>
            </li>
          ))}
        </ol>
        <div className="form-group">
          <label htmlFor="demo-issue" className="form-label">
            {d("issue")}
          </label>
          <textarea
            id="demo-issue"
            className="form-input"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            maxLength={500}
          />
          <div className="demo-action-row">
            <Button
              variant="outline"
              disabled={demo.busy || !issue.trim()}
              onClick={() => call("support", { message: issue })}
            >
              {d("support")}
            </Button>
            {owner && booking.status === "complete" && (
              <Button
                variant="outline"
                disabled={!issue.trim() || demo.busy}
                onClick={() => call("dispute", { message: issue })}
              >
                {statusLabel("disputed", locale)}
              </Button>
            )}
          </div>
        </div>
        {demo.error && (
          <div role="alert">
            <Notice error>{demo.error}</Notice>
          </div>
        )}
      </section>
      <aside className="summary-panel">
        <h2>{d("total")}</h2>
        <PriceBreakdown price={booking.quote ?? booking.estimate} merchant={merchant || ops} />
        {booking.approvedQuote && (
          <Notice>
            {d("confirmed")} {money(booking.approvedQuote.total, locale)}
          </Notice>
        )}
        <p className="mt-4 text-xs">{d("cancelNotice")}</p>
        <p className="mt-3 text-xs">{d("noRefund")}</p>
      </aside>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={d(action === "approve" ? "approve" : "cancel")}
        description={
          action === "approve"
            ? `${money(booking.quote?.total ?? 0, locale)} · ${d("confirmed")}`
            : d("cancelNotice")
        }
      >
        <Button
          disabled={demo.busy}
          onClick={async () => {
            await call(action, { quoteVersion: booking.quoteVersion });
            setConfirm(false);
          }}
        >
          {d(action === "approve" ? "approve" : "cancel")}
        </Button>
      </Modal>
    </div>
  );
}
export function DemoBookingRoute({ id }: { id: string }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const b = demo.state.bookings.find((b) => b.id === (id === "demo" ? demo.lastBookingId : id));
  return (
    <PageShell
      role={demo.persona?.role === "operations" ? "admin" : (demo.persona?.role ?? "customer")}
    >
      <main id="main" className="wrap pb-10">
        <PageTop title={dt("bookings", locale)} desc={dt("boundary", locale)} />
        {b ? (
          <DemoBookingDetail key={b.id} booking={b} />
        ) : (
          <Notice>{dt("notFound", locale)}</Notice>
        )}
      </main>
    </PageShell>
  );
}
export function DemoBookings({
  role = "customer",
  detail = false,
}: {
  role?: Role;
  detail?: boolean;
  mode?: string;
}) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const id = path.split("/")[3] ?? "";
  const b = demo.state.bookings.find((b) => b.id === (id === "demo" ? demo.lastBookingId : id));
  return (
    <PageShell role={role}>
      <main id="main" className="wrap pb-10">
        <RoleGate role={role}>
          <PageTop title={dt("bookings", locale)} />
          {detail ? (
            b ? (
              <DemoBookingDetail key={b.id} booking={b} />
            ) : (
              <Notice>{dt("notFound", locale)}</Notice>
            )
          ) : (
            <>
              <Button asChild>
                <Link to="/customer/book/new">{dt("newBooking", locale)}</Link>
              </Button>
              <BookingList role={role} />
            </>
          )}
        </RoleGate>
      </main>
    </PageShell>
  );
}
function BookingList({ role, targetId }: { role: Role; targetId?: string | undefined }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const records = demo.state.bookings
    .filter((b) =>
      role === "customer"
        ? b.customerId === demo.persona?.id
        : role === "merchant"
          ? b.offers.includes(demo.persona?.merchantId ?? "") ||
            b.merchantId === demo.persona?.merchantId
          : role === "technician"
            ? b.technicianId === demo.persona?.id
            : true,
    )
    .filter((b) => `${b.id} ${b.problem} ${b.zone}`.toLowerCase().includes(search.toLowerCase()));
  const b = targetId
    ? records.find((b) => b.id === targetId)
    : (records.find((b) => b.id === selected) ?? records[0]);
  return (
    <>
      <label className="form-label mt-5" htmlFor="demo-search">
        {locale === "te-IN" ? "అభ్యర్థనలు వెతకండి" : "Search requests"}
      </label>
      <input
        id="demo-search"
        className="form-input mb-5"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="demo-master-detail">
        <div className="demo-job-list">
          {records.map((job) => (
            <Button
              variant={job.id === b?.id ? "secondary" : "outline"}
              key={job.id}
              className="demo-job-button"
              onClick={() => {
                setSelected(job.id);
                demo.clearError();
              }}
            >
              <span>
                <strong>
                  {job.id} · {categoryLabel(job.category, locale)}
                </strong>
                <span>
                  {role === "merchant" && job.merchantId !== demo.persona?.merchantId
                    ? lt(
                        offerState(job, demo.persona?.merchantId ?? "") as
                          | "closed"
                          | "offered"
                          | "viewed"
                          | "declined"
                          | "expired"
                          | "cancelled"
                          | "no_availability",
                        locale,
                      )
                    : statusLabel(job.status, locale)}
                </span>
                <span>
                  {placeLabel(job.zone, locale)} · {job.date} · {money((job.quote ?? job.estimate).total, locale)}
                </span>
              </span>
            </Button>
          ))}
          {!records.length && <p>{dt("noJobs", locale)}</p>}
        </div>
        {targetId && !b && <Notice>{dt("notFound", locale)}</Notice>}
        {b && (
          <section className="demo-detail-region">
            <DemoBookingDetail key={b.id} booking={b} />
          </section>
        )}
      </div>
    </>
  );
}
export function DemoRolePage({ role, page = "overview" }: { role: Role; page?: string }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const d = (k: DemoKey) => dt(k, locale);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const targetId = page.includes("$id") ? pathname.split("/")[3] : undefined;
  const profile = page.includes("profile") || page.includes("settings");
  return (
    <PageShell role={role}>
      <main id="main" className="wrap pb-10">
        <RoleGate role={role}>
          {page === "notifications" ? (
            <DemoNotifications />
          ) : (
            <>
              <PageTop
                title={`${d(role)} · ${demo.persona?.name ?? "SAMPLE"}`}
                desc={d("boundary")}
              />
              <nav className="demo-action-row">
                <Button asChild variant="outline">
                  <Link to={rolePath(role)}>{d("home")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to={
                      role === "merchant"
                        ? "/merchant/notifications"
                        : role === "technician"
                          ? "/technician/notifications"
                          : role === "customer"
                            ? "/customer/notifications"
                            : "/admin/notifications"
                    }
                  >
                    {d("notifications")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/demo">{d("scenario")}</Link>
                </Button>
                {role === "customer" && (
                  <Button asChild>
                    <Link to="/customer/book/new">{d("newBooking")}</Link>
                  </Button>
                )}
                {role === "merchant" && (
                  <Button asChild variant="outline">
                    <Link to="/merchant/onboarding/business">{d("onboard")}</Link>
                  </Button>
                )}
              </nav>
              {profile ? (
                <>
                  <Notice>{d("registrationNotice")}</Notice>
                  <p>
                    {demo.persona?.name} · {d(role)}
                  </p>
                  <Button asChild variant="outline">
                    <Link to="/communications/preferences">
                      {locale === "te-IN" ? "SMS / వాట్సాప్ అనుమతులు" : "SMS / WhatsApp consent"}
                    </Link>
                  </Button>
                  <Button onClick={demo.logout}>{d("signout")}</Button>
                </>
              ) : page === "pricing" && role === "admin" ? (
                <PricingPanel />
              ) : page === "pricing" && role === "merchant" ? (
                <>
                  <Notice warning>{d("hypothesis")}</Notice>
                  <div className="demo-example-grid">
                    {categoriesDemo.map((c) => (
                      <article className="service-card" key={c}>
                        <h2>{categoryLabel(c, locale)}</h2>
                        <PriceBreakdown
                          price={calculate(
                            demo.state.merchants.find((m) => m.id === demo.persona?.merchantId)
                              ?.catalog?.[c] ?? demo.state.policy[c],
                          )}
                          merchant
                        />
                      </article>
                    ))}
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/merchant/onboarding/pricing">{d("save")}</Link>
                  </Button>
                </>
              ) : page === "availability" ||
                page === "technicians" ||
                page === "team" ||
                page === "settings/team" ||
                (role === "admin" && page === "merchants") ? (
                <AvailabilityPanel role={role} />
              ) : page === "audit" || page === "events" || page === "reports" ? (
                <AuditPanel />
              ) : (
                <BookingList role={role} targetId={targetId} />
              )}
            </>
          )}
        </RoleGate>
      </main>
    </PageShell>
  );
}
export function PricingPanel() {
  const demo = useDemo();
  const { locale } = useFixHub();
  const d = (k: DemoKey) => dt(k, locale);
  const [cat, setCat] = useState<Category>("electrician");
  const [rates, setRates] = useState<Rates>({ ...demo.state.policy.electrician });
  const fields: [keyof Rates, DemoKey][] = [
    ["visit", "visit"],
    ["labor", "labor"],
    ["parts", "parts"],
    ["fee", "fee"],
    ["discount", "discount"],
    ["commissionBps", "deduction"],
    ["taxBps", "tax"],
  ];
  let price;
  try {
    price = calculate(rates);
  } catch {
    price = null;
  }
  return (
    <>
      <h2 className="text-2xl mb-3">{d("policy")}</h2>
      <p className="mb-6 text-muted-foreground">{d("hypothesis")}</p>
      <div className="content-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            demo.act({ type: "policy", payload: { category: cat, rates } });
          }}
        >
          <label className="form-label" htmlFor="policy-category">
            {d("services")}
          </label>
          <select
            id="policy-category"
            className="form-input"
            value={cat}
            onChange={(e) => {
              const c = e.target.value as Category;
              setCat(c);
              setRates({ ...demo.state.policy[c] });
            }}
          >
            {categoriesDemo.map((c) => (
              <option value={c} key={c}>
                {categoryLabel(c, locale)}
              </option>
            ))}
          </select>
          <div className="demo-form-pair mt-4">
            {fields.map(([key, label]) => (
              <label className="form-label" key={key}>
                {d(label)}
                {key.includes("Bps") ? " · bps (100 = 1%)" : ""}
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step={key.includes("Bps") ? "1" : "0.01"}
                  value={Number(rates[key])}
                  onChange={(e) => setRates({ ...rates, [key]: Number(e.target.value) })}
                />
              </label>
            ))}
          </div>
          <label className="flex min-h-11 items-center gap-3 my-4">
            <input
              type="checkbox"
              checked={rates.taxConfigured}
              onChange={(e) => setRates({ ...rates, taxConfigured: e.target.checked })}
            />
            {d("tax")} ·{" "}
            {locale === "te-IN"
              ? "పన్ను రేటును స్పష్టంగా అమర్చండి"
              : "Explicitly enable the displayed tax rate"}
          </label>
          <Notice>
            {locale === "te-IN"
              ? "కొత్త అంచనాలకు మార్పులు వర్తిస్తాయి. పాత ధర మూల సంచిక, ఆమోదించిన ధర మారవు."
              : "Changes apply to new estimates. Existing quotes retain their source version and approved amounts."}
          </Notice>
          <Button disabled={demo.busy || !price || demo.persona?.role !== "admin"} type="submit">
            {d("save")}
          </Button>
          {demo.error && <Notice error>{demo.error}</Notice>}
        </form>
        <aside className="summary-panel">
          {price ? (
            <PriceBreakdown price={price} merchant />
          ) : (
            <Notice error>{d("invalidPrice")}</Notice>
          )}
        </aside>
      </div>
    </>
  );
}
function AvailabilityPanel({ role }: { role: Role }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  if (role === "technician")
    return (
      <>
        <label className="form-label">
          {dt("available", locale)}
          <select
            className="form-input"
            value={demo.persona?.unavailable ? "unavailable" : "active"}
            onChange={(e) =>
              demo.act({ type: "availability", payload: { status: e.target.value } })
            }
          >
            <option value="active">{dt("active", locale)}</option>
            <option value="unavailable">{dt("unavailable", locale)}</option>
          </select>
        </label>
      </>
    );
  return (
    <div className="demo-example-grid">
      {demo.state.merchants
        .filter(
          (m) => role === "admin" || role === "operations" || m.id === demo.persona?.merchantId,
        )
        .map((m) => (
          <article className="service-card" key={m.id}>
            <h2>{m.name}</h2>
            <p>{placeLabel(m.zones.join(" · "), locale)} · SAMPLE</p>
            <p>{m.skills.map((c) => categoryLabel(c, locale)).join(" · ")}</p>
            <p>
              {m.hours} · {dt("capacity", locale)}: {m.capacity}
            </p>
            <label className="form-label">
              {dt("available", locale)}
              <select
                className="form-input"
                value={m.status}
                onChange={(e) =>
                  demo.act({
                    type: "availability",
                    payload: { merchantId: m.id, status: e.target.value },
                  })
                }
              >
                {(["active", "unavailable", "pending", "suspended"] as const).map((s) => (
                  <option value={s} key={s}>
                    {dt(s, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              {dt("capacity", locale)}
              <input
                type="number"
                className="form-input"
                min="0"
                value={m.capacity}
                onChange={(e) =>
                  demo.act({
                    type: "availability",
                    payload: {
                      merchantId: m.id,
                      status: m.status,
                      capacity: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            {demo.state.personas
              .filter((p) => p.merchantId === m.id && p.role === "technician")
              .map((p) => (
                <p key={p.id}>{p.name}</p>
              ))}
          </article>
        ))}
    </div>
  );
}
export function AuditPanel() {
  const demo = useDemo();
  const { locale } = useFixHub();
  return (
    <>
      <h2>{dt("audit", locale)}</h2>
      <ul className="demo-notifications">
        {demo.state.audit
          .slice()
          .reverse()
          .map((e) => (
            <li key={e.id}>
              <strong>{eventLabel(e.event, locale)}</strong>
              <span>
                {e.actor} · {e.bookingId}
              </span>
              <time>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(e.at)}
              </time>
            </li>
          ))}
      </ul>
      {!demo.state.audit.length && <p>{dt("empty", locale)}</p>}
      {demo.state.tickets.map((t) => (
        <p key={t.id}>
          {t.id} · {t.message}
        </p>
      ))}
      {demo.state.reviews.map((r) => (
        <p key={r.id}>{r.label}</p>
      ))}
    </>
  );
}
export function DemoOnboarding({ step = 0 }: { step?: number }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const d = (k: DemoKey) => dt(k, locale);
  const navigate = useNavigate();
  const keys: DemoKey[] = [
    "business",
    "displayName",
    "services",
    "zone",
    "hours",
    "policy",
    "team",
    "verification",
    "submitted",
  ];
  const routes = [
    "/merchant/onboarding/business",
    "/merchant/onboarding/identity",
    "/merchant/onboarding/services",
    "/merchant/onboarding/coverage",
    "/merchant/onboarding/hours",
    "/merchant/onboarding/pricing",
    "/merchant/onboarding/team",
    "/merchant/onboarding/documents",
    "/merchant/onboarding/review",
  ] as const;
  const current = keys[Math.min(step, 8)] ?? "business";
  const prefix = `${demo.persona?.id ?? ""}:`;
  const [value, setValue] = useState(demo.state.onboarding[prefix + current] ?? "");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  return (
    <PageShell role="merchant">
      <main id="main" className="wrap pb-10">
        <RoleGate role="merchant">
          <PageTop title={d("onboard")} desc={d("registrationNotice")} />
          <div className="content-grid">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (step < 7 && !value.trim()) {
                  setError(d("required"));
                  return;
                }
                const r = await demo.act({
                  type: "onboard",
                  payload: { [current]: value, ...(step >= 8 ? { submitted: "yes" } : {}) },
                });
                if (r.ok) {
                  if (step >= 8) setDone(true);
                  else
                    navigate({
                      to: routes[Math.min(step + 1, 8)] ?? "/merchant/onboarding/review",
                    });
                }
              }}
            >
              <div className="wizard-progress">
                {keys.map((_, i) => (
                  <span key={i} className={i <= step ? "done" : ""} />
                ))}
              </div>
              <h2>
                {d(current)} · {Math.min(step + 1, 9)} / 9
              </h2>
              {step < 7 ? (
                <label className="form-label mt-5">
                  {d(current)}
                  {step === 2 ? (
                    <select
                      className="form-input"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    >
                      <option value="">—</option>
                      {categoriesDemo.map((c) => (
                        <option value={c} key={c}>
                          {categoryLabel(c, locale)}
                        </option>
                      ))}
                    </select>
                  ) : step === 3 ? (
                    <select
                      className="form-input"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    >
                      <option value="">—</option>
                      {["Tanuku", "Velpur", "Undrajavaram"].map((z) => (
                        <option key={z}>{z}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={
                        step === 4
                          ? "08:00–20:00"
                          : step === 5
                            ? "149 / 450 / 200"
                            : step === 6
                              ? "SAMPLE Technician A"
                              : ""
                      }
                      maxLength={100}
                    />
                  )}
                </label>
              ) : (
                <>
                  <Notice>{d("verification")}</Notice>
                  <dl className="demo-details">
                    {Object.entries(demo.state.onboarding)
                      .filter(([k]) => k.startsWith(prefix))
                      .map(([raw, v]) => {
                        const k = raw.slice(prefix.length);
                        return (
                          <div key={k}>
                            <dt>{keys.includes(k as DemoKey) ? d(k as DemoKey) : "DEMO"}</dt>
                            <dd>{v}</dd>
                          </div>
                        );
                      })}
                  </dl>
                </>
              )}
              {step === 5 && (
                <PriceBreakdown price={calculate(demo.state.policy.electrician)} merchant />
              )}
              {error && <Notice error>{error}</Notice>}
              {done ? (
                <Notice>{d("submitted")}</Notice>
              ) : (
                <div className="demo-action-row">
                  <Button asChild variant="outline">
                    <Link to={routes[Math.max(0, step - 1)] ?? "/merchant/onboarding/business"}>
                      {locale === "te-IN" ? "వెనుకకు" : "Back"}
                    </Link>
                  </Button>
                  <Button type="submit" disabled={demo.busy}>
                    {d(step >= 8 ? "verification" : "continue")}
                  </Button>
                </div>
              )}
            </form>
            <aside className="summary-panel">
              <h2>{d("verification")}</h2>
              <Notice>{d("registrationNotice")}</Notice>
              <p>
                {demo.state.onboarding[prefix + "submitted"] === "yes"
                  ? d("submitted")
                  : d("pending")}
              </p>
            </aside>
          </div>
        </RoleGate>
      </main>
    </PageShell>
  );
}
