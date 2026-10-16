import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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

  return (
    <PageShell role="customer" functionalPreview authState="signed-in">
      <main id="main" className="wrap pb-10">
        <PageTop title={te ? "నా బుకింగ్‌లు" : "My bookings"} />
        {error && <div role="alert" className="mb-4"><Notice error>{error}</Notice></div>}
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
            </dl>
            <Notice>{te ? "ధర అంచనా మాత్రమే; పని ప్రారంభించే ముందు తుది ధరను మీరు అంగీకరించాలి. నగదు చెల్లింపు మాత్రమే." : "Indicative estimate only. Accept the final provider price before work begins. Cash on completion only; no online payment is collected."}</Notice>
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
