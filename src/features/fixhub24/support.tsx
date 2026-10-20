import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, ApiError, resolveApiSession, type ApiSession } from "./api-client";
import { useFixHub24 } from "./context";
import { PageShell, PageTop, Notice } from "./shared";

type Ticket = {
  id: string;
  booking_id: string | null;
  subject: string;
  description: string;
  status: "open" | "in_review" | "resolved";
  response_text: string | null;
  version: number;
  created_at: string;
};
type TicketPage = { items: Ticket[]; nextCursor: string | null };
const failure = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Support is temporarily unavailable. Please try again.";

export function SupportPage({ staff = false }: { staff?: boolean }) {
  const { locale } = useFixHub24();
  const te = locale === "te-IN";
  const [session, setSession] = useState<ApiSession | null>(null);
  useEffect(() => {
    let active = true;
    void resolveApiSession().then((value) => {
      if (active) setSession(value);
    });
    return () => {
      active = false;
    };
  }, []);
  const permitted =
    session?.mode === "authenticated" &&
    (staff
      ? session.roles.some((role) => role === "admin" || role === "support")
      : session.roles.some((role) => role === "customer" || role === "merchant"));
  return (
    <PageShell
      role={staff ? "admin" : session?.roles.includes("merchant") ? "merchant" : "customer"}
      functionalPreview
    >
      <main id="main" className="wrap pb-10">
        <PageTop
          title={
            staff
              ? te
                ? "సహాయ అభ్యర్థనల ఇన్‌బాక్స్"
                : "Support inbox"
              : te
                ? "సహాయం మరియు సంప్రదింపు"
                : "Help and contact"
          }
        />
        {!session ? (
          <p role="status">{te ? "యాక్సెస్ తనిఖీ చేస్తున్నాం…" : "Checking support access…"}</p>
        ) : permitted ? (
          <SupportWorkspace staff={staff} te={te} />
        ) : (
          <Notice warning>
            {session.mode === "unauthenticated" ? (
              <Link to="/sign-in">
                {te
                  ? "మీ ఖాతాతో సైన్ ఇన్ చేసి సహాయం కోరండి"
                  : "Sign in to request help with your account"}
              </Link>
            ) : session.mode === "demo" ? (
              te ? (
                "ఈ ప్రివ్యూలో సహాయ అభ్యర్థనలు పంపబడవు."
              ) : (
                "Support requests cannot be sent from the unconfigured demonstration."
              )
            ) : session.mode === "unavailable" ? (
              te ? (
                "సహాయ సేవ తాత్కాలికంగా అందుబాటులో లేదు."
              ) : (
                "Support is temporarily unavailable."
              )
            ) : (
              <>
                {te
                  ? "ఈ ఖాతాకు ఈ సహాయ వీక్షణ అనుమతి లేదు."
                  : "This account cannot access this support view."}{" "}
                <Link to={staff ? "/customer/support" : "/admin/support"}>
                  {te ? "మరొక సహాయ వీక్షణ" : "Open the other support view"}
                </Link>
              </>
            )}
          </Notice>
        )}
      </main>
    </PageShell>
  );
}

function SupportWorkspace({ staff, te }: { staff: boolean; te: boolean }) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState("");
  const retry = useRef<{ payload: string; key: string } | null>(null);
  const reportFailure = useCallback((cause: unknown) => {
    setError(failure(cause));
    if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
      setItems([]);
      setNextCursor(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const query = new URLSearchParams(staff ? { view } : {});
    if (cursor) query.set("cursor", cursor);
    void apiRequest<TicketPage>(`/api/v1/support/${staff ? "inbox" : "requests"}?${query}`, {
      signal: controller.signal,
    })
      .then((page) => {
        if (!controller.signal.aborted) {
          setItems((current) => (cursor ? [...current, ...page.items] : page.items));
          setNextCursor(page.nextCursor);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) reportFailure(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [staff, view, cursor, refresh, reportFailure]);

  function reload() {
    setCursor(null);
    setRefresh((value) => value + 1);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const payload = JSON.stringify({
      subject: subject.trim(),
      message: message.trim(),
      ...(bookingId.trim() ? { bookingId: bookingId.trim() } : {}),
    });
    if (retry.current?.payload !== payload) retry.current = { payload, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    setReceipt("");
    try {
      const result = await apiRequest<{ ticket: Ticket }>("/api/v1/support/requests", {
        method: "POST",
        headers: { "Idempotency-Key": retry.current.key },
        body: payload,
      });
      setReceipt(result.ticket.id);
      setSubject("");
      setMessage("");
      setBookingId("");
      retry.current = null;
      reload();
    } catch (cause) {
      reportFailure(cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Notice warning>
        {te
          ? "ఇది అత్యవసర సేవ కాదు. పాస్‌వర్డ్‌లు, OTPలు, చెల్లింపు లేదా ప్రభుత్వ గుర్తింపు పత్రాలను పంపవద్దు. సమాధాన సమయం హామీ లేదు."
          : "This is not an emergency service. Do not send passwords, one-time codes, payment details or government identity documents. Response times are not guaranteed."}
      </Notice>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {receipt && (
        <p role="status">
          {te ? "అభ్యర్థన నమోదైంది. సూచన:" : "Request recorded. Reference:"} <code>{receipt}</code>
        </p>
      )}
      {!staff && (
        <form className="summary-panel space-y-4" onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            <legend className="text-lg font-semibold">
              {te ? "సహాయ అభ్యర్థన పంపండి" : "Send a support request"}
            </legend>
            <div>
              <label className="form-label" htmlFor="support-subject">
                {te ? "విషయం" : "Subject"}
              </label>
              <input
                id="support-subject"
                className="form-input"
                required
                minLength={3}
                maxLength={120}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="support-booking">
                {te ? "బుకింగ్ సూచన (ఐచ్ఛికం)" : "Booking reference (optional)"}
              </label>
              <input
                id="support-booking"
                className="form-input"
                maxLength={36}
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="support-message">
                {te ? "ఏం జరిగింది?" : "What happened?"}
              </label>
              <textarea
                id="support-message"
                className="form-input min-h-32"
                required
                minLength={10}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {te
                ? "మీ అభ్యర్థన మీ ఖాతాకు అనుసంధానమవుతుంది. సమాధానం మరియు స్థితిని కింద చూడండి."
                : "Your request is linked to your account. Check the requests below for its status and the latest staff reply."}
            </p>
            <Button
              type="submit"
              disabled={busy || subject.trim().length < 3 || message.trim().length < 10}
            >
              {busy && (
                <LoaderCircle
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {busy
                ? te
                  ? "నమోదు చేస్తోంది…"
                  : "Recording request…"
                : te
                  ? "అభ్యర్థన పంపండి"
                  : "Send request"}
            </Button>
          </fieldset>
        </form>
      )}
      <section className="space-y-4" aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            {staff ? (te ? "అభ్యర్థనలు" : "Requests") : te ? "మీ అభ్యర్థనలు" : "Your requests"}
          </h2>
          {staff && (
            <label>
              {te ? "చూపించు" : "Show"}
              <select
                className="form-input"
                value={view}
                onChange={(e) => {
                  setCursor(null);
                  setView(e.target.value);
                }}
              >
                <option value="active">{te ? "సక్రియం" : "Active"}</option>
                <option value="all">{te ? "అన్నీ" : "All requests"}</option>
              </select>
            </label>
          )}
          <Button variant="outline" disabled={loading} onClick={reload}>
            {te ? "తాజా చేయి" : "Refresh requests"}
          </Button>
        </div>
        {loading && (
          <p role="status">{te ? "అభ్యర్థనలు లోడ్ అవుతున్నాయి…" : "Loading requests…"}</p>
        )}
        {!loading && !items.length && !error && (
          <p>{te ? "ప్రస్తుతం అభ్యర్థనలు లేవు." : "No requests to show."}</p>
        )}
        {items.map((ticket) => (
          <TicketCard
            key={`${ticket.id}:${ticket.version}`}
            ticket={ticket}
            staff={staff}
            te={te}
            onUpdated={reload}
            onAccessDenied={reportFailure}
          />
        ))}
        {nextCursor && (
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              setCursor(nextCursor);
              setRefresh((value) => value + 1);
            }}
          >
            {te ? "మరిన్ని అభ్యర్థనలు" : "Load more requests"}
          </Button>
        )}
      </section>
    </div>
  );
}

function TicketCard({
  ticket,
  staff,
  te,
  onUpdated,
  onAccessDenied,
}: {
  ticket: Ticket;
  staff: boolean;
  te: boolean;
  onUpdated: () => void;
  onAccessDenied: (cause: unknown) => void;
}) {
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<Ticket["status"]>(
    ticket.status === "open" ? "in_review" : ticket.status,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const labels = {
    open: te ? "కొత్తది" : "Open",
    in_review: te ? "పరిశీలనలో ఉంది" : "In review",
    resolved: te ? "పరిష్కరించబడింది" : "Resolved",
  };
  async function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/api/v1/support/requests/${ticket.id}/response`, {
        method: "POST",
        body: JSON.stringify({
          response: response.trim(),
          status,
          expectedVersion: ticket.version,
        }),
      });
      onUpdated();
    } catch (cause) {
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403))
        onAccessDenied(cause);
      else setError(failure(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="summary-panel space-y-3">
      <h3 className="font-semibold">{ticket.subject}</h3>
      <p className="text-sm">
        {labels[ticket.status]} · <code className="break-all">{ticket.id}</code>
      </p>
      {ticket.booking_id && (
        <p className="text-sm">
          {te ? "బుకింగ్:" : "Booking:"} <code>{ticket.booking_id}</code>
        </p>
      )}
      <p className="whitespace-pre-wrap break-words">{ticket.description}</p>
      {ticket.response_text && (
        <div className="rounded-lg border p-3">
          <h4 className="font-medium">{te ? "తాజా సిబ్బంది సమాధానం" : "Latest staff reply"}</h4>
          <p className="whitespace-pre-wrap break-words">{ticket.response_text}</p>
        </div>
      )}
      {staff && (
        <form className="space-y-3" onSubmit={reply} aria-busy={busy}>
          <label className="form-label" htmlFor={`reply-${ticket.id}`}>
            {te ? "అభ్యర్థించిన వ్యక్తికి కనిపించే సమాధానం" : "Reply visible to the requester"}
          </label>
          <textarea
            id={`reply-${ticket.id}`}
            className="form-input min-h-24"
            required
            minLength={5}
            maxLength={2000}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={busy}
          />
          <label className="form-label" htmlFor={`status-${ticket.id}`}>
            {te ? "స్థితి" : "Status"}
          </label>
          <select
            id={`status-${ticket.id}`}
            className="form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value as Ticket["status"])}
            disabled={busy}
          >
            {Object.entries(labels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || response.trim().length < 5}>
            {busy && (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {te ? "సమాధానం మరియు స్థితిని సేవ్ చేయండి" : "Save reply and status"}
          </Button>
        </form>
      )}
    </article>
  );
}
