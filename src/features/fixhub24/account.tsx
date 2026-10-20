import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub24 } from "./context";
import { PageShell, PageTop, Notice } from "./shared";
import { DemoRolePage } from "./demo-pages";
import { resolveApiSessionMode, type ApiSessionMode, apiRequest, ApiError } from "./api-client";
export function AccountPage({ page = "profile" }: { page?: string }) {
  if (page.includes("delete-account")) return <DeletionRequestGate />;
  if (page === "notifications") return <WhatsAppPreferencesGate role="customer" />;
  return <DemoRolePage role="customer" page={page} />;
}

type WhatsAppContact = {
  phone: string;
  verified: boolean;
  consented: boolean;
  verificationPending?: boolean;
};

export function WhatsAppPreferencesGate({ role = "customer" }: { role?: "customer" | "merchant" }) {
  const { locale } = useFixHub24();
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  useEffect(() => {
    let active = true;
    void resolveApiSessionMode().then((result) => {
      if (active) setMode(result);
    });
    return () => {
      active = false;
    };
  }, []);
  if (mode === "checking")
    return (
      <PageShell functionalPreview>
        <main id="main" className="wrap">
          <p role="status">
            {locale === "te-IN" ? "లోడ్ అవుతోంది…" : "Loading notification preferences…"}
          </p>
        </main>
      </PageShell>
    );
  if (mode === "demo") return <DemoRolePage role={role} page="notifications" />;
  if (mode !== "authenticated")
    return (
      <PageShell role={role} functionalPreview>
        <main id="main" className="wrap">
          <PageTop title={locale === "te-IN" ? "సందేశాల అభిరుచులు" : "Messaging preferences"} />
          <Notice warning>
            {mode === "unauthenticated" ? (
              <Link to="/sign-in">
                {locale === "te-IN"
                  ? "సైన్ ఇన్ చేసి కొనసాగండి"
                  : "Sign in to manage your preferences"}
              </Link>
            ) : locale === "te-IN" ? (
              "సందేశాల సేవ తాత్కాలికంగా అందుబాటులో లేదు."
            ) : (
              "The messaging service is temporarily unavailable."
            )}
          </Notice>
        </main>
      </PageShell>
    );
  return <LiveWhatsAppPreferences role={role} />;
}

function LiveWhatsAppPreferences({ role }: { role: "customer" | "merchant" }) {
  const { locale } = useFixHub24();
  const te = locale === "te-IN";
  const [contact, setContact] = useState<WhatsAppContact | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [stage, setStage] = useState<"loading" | "ready" | "code" | "unavailable">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void apiRequest<{ contact: WhatsAppContact | null }>("/api/v1/account/whatsapp")
      .then((result) => {
        if (active) {
          setContact(result.contact);
          setStage(
            result.contact?.consented && result.contact.verificationPending ? "code" : "ready",
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setStage(cause instanceof ApiError && cause.status === 404 ? "unavailable" : "ready");
          if (!(cause instanceof ApiError && cause.status === 404))
            setError(cause instanceof Error ? cause.message : "Request failed");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function requestVerification(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest<{ contact: WhatsAppContact; message?: string }>(
        "/api/v1/account/whatsapp/verification",
        {
          method: "POST",
          body: JSON.stringify({ phoneE164: phone.trim(), consent: true }),
        },
      );
      setContact(result.contact);
      if (!result.contact.verified) setStage("code");
      setMessage(
        result.message ??
          (te ? "ఈ నంబర్ ఇప్పటికే ధృవీకరించబడింది." : "This number is already verified."),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : te
            ? "కోడ్ పంపలేకపోయాం."
            : "We could not request a verification code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await apiRequest<{ contact: WhatsAppContact }>(
        "/api/v1/account/whatsapp/verify",
        { method: "POST", body: JSON.stringify({ code }) },
      );
      setContact(result.contact);
      setStage("ready");
      setCode("");
      setConsent(false);
      setMessage(te ? "WhatsApp నంబర్ ధృవీకరించబడింది." : "Your WhatsApp number is verified.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : te
            ? "కోడ్ ధృవీకరించలేకపోయాం."
            : "We could not verify that code.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiRequest("/api/v1/account/whatsapp/consent/revoke", {
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      });
      setContact((current) => (current ? { ...current, consented: false } : current));
      setStage("ready");
      setMessage(te ? "WhatsApp సమ్మతి ఉపసంహరించబడింది." : "WhatsApp consent has been withdrawn.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : te
            ? "సమ్మతిని ఉపసంహరించలేకపోయాం."
            : "We could not withdraw consent.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell role={role} functionalPreview authState="signed-in">
      <main id="main" className="wrap pb-10">
        <PageTop
          title={te ? "సందేశాల అభిరుచులు" : "Messaging preferences"}
          desc={
            te
              ? "మీ సేవా నవీకరణలను ఎలా పొందాలో ఎంచుకోండి."
              : "Choose whether you want service updates over WhatsApp."
          }
        />
        {stage === "loading" ? (
          <p role="status">{te ? "లోడ్ అవుతోంది…" : "Loading…"}</p>
        ) : stage === "unavailable" ? (
          <Notice warning>
            {te
              ? "WhatsApp ధృవీకరణ ప్రస్తుతం అందుబాటులో లేదు. ఇమెయిల్/యాప్‌లోని బుకింగ్ స్థితినే ఆధారంగా తీసుకోండి."
              : "WhatsApp verification is not enabled. Use the booking status shown in your account as the source of truth."}
          </Notice>
        ) : (
          <section className="summary-panel max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold">{te ? "సేవా సందేశాలు" : "Service messages"}</h2>
            {contact && (
              <p role="status">
                {te
                  ? `నంబర్: ${contact.phone} · ధృవీకరణ: ${contact.verified ? "పూర్తి" : "పెండింగ్"} · సమ్మతి: ${contact.consented ? "ఇచ్చారు" : "లేదు"}`
                  : `Number: ${contact.phone} · Verification: ${contact.verified ? "verified" : "pending"} · Consent: ${contact.consented ? "on" : "off"}`}
              </p>
            )}
            {stage === "code" ? (
              <form onSubmit={verify} className="space-y-4">
                <label className="form-group">
                  <span className="form-label">
                    {te ? "ఆరు అంకెల ధృవీకరణ కోడ్" : "Six-digit verification code"}
                  </span>
                  <input
                    className="form-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </label>
                <Button type="submit" disabled={busy || code.length !== 6}>
                  {busy
                    ? te
                      ? "ధృవీకరిస్తోంది…"
                      : "Verifying…"
                    : te
                      ? "నంబర్ ధృవీకరించండి"
                      : "Verify number"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setCode("");
                    setPhone("");
                    setConsent(false);
                    setStage("ready");
                  }}
                >
                  {te
                    ? "మరొక నంబర్ లేదా కొత్త కోడ్ కోసం తిరిగి వెళ్లండి"
                    : "Back to enter the number and request another code"}
                </Button>
              </form>
            ) : !contact?.consented || !contact.verified ? (
              <form onSubmit={requestVerification} className="space-y-4">
                <label className="form-group">
                  <span className="form-label">
                    {te ? "WhatsApp నంబర్ (దేశ కోడ్‌తో)" : "WhatsApp number (with country code)"}
                  </span>
                  <input
                    className="form-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+919876543210"
                    pattern="\+[1-9][0-9]{7,14}"
                    maxLength={16}
                    required
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value.replace(/[^+0-9]/g, "").slice(0, 16))
                    }
                  />
                </label>
                <label className="flex min-h-11 items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-5"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  <span>
                    {te
                      ? "నా బుకింగ్‌లు మరియు ఖాతాకు సంబంధించిన సేవా సందేశాలను FixHub24 నుంచి WhatsApp ద్వారా పొందడానికి నేను అంగీకరిస్తున్నాను. ఇది ఐచ్ఛికం; ఎప్పుడైనా సమ్మతిని వెనక్కి తీసుకోవచ్చు. ప్రమోషనల్ సందేశాలకు ఈ సమ్మతిని ఉపయోగించరు."
                      : "I agree to receive optional service-related WhatsApp messages from FixHub24 about my bookings and account. I can withdraw consent at any time. This consent will not be used for promotional messages."}
                  </span>
                </label>
                <Button
                  type="submit"
                  disabled={busy || !consent || !/^\+[1-9]\d{7,14}$/.test(phone)}
                >
                  {busy
                    ? te
                      ? "కోడ్ అభ్యర్థిస్తోంది…"
                      : "Requesting code…"
                    : te
                      ? "సమ్మతించి ధృవీకరణ కోడ్ పొందండి"
                      : "Agree and request verification code"}
                </Button>
              </form>
            ) : (
              <Button variant="outline" disabled={busy} onClick={() => void revoke()}>
                {busy
                  ? te
                    ? "నవీకరిస్తోంది…"
                    : "Updating…"
                  : te
                    ? "WhatsApp సమ్మతిని ఉపసంహరించండి"
                    : "Withdraw WhatsApp consent"}
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {te
                ? "సందేశం ఆలస్యమైనా లేదా అందకపోయినా, బుకింగ్ స్థితి FixHub24 ఖాతాలోనే ప్రామాణికం."
                : "Messages may be delayed or unavailable. Your FixHub24 account remains the source of truth for booking status."}
            </p>
            {message && (
              <div role="status">
                <Notice>{message}</Notice>
              </div>
            )}
            {error && (
              <div role="alert">
                <Notice error>{error}</Notice>
              </div>
            )}
          </section>
        )}
      </main>
    </PageShell>
  );
}

function DeletionRequestGate() {
  const { locale } = useFixHub24();
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  useEffect(() => {
    let active = true;
    void resolveApiSessionMode().then((result) => {
      if (active) setMode(result);
    });
    return () => {
      active = false;
    };
  }, []);
  if (mode === "checking")
    return (
      <PageShell functionalPreview>
        <main id="main" className="wrap">
          <p role="status">{locale === "te-IN" ? "లోడ్ అవుతోంది…" : "Loading account status…"}</p>
        </main>
      </PageShell>
    );
  if (mode === "demo") return <DemoRolePage role="customer" page="settings/delete-account" />;
  if (mode !== "authenticated")
    return (
      <PageShell functionalPreview>
        <main id="main" className="wrap">
          <PageTop
            title={locale === "te-IN" ? "ఖాతా తొలగింపు అభ్యర్థన" : "Request account deletion"}
          />
          <Notice warning>
            {mode === "unauthenticated" ? (
              <Link to="/sign-in">
                {locale === "te-IN"
                  ? "మీ ఖాతాను ధృవీకరించి కొనసాగండి"
                  : "Sign in to verify your account"}
              </Link>
            ) : locale === "te-IN" ? (
              "గోప్యతా సేవ తాత్కాలికంగా అందుబాటులో లేదు."
            ) : (
              "The privacy service is temporarily unavailable. Please try again."
            )}
          </Notice>
        </main>
      </PageShell>
    );
  return <LiveDeletionRequest />;
}

function LiveDeletionRequest() {
  const { locale } = useFixHub24();
  const te = locale === "te-IN";
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState("");
  async function submit() {
    if (!confirmed || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ requestId: string }>("/api/v1/customer/account-deletion", {
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      });
      setRequestId(result.requestId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : te
            ? "అభ్యర్థన నమోదు కాలేదు."
            : "The request could not be recorded.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageShell role="customer" functionalPreview authState="signed-in">
      <main id="main" className="wrap pb-10">
        <PageTop title={te ? "ఖాతా తొలగింపును అభ్యర్థించండి" : "Request account deletion"} />
        {requestId ? (
          <Notice>
            {te
              ? `మీ అభ్యర్థన నమోదైంది. సూచన: ${requestId}. ఖాతా యాక్సెస్ నిలిపివేశారు. ఇది అన్ని రికార్డులు తొలగించబడ్డాయని నిర్ధారణ కాదు.`
              : `Request ${requestId} is recorded and account access is disabled. This is not confirmation that all records have been deleted; retention and legal holds will be reviewed.`}
          </Notice>
        ) : (
          <section className="summary-panel max-w-2xl" aria-busy={busy}>
            <Notice warning>
              {te
                ? "ఈ చర్య మీ సైన్-ఇన్ యాక్సెస్‌ను నిలిపివేస్తుంది. సేవా రికార్డులు, వివాదాలు, చట్టపరమైన నిల్వలు లేదా బ్యాకప్‌లలోని డేటా వెంటనే తొలగించబడదు."
                : "This disables account sign-in and records a deletion request. Service, dispute, legally held, and backup records are not immediately deleted; applicable retention must be reviewed."}
            </Notice>
            <p className="mt-4 text-sm">
              <Link className="underline" to="/privacy">
                {te ? "గోప్యతా సమాచారాన్ని చూడండి" : "Review the Privacy information"}
              </Link>
            </p>
            <label className="my-5 flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                {te
                  ? "నా ఖాతా తొలగింపు అభ్యర్థనను నమోదు చేసి యాక్సెస్ నిలిపివేయడానికి నేను అంగీకరిస్తున్నాను."
                  : "I confirm that I want to record an account-deletion request and disable access."}
              </span>
            </label>
            {error && (
              <div role="alert">
                <Notice error>{error}</Notice>
              </div>
            )}
            <Button
              variant="destructive"
              onClick={submit}
              disabled={!confirmed || busy}
              aria-busy={busy}
            >
              {busy && (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              )}
              {busy
                ? te
                  ? "నమోదు చేస్తోంది…"
                  : "Recording…"
                : te
                  ? "తొలగింపు అభ్యర్థనను నమోదు చేయండి"
                  : "Submit deletion request"}
            </Button>
            {busy && (
              <p className="mt-3 text-sm text-muted-foreground" role="status" aria-live="polite">
                {te
                  ? "మీ తొలగింపు అభ్యర్థనను నమోదు చేసి, సైన్-ఇన్‌ను నిలిపివేస్తున్నాం. ఇది రికార్డులు తొలగించబడ్డాయని నిర్ధారణ కాదు."
                  : "Recording your request and disabling sign-in. This does not confirm that records have been deleted."}
              </p>
            )}
          </section>
        )}
      </main>
    </PageShell>
  );
}
