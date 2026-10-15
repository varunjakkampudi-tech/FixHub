import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { PageShell, PageTop, Empty, Notice } from "./shared";
export function RecoveryPage({ mode = "server-error" }: { mode?: string }) {
  const { t } = useFixHub();
  const [ready, setReady] = useState(false);
  const offline = mode === "offline";
  return (
    <PageShell>
      <main id="main" className="wrap">
        <PageTop
          title={t(offline ? "offline" : mode === "not-found" ? "notFound" : "unavailableTitle")}
        />
        <Empty
          title={
            ready
              ? "ready"
              : offline
                ? "offline"
                : mode === "not-found"
                  ? "notFound"
                  : "unavailableTitle"
          }
          desc={offline ? "offlineDesc" : mode === "not-found" ? "notFoundDesc" : "unavailableDesc"}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/">{t("goHome")}</Link>
              </Button>
              <Button variant="outline" onClick={() => setReady(true)}>
                {t(offline ? "reconnect" : "retry")}
              </Button>
            </div>
          }
        />
        {ready && <Notice>{t("routePreview")}</Notice>}
      </main>
    </PageShell>
  );
}
export function MatchingPage({ assignment = false }: { assignment?: boolean }) {
  const { t } = useFixHub();
  const [empty, setEmpty] = useState(false);
  return (
    <PageShell>
      <main id="main" className="wrap">
        <PageTop title={t(assignment ? "assigned" : "matching")} desc={t("demo")} />
        <Notice warning>{t("availabilityNote")}</Notice>
        <Empty
          title={empty ? "noProvider" : assignment ? "assigned" : "matching"}
          desc={empty ? "noProviderDesc" : "submittedDesc"}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/customer/book/schedule">{t("calendar")}</Link>
              </Button>
              <Button variant="outline" onClick={() => setEmpty(!empty)}>
                {t(empty ? "retry" : "noProvider")}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/customer/bookings/$id" params={{ id: "demo" }}>
                  {t("viewBooking")}
                </Link>
              </Button>
            </div>
          }
        />
      </main>
    </PageShell>
  );
}
