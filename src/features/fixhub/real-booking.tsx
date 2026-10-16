import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "./api-client";
import { useFixHub } from "./context";
import { Notice, PageShell, PageTop } from "./shared";

type Service = { id: string; name: string; category: string; description: string };
type Address = { id: string; label: string; address: string; locality: string; latitude: number | null; longitude: number | null };
type Booking = {
  id: string;
  status: string;
  scheduled_at: string | null;
  customer_note?: string;
  visit_price_paise: number;
  labor_estimate_paise: number;
  parts_estimate_paise: number | null;
  currency: string;
  payment_method: string;
  service_name: string;
  address_label: string;
  address_text?: string;
  locality: string;
  business_name?: string | null;
  quote_version?: string;
  customer_quote_accepted?: boolean;
  customer_rating?: number | null;
  customer_review?: string | null;
};

function rupees(paise: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function errorMessage(error: unknown, fallback: string, noProvider: string) {
  return error instanceof ApiError && error.code === "NO_ELIGIBLE_PROVIDER" ? noProvider : error instanceof Error ? error.message : fallback;
}

export function RealBookingPage() {
  const { locale } = useFixHub();
  const navigate = useNavigate();
  const te = locale === "te-IN";
  const [services, setServices] = useState<Service[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [label, setLabel] = useState("Home");
  const [addressText, setAddressText] = useState("");
  const [locality, setLocality] = useState("Tanuku");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [note, setNote] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedAddress, setSavedAddress] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ items: Service[] }>("/api/v1/services"),
      apiRequest<{ items: Address[] }>("/api/v1/customer/addresses"),
    ]).then(([serviceResult, addressResult]) => {
      if (!active) return;
      setServices(serviceResult.items);
      setAddresses(addressResult.items);
      setServiceId(serviceResult.items[0]?.id ?? "");
      setAddressId(addressResult.items[0]?.id ?? "");
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : (te ? "సేవలను లోడ్ చేయలేకపోయాం." : "Could not load services and saved addresses."));
    });
    return () => { active = false; };
  }, [te]);

  function useCurrentLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage(te ? "ఈ పరికరంలో స్థానం అందుబాటులో లేదు." : "Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationMessage(te ? "మీరు ఎంచుకున్న స్థానాన్ని ఫారమ్‌కు జోడించాం." : "Your chosen location was added to this address.");
      },
      () => setLocationMessage(te ? "స్థాన అనుమతి లభించలేదు. చిరునామా వివరాలు నమోదు చేయండి." : "Location was not shared. Enter the address details manually."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  async function saveAddress() {
    if (busy) return;
    setBusy(true);
    setError("");
    setSavedAddress(false);
    try {
      const result = await apiRequest<{ item: Address }>("/api/v1/customer/addresses", {
        method: "POST",
        body: JSON.stringify({ label, address: addressText, locality, ...(latitude === null ? {} : { latitude, longitude }) }),
      });
      setAddresses((current) => [result.item, ...current]);
      setAddressId(result.item.id);
      setSavedAddress(true);
      setIdempotencyKey("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (te ? "చిరునామా సేవ్ కాలేదు." : "The address could not be saved."));
    } finally { setBusy(false); }
  }

  async function createBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const chosenAddress = addresses.find((item) => item.id === addressId);
    if (!chosenAddress || (chosenAddress.latitude === null || chosenAddress.longitude === null)) {
      setError(te ? "సేవా లభ్యతను తనిఖీ చేయడానికి, చిరునామాను సేవ్ చేసే సమయంలో స్థానాన్ని స్పష్టంగా పంచుకోండి." : "Share location explicitly when saving the address so provider coverage can be checked.");
      return;
    }
    setBusy(true);
    const key = idempotencyKey || crypto.randomUUID();
    setIdempotencyKey(key);
    try {
      const result = await apiRequest<{ booking: { id: string } }>("/api/v1/customer/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({
          serviceId,
          addressId,
          note,
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        }),
      });
      await navigate({ to: "/customer/bookings/$id", params: { id: result.booking.id } });
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "IDEMPOTENCY_KEY_REUSED") setIdempotencyKey("");
      setError(errorMessage(cause, te ? "అభ్యర్థన పూర్తి కాలేదు." : "The booking request could not be completed.", te ? "ఈ ప్రాంతంలో ప్రస్తుతం ధృవీకరించిన సేవా ప్రదాతలు లేరు." : "No verified service provider is currently available for this service and location."));
    } finally { setBusy(false); }
  }

  return (
    <PageShell role="customer" functionalPreview authState="signed-in">
      <main id="main" className="wrap pb-10">
        <PageTop title={te ? "సేవను బుక్ చేయండి" : "Request a home service"} desc={te ? "ధరలు మరియు అందుబాటు సేవా ప్రదాతల ఆధారంగా చూపబడతాయి." : "Only verified providers accepting work in your service area can receive your request."} />
        {error && <div role="alert" className="mb-5"><Notice error>{error}</Notice></div>}
        <div className="content-grid">
          <form className="space-y-5" onSubmit={createBooking}>
            <section className="summary-panel">
              <h2 className="text-lg font-semibold">{te ? "సేవను ఎంచుకోండి" : "Choose a service"}</h2>
              <div className="form-group mt-4">
                <label className="form-label" htmlFor="live-service">{te ? "సేవ" : "Service"}</label>
                <select id="live-service" className="form-input" required value={serviceId} onChange={(event) => { setServiceId(event.target.value); setIdempotencyKey(""); }}>
                  <option value="">{te ? "సేవను ఎంచుకోండి" : "Select a service"}</option>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-foreground">{te ? "చివరి ఖర్చు పని తనిఖీ మరియు ధర అంగీకారానికి లోబడి ఉంటుంది." : "A provider confirms the inspection and final price before any work. Unknown costs are not treated as zero."}</p>
            </section>

            <section className="summary-panel">
              <h2 className="text-lg font-semibold">{te ? "సేవా చిరునామా" : "Service address"}</h2>
              {addresses.length > 0 && (
                <div className="form-group mt-4">
                  <label className="form-label" htmlFor="saved-address">{te ? "సేవ్ చేసిన చిరునామాలు" : "Saved addresses"}</label>
                  <select id="saved-address" className="form-input" value={addressId} onChange={(event) => setAddressId(event.target.value)}>
                    <option value="">{te ? "చిరునామాను ఎంచుకోండి" : "Choose an address"}</option>
                    {addresses.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.locality}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group mt-4">
                <label className="form-label" htmlFor="address-label">{te ? "చిరునామా పేరు" : "Address label"}</label>
                <input id="address-label" className="form-input" maxLength={40} value={label} onChange={(event) => setLabel(event.target.value)} />
              </div>
              <div className="form-group mt-4">
                <label className="form-label" htmlFor="address-text">{te ? "పూర్తి చిరునామా" : "Full address"}</label>
                <textarea id="address-text" className="form-input min-h-24" maxLength={500} required value={addressText} onChange={(event) => setAddressText(event.target.value)} />
              </div>
              <div className="form-group mt-4">
                <label className="form-label" htmlFor="address-locality">{te ? "ప్రాంతం / పట్టణం" : "Locality / town"}</label>
                <input id="address-locality" className="form-input" maxLength={120} required value={locality} onChange={(event) => setLocality(event.target.value)} />
              </div>
              <Button type="button" variant="outline" className="mt-3" onClick={useCurrentLocation} disabled={busy}>
                {te ? "నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి" : "Use my current location"}
              </Button>
              {latitude !== null && longitude !== null && <p className="mt-2 text-xs text-muted-foreground">{te ? "స్థానం ఎంచుకోబడింది" : "Location shared for this service request"}</p>}
              {locationMessage && <p role="status" className="mt-2 text-sm">{locationMessage}</p>}
              <Button type="button" variant="outline" className="mt-3 block" onClick={saveAddress} disabled={busy || !addressText.trim() || !locality.trim()}>
                {savedAddress ? (te ? "చిరునామా సేవ్ అయింది" : "Address saved") : (te ? "చిరునామాను సేవ్ చేయండి" : "Save this address")}
              </Button>
            </section>

            <section className="summary-panel">
              <h2 className="text-lg font-semibold">{te ? "సమయం మరియు పని వివరాలు" : "Timing and job details"}</h2>
              <div className="form-group mt-4">
                <label className="form-label" htmlFor="requested-time">{te ? "ఇష్టమైన సమయం (ఐచ్ఛికం)" : "Preferred time (optional)"}</label>
                <input id="requested-time" type="datetime-local" className="form-input" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">{te ? "ఇది అభ్యర్థన మాత్రమే; ధృవీకరించిన సమయం కాదు." : "This is a request only, not a confirmed appointment."}</p>
              </div>
              <div className="form-group mt-4">
                <label className="form-label" htmlFor="job-note">{te ? "పని వివరాలు (ఐచ్ఛికం)" : "Describe the issue (optional)"}</label>
                <textarea id="job-note" className="form-input min-h-24" maxLength={2000} value={note} onChange={(event) => { setNote(event.target.value); setIdempotencyKey(""); }} />
              </div>
            </section>
            <Button type="submit" disabled={busy || !serviceId || !addressId}>
              {busy ? (te ? "అభ్యర్థన పంపుతోంది…" : "Submitting request…") : (te ? "ధృవీకరించిన సేవా ప్రదాతలను వెతకండి" : "Find eligible providers")}
            </Button>
          </form>
          <aside className="summary-panel h-fit">
            <h2 className="text-lg font-semibold">{te ? "చెల్లింపు" : "Payment"}</h2>
            <p className="mt-2">{te ? "సేవ పూర్తయిన తర్వాత నగదు." : "Cash paid directly to the provider after service completion."}</p>
            <p className="mt-2 text-sm text-muted-foreground">{te ? "ఇది ఆన్‌లైన్ చెల్లింపు కాదు. తుది ధరను ముందుగా మీరు అంగీకరించాలి." : "No online payment is collected. You must see and accept the final price before work begins."}</p>
            <p className="mt-4 text-sm"><Link className="underline" to="/terms">{te ? "సేవా నిబంధనలు" : "Service terms"}</Link> · <Link className="underline" to="/privacy">{te ? "గోప్యత" : "Privacy"}</Link></p>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

export function RealBookingHistory({ detail = false }: { detail?: boolean; mode?: string }) {
  const { locale } = useFixHub();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const id = path.split("/")[3] ?? "";
  const [items, setItems] = useState<Booking[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmQuote, setConfirmQuote] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const actionKeys = useRef(new Map<string, string>());
  const te = locale === "te-IN";

  useEffect(() => {
    let active = true;
    setLoading(true);
    const request = detail
      ? apiRequest<{ booking: Booking }>(`/api/v1/customer/bookings/${encodeURIComponent(id)}`)
      : apiRequest<{ items: Booking[] }>("/api/v1/customer/bookings");
    request.then((result) => {
      if (!active) return;
      if (detail) setBooking((result as { booking: Booking }).booking);
      else setItems((result as { items: Booking[] }).items);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : (te ? "బుకింగ్‌లను లోడ్ చేయలేకపోయాం." : "Could not load bookings.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [detail, id, te]);

  async function refreshBooking() {
    if (!detail || !id || refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      const result = await apiRequest<{ booking: Booking }>(`/api/v1/customer/bookings/${encodeURIComponent(id)}`);
      setBooking(result.booking);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (te ? "స్థితిని తాజా చేయలేకపోయాం." : "We could not refresh this booking."));
    } finally { setRefreshing(false); }
  }

  async function completeBooking() {
    if (!booking || actionBusy || !confirmComplete) return;
    const key = actionKeys.current.get("complete") ?? crypto.randomUUID();
    actionKeys.current.set("complete", key);
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      await apiRequest(`/api/v1/customer/bookings/${encodeURIComponent(booking.id)}/complete`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({ confirm: true }),
      });
      actionKeys.current.delete("complete");
      setBooking({ ...booking, status: "completed" });
      setActionMessage(te ? "సేవ పూర్తయినట్లు నిర్ధారించబడింది. ఇప్పుడు మీ సమీక్షను ఇవ్వవచ్చు." : "Completion confirmed. You can now rate the service.");
      setConfirmComplete(false);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : (te ? "పూర్తి నిర్ధారణను సేవ్ చేయలేకపోయాం." : "Completion could not be saved. Please retry."));
    } finally { setActionBusy(false); }
  }

  async function approveQuote() {
    if (!booking || !booking.quote_version || actionBusy || !confirmQuote) return;
    const key = actionKeys.current.get("quote") ?? crypto.randomUUID();
    actionKeys.current.set("quote", key);
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      await apiRequest(`/api/v1/customer/bookings/${encodeURIComponent(booking.id)}/quote-approval`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({ confirm: true, quoteVersion: booking.quote_version }),
      });
      actionKeys.current.delete("quote");
      setBooking({ ...booking, customer_quote_accepted: true });
      setActionMessage(te ? "ప్రదర్శించిన నగదు ధరను మీరు ఆమోదించారు." : "You approved the displayed cash price.");
      setConfirmQuote(false);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : (te ? "ధర ఆమోదాన్ని సేవ్ చేయలేకపోయాం." : "Quote approval could not be saved. Please retry."));
    } finally { setActionBusy(false); }
  }

  async function submitReview() {
    if (!booking || actionBusy || booking.customer_rating != null) return;
    const key = actionKeys.current.get("review") ?? crypto.randomUUID();
    actionKeys.current.set("review", key);
    setActionBusy(true);
    setActionError("");
    setActionMessage("");
    try {
      const result = await apiRequest<{ review: { rating: number; comment: string } }>(`/api/v1/customer/bookings/${encodeURIComponent(booking.id)}/review`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({ rating, comment: reviewComment }),
      });
      actionKeys.current.delete("review");
      setBooking({ ...booking, customer_rating: result.review.rating, customer_review: result.review.comment });
      setActionMessage(te ? "ధన్యవాదాలు. మీ సమీక్ష నమోదు అయింది." : "Thank you. Your rating has been recorded.");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : (te ? "సమీక్షను సేవ్ చేయలేకపోయాం." : "Your rating could not be saved. Please retry."));
    } finally { setActionBusy(false); }
  }

  return (
    <PageShell role="customer" functionalPreview authState="signed-in">
      <main id="main" className="wrap pb-10">
        <PageTop title={te ? "నా బుకింగ్‌లు" : "My bookings"} />
        {error && <div role="alert" className="mb-4"><Notice error>{error}</Notice></div>}
        {actionError && <div role="alert" className="mb-4"><Notice error>{actionError}</Notice></div>}
        {actionMessage && <div role="status" className="mb-4"><Notice>{actionMessage}</Notice></div>}
        {detail && !loading && <div className="mb-4"><Button variant="outline" disabled={refreshing} onClick={() => void refreshBooking()}>{refreshing ? (te ? "తాజా స్థితి…" : "Refreshing status…") : (te ? "స్థితిని తాజా చేయి" : "Refresh status")}</Button></div>}
        {loading ? <p role="status">{te ? "లోడ్ అవుతోంది…" : "Loading…"}</p> : detail ? booking ? (
          <article className="summary-panel">
            <h2 className="text-xl font-semibold">{booking.service_name}</h2>
            <p className="mt-2">{te ? "స్థితి" : "Status"}: {booking.status}</p>
            {(booking.status === "requested" || booking.status === "offered") && <Notice warning>{te ? "అభ్యర్థన సేవ్ అయింది; ఈ విడుదలలో సేవా ప్రదాతలకు ఇంకా సందేశాలు పంపడం లేదా కేటాయింపు చేయడం లేదు." : "Your request is saved and visible to eligible merchants, but they have not been notified or assigned in this build."}</Notice>}
            <p>{booking.address_label} · {booking.locality}</p>
            {booking.address_text && <p className="mt-1">{booking.address_text}</p>}
            {booking.business_name && <p>{booking.business_name}</p>}
            <dl className="mt-5 space-y-2">
              <div><dt className="inline">{te ? "పరిశీలన ఛార్జీ" : "Visit charge"}: </dt><dd className="inline">{rupees(booking.visit_price_paise, locale)}</dd></div>
              <div><dt className="inline">{te ? "శ్రమ అంచనా" : "Labour estimate"}: </dt><dd className="inline">{rupees(booking.labor_estimate_paise, locale)}</dd></div>
              <div><dt className="inline">{te ? "భాగాలు" : "Parts"}: </dt><dd className="inline">{booking.parts_estimate_paise === null ? (te ? "అవసరమైతే తనిఖీ తర్వాత కోట్" : "Quoted after inspection if needed") : rupees(booking.parts_estimate_paise, locale)}</dd></div>
              <div className="border-t pt-2 font-semibold"><dt className="inline">{te ? "ప్రదర్శించిన మొత్తం అంచనా" : "Displayed estimate"}: </dt><dd className="inline">{rupees(booking.visit_price_paise + booking.labor_estimate_paise + (booking.parts_estimate_paise ?? 0), locale)}{booking.parts_estimate_paise === null && <span className="ml-1 text-xs font-normal text-muted-foreground">{te ? "· భాగాలు అదనం కావచ్చు" : "· parts may be additional"}</span>}</dd></div>
            </dl>
            <Notice>{te ? "ధర అంచనా మాత్రమే; పని ప్రారంభించే ముందు తుది ధరను మీరు అంగీకరించాలి. నగదు చెల్లింపు మాత్రమే." : "Indicative estimate only. Accept the final provider price before work begins. Cash on completion only; no online payment is collected."}</Notice>
            {booking.status === "accepted" && !booking.customer_quote_accepted && <section className="mt-5 space-y-3 rounded-xl border p-4" aria-labelledby="quote-approval-title">
              <h3 id="quote-approval-title" className="font-semibold">{te ? "సేవకు ముందు ధరను ఆమోదించండి" : "Approve the price before work starts"}</h3>
              <p className="text-sm">{te ? "ఇది ప్రదర్శించిన ధరలకు మీ అంగీకారం. అవసరమైన భాగాల ధర ఇక్కడ లేకపోతే, ఆ పని ముందు వేరే కోట్ ఇచ్చి మీ అనుమతి తీసుకోవాలి." : "This approves the displayed price. If a parts price is not shown above, the provider must quote it separately and get your approval before doing that work."}</p>
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmQuote} onChange={(event) => setConfirmQuote(event.target.checked)} /><span>{te ? "ప్రదర్శించిన నగదు ధరను నేను ఆమోదిస్తున్నాను." : "I approve the displayed price for cash payment directly to the provider on completion."}</span></label>
              <Button disabled={!confirmQuote || actionBusy} onClick={() => void approveQuote()}>{actionBusy ? (te ? "సేవ్ అవుతోంది…" : "Saving…") : (te ? "ధరను ఆమోదించు" : "Approve price")}</Button>
            </section>}
            {booking.status === "accepted" && booking.customer_quote_accepted && <Notice>{te ? "మీరు ప్రదర్శించిన నగదు ధరను ఆమోదించారు. భాగాల ధర ఇక్కడ లేకపోతే, ఆ పని ముందు మీ అనుమతి అవసరం." : "You approved the displayed cash price. If a parts price is not shown above, your approval is still required before that work begins."}</Notice>}
            {booking.status === "in_progress" && <section className="mt-5 space-y-3 rounded-xl border p-4" aria-labelledby="completion-confirmation-title">
              <h3 id="completion-confirmation-title" className="font-semibold">{te ? "పని పూర్తయిందా?" : "Has the service been completed?"}</h3>
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmComplete} onChange={(event) => setConfirmComplete(event.target.checked)} /><span>{te ? "పని పూర్తయిందని నేను నిర్ధారిస్తున్నాను." : "I confirm that the service work is complete."}</span></label>
              <Button disabled={!confirmComplete || actionBusy} onClick={() => void completeBooking()}>{actionBusy ? (te ? "సేవ్ అవుతోంది…" : "Saving…") : (te ? "పూర్తి నిర్ధారించు" : "Confirm completion")}</Button>
              <p className="text-xs text-muted-foreground">{te ? "ఇది పని పూర్తి నిర్ధారణ మాత్రమే; చెల్లింపు లేదా పన్ను బిల్లు ధృవీకరణ కాదు." : "This confirms service completion only. It does not verify payment or create a tax invoice."}</p>
            </section>}
            {booking.status === "completed" && booking.customer_rating == null && <section className="mt-5 space-y-3 rounded-xl border p-4" aria-labelledby="rating-title">
              <h3 id="rating-title" className="font-semibold">{te ? "మీ అనుభవాన్ని రేట్ చేయండి" : "Rate your experience"}</h3>
              <label className="block text-sm" htmlFor="service-rating">{te ? "రేటింగ్ (1–5)" : "Rating (1–5)"}</label>
              <select id="service-rating" className="min-h-11 rounded-md border bg-background px-3" value={rating} onChange={(event) => setRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select>
              <label className="block text-sm" htmlFor="service-review">{te ? "వ్యాఖ్య (ఐచ్ఛికం)" : "Comment (optional)"}</label>
              <textarea id="service-review" className="min-h-24 w-full rounded-md border bg-background p-3" maxLength={1000} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
              <Button disabled={actionBusy} onClick={() => void submitReview()}>{actionBusy ? (te ? "సేవ్ అవుతోంది…" : "Saving…") : (te ? "సమీక్ష పంపు" : "Submit rating")}</Button>
              <p className="text-xs text-muted-foreground">{te ? "ఈ సమీక్ష ప్రస్తుతం మీ ఖాతాలో మాత్రమే కనిపిస్తుంది." : "Your review is stored privately; public display and moderation are not yet available."}</p>
            </section>}
            {booking.customer_rating != null && <div className="mt-5 rounded-xl border p-4"><h3 className="font-semibold">{te ? "మీ సమీక్ష" : "Your review"}: {booking.customer_rating}/5</h3>{booking.customer_review && <p className="mt-2 whitespace-pre-wrap">{booking.customer_review}</p>}</div>}
            <div className="mt-4 flex gap-3"><Button asChild variant="outline"><Link to="/contact">{te ? "మద్దతును సంప్రదించండి" : "Contact support"}</Link></Button><Button asChild><Link to="/customer/book/new">{te ? "మరొక సేవను అభ్యర్థించండి" : "Request another service"}</Link></Button></div>
          </article>
        ) : <Notice>{te ? "ఈ బుకింగ్ దొరకలేదు." : "This booking was not found."}</Notice> : (
          <>
            <Button asChild className="mb-5"><Link to="/customer/book/new">{te ? "కొత్త సేవను అభ్యర్థించండి" : "Request a service"}</Link></Button>
            {items.length === 0 ? <Notice>{te ? "ఇంకా బుకింగ్‌లు లేవు." : "No bookings yet."}</Notice> : <div className="grid gap-4 md:grid-cols-2">{items.map((item) => (
              <Link key={item.id} className="summary-panel block" to="/customer/bookings/$id" params={{ id: item.id }}>
                <h2 className="font-semibold">{item.service_name}</h2>
                <p>{item.status} · {item.address_label}, {item.locality}</p>
                <p>{rupees(item.visit_price_paise + item.labor_estimate_paise, locale)} · {te ? "భాగాలు అవసరమైతే అదనం; నగదు" : "Parts quoted separately if needed · Cash"}</p>
              </Link>
            ))}</div>}
          </>
        )}
      </main>
    </PageShell>
  );
}
