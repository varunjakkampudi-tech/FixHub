import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, apiRequest } from "./api-client";

type HealthResponse = { status: string; mode?: string; reason?: string };
type Check = { state: "checking" | "ok" | "error"; detail?: string; requestId?: string };
type Checks = { live: Check; ready: Check };

const checking: Check = { state: "checking" };

export function AdminHealthDiagnostics({ locale }: { locale: string }) {
  const te = locale === "te-IN";
  const [refresh, setRefresh] = useState(0);
  const [checks, setChecks] = useState<Checks>({ live: checking, ready: checking });
  const busy = checks.live.state === "checking" || checks.ready.state === "checking";

  useEffect(() => {
    const controller = new AbortController();
    setChecks({ live: checking, ready: checking });

    const check = async (path: string): Promise<Check> => {
      try {
        const response = await apiRequest<HealthResponse>(path, { signal: controller.signal });
        const detail = [response.status, response.mode, response.reason].filter(Boolean).join(" · ");
        return { state: "ok", detail };
      } catch (error) {
        if (controller.signal.aborted) return checking;
        return { state: "error", requestId: error instanceof ApiError ? error.requestId : undefined };
      }
    };

    void check("/health/live").then((live) => {
      if (!controller.signal.aborted) setChecks((current) => ({ ...current, live }));
    });
    void check("/health/ready").then((ready) => {
      if (!controller.signal.aborted) setChecks((current) => ({ ...current, ready }));
    });
    return () => controller.abort();
  }, [refresh]);

  const label = (name: string, check: Check) => (
    <article className="summary-panel space-y-2" key={name}>
      <h2 className="font-semibold">{name}</h2>
      <p role={check.state === "error" ? "alert" : "status"} aria-live="polite" aria-busy={check.state === "checking"}>
        {check.state === "checking"
          ? (te ? "పరిశీలిస్తోంది…" : "Checking…")
          : check.state === "ok"
            ? check.detail
            : (te ? "పరిశీలన అందుబాటులో లేదు." : "Check unavailable.")}
      </p>
      {check.state === "error" && check.requestId && (
        <p className="text-sm text-muted-foreground">
          {te ? "సూచన" : "Reference"}: <code>{check.requestId}</code>
        </p>
      )}
    </article>
  );

  return (
    <section className="space-y-5" aria-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{te ? "API ఆరోగ్య తనిఖీలు" : "API health checks"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {te ? "ఇవి చదవడానికి మాత్రమే చేసే తనిఖీలు." : "These are read-only checks; they do not change service data."}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={busy} onClick={() => setRefresh((value) => value + 1)}>
          {te ? "మళ్లీ తనిఖీ చేయి" : "Refresh checks"}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {label(te ? "సేవ నడుస్తోందా" : "Process liveness", checks.live)}
        {label(te ? "అభ్యర్థనలకు సిద్ధమా" : "Request readiness", checks.ready)}
      </div>
      <p className="rounded-lg border p-4 text-sm text-muted-foreground">
        {te
          ? "ఈ బ్రౌజర్‌లో సర్వర్ లాగ్‌లు చూపబడవు. అభ్యర్థన విఫలమైతే అందిన సూచన సంఖ్యను అధికారం ఉన్న ఆపరేషన్స్ సిబ్బందితో మాత్రమే పంచుకుని, సర్వర్ లాగ్‌లలో సరిపోల్చండి. పాస్‌వర్డ్‌లు, OTPలు, చిరునామాలు లేదా టోకెన్‌లను పంచుకోవద్దు."
          : "Server logs are not exposed in this browser. If a request fails, share its reference only with authorized operations staff so they can correlate it with server logs. Do not share passwords, one-time codes, addresses, or tokens."}
      </p>
      <a className="text-link underline" href="/docs" target="_blank" rel="noreferrer">
        {te ? "API డాక్యుమెంటేషన్ తెరవండి" : "Open API documentation"}
      </a>
    </section>
  );
}
