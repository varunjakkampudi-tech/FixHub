import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { apiRequest, ApiError } from "./api-client";
import { PageShell, PageTop, Notice } from "./shared";

export function RealAuth({ mode = "sign-in" }: { mode?: string }) {
  const { locale } = useFixHub();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const te = locale === "te-IN";
  const registering = mode.includes("register");

  async function requestEmailCode() {
    const result = await apiRequest<{ message: string }>("/api/v1/auth/code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setMessage(result.message);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (stage === "email") {
        await requestEmailCode();
        setStage("code");
      } else {
        const session = await apiRequest<{ roles?: string[] }>("/api/v1/auth/verify", {
          method: "POST",
          body: JSON.stringify({ email, code }),
        });
        if (session.roles?.includes("admin")) await navigate({ to: "/admin" });
        else if (session.roles?.includes("merchant")) await navigate({ to: "/merchant/requests" });
        else if (session.roles?.includes("technician")) await navigate({ to: "/technician/jobs" });
        else await navigate({ to: "/customer/bookings" });
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : (te ? "అభ్యర్థన పూర్తి కాలేదు. మళ్లీ ప్రయత్నించండి." : "We could not complete that request. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (busy || stage !== "code") return;
    setBusy(true);
    setResending(true);
    setError("");
    setMessage("");
    try {
      await requestEmailCode();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : (te ? "కోడ్‌ను మళ్లీ పంపలేకపోయాం. కొద్దిసేపటి తర్వాత ప్రయత్నించండి." : "We could not resend the code. Please try again shortly."));
    } finally {
      setResending(false);
      setBusy(false);
    }
  }

  return (
    <PageShell functionalPreview authState="signed-out">
      <main id="main" className="wrap">
        <section className="mx-auto max-w-lg pb-10">
          <PageTop
            title={stage === "code"
              ? (te ? "మీ ఇమెయిల్‌ను ధృవీకరించండి" : "Check your email")
              : registering
                ? (te ? "Fix Hubలో చేరండి" : "Create your Fix Hub account")
                : (te ? "Fix Hubకు సైన్ ఇన్ చేయండి" : "Sign in to Fix Hub")}
            desc={stage === "code"
              ? (te ? "మీరు అందుకున్న ఆరు అంకెల కోడ్‌ను నమోదు చేయండి." : "Enter the six-digit code we sent you. It expires after ten minutes.")
              : (te ? "మీ ఇమెయిల్‌తో సురక్షితంగా కొనసాగండి." : "Use your email to continue. No password is required.")}
          />
          <form onSubmit={submit} noValidate>
            {stage === "email" ? (
              <div className="form-group">
                <label htmlFor="fixhub-email" className="form-label">{te ? "ఇమెయిల్ చిరునామా" : "Email address"}</label>
                <input
                  id="fixhub-email"
                  className="form-input"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy}
                />
              </div>
            ) : (
              <div className="fixhub-auth-step">
                <p className="mb-4 text-sm">{email}</p>
                <div className="form-group">
                  <label htmlFor="fixhub-code" className="form-label">{te ? "ఆరు అంకెల కోడ్" : "Six-digit code"}</label>
                  <input
                    id="fixhub-code"
                    className="form-input"
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={busy}
                  />
                </div>
              </div>
            )}
            {message && <div role="status" className="mb-4"><Notice>{message}</Notice></div>}
            {error && <div role="alert" className="mb-4"><Notice error>{error}</Notice></div>}
            <Button type="submit" className="w-full" disabled={busy || (stage === "code" && code.length !== 6)}>
              {busy ? (te ? "దయచేసి వేచి ఉండండి…" : "Please wait…") : stage === "email" ? (te ? "కోడ్ పంపండి" : "Send sign-in code") : (te ? "ధృవీకరించి కొనసాగండి" : "Verify and continue")}
            </Button>
            {stage === "code" && (
              <div className="mt-2 grid gap-1">
                <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={() => void resendCode()}>
                  {resending ? (te ? "పంపిస్తోంది…" : "Sending…") : (te ? "కోడ్‌ను మళ్లీ పంపండి" : "Resend code")}
                </Button>
                <Button type="button" variant="ghost" className="w-full" disabled={busy} onClick={() => { setStage("email"); setCode(""); setMessage(""); }}>
                  {te ? "ఇమెయిల్ మార్చండి" : "Use a different email"}
                </Button>
              </div>
            )}
          </form>
          <p className="mt-5 text-xs text-muted-foreground">
            {te ? "కొనసాగడానికి ముందు " : "Before continuing, review the "}
            <Link className="underline" to="/terms">{te ? "నిబంధనలు" : "Terms"}</Link>
            {te ? " మరియు " : " and "}
            <Link className="underline" to="/privacy">{te ? "గోప్యత" : "Privacy information"}</Link>.
          </p>
        </section>
      </main>
    </PageShell>
  );
}
