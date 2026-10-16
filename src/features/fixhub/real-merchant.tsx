import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "./api-client";
import { useFixHub } from "./context";
import { Notice, PageTop } from "./shared";

type Offer = {
  offer_id: string;
  booking_id: string;
  service_name: string;
  category: string;
  scheduled_at: string | null;
  locality: string;
  visit_estimate_paise: number;
  labor_estimate_paise: number;
  expires_at: string | null;
};

type Job = {
  id: string;
  status: string;
  scheduled_at: string | null;
  service_name: string;
  address_label: string;
  address_text: string;
  locality: string;
  latitude: number | null;
  longitude: number | null;
  visit_price_paise: number;
  labor_estimate_paise: number;
  parts_estimate_paise: number | null;
};

export function googleMapsDirectionsUrl(latitude: number, longitude: number): string {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Coordinates are outside the valid range.");
  }
  const query = new URLSearchParams({ api: "1", destination: `${latitude},${longitude}` });
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}

function money(paise: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function dateLabel(value: string | null, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function RealMerchantPage({ page }: { page: "requests" | "jobs" }) {
  const { locale } = useFixHub();
  const te = locale === "te-IN";
  const [offers, setOffers] = useState<Offer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<string | null>(null);
  const [pendingJob, setPendingJob] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const retryKeys = useRef(new Map<string, string>());
  const jobRetryKeys = useRef(new Map<string, string>());

  async function load(showLoader = false) {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      if (page === "requests") {
        const result = await apiRequest<{ items: Offer[] }>("/api/v1/merchant/offers");
        setOffers(result.items);
      } else {
        const result = await apiRequest<{ items: Job[] }>("/api/v1/merchant/jobs");
        setJobs(result.items);
      }
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 403
        ? (te ? "ఈ ఖాతాకు వ్యాపారి పనుల అనుమతి లేదు." : "This account is not authorized for merchant work.")
        : (cause instanceof Error ? cause.message : (te ? "ఇప్పుడే లోడ్ చేయలేకపోయాం." : "We could not load this page right now.")));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { void load(true); }, [page]);

  async function respond(offerId: string, decision: "accept" | "decline") {
    const key = `${offerId}:${decision}`;
    const idempotencyKey = retryKeys.current.get(key) ?? crypto.randomUUID();
    retryKeys.current.set(key, idempotencyKey);
    setPendingOffer(offerId);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/v1/merchant/offers/${encodeURIComponent(offerId)}/response`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ decision }),
      });
      retryKeys.current.delete(key);
      setMessage(decision === "accept"
        ? (te ? "పని మీకు కేటాయించబడింది. పూర్తి చిరునామా నా పనుల్లో అందుబాటులో ఉంది." : "You accepted the job. Its service address is now available under My jobs.")
        : (te ? "మీరు అభ్యర్థనను తిరస్కరించారు." : "You declined this offer."));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (te ? "స్పందన నమోదు కాలేదు. మళ్లీ ప్రయత్నించండి." : "Your response was not recorded. Please retry."));
    } finally { setPendingOffer(null); }
  }

  async function startJob(jobId: string) {
    const key = jobRetryKeys.current.get(jobId) ?? crypto.randomUUID();
    jobRetryKeys.current.set(jobId, key);
    setPendingJob(jobId);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/api/v1/merchant/jobs/${encodeURIComponent(jobId)}/start`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
      });
      jobRetryKeys.current.delete(jobId);
      setMessage(te ? "పని ప్రారంభించినట్లు నమోదు అయింది." : "Job marked as in progress.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (te ? "పని స్థితిని మార్చలేకపోయాం." : "We could not update the job status."));
    } finally { setPendingJob(null); }
  }

  return (
    <section className="space-y-5">
      <PageTop
        title={page === "requests" ? (te ? "కొత్త పని అభ్యర్థనలు" : "Incoming work") : (te ? "నా పనులు" : "My jobs")}
        desc={page === "requests"
          ? (te ? "మీరు ధృవీకరించిన సేవలు, ప్రాంతానికి సరిపడే అభ్యర్థనలు మాత్రమే." : "Only pending offers for your verified services and service area appear here.")
          : (te ? "మీకు కేటాయించిన పనుల చిరునామాలు మాత్రమే ఇక్కడ చూపబడతాయి." : "Full service addresses are shown only for jobs assigned to your merchant account.")}
      />
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void load()} disabled={loading || refreshing}>
          {refreshing ? (te ? "తాజా సమాచారం…" : "Refreshing…") : (te ? "తాజా సమాచారం పొందండి" : "Refresh")}
        </Button>
      </div>
      {error && <div role="alert"><Notice error>{error}</Notice></div>}
      {message && <div role="status"><Notice>{message}</Notice></div>}
      <Notice warning>{te ? "వాట్సాప్ / పుష్ నోటిఫికేషన్లు ఇంకా సక్రియంగా లేవు; కొత్త అభ్యర్థనలను చూడటానికి రిఫ్రెష్ చేయండి." : "WhatsApp/push notifications are not active yet. Refresh to check for new offers."}</Notice>
      {loading ? (
        <div role="status" aria-label={te ? "పనులు లోడ్ అవుతున్నాయి" : "Loading work"} className="space-y-3">
          {[0, 1].map((item) => <div key={item} className="h-36 animate-pulse motion-reduce:animate-none rounded-xl border bg-muted/40" />)}
        </div>
      ) : page === "requests" ? (
        offers.length ? <div className="grid gap-4 xl:grid-cols-2">{offers.map((offer) => (
          <article key={offer.offer_id} className="summary-panel space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="status">{te ? "కొత్త అభ్యర్థన" : "New offer"}</span>
              {offer.expires_at && <span className="text-xs text-muted-foreground">{te ? "గడువు" : "Expires"}: {dateLabel(offer.expires_at, locale, "—")}</span>}
            </div>
            <h2 className="text-lg font-semibold">{offer.service_name}</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-muted-foreground">{te ? "ప్రాంతం" : "Locality"}</dt><dd>{offer.locality}</dd></div>
              <div><dt className="text-muted-foreground">{te ? "సమయం" : "Requested time"}</dt><dd>{dateLabel(offer.scheduled_at, locale, te ? "తక్షణ సేవ" : "As soon as available")}</dd></div>
              <div><dt className="text-muted-foreground">{te ? "సందర్శన ఛార్జీ" : "Visit charge"}</dt><dd>{money(offer.visit_estimate_paise, locale)}</dd></div>
              <div><dt className="text-muted-foreground">{te ? "శ్రమ అంచనా" : "Labour estimate"}</dt><dd>{money(offer.labor_estimate_paise, locale)}</dd></div>
            </dl>
            <p className="text-xs text-muted-foreground">{te ? "పని వివరాలు, తుది ధరను కస్టమర్‌తో నిర్ధారించండి. ఈ అభ్యర్థన ఇంకా మీకు కేటాయించబడలేదు." : "Confirm job details and the final price with the customer. Accepting claims this request for your business."}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button disabled={pendingOffer !== null} onClick={() => void respond(offer.offer_id, "accept")}>
                {pendingOffer === offer.offer_id ? (te ? "సేవ్ అవుతోంది…" : "Saving…") : (te ? "అంగీకరించు" : "Accept offer")}
              </Button>
              <Button variant="outline" disabled={pendingOffer !== null} onClick={() => void respond(offer.offer_id, "decline")}>{te ? "తిరస్కరించు" : "Decline"}</Button>
            </div>
          </article>
        ))}</div> : <div role="status"><Notice>{te ? "మీ ధృవీకరించిన సేవలకు ప్రస్తుతం కొత్త అభ్యర్థనలు లేవు." : "No matching offers are available right now. Refresh later to check again."}</Notice></div>
      ) : jobs.length ? <div className="grid gap-4 xl:grid-cols-2">{jobs.map((job) => (
        <article key={job.id} className="summary-panel space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{job.service_name}</h2><span className="status">{job.status}</span></div>
          <p className="text-sm">{job.address_label} · {job.locality}</p>
          <p className="text-sm">{job.address_text}</p>
          <p className="text-sm text-muted-foreground">{dateLabel(job.scheduled_at, locale, te ? "సమయం నిర్ధారణ కాలేదు" : "Time not confirmed")}</p>
          <p className="text-sm">{te ? "ధర అంచనా" : "Current estimate"}: {money(job.visit_price_paise + job.labor_estimate_paise, locale)} · {te ? "భాగాలు అవసరమైతే అదనం" : "parts quoted separately if needed"}</p>
          {job.latitude !== null && job.longitude !== null && <a className="inline-flex min-h-11 items-center rounded-md border px-4 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={googleMapsDirectionsUrl(Number(job.latitude), Number(job.longitude))} target="_blank" rel="noopener noreferrer">{te ? "Google Mapsలో దిశలు తెరవండి" : "Open directions in Google Maps"}</a>}
          {job.status === "accepted" && <Button disabled={pendingJob !== null} onClick={() => void startJob(job.id)}>{pendingJob === job.id ? (te ? "సేవ్ అవుతోంది…" : "Saving…") : (te ? "పని ప్రారంభించు" : "Start job")}</Button>}
          {job.status === "in_progress" && <p className="text-sm text-muted-foreground">{te ? "పని పూర్తయ్యాక కస్టమర్ పూర్తి చేసినట్లు నిర్ధారిస్తారు." : "The customer will confirm completion after the work is finished."}</p>}
        </article>
      ))}</div> : <div role="status"><Notice>{te ? "మీకు కేటాయించిన పనులు ఇంకా లేవు." : "Accepted jobs assigned to your business will appear here."}</Notice></div>}
    </section>
  );
}
