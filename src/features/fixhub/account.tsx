import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { type MessageKey } from "./locales";
import { PageShell, PageTop, Empty, LocaleControl, Notice, CategoryGrid, Modal } from "./shared";
import { FAQ } from "./public";
import { DemoRolePage } from "./demo-pages";
import { resolveApiSessionMode, type ApiSessionMode, apiRequest } from "./api-client";
export function AccountPage({ page = "profile" }: { page?: string }) {
  if (page.includes("delete-account")) return <DeletionRequestGate />;
  return <DemoRolePage role="customer" page={page} />;
}

function DeletionRequestGate() {
  const { locale } = useFixHub();
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  useEffect(() => {
    let active = true;
    void resolveApiSessionMode().then((result) => { if (active) setMode(result); });
    return () => { active = false; };
  }, []);
  if (mode === "checking") return <PageShell functionalPreview><main id="main" className="wrap"><p role="status">{locale === "te-IN" ? "లోడ్ అవుతోంది…" : "Loading account status…"}</p></main></PageShell>;
  if (mode === "demo") return <DemoRolePage role="customer" page="settings/delete-account" />;
  if (mode !== "authenticated") return <PageShell functionalPreview><main id="main" className="wrap"><PageTop title={locale === "te-IN" ? "ఖాతా తొలగింపు అభ్యర్థన" : "Request account deletion"} /><Notice warning>{mode === "unauthenticated" ? <Link to="/sign-in">{locale === "te-IN" ? "మీ ఖాతాను ధృవీకరించి కొనసాగండి" : "Sign in to verify your account"}</Link> : (locale === "te-IN" ? "గోప్యతా సేవ తాత్కాలికంగా అందుబాటులో లేదు." : "The privacy service is temporarily unavailable. Please try again.")}</Notice></main></PageShell>;
  return <LiveDeletionRequest />;
}

function LiveDeletionRequest() {
  const { locale } = useFixHub();
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : (te ? "అభ్యర్థన నమోదు కాలేదు." : "The request could not be recorded.")); }
    finally { setBusy(false); }
  }
  return (
    <PageShell role="customer" functionalPreview authState="signed-in">
      <main id="main" className="wrap pb-10">
        <PageTop title={te ? "ఖాతా తొలగింపును అభ్యర్థించండి" : "Request account deletion"} />
        {requestId ? (
          <Notice>{te ? `మీ అభ్యర్థన నమోదైంది. సూచన: ${requestId}. ఖాతా యాక్సెస్ నిలిపివేశారు. ఇది అన్ని రికార్డులు తొలగించబడ్డాయని నిర్ధారణ కాదు.` : `Request ${requestId} is recorded and account access is disabled. This is not confirmation that all records have been deleted; retention and legal holds will be reviewed.`}</Notice>
        ) : (
          <section className="summary-panel max-w-2xl">
            <Notice warning>{te ? "ఈ చర్య మీ సైన్-ఇన్ యాక్సెస్‌ను నిలిపివేస్తుంది. సేవా రికార్డులు, వివాదాలు, చట్టపరమైన నిల్వలు లేదా బ్యాకప్‌లలోని డేటా వెంటనే తొలగించబడదు." : "This disables account sign-in and records a deletion request. Service, dispute, legally held, and backup records are not immediately deleted; applicable retention must be reviewed."}</Notice>
            <p className="mt-4 text-sm"><Link className="underline" to="/privacy">{te ? "గోప్యతా సమాచారాన్ని చూడండి" : "Review the Privacy information"}</Link></p>
            <label className="my-5 flex min-h-11 items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 size-5" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>{te ? "నా ఖాతా తొలగింపు అభ్యర్థనను నమోదు చేసి యాక్సెస్ నిలిపివేయడానికి నేను అంగీకరిస్తున్నాను." : "I confirm that I want to record an account-deletion request and disable access."}</span>
            </label>
            {error && <div role="alert"><Notice error>{error}</Notice></div>}
            <Button variant="destructive" onClick={submit} disabled={!confirmed || busy}>{busy ? (te ? "నమోదు చేస్తోంది…" : "Recording…") : (te ? "తొలగింపు అభ్యర్థనను నమోదు చేయండి" : "Submit deletion request")}</Button>
          </section>
        )}
      </main>
    </PageShell>
  );
}
function LegacyAccountPage({ page = "profile" }: { page?: string }) {
  const { t, draft, updateDraft } = useFixHub();
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const home = page === "overview";
  const address = page.includes("address") || page === "location";
  const notification = page.includes("notifications");
  const help = page.includes("support");
  const remove = page.includes("delete");
  const title = t(
    home
      ? "customerHome"
      : address
        ? "address"
        : notification
          ? "notifications"
          : help
            ? "help"
            : remove
              ? "delete"
              : page.includes("settings")
                ? "settings"
                : "profile",
  );
  return (
    <PageShell>
      <main id="main" className="wrap pb-10">
        <PageTop title={title} desc={t(home ? "customerHomeDesc" : "routePreview")} />
        {home ? (
          <>
            <CategoryGrid />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/customer/book/new">{t("book")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/customer/bookings">{t("bookings")}</Link>
              </Button>
            </div>
          </>
        ) : help ? (
          <FAQ />
        ) : notification ? (
          <Empty title="noNotifications" desc="notificationsDesc" />
        ) : address && !page.includes("new") ? (
          <Empty
            title="noAddress"
            desc="noAddressDesc"
            action={
              <Button asChild>
                <Link to="/customer/addresses/new">{t("addAddress")}</Link>
              </Button>
            }
          />
        ) : remove ? (
          <>
            <Notice warning>{t("deleteDesc")}</Notice>
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              {t("delete")}
            </Button>
          </>
        ) : (
          <div className="content-grid">
            <section>
              {address ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="temp-address">
                    {t("address")}
                  </label>
                  <textarea
                    className="form-input"
                    id="temp-address"
                    value={draft.address}
                    onChange={(e) => updateDraft({ address: e.target.value })}
                  />
                  <Button className="mt-4" onClick={() => setSaved(true)}>
                    {t("saveChanges")}
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="mb-5 text-xl">{t("language")}</h2>
                  <LocaleControl />
                  <p className="my-5 text-sm text-muted-foreground">{t("languageHelp")}</p>
                  <label className="my-6 flex min-h-11 items-center justify-between gap-4 text-sm">
                    {t("notificationPref")}
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="size-5 accent-primary"
                    />
                  </label>
                  <Button onClick={() => setSaved(true)}>{t("save")}</Button>
                </>
              )}
              {saved && (
                <div className="mt-5" role="status">
                  <Notice>{t("saved")}</Notice>
                </div>
              )}
              <div className="mt-8 space-y-1">
                {[
                  ["/customer/addresses", "address"],
                  ["/customer/settings/privacy", "privacy"],
                  ["/customer/settings/delete-account", "delete"],
                  ["/customer/notifications", "notifications"],
                ].map(([to, key]) => (
                  <Button asChild key={to} variant="ghost" className="block justify-start">
                    <Link to={to ?? "/"}>{t(key as MessageKey)}</Link>
                  </Button>
                ))}
              </div>
            </section>
            <aside className="summary-panel">
              <h2>{t("previewRoles")}</h2>
              {[
                ["/customer", "customer"],
                ["/merchant", "merchant"],
                ["/technician", "technician"],
                ["/admin", "admin"],
              ].map(([to, key]) => (
                <Button asChild key={to} variant="outline" className="mb-3 w-full">
                  <Link to={to ?? "/"}>{t(key as MessageKey)}</Link>
                </Button>
              ))}
            </aside>
          </div>
        )}
      </main>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={t("restricted")}
        description={t("deleteDesc")}
      >
        <Button onClick={() => setConfirm(false)}>{t("close")}</Button>
      </Modal>
    </PageShell>
  );
}
