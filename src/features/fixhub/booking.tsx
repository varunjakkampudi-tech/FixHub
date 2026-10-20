import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, ImagePlus, CircleCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { categories, type MessageKey } from "./locales";
import { PageShell, PageTop, Notice, Empty } from "./shared";
import { useDemo } from "./demo-context";
import { PriceBreakdown } from "./demo-price";
import { calculate, categoriesDemo, type Category, type Role } from "./demo-model";
import { dt } from "./demo-copy";
import { CityPicker, AddressEditor, SampleProviders } from "./location-ui";
import { enabledServices, ratesFor } from "./location-model";
import { DemoBookings } from "./demo-pages";
import { resolveApiSessionMode, type ApiSessionMode } from "./api-client";
import { RealBookingHistory, RealBookingPage } from "./real-booking";
const paths = [
  "/customer/book/new",
  "/customer/book/details",
  "/customer/book/photos",
  "/customer/book/schedule",
  "/customer/book/review",
];
export function BookingPage({ step = 0 }: { step?: number }) {
  const { locale } = useFixHub();
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  useEffect(() => {
    let active = true;
    void resolveApiSessionMode().then((sessionMode) => {
      if (active) setMode(sessionMode);
    });
    return () => {
      active = false;
    };
  }, []);
  if (mode === "checking")
    return (
      <PageShell>
        <main id="main" className="wrap">
          <p role="status">{locale === "te-IN" ? "లోడ్ అవుతోంది…" : "Loading your session…"}</p>
        </main>
      </PageShell>
    );
  if (mode === "authenticated") return <RealBookingPage />;
  if (mode === "demo") return <DemoBookingPage step={step} />;
  return (
    <PageShell functionalPreview>
      <main id="main" className="wrap">
        <PageTop title={locale === "te-IN" ? "సైన్ ఇన్ అవసరం" : "Sign in required"} />
        <Notice warning>
          <Link to="/sign-in">
            {locale === "te-IN" ? "సైన్ ఇన్ చేయండి" : "Sign in to book a service"}
          </Link>
        </Notice>
      </main>
    </PageShell>
  );
}

function DemoBookingPage({ step = 0 }: { step?: number }) {
  const { t, locale, draft, updateDraft, setSubmitted, setCancelled } = useFixHub();
  const demo = useDemo();
  const zone = draft.zone;
  const service = demo.state.registry.services.find((s) => s.id === draft.service);
  const cityId = draft.cityId ?? "tanuku";
  const address = demo.state.registry.addresses.find(
    (a) => a.id === draft.addressId && a.customerId === demo.persona?.id,
  );
  const cat =
    service?.pricingCategory ??
    ((draft.service === "appliances" ? "appliance" : draft.service) as Category);
  const price = calculate(
    ratesFor(
      demo.state,
      cityId,
      service?.id ?? cat,
      categoriesDemo.includes(cat) ? cat : "electrician",
    ),
  );
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submissionId = useRef<string | null>(null);
  const today = new Date().toLocaleDateString("en-CA");
  const name = categories.find((c) => c.id === draft.service);
  const serviceName = service?.names[locale] ?? (locale === "te-IN" ? name?.te : name?.en);
  async function next() {
    setError("");
    if (step === 1 && !draft.problem.trim()) {
      setError(t("required"));
      return;
    }
    if (step === 3 && (!address || Date.now() - address.confirmedAt > 86400000 || !draft.date)) {
      setError(t("required"));
      return;
    }
    if (step === 3 && draft.date < today) {
      setError(t("dateInvalid"));
      return;
    }
    if (step === 4) {
      if (!draft.consent) {
        setError(t("consentRequired"));
        return;
      }
      if (
        !draft.problem ||
        !address ||
        Date.now() - address.confirmedAt > 86400000 ||
        !draft.date ||
        !enabledServices(demo.state, cityId).some((s) => s.id === draft.service)
      ) {
        setError(t("required"));
        return;
      }
      if (busy) return;
      setBusy(true);
      submissionId.current ??= crypto.randomUUID();
      const result = await demo.act({
        type: "create",
        id: submissionId.current,
        payload: {
          category: cat,
          cityId,
          serviceId: service?.id ?? cat,
          location: address,
          zone,
          problem: draft.problem,
          date: draft.date,
          slot: draft.time,
          priceVersion: price.rates.version,
          priceTotal: price.total,
        },
      });
      if (!result.ok) {
        setBusy(false);
        return;
      }
      if (demo.state.scenario === "duplicate" && result.bookingId)
        await demo.act({
          type: "create",
          id: submissionId.current,
          payload: {},
          bookingId: result.bookingId,
        });
      setSubmitted(true);
      setCancelled(false);
      navigate({ to: "/customer/bookings/$id", params: { id: result.bookingId ?? "demo" } });
      return;
    }
    navigate({ to: paths[Math.min(step + 1, 4)] ?? "/customer/book/review" });
  }
  const titles: MessageKey[] = ["serviceLabel", "details", "photos", "scheduled", "review"];
  return (
    <PageShell>
      <main id="main" className="wrap pb-10">
        <PageTop title={t("book")} desc={t("requestDesc")} />
        {!demo.persona || demo.persona.role !== "customer" ? (
          <>
            <Notice warning>{dt("session", locale)}</Notice>
            <Button asChild>
              <Link to="/sign-in">{dt("signin", locale)}</Link>
            </Button>
          </>
        ) : (
          <>
            <CityPicker />
            <SampleProviders serviceId={service?.id ?? cat} />
            <div className="content-grid">
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
              >
                <div className="mb-3 flex justify-between text-xs text-muted-foreground">
                  <span>{t(titles[step] ?? "serviceLabel")}</span>
                  <span>
                    {t("currentStep")} {new Intl.NumberFormat(locale).format(step + 1)} {t("of")} 5
                  </span>
                </div>
                <div className="wizard-progress" aria-label={`${t("currentStep")} ${step + 1} / 5`}>
                  {titles.map((_, i) => (
                    <span key={i} className={i <= step ? "done" : ""} />
                  ))}
                </div>
                {step === 0 && (
                  <>
                    <h2 className="mb-6 text-xl">{t("serviceLabel")}</h2>
                    <div className="form-group">
                      <label htmlFor="service" className="form-label">
                        {t("serviceLabel")}
                      </label>
                      <select
                        id="service"
                        className="form-input"
                        value={draft.service}
                        onChange={(e) => updateDraft({ service: e.target.value })}
                      >
                        {enabledServices(demo.state, cityId).map((c) => (
                          <option value={c.id} key={c.id}>
                            {c.names[locale]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Notice>{t("serviceInfo")}</Notice>
                    <div className="booking-inline-price">
                      <PriceBreakdown price={price} />
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="form-group">
                      <label htmlFor="problem" className="form-label">
                        {t("problem")}
                      </label>
                      <textarea
                        id="problem"
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "form-error" : undefined}
                        className="form-input min-h-40"
                        placeholder={t("problemPlaceholder")}
                        value={draft.problem}
                        onChange={(e) => updateDraft({ problem: e.target.value })}
                      />
                    </div>
                    <Notice>{t("quoteNote")}</Notice>
                  </>
                )}
                {step === 2 && (
                  <>
                    <div className="upload-zone">
                      <ImagePlus size={35} />
                      <label htmlFor="photos" className="form-label">
                        {t("photos")} · {t("optional")}
                      </label>
                      <p className="mb-5 text-xs text-muted-foreground">{t("photosHelp")}</p>
                      <input
                        type="file"
                        id="photos"
                        accept="image/*"
                        multiple
                        className="form-input"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (
                            files.length > 3 ||
                            files.some(
                              (f) => f.size > 5 * 1024 * 1024 || !f.type.startsWith("image/"),
                            )
                          ) {
                            setError(t("fileError"));
                            e.target.value = "";
                            return;
                          }
                          setError("");
                          updateDraft({ photoNames: files.map((f) => f.name) });
                        }}
                      />
                    </div>
                    <ul className="mt-5 space-y-2">
                      {draft.photoNames.map((name, i) => (
                        <li
                          key={i}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-md border p-3"
                        >
                          <span className="break-all text-sm">{name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${t("remove")} ${name}`}
                            onClick={() =>
                              updateDraft({
                                photoNames: draft.photoNames.filter((_, index) => index !== i),
                              })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {step === 3 && (
                  <>
                    <AddressEditor embedded />
                    <div className="form-group">
                      <label htmlFor="date" className="form-label">
                        {t("date")}
                      </label>
                      <input
                        type="date"
                        id="date"
                        min={today}
                        className="form-input"
                        value={draft.date}
                        onChange={(e) => updateDraft({ date: e.target.value })}
                      />
                    </div>
                    <fieldset className="form-group">
                      <legend className="form-label">{t("time")}</legend>
                      <div className="slot-grid">
                        {(["morning", "afternoon", "evening"] as MessageKey[]).map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={draft.time === time ? "default" : "outline"}
                            aria-pressed={draft.time === time}
                            onClick={() => updateDraft({ time })}
                          >
                            {t(time)}
                          </Button>
                        ))}
                      </div>
                    </fieldset>
                    <Notice warning>{t("availabilityNote")}</Notice>
                  </>
                )}
                {step === 4 && (
                  <>
                    <h2 className="mb-5 text-xl">{t("review")}</h2>
                    <div className="space-y-3">
                      <p>
                        <strong>{t("serviceLabel")}:</strong> {serviceName}
                      </p>
                      <p className="break-words">
                        <strong>{t("details")}:</strong> {draft.problem || t("notSelected")}
                      </p>
                      <p className="break-words">
                        <strong>{t("address")}:</strong> {draft.address || t("notSelected")}
                      </p>
                      <p>
                        <strong>{t("date")}:</strong>{" "}
                        {draft.date
                          ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                              new Date(draft.date + "T12:00:00"),
                            )
                          : t("notSelected")}
                      </p>
                      <p>
                        <strong>{t("time")}:</strong> {t(draft.time as MessageKey)}
                      </p>
                    </div>
                    <div className="booking-inline-price">
                      <PriceBreakdown price={price} />
                    </div>
                    <div className="mt-6">
                      <Notice warning>{t("quoteNote")}</Notice>
                    </div>
                    <label className="flex min-h-11 items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 size-5 shrink-0 accent-primary"
                        checked={draft.consent}
                        onChange={(e) => updateDraft({ consent: e.target.checked })}
                      />
                      {t("consent")}
                    </label>
                  </>
                )}
                {error && (
                  <div id="form-error" className="mt-4" role="alert">
                    <Notice error>{error}</Notice>
                  </div>
                )}
                {demo.error && (
                  <div role="alert">
                    <Notice error>{demo.error}</Notice>
                  </div>
                )}
                <div className="form-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate({ to: step === 0 ? "/services" : (paths[step - 1] ?? "/services") })
                    }
                  >
                    <ArrowLeft />
                    {t("back")}
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {t(step === 4 ? "submit" : "next")}
                    <ArrowRight />
                  </Button>
                </div>
              </form>
              <aside className="summary-panel">
                <h2>{t("summary")}</h2>
                <div className="summary-row">
                  <span>{t("serviceLabel")}</span>
                  <strong>{serviceName}</strong>
                </div>
                <div className="summary-row">
                  <span>{t("area")}</span>
                  <strong>
                    {demo.state.registry.cities.find((c) => c.id === cityId)?.names[locale]}
                  </strong>
                </div>
                <PriceBreakdown price={price} />
                <p className="mt-5 text-xs text-muted-foreground">{t("quoteNote")}</p>
                <div className="mt-5">
                  <Notice>{t("demo")}</Notice>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}

export function BookingHistory(props: { role?: Role; detail?: boolean; mode?: string }) {
  const { locale } = useFixHub();
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  useEffect(() => {
    let active = true;
    void resolveApiSessionMode().then((sessionMode) => {
      if (active)
        setMode(
          sessionMode === "authenticated" && (!props.role || props.role === "customer")
            ? "authenticated"
            : sessionMode,
        );
    });
    return () => {
      active = false;
    };
  }, [props.role]);
  if (mode === "checking")
    return (
      <PageShell>
        <main id="main" className="wrap">
          <p role="status">{locale === "te-IN" ? "లోడ్ అవుతోంది…" : "Loading your session…"}</p>
        </main>
      </PageShell>
    );
  if (mode === "authenticated")
    return <RealBookingHistory detail={props.detail} mode={props.mode} />;
  if (mode === "demo") return <DemoBookings {...props} />;
  return (
    <PageShell functionalPreview>
      <main id="main" className="wrap">
        <PageTop
          title={locale === "te-IN" ? "బుకింగ్‌లు అందుబాటులో లేవు" : "Bookings unavailable"}
        />
        <Notice warning>
          {mode === "unauthenticated" ? (
            <Link to="/sign-in">
              {locale === "te-IN"
                ? "మీ బుకింగ్‌లను చూడటానికి సైన్ ఇన్ చేయండి"
                : "Sign in to view your bookings"}
            </Link>
          ) : locale === "te-IN" ? (
            "సేవను తాత్కాలికంగా లోడ్ చేయలేకపోయాం."
          ) : (
            "The booking service is temporarily unavailable. Please try again shortly."
          )}
        </Notice>
      </main>
    </PageShell>
  );
}
export function SubmittedPage() {
  const { t } = useFixHub();
  return (
    <PageShell>
      <main id="main" className="wrap">
        <PageTop title={t("submitted")} />
        <Empty
          title="submitted"
          desc="submittedDesc"
          icon={CircleCheck}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/customer/bookings/$id" params={{ id: "demo" }}>
                  {t("viewBooking")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/services">{t("services")}</Link>
              </Button>
            </div>
          }
        />
      </main>
    </PageShell>
  );
}
