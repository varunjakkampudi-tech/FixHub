import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { type MessageKey } from "./locales";
import { PageShell, PageTop, Empty, LocaleControl, Notice, CategoryGrid, Modal } from "./shared";
import { FAQ } from "./public";
import { DemoRolePage } from "./demo-pages";
export function AccountPage({ page = "profile" }: { page?: string }) {
  return <DemoRolePage role="customer" page={page} />;
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
