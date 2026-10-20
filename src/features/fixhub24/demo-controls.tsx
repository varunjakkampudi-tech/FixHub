import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Users, LogOut, X } from "lucide-react";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-context";
import { useFixHub24 } from "./context";
import { dt, type DemoKey, eventLabel } from "./demo-copy";
import type { Role } from "./demo-model";
export const rolePath = (role: Role) =>
  role === "customer"
    ? "/customer"
    : role === "merchant"
      ? "/merchant/requests"
      : role === "technician"
        ? "/technician/jobs"
        : role === "operations"
          ? "/admin/dispatch"
          : "/admin/dashboard";
export function DemoControls() {
  const demo = useDemo();
  const { locale } = useFixHub24();
  const d = (k: DemoKey) => dt(k, locale);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState(false);
  const notes = demo.state.notifications.filter((n) => n.to === demo.persona?.id);
  const unread = notes.filter((n) => !n.read).length;
  return (
    <>
      <div className="demo-toolbar">
        <div className="wrap demo-toolbar-inner">
          <span className="demo-mode">{d("mode")}</span>
          <div className="demo-tools">
            <Button variant="ghost" onClick={() => setOpen(true)} aria-label={d("switcher")}>
              <Users size={17} />
              <span>{demo.persona?.name ?? d("switcher")}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotices(true)}
              aria-label={`${d("notifications")} ${unread}`}
            >
              <Bell size={19} />
              {unread > 0 && <span className="demo-badge">{unread}</span>}
            </Button>
          </div>
        </div>
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content demo-dialog">
            <Dialog.Title>{d("switcher")}</Dialog.Title>
            <Dialog.Description>{d("boundary")}</Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="modal-close"
                aria-label={locale === "te-IN" ? "మూసివేయండి" : "Close"}
              >
                <X />
              </Button>
            </Dialog.Close>
            <label className="form-label" htmlFor="demo-persona">
              {d("signin")}
            </label>
            <select
              id="demo-persona"
              className="form-input"
              value={demo.persona?.id ?? ""}
              onChange={(e) => {
                demo.login(e.target.value);
                const p = demo.state.personas.find((p) => p.id === e.target.value);
                if (p) {
                  setOpen(false);
                  navigate({ to: rolePath(p.role) });
                }
              }}
            >
              <option value="">—</option>
              <optgroup label={locale === "te-IN" ? "3 ప్రాథమిక పాత్రలు" : "3 Primary Roles"}>
                <option value="sample-c1">
                  Customer · {locale === "te-IN" ? "కస్టమర్" : "Customer"}
                </option>
                <option value="sample-m1">
                  Merchant · {locale === "te-IN" ? "వ్యాపారి" : "Merchant"}
                </option>
                <option value="sample-admin">
                  Admin (Me) · {locale === "te-IN" ? "అడ్మిన్ (నేను)" : "Admin (Me)"}
                </option>
              </optgroup>
              <optgroup label={locale === "te-IN" ? "ఇతర నమూనా ప్రొఫైల్స్" : "Other Test Fixtures"}>
                {demo.state.personas
                  .filter(
                    (p) =>
                      !["sample-c1", "sample-m1", "sample-admin"].includes(p.id) && !p.deactivated,
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {d(p.role)}
                    </option>
                  ))}
              </optgroup>
            </select>
            <Button asChild variant="outline">
              <Link to="/demo" onClick={() => setOpen(false)}>
                {locale === "te-IN" ? "సందర్భాలు / ధరలు" : "Scenarios / prices"}
              </Link>
            </Button>
            {demo.persona && (
              <Button
                variant="outline"
                onClick={() => {
                  demo.logout();
                  setOpen(false);
                  navigate({ to: "/sign-in" });
                }}
              >
                <LogOut />
                {d("signout")}
              </Button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={notices} onOpenChange={setNotices}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content className="modal-content demo-dialog">
            <Dialog.Title>
              {d("notifications")} · {demo.persona?.name ?? "DEMO"}
            </Dialog.Title>
            <Dialog.Description>{d("boundary")}</Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="modal-close"
                aria-label={locale === "te-IN" ? "మూసివేయండి" : "Close"}
              >
                <X />
              </Button>
            </Dialog.Close>
            <Button
              variant="outline"
              disabled={!demo.persona || demo.busy}
              onClick={() => demo.act({ type: "read" })}
            >
              {d("read")}
            </Button>
            <ul className="demo-notifications">
              {notes
                .slice()
                .reverse()
                .map((n) => (
                  <li key={n.id} className={n.read ? "" : "unread"}>
                    <strong>{eventLabel(n.event, locale)}</strong>
                    <time>
                      {new Intl.DateTimeFormat(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(n.at)}
                    </time>
                    {n.bookingId && (
                      <Link
                        to="/demo/bookings/$id"
                        params={{ id: n.bookingId }}
                        onClick={() => setNotices(false)}
                      >
                        {n.bookingId} · {d("view")}
                      </Link>
                    )}
                  </li>
                ))}
            </ul>
            {notes.length === 0 && <p>{d("empty")}</p>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="sr-only" role="status" aria-live="polite">
        {unread > 0
          ? `${d("notifications")}: ${unread}. ${eventLabel(notes[notes.length - 1]?.event ?? "created", locale)}`
          : ""}
      </div>
    </>
  );
}
