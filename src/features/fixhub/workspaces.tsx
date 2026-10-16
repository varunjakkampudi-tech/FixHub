import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Users,
  Settings,
  CircleHelp,
  ShieldCheck,
  Bell,
  ArrowRight,
  CircleCheck,
  MapPin,
  Clock,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { type MessageKey, categories } from "./locales";
import { PageShell, PageTop, Notice, Empty, Modal, LocaleControl } from "./shared";
import { FAQ } from "./public";
import { RegistryAdmin } from "./registry-admin";
import { DemoRolePage } from "./demo-pages";
import { resolveApiSession, type ApiSessionMode } from "./api-client";
import { RealMerchantPage } from "./real-merchant";
import { WhatsAppPreferencesGate } from "./account";
const merchantNav: [string, MessageKey, typeof LayoutDashboard][] = [
  ["/merchant", "overview", LayoutDashboard],
  ["/merchant/requests", "incoming", ClipboardList],
  ["/merchant/jobs", "jobs", ClipboardList],
  ["/merchant/calendar", "calendar", CalendarDays],
  ["/merchant/technicians", "team", Users],
  ["/merchant/availability", "availability", Clock],
  ["/merchant/verification", "verificationCenter", ShieldCheck],
  ["/merchant/pricing", "earnings", Wallet],
  ["/merchant/settings", "settings", Settings],
  ["/merchant/support", "help", CircleHelp],
];
const adminNav: [string, MessageKey, typeof LayoutDashboard][] = [
  ["/admin", "overview", LayoutDashboard],
  ["/admin/operations", "operations", ClipboardList],
  ["/admin/bookings", "bookings", CalendarDays],
  ["/admin/customers", "customers", Users],
  ["/admin/merchants", "merchants", Users],
  ["/admin/technicians", "team", Users],
  ["/admin/dispatch", "dispatch", MapPin],
  ["/admin/verification", "verificationCenter", ShieldCheck],
  ["/admin/reports", "reports", ClipboardList],
  ["/admin/audit", "audit", Clock],
  ["/admin/support", "help", CircleHelp],
  ["/admin/settings", "settings", Settings],
];
const technicianNav: [string, MessageKey, typeof LayoutDashboard][] = [
  ["/technician", "todaysJobs", ClipboardList],
  ["/technician/upcoming", "upcoming", CalendarDays],
  ["/technician/availability", "availability", Clock],
  ["/technician/notifications", "notifications", Bell],
  ["/technician/profile", "profile", Users],
  ["/technician/support", "help", CircleHelp],
];
function Workspace({ role, children, functionalPreview = false }: { role: string; children: ReactNode; functionalPreview?: boolean }) {
  const { t } = useFixHub();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const list = role === "admin" ? adminNav : role === "technician" ? technicianNav : merchantNav;
  return (
    <PageShell role={role} functionalPreview={functionalPreview}>
      <main id="main" className={`workspace ${collapsed ? "rail-collapsed" : ""}`}>
        <aside className="workspace-rail">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("menu")}
            onClick={() => setCollapsed(!collapsed)}
            className="mb-4"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <h2>{t(role as MessageKey)}</h2>
          <nav>
            {list.map(([to, key, Icon]) => (
              <Link to={to} key={to} title={t(key)} className={path === to ? "active" : ""}>
                <Icon />
                <span>{t(key)}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="workspace-main">{children}</div>
      </main>
    </PageShell>
  );
}
export function MerchantPage({ page = "overview" }: { page?: string }) {
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  const [roles, setRoles] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    void resolveApiSession().then((value) => { if (active) { setMode(value.mode); setRoles(value.roles); } });
    return () => { active = false; };
  }, []);
  if (mode === "checking") return <PageShell functionalPreview><main id="main" className="wrap"><p role="status" className="animate-pulse motion-reduce:animate-none">Checking merchant access…</p></main></PageShell>;
  if (mode === "demo") return <DemoRolePage role="merchant" page={page} />;
  if (mode !== "authenticated") return <PageShell functionalPreview><main id="main" className="wrap"><Notice warning>{mode === "unauthenticated" ? <Link to="/sign-in">Sign in with a provisioned merchant account</Link> : "Merchant services are temporarily unavailable."}</Notice></main></PageShell>;
  if (!roles.includes("merchant")) return <PageShell functionalPreview><main id="main" className="wrap"><Notice error>This account is not authorized for the merchant workspace.</Notice></main></PageShell>;
  if (page === "requests" || page === "jobs") {
    return <Workspace role="merchant" functionalPreview><RealMerchantPage page={page} /></Workspace>;
  }
  if (page === "notifications") return <WhatsAppPreferencesGate role="merchant" />;
  return <Workspace role="merchant" functionalPreview><PageTop title={page === "overview" ? "Merchant workspace" : "Merchant settings"} /><Notice warning>This merchant workspace section is not connected to live account settings yet.</Notice></Workspace>;
}
export function TechnicianPage({ page = "overview" }: { page?: string }) {
  return <DemoRolePage role="technician" page={page} />;
}
export function AdminPage({ page = "overview" }: { page?: string }) {
  return <RegistryAdmin page={page} />;
}
export { DemoOnboarding as OnboardingPage } from "./demo-pages";
function LegacyMerchantPage({ page = "overview" }: { page?: string }) {
  const { t, locale } = useFixHub();
  const [state, setState] = useState("ready");
  const [selected, setSelected] = useState("electrician");
  const [confirm, setConfirm] = useState<"accept" | "decline" | null>(null);
  const [available, setAvailable] = useState(true);
  const [saved, setSaved] = useState(false);
  const requests = page === "overview" || page.includes("request") || page.includes("job");
  const schedule = page === "calendar" || page === "availability";
  const settings =
    page.includes("setting") ||
    page.includes("profile") ||
    page === "services" ||
    page === "coverage";
  const verification = page.includes("verification");
  const title = t(
    requests
      ? "incoming"
      : schedule
        ? "calendar"
        : settings
          ? "settings"
          : verification
            ? "verificationCenter"
            : page.includes("support") || page === "messages"
              ? "help"
              : page === "notifications"
                ? "notifications"
                : page === "reviews"
                  ? "noReview"
                  : page === "pricing" || page === "analytics"
                    ? "earnings"
                    : "merchant",
  );
  return (
    <Workspace role="merchant">
      <PageTop title={page === "overview" ? t("merchantTitle") : title} desc={t("merchantDesc")} />
      <Notice warning>{t("capacity")}</Notice>
      {requests ? (
        <>
          <div className="tab-row">
            {(["ready", "expired", "conflict", "empty", "error", "loading"] as const).map((s) => (
              <Button
                variant={state === s ? "secondary" : "ghost"}
                key={s}
                onClick={() => setState(s)}
              >
                {t(s === "conflict" ? "conflict" : s === "expired" ? "expired" : (s as MessageKey))}
              </Button>
            ))}
          </div>
          {state === "empty" ? (
            <Empty
              title="noRecords"
              desc="noRecordsDesc"
              action={<Button onClick={() => setState("ready")}>{t("retry")}</Button>}
            />
          ) : state === "loading" ? (
            <div role="status" className="py-12 text-center">
              {t("loading")}
              <Button onClick={() => setState("ready")} variant="ghost">
                {t("next")}
              </Button>
            </div>
          ) : state === "error" ? (
            <Empty
              title="unavailableTitle"
              desc="unavailableDesc"
              action={<Button onClick={() => setState("ready")}>{t("retry")}</Button>}
            />
          ) : (
            <div className="workspace-grid">
              <div className="job-list">
                {["electrician", "plumbing", "ac"].map((id) => {
                  const c = categories.find((c) => c.id === id);
                  return (
                    <article className={`job-item ${selected === id ? "selected" : ""}`} key={id}>
                      <span className="status">{t("demo")}</span>
                      <h3>{locale === "te-IN" ? c?.te : c?.en}</h3>
                      <p>{t("generalLocation")}</p>
                      <p>{t("deadline")}</p>
                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => {
                          setSelected(id);
                          setSaved(false);
                        }}
                      >
                        {t("openRequest")}
                        <ArrowRight />
                      </Button>
                    </article>
                  );
                })}
              </div>
              <section className="job-detail">
                <span className="status">
                  {t(
                    state === "expired"
                      ? "expired"
                      : state === "conflict"
                        ? "conflict"
                        : saved
                          ? "accepted"
                          : "newOffer",
                  )}
                </span>
                <h2 className="mt-4">
                  {locale === "te-IN"
                    ? categories.find((c) => c.id === selected)?.te
                    : categories.find((c) => c.id === selected)?.en}
                </h2>
                <div className="summary-row">
                  <span>{t("location")}</span>
                  <strong>{t("generalLocation")}</strong>
                </div>
                <div className="summary-row">
                  <span>{t("time")}</span>
                  <strong>{t("morning")}</strong>
                </div>
                <div className="my-5">
                  <Notice>{t("privacyOffer")}</Notice>
                  <Notice warning>
                    {state === "expired" || state === "conflict"
                      ? t("deadlineExpired")
                      : t("capacity")}
                  </Notice>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={state !== "ready" || saved}
                    onClick={() => setConfirm("accept")}
                  >
                    {t("accept")}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={state !== "ready" || saved}
                    onClick={() => setConfirm("decline")}
                  >
                    {t("decline")}
                  </Button>
                </div>
                {saved && (
                  <p role="status" className="mt-5 text-sm text-primary">
                    {t("saved")} · {t("assigned")}
                  </p>
                )}
              </section>
            </div>
          )}
        </>
      ) : schedule ? (
        <section>
          <label className="mb-6 flex min-h-11 max-w-xl items-center justify-between gap-5 text-sm font-bold">
            {t("availabilityToggle")}
            <input
              type="checkbox"
              className="size-6 accent-primary"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
          </label>
          <Notice>
            {t(available ? "available" : "unavailable")} · {t("demo")}
          </Notice>
          <div className="service-grid">
            {(["morning", "afternoon", "evening"] as MessageKey[]).map((time) => (
              <article className="service-card" key={time}>
                <CalendarDays className="text-primary" />
                <h2>{t(time)}</h2>
                <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
                  {t("available")}
                  <input type="checkbox" defaultChecked className="size-5 accent-primary" />
                </label>
              </article>
            ))}
          </div>
        </section>
      ) : settings ? (
        <>
          <div className="max-w-xl">
            <h2 className="mb-4 text-xl">{t("language")}</h2>
            <LocaleControl />
            <p className="my-5 text-sm text-muted-foreground">{t("languageHelp")}</p>
            <div className="form-group">
              <label className="form-label" htmlFor="merchant-business">
                {t("businessName")}
              </label>
              <input id="merchant-business" className="form-input" />
            </div>
            <Button onClick={() => setSaved(true)}>{t("saveChanges")}</Button>
            {saved && (
              <div className="mt-4">
                <Notice>{t("saved")}</Notice>
              </div>
            )}
          </div>
        </>
      ) : verification ? (
        <>
          <Notice warning>{t("pendingDesc")}</Notice>
          <Button asChild>
            <Link to="/merchant/onboarding">{t("onboard")}</Link>
          </Button>
        </>
      ) : page.includes("support") || page === "messages" ? (
        <FAQ />
      ) : page === "notifications" ? (
        <Empty title="noNotifications" desc="notificationsDesc" />
      ) : page === "reviews" ? (
        <Empty title="noReview" desc="noReviewDesc" />
      ) : (
        <Empty title="noEarnings" desc="noEarningsDesc" />
      )}
      <Modal
        open={Boolean(confirm)}
        onOpenChange={() => setConfirm(null)}
        title={t("confirmTitle")}
        description={t("confirmDesc")}
      >
        <Button
          onClick={() => {
            setSaved(true);
            setConfirm(null);
          }}
        >
          {t("confirm")}
        </Button>
      </Modal>
    </Workspace>
  );
}
function LegacyOnboardingPage({ step = 0 }: { step?: number }) {
  const { t, locale } = useFixHub();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const labels: MessageKey[] = [
    "businessName",
    "owner",
    "serviceLabel",
    "coverage",
    "hours",
    "price",
    "team",
    "documents",
    "review",
  ];
  const label = labels[Math.min(step, 8)] ?? "businessName";
  return (
    <Workspace role="merchant">
      <PageTop title={t("onboard")} desc={t("onboardDesc")} />
      {done || step > 8 ? (
        <Empty
          title="applicationReady"
          desc="pendingDesc"
          icon={CircleCheck}
          action={
            <Button asChild>
              <Link to="/merchant/verification">{t("verificationCenter")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="content-grid">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 7 && !values[label]?.trim()) {
                setError(true);
                return;
              }
              setError(false);
              setDone(true);
            }}
          >
            <div className="wizard-progress">
              {labels.map((_, i) => (
                <span key={i} className={i <= step ? "done" : ""} />
              ))}
            </div>
            <h2 className="mb-6 text-xl">{t(label ?? "businessName")}</h2>
            {step === 7 ? (
              <Notice warning>{t("docsNote")}</Notice>
            ) : step === 8 ? (
              <Notice>{t("onboardDesc")}</Notice>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="onboard-value">
                  {t(label ?? "businessName")}
                </label>
                {step === 2 ? (
                  <select
                    id="onboard-value"
                    className="form-input"
                    value={values[label] ?? ""}
                    onChange={(e) => setValues({ ...values, [label]: e.target.value })}
                  >
                    <option value="">{t("choose")}</option>
                    {categories
                      .filter((c) => c.id !== "more")
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {locale === "te-IN" ? c.te : c.en}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    id="onboard-value"
                    className="form-input"
                    value={values[label] ?? ""}
                    onChange={(e) => setValues({ ...values, [label]: e.target.value })}
                  />
                )}
              </div>
            )}
            {error && <Notice error>{t("required")}</Notice>}
            <div className="form-actions">
              <Button asChild variant="outline">
                <Link to="/partners">{t("back")}</Link>
              </Button>
              <Button type="submit">{t("saveChanges")}</Button>
            </div>
            <div className="tab-row">
              {(
                [
                  "/merchant/onboarding/business",
                  "/merchant/onboarding/identity",
                  "/merchant/onboarding/services",
                  "/merchant/onboarding/coverage",
                  "/merchant/onboarding/hours",
                  "/merchant/onboarding/pricing",
                  "/merchant/onboarding/team",
                  "/merchant/onboarding/documents",
                  "/merchant/onboarding/review",
                ] as const
              ).map((to, i) => (
                <Button variant="ghost" asChild key={to}>
                  <Link to={to}>{t(labels[i] ?? "businessName")}</Link>
                </Button>
              ))}
            </div>
          </form>
          <aside className="summary-panel">
            <h2>{t("verificationCenter")}</h2>
            <Notice warning>{t("pendingDesc")}</Notice>
            <p className="text-sm text-muted-foreground">{t("docsNote")}</p>
          </aside>
        </div>
      )}
    </Workspace>
  );
}
function LegacyTechnicianPage({ page = "overview" }: { page?: string }) {
  const { t, locale } = useFixHub();
  const [status, setStatus] = useState<MessageKey>("acknowledged");
  const [offline, setOffline] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState("electrician");
  const task = !["availability", "notifications", "profile", "settings", "support", "safety"].some(
    (p) => page.includes(p),
  );
  const nextStatus: Record<string, MessageKey> = {
    acknowledged: "onWay",
    onWay: "arrived",
    arrived: "work",
    work: "completed",
  };
  const action: Record<string, MessageKey> = {
    acknowledged: "travel",
    onWay: "arrival",
    arrived: "start",
    work: "finish",
    completed: "completed",
  };
  return (
    <Workspace role="technician">
      <PageTop title={t("techTitle")} desc={t("techDesc")} />
      <div className="tab-row">
        <Button
          variant={offline ? "secondary" : "outline"}
          aria-pressed={offline}
          onClick={() => setOffline(!offline)}
        >
          {t("offline")}
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/technician/jobs">{t("todaysJobs")}</Link>
        </Button>
      </div>
      {offline ? (
        <>
          <Notice warning>{t("offlineDesc")}</Notice>
          <Button onClick={() => setOffline(false)}>{t("reconnect")}</Button>
        </>
      ) : task ? (
        <div className="workspace-grid">
          <div className="job-list">
            {["electrician", "plumbing"].map((id) => (
              <article className={`job-item ${selected === id ? "selected" : ""}`} key={id}>
                <span className="status">{t("demo")}</span>
                <h3>
                  {locale === "te-IN"
                    ? categories.find((c) => c.id === id)?.te
                    : categories.find((c) => c.id === id)?.en}
                </h3>
                <p>{t("generalLocation")}</p>
                <Button variant="ghost" onClick={() => setSelected(id)}>
                  {t("viewBooking")}
                  <ArrowRight />
                </Button>
              </article>
            ))}
          </div>
          <section className="job-detail">
            <span className="status">
              {t(status)} · {t("demo")}
            </span>
            <h2 className="mt-4">
              {locale === "te-IN"
                ? categories.find((c) => c.id === selected)?.te
                : categories.find((c) => c.id === selected)?.en}
            </h2>
            <Notice>{t("directionsDesc")}</Notice>
            <h3 className="mb-4 text-base">{t("checklist")}</h3>
            {(["check1", "check2", "check3", "check4"] as MessageKey[]).map((key, i) => (
              <label className="flex min-h-14 items-start gap-3 py-3 text-sm" key={key}>
                <input
                  type="checkbox"
                  className="mt-1 size-5 shrink-0 accent-primary"
                  checked={checks[i]}
                  onChange={(e) =>
                    setChecks((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                  }
                />
                {t(key)}
              </label>
            ))}
            <Button
              className="mt-5 w-full"
              size="lg"
              disabled={status === "completed" || (status === "work" && checks.some((v) => !v))}
              onClick={() => setConfirm(true)}
            >
              {t(action[status] ?? "finish")}
            </Button>
            <div className="mt-4">
              <label className="form-label" htmlFor="work-photos">
                {t("photos")}
              </label>
              <input
                className="form-input"
                id="work-photos"
                type="file"
                accept="image/*"
                onChange={() => setSaved(true)}
              />
              <p className="mt-3 text-xs text-muted-foreground">{t("photosHelp")}</p>
              {saved && (
                <p role="status" className="text-xs text-primary">
                  {t("saved")}
                </p>
              )}
            </div>
            <Button asChild variant="ghost" className="mt-3">
              <Link to="/technician/report-issue">{t("reportIssue")}</Link>
            </Button>
          </section>
        </div>
      ) : page.includes("support") || page === "safety" ? (
        <FAQ />
      ) : page === "notifications" ? (
        <Empty title="noNotifications" desc="notificationsDesc" />
      ) : page === "availability" ? (
        <label className="flex min-h-11 max-w-md items-center justify-between gap-4">
          {t("available")}
          <input type="checkbox" defaultChecked className="size-6 accent-primary" />
        </label>
      ) : (
        <>
          <LocaleControl />
          <p className="my-5 text-sm text-muted-foreground">{t("languageHelp")}</p>
          <Button onClick={() => setSaved(true)}>{t("saveChanges")}</Button>
          {saved && <Notice>{t("saved")}</Notice>}
        </>
      )}
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={t("confirmTitle")}
        description={t("confirmDesc")}
      >
        <Button
          onClick={() => {
            setStatus(nextStatus[status] ?? "completed");
            setConfirm(false);
          }}
        >
          {t("confirm")}
        </Button>
      </Modal>
    </Workspace>
  );
}
function LegacyAdminPage({ page = "overview" }: { page?: string }) {
  const { t } = useFixHub();
  const [search, setSearch] = useState("");
  const [state, setState] = useState<MessageKey>("pending");
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const records = [
    "customers",
    "merchants",
    "technicians",
    "bookings",
    "dispatch",
    "operations",
    "overview",
    "support",
    "verification",
  ].some((p) => page.includes(p));
  return (
    <Workspace role="admin">
      <PageTop
        title={t(
          page === "overview"
            ? "operations"
            : page.includes("settings")
              ? "settings"
              : page.includes("support")
                ? "help"
                : records
                  ? "directory"
                  : "admin",
        )}
        desc={t("adminDesc")}
      />
      <Notice warning>{t("restrictedDesc")}</Notice>
      {page.includes("access-denied") || page.includes("access") ? (
        <Empty title="restricted" desc="restrictedDesc" />
      ) : records ? (
        <>
          <div className="metrics">
            <div className="metric">
              <strong>—</strong>
              <span>{t("bookings")}</span>
            </div>
            <div className="metric">
              <strong>—</strong>
              <span>{t("merchants")}</span>
            </div>
            <div className="metric">
              <strong>—</strong>
              <span>{t("dispatch")}</span>
            </div>
          </div>
          <div className="form-group max-w-xl">
            <label htmlFor="admin-search" className="form-label">
              {t("search")}
            </label>
            <input
              id="admin-search"
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="workspace-grid">
            <div className="job-list">
              {["electrician", "plumbing", "ac"]
                .filter((id) => id.includes(search.toLowerCase()))
                .map((id) => (
                  <article className="job-item" key={id}>
                    <span className="status">{t("demo")}</span>
                    <h3>
                      {t("sampleOffer")} · {id.toUpperCase()}
                    </h3>
                    <p>{t("pending")}</p>
                    <Button variant="ghost" onClick={() => setSaved(true)}>
                      {t("review")}
                      <ArrowRight />
                    </Button>
                  </article>
                ))}
            </div>
            <section className="job-detail">
              <h2>{t("verificationCenter")}</h2>
              <span className="status">
                {t(state)} · {t("demo")}
              </span>
              <Notice>{t("docsNote")}</Notice>
              <fieldset>
                <legend className="form-label">{t("stateLabel")}</legend>
                <div className="tab-row">
                  {(["pending", "approved", "rejected", "suspended"] as MessageKey[]).map((s) => (
                    <Button
                      variant={state === s ? "secondary" : "ghost"}
                      key={s}
                      onClick={() => setState(s)}
                    >
                      {t(s)}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <Button variant="outline" onClick={() => setConfirm(true)}>
                {t("review")}
              </Button>
              {saved && (
                <div className="mt-4" role="status">
                  <Notice>
                    {t("demo")} · {t("pendingDesc")}
                  </Notice>
                </div>
              )}
            </section>
          </div>
        </>
      ) : page.includes("setting") || page.includes("localization") || page.includes("feature") ? (
        <div className="max-w-xl">
          <LocaleControl />
          <p className="my-5 text-sm text-muted-foreground">{t("languageHelp")}</p>
          <label className="flex min-h-11 items-center justify-between gap-4">
            {t("notificationPref")}
            <input type="checkbox" defaultChecked className="size-5 accent-primary" />
          </label>
          <Button className="mt-5" onClick={() => setSaved(true)}>
            {t("saveChanges")}
          </Button>
          {saved && <Notice>{t("saved")}</Notice>}
        </div>
      ) : (
        <>
          <Empty title="noRecords" desc="noRecordsDesc" />
          <Button
            onClick={() => {
              const blob = new Blob(["record_type,boundary\nsample,design-only\n"], {
                type: "text/csv",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "fixhub-sample.csv";
              a.click();
              URL.revokeObjectURL(url);
              setSaved(true);
            }}
          >
            {t("export")}
          </Button>
          {saved && (
            <div className="mt-5">
              <Notice>{t("exportNote")}</Notice>
            </div>
          )}
        </>
      )}
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={t("restricted")}
        description={t("restrictedDesc")}
      >
        <Button onClick={() => setConfirm(false)}>{t("close")}</Button>
      </Modal>
    </Workspace>
  );
}
