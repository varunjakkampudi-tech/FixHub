import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowRight, ArrowLeft, ImagePlus, CircleCheck, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { categories, type MessageKey } from "./locales";
import { PageShell, PageTop, Notice, Empty, Modal } from "./shared";
import { useDemo } from "./demo-context";
import { PriceBreakdown } from "./demo-price";
import { calculate, categoriesDemo, zones, type Category } from "./demo-model";
import { dt } from "./demo-copy";
import { CityPicker, AddressEditor, SampleProviders } from "./location-ui";
import { enabledServices, ratesFor } from "./location-model";
import { lt } from "./location-copy";
export { DemoBookings as BookingHistory } from "./demo-pages";
const paths = [
  "/customer/book/new",
  "/customer/book/details",
  "/customer/book/photos",
  "/customer/book/schedule",
  "/customer/book/review",
];
export function BookingPage({ step = 0 }: { step?: number }) {
  const { t, locale, draft, updateDraft, setSubmitted, setCancelled } = useFixHub();
  const demo = useDemo();
  const zone = draft.zone;
  const setZone = (zone: string) => updateDraft({ zone });
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
function LegacyBookingHistory({
  detail = false,
  mode = "timeline",
}: {
  detail?: boolean;
  mode?: string;
}) {
  const { t, draft, locale, submitted, cancelled, setCancelled } = useFixHub();
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const name = categories.find((c) => c.id === draft.service);
  return (
    <PageShell>
      <main id="main" className="wrap pb-8">
        <PageTop title={t(detail ? "viewBooking" : "bookings")} desc={t("demo")} />
        {!detail && !submitted ? (
          <Empty
            title="noBookings"
            desc="noBookingsDesc"
            action={
              <Button asChild>
                <Link to="/customer/book/new">{t("book")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="content-grid">
            <section>
              <Notice warning>{t("submittedDesc")}</Notice>
              <div className="service-card">
                <span className="status">{t(cancelled ? "cancelled" : "requestOnly")}</span>
                <h2>{locale === "te-IN" ? name?.te : name?.en}</h2>
                <p>{draft.problem || t("sampleOffer")}</p>
                {!detail ? (
                  <Link className="text-link" to="/customer/bookings/$id" params={{ id: "demo" }}>
                    {t("viewBooking")}
                    <ArrowRight size={15} />
                  </Link>
                ) : (
                  <>
                    <h3>{t("timeline")}</h3>
                    <div className="timeline">
                      {(
                        [
                          "draft",
                          "matching",
                          "assigned",
                          "waitingQuote",
                          "work",
                          "completed",
                        ] as MessageKey[]
                      ).map((s, i) => (
                        <div className="timeline-item" key={s}>
                          {i === 0 ? <CircleCheck size={20} /> : <Clock size={20} />}
                          <div>
                            <strong>{t(s)}</strong>
                            {i === 1 && <p>{t("availabilityNote")}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {mode === "quote" || mode === "payment" ? (
                      <Notice>{t("quoteNote")}</Notice>
                    ) : null}
                    {mode === "review" || mode === "complaint" ? (
                      <label className="form-label">
                        {t("message")}
                        <textarea className="form-input mt-3" onChange={() => setSaved(false)} />
                        <Button className="mt-3" onClick={() => setSaved(true)}>
                          {t("sendDemo")}
                        </Button>
                      </label>
                    ) : null}
                    {mode === "reschedule" ? (
                      <div className="form-group">
                        <label htmlFor="reschedule" className="form-label">
                          {t("date")}
                        </label>
                        <input id="reschedule" type="date" className="form-input" />
                        <Button className="mt-3" onClick={() => setSaved(true)}>
                          {t("saveChanges")}
                        </Button>
                      </div>
                    ) : null}
                    {saved && <Notice>{t("saved")}</Notice>}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setConfirm(true)}
                        disabled={cancelled}
                      >
                        {t("cancel")}
                      </Button>
                      <Button asChild variant="ghost">
                        <Link to="/customer/bookings/$id/reschedule" params={{ id: "demo" }}>
                          {t("calendar")}
                        </Link>
                      </Button>
                      <Button asChild variant="ghost">
                        <Link to="/customer/bookings/$id/complaint" params={{ id: "demo" }}>
                          {t("reportIssue")}
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </section>
            <aside className="summary-panel">
              <h2>{t("summary")}</h2>
              <p className="text-sm text-muted-foreground">{t("quoteNote")}</p>
              <Link to="/help" className="text-link">
                {t("help")}
                <ArrowRight size={15} />
              </Link>
            </aside>
          </div>
        )}
      </main>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={t("confirmTitle")}
        description={t("confirmDesc")}
      >
        <Button
          onClick={() => {
            setCancelled(true);
            setConfirm(false);
          }}
        >
          {t("confirm")}
        </Button>
      </Modal>
    </PageShell>
  );
}
