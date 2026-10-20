import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Users,
  Settings,
  CircleHelp,
  ShieldCheck,
  Bell,
  MapPin,
  Clock,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { type MessageKey } from "./locales";
import { PageShell, PageTop, Notice } from "./shared";
import { RegistryAdmin } from "./registry-admin";
import { DemoRolePage } from "./demo-pages";
import { resolveApiSession, type ApiSessionMode } from "./api-client";
import { RealMerchantPage } from "./real-merchant";
import { WhatsAppPreferencesGate } from "./account";
const merchantNav: [string, MessageKey, typeof LayoutDashboard][] = [
  ["/merchant", "overview", LayoutDashboard],
  ["/merchant/requests", "incoming", ClipboardList],
  ["/merchant/jobs", "jobs", ClipboardList],
  ["/merchant/calendar", "calendar", CalendarDays],
  ["/merchant/technicians", "team", Users],
  ["/merchant/availability", "availability", Clock],
  ["/merchant/verification", "verificationCenter", ShieldCheck],
  ["/merchant/pricing", "earnings", Wallet],
  ["/merchant/settings", "settings", Settings],
  ["/merchant/support", "help", CircleHelp],
];
const adminNav: [string, MessageKey, typeof LayoutDashboard][] = [
  ["/admin", "overview", LayoutDashboard],
  ["/admin/operations", "operations", ClipboardList],
  ["/admin/bookings", "bookings", CalendarDays],
  ["/admin/customers", "customers", Users],
  ["/admin/merchants", "merchants", Users],
  ["/admin/technicians", "team", Users],
  ["/admin/dispatch", "dispatch", MapPin],
  ["/admin/verification", "verificationCenter", ShieldCheck],
  ["/admin/reports", "reports", ClipboardList],
  ["/admin/audit", "audit", Clock],
  ["/admin/support", "help", CircleHelp],
  ["/admin/settings", "settings", Settings],
];
const technicianNav: [string, MessageKey, typeof LayoutDashboard][] = [
  ["/technician", "todaysJobs", ClipboardList],
  ["/technician/upcoming", "upcoming", CalendarDays],
  ["/technician/availability", "availability", Clock],
  ["/technician/notifications", "notifications", Bell],
  ["/technician/profile", "profile", Users],
  ["/technician/support", "help", CircleHelp],
];
function Workspace({ role, children, functionalPreview = false }: { role: string; children: ReactNode; functionalPreview?: boolean }) {
  const { t } = useFixHub();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const list = role === "admin" ? adminNav : role === "technician" ? technicianNav : merchantNav;
  return (
    <PageShell role={role} functionalPreview={functionalPreview}>
      <main id="main" className={`workspace ${collapsed ? "rail-collapsed" : ""}`}>
        <aside className="workspace-rail">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("menu")}
            onClick={() => setCollapsed(!collapsed)}
            className="mb-4"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <h2>{t(role as MessageKey)}</h2>
          <nav>
            {list.map(([to, key, Icon]) => (
              <Link to={to} key={to} title={t(key)} className={path === to ? "active" : ""}>
                <Icon />
                <span>{t(key)}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="workspace-main">{children}</div>
      </main>
    </PageShell>
  );
}
export function MerchantPage({ page = "overview" }: { page?: string }) {
  const [mode, setMode] = useState<"checking" | ApiSessionMode>("checking");
  const [roles, setRoles] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    void resolveApiSession().then((value) => { if (active) { setMode(value.mode); setRoles(value.roles); } });
    return () => { active = false; };
  }, []);
  if (mode === "checking") return <PageShell functionalPreview><main id="main" className="wrap"><p role="status" className="animate-pulse motion-reduce:animate-none">Checking merchant access…</p></main></PageShell>;
  if (mode === "demo") return <DemoRolePage role="merchant" page={page} />;
  if (mode !== "authenticated") return <PageShell functionalPreview><main id="main" className="wrap"><Notice warning>{mode === "unauthenticated" ? <Link to="/sign-in">Sign in with a provisioned merchant account</Link> : "Merchant services are temporarily unavailable."}</Notice></main></PageShell>;
  if (!roles.includes("merchant")) return <PageShell functionalPreview><main id="main" className="wrap"><Notice error>This account is not authorized for the merchant workspace.</Notice></main></PageShell>;
  if (page === "requests" || page === "jobs") {
    return <Workspace role="merchant" functionalPreview><RealMerchantPage page={page} /></Workspace>;
  }
  if (page === "notifications") return <WhatsAppPreferencesGate role="merchant" />;
  return <Workspace role="merchant" functionalPreview><PageTop title={page === "overview" ? "Merchant workspace" : "Merchant settings"} /><Notice warning>This merchant workspace section is not connected to live account settings yet.</Notice></Workspace>;
}
export function TechnicianPage({ page = "overview" }: { page?: string }) {
  return <DemoRolePage role="technician" page={page} />;
}
export function AdminPage({ page = "overview" }: { page?: string }) {
  return <RegistryAdmin page={page} />;
}
export { DemoOnboarding as OnboardingPage } from "./demo-pages";
