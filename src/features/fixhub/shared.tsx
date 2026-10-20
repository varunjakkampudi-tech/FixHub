import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home,
  Menu,
  MapPin,
  ChevronDown,
  ArrowRight,
  Search,
  CalendarDays,
  CircleHelp,
  UserRound,
  Zap,
  Droplets,
  AirVent,
  WashingMachine,
  PaintRoller,
  BrushCleaning,
  Hammer,
  Bug,
  Cctv,
  Grid2X2,
  ShieldCheck,
  BriefcaseBusiness,
  LayoutDashboard,
  Users,
  Settings,
  ClipboardList,
  Clock,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { categories, type MessageKey } from "./locales";
import { DemoControls } from "./demo-controls";
import { useDemo } from "./demo-context";
import { CityPicker } from "./location-ui";
import { enabledServices } from "./location-model";
export const icons = [
  Zap,
  Droplets,
  AirVent,
  WashingMachine,
  PaintRoller,
  BrushCleaning,
  Hammer,
  Bug,
  Cctv,
  Grid2X2,
];
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Home aria-hidden="true" />
      </span>
      Fix Hub
    </span>
  );
}
export function LocaleControl() {
  const { locale, setLocale } = useFixHub();
  return (
    <div className="locale-control" aria-label="Language / భాష">
      <Button variant="ghost" aria-pressed={locale === "en-IN"} onClick={() => setLocale("en-IN")}>
        EN
      </Button>
      <span aria-hidden="true">|</span>
      <Button
        variant="ghost"
        lang="te"
        aria-pressed={locale === "te-IN"}
        onClick={() => setLocale("te-IN")}
      >
        తెలుగు
      </Button>
    </div>
  );
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { t } = useFixHub();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content className="fixed z-50 bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-xl bg-background p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-lg sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:right-auto sm:w-[min(480px,calc(100%-32px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg">
          <Dialog.Title className="pr-10 text-xl font-bold">{title}</Dialog.Title>
          <Dialog.Description className="mb-6 mt-3 text-sm text-muted-foreground">
            {description}
          </Dialog.Description>
          <Dialog.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3"
              aria-label={t("close")}
            >
              <X />
            </Button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const publicNav: [string, MessageKey][] = [
  ["/", "home"],
  ["/services", "services"],
  ["/how-it-works", "how"],
  ["/partners", "partners"],
  ["/help", "support"],
];
export function Header({
  functionalPreview = false,
  authState = "signed-out",
}: {
  functionalPreview?: boolean;
  authState?: "signed-in" | "signed-out";
}) {
  const { t, locale, draft } = useFixHub();
  const demo = useDemo();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const cityLabel =
    demo.state.registry.cities.find((c) => c.id === (draft.cityId ?? "tanuku"))?.names[locale] ??
    t("location");
  const [menu, setMenu] = useState(false);
  const [location, setLocation] = useState(false);
  return (
    <>
      <a href="#main" className="skip-link">
        {t("skip")}
      </a>
      <header className="site-header">
        <div className="wrap header-main">
          <Link to="/" aria-label="Fix Hub">
            <Brand />
          </Link>
          <nav className="header-links" aria-label={t("menu")}>
            {publicNav.map(([to, key]) => (
              <Link key={to} to={to ?? "/"} className={path === to ? "active" : ""}>
                {t(key)}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            {functionalPreview ? (
              <span className="desktop-location location-label">
                <MapPin className="text-orange" />
                {cityLabel}
                <small>{t("state")}</small>
              </span>
            ) : (
              <Button
                variant="ghost"
                className="desktop-location"
                onClick={() => setLocation(true)}
                aria-label={t("changeLocation")}
              >
                <MapPin className="text-orange" />
                <span className="location-label">
                  {cityLabel}
                  <small>{t("state")}</small>
                </span>
                <ChevronDown />
              </Button>
            )}
            <LocaleControl />
            <Button asChild className="header-signin">
              <Link
                to={
                  functionalPreview
                    ? authState === "signed-in"
                      ? "/customer/bookings"
                      : "/sign-in"
                    : demo.persona
                      ? "/demo"
                      : "/sign-in"
                }
              >
                {functionalPreview
                  ? authState === "signed-in"
                    ? t("bookings")
                    : t("signin")
                  : demo.persona
                    ? "SAMPLE"
                    : t("signin")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              onClick={() => setMenu(true)}
              aria-label={t("menu")}
            >
              <Menu />
            </Button>
          </div>
        </div>
        {!functionalPreview && (
          <div className="wrap mobile-location">
            <Button variant="ghost" onClick={() => setLocation(true)}>
              <MapPin className="text-primary" />
              {cityLabel}
              <ChevronDown />
            </Button>
            <span className="text-muted-foreground">{t("by")}</span>
          </div>
        )}
      </header>
      {functionalPreview ? (
        <div className="preview-strip">
          {locale === "te-IN"
            ? "ఫంక్షనల్ ప్రివ్యూ · స్వయంచాలక కేటాయింపు, ఆన్‌లైన్ చెల్లింపులు సక్రియంగా లేవు. WhatsApp సందేశాలు సక్రియం చేసినా అవి ఉత్తమ ప్రయత్నంతో మాత్రమే అందుతాయి."
            : "Functional preview · Automated assignment and online payments are not active. WhatsApp messages, if enabled, are best-effort."}
        </div>
      ) : (
        <>
          <div className="preview-strip">{t("preview")}</div>
          <DemoControls />
        </>
      )}
      <Modal open={menu} onOpenChange={setMenu} title={t("menu")} description={t("local")}>
        <nav className="flex flex-col gap-1">
          {publicNav.map(([to, key]) => (
            <Button
              asChild
              variant="ghost"
              key={to}
              className="justify-start"
              onClick={() => setMenu(false)}
            >
              <Link to={to ?? "/"}>{t(key)}</Link>
            </Button>
          ))}
          <Button asChild onClick={() => setMenu(false)}>
            <Link to="/sign-in">{t("signin")}</Link>
          </Button>
          {!functionalPreview && (
            <>
              <h2 className="mt-5 text-xs font-bold text-muted-foreground">{t("previewRoles")}</h2>
              {[
                ["/customer", "customer"],
                ["/merchant", "merchant"],
                ["/technician", "technician"],
                ["/admin", "admin"],
              ].map(([to, key]) => (
                <Button
                  asChild
                  variant="ghost"
                  key={to}
                  onClick={() => setMenu(false)}
                  className="justify-start"
                >
                  <Link to={to ?? "/"}>{t(key as MessageKey)}</Link>
                </Button>
              ))}
            </>
          )}
        </nav>
      </Modal>
      <Modal
        open={location}
        onOpenChange={setLocation}
        title={t("changeLocation")}
        description={t("areasDesc")}
      >
        <CityPicker onSelected={() => setLocation(false)} />
      </Modal>
    </>
  );
}
export function Footer({ functionalPreview = false }: { functionalPreview?: boolean }) {
  const { t, locale } = useFixHub();
  const groups: [MessageKey, [string, MessageKey][]][] = [
    [
      "quick",
      [
        ["/", "home"],
        ["/services", "services"],
        ["/how-it-works", "how"],
        ["/partners", "partners"],
        ["/about", "about"],
      ],
    ],
    [
      "legal",
      [
        ["/privacy", "privacy"],
        ["/terms", "terms"],
        ["/cancellation-policy", "cancelPolicy"],
        ["/safety", "safety"],
      ],
    ],
    [
      "support",
      [
        ["/help", "help"],
        ["/contact", "contact"],
        ["/accessibility", "accessibility"],
        ["/service-areas", "location"],
      ],
    ],
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link to="/" aria-label="Fix Hub">
              <Brand />
            </Link>
            <p>
              {t("footerTag")}
              <br />
              {t("by")}
            </p>
          </div>
          {groups.map(([title, links]) => (
            <div key={title}>
              <h3>{t(title)}</h3>
              {links.map(([to, key]) => (
                <Link key={to} to={to ?? "/"}>
                  {t(key)}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h3>{t("language")}</h3>
            <LocaleControl />
            {functionalPreview ? (
              <p>
                {locale === "te-IN"
                  ? "సేవా ప్రదాతల సందేశాలు ఇంకా సక్రియంగా లేవు"
                  : "Provider dispatch is not active"}
              </p>
            ) : (
              <>
                <p>{t("demo")}</p>
                <Link to="/customer">
                  {t("previewRoles")} <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t("rights")}</span>
          <span>{t("made")}</span>
        </div>
      </div>
    </footer>
  );
}
export function BottomNav({
  role = "customer",
  functionalPreview = false,
}: {
  role?: string;
  functionalPreview?: boolean;
}) {
  const { t } = useFixHub();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items =
    functionalPreview && role === "customer"
      ? [
          [Home, "/", "home"],
          [Grid2X2, "/services", "services"],
          [CalendarDays, "/customer/bookings", "bookings"],
          [CircleHelp, "/contact", "contact"],
          [UserRound, "/customer/settings/delete-account", "settings"],
        ]
      : role === "merchant"
        ? [
            [LayoutDashboard, "/merchant", "home"],
            [ClipboardList, "/merchant/requests", "incoming"],
            [CalendarDays, "/merchant/calendar", "calendar"],
            [CircleHelp, "/merchant/support", "help"],
            [UserRound, "/merchant/profile", "profile"],
          ]
        : role === "technician"
          ? [
              [Home, "/technician", "home"],
              [ClipboardList, "/technician/jobs", "jobs"],
              [CalendarDays, "/technician/upcoming", "upcoming"],
              [CircleHelp, "/technician/support", "help"],
              [UserRound, "/technician/profile", "profile"],
            ]
          : role === "admin"
            ? [
                [LayoutDashboard, "/admin", "home"],
                [ClipboardList, "/admin/bookings", "bookings"],
                [Users, "/admin/merchants", "merchants"],
                [CircleHelp, "/admin/support", "help"],
                [Settings, "/admin/settings", "settings"],
              ]
            : [
                [Home, "/", "home"],
                [Grid2X2, "/services", "services"],
                [CalendarDays, "/customer/bookings", "bookings"],
                [CircleHelp, "/help", "help"],
                [UserRound, "/customer/profile", "profile"],
              ];
  return (
    <nav className="bottom-nav" aria-label={t("menu")}>
      {items.map(([Icon, to, key]) => {
        const I = Icon as typeof Home;
        const dest = to as string;
        return (
          <Link
            key={dest}
            to={dest}
            className={(dest === "/" ? path === "/" : path.startsWith(dest)) ? "active" : ""}
          >
            <I aria-hidden="true" />
            <span>{t(key as MessageKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
export function PageShell({
  children,
  role,
  functionalPreview = false,
  authState = "signed-out",
}: {
  children: ReactNode;
  role?: string;
  functionalPreview?: boolean;
  authState?: "signed-in" | "signed-out";
}) {
  return (
    <>
      <Header functionalPreview={functionalPreview} authState={authState} />
      {children}
      <Footer functionalPreview={functionalPreview} />
      <BottomNav role={role ?? "customer"} functionalPreview={functionalPreview} />
    </>
  );
}
export function CategoryIcon({ id }: { id: string }) {
  const i = categories.findIndex((c) => c.id === id);
  const Icon = icons[Math.max(0, i)] ?? Grid2X2;
  return (
    <span className={`category-icon cat-${id}`}>
      <Icon aria-hidden="true" />
    </span>
  );
}
export function CategoryGrid() {
  const { locale, draft } = useFixHub();
  const { state } = useDemo();
  return (
    <div className="category-grid">
      {enabledServices(state, draft.cityId ?? "tanuku").map((c) => (
        <Link
          to="/services/$category"
          params={{ category: c.id }}
          className="category-link"
          key={c.id}
        >
          <CategoryIcon id={c.id} />
          <span>{c.names[locale]}</span>
        </Link>
      ))}
    </div>
  );
}
export function SearchBox({
  onSearch,
  initial = "",
}: {
  onSearch: (value: string) => void;
  initial?: string;
}) {
  const { t } = useFixHub();
  const [value, setValue] = useState(initial);
  return (
    <form
      className="search-box"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value);
      }}
    >
      <Search size={20} className="shrink-0 text-primary" aria-hidden="true" />
      <input
        aria-label={t("search")}
        placeholder={t("searchPlaceholder")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit">{t("search")}</Button>
    </form>
  );
}
export function Empty({
  title,
  desc,
  action,
  icon: Icon = CalendarDays,
}: {
  title: MessageKey;
  desc: MessageKey;
  action?: ReactNode;
  icon?: typeof Home;
}) {
  const { t } = useFixHub();
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" />
      <h2>{t(title)}</h2>
      <p>{t(desc)}</p>
      {action}
    </div>
  );
}
export function Notice({
  children,
  warning = false,
  error = false,
}: {
  children: ReactNode;
  warning?: boolean;
  error?: boolean;
}) {
  const { locale } = useFixHub();
  const [referenceCopyState, setReferenceCopyState] = useState<"idle" | "copied" | "unavailable">(
    "idle",
  );
  const supportReference =
    error && typeof children === "string"
      ? children.match(/\(Reference: ([\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12})\)/i)?.[1]
      : undefined;

  async function copySupportReference() {
    if (!supportReference) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(supportReference);
      setReferenceCopyState("copied");
    } catch {
      setReferenceCopyState("unavailable");
    }
  }

  return (
    <div
      className={`notice ${warning ? "warning" : ""} ${error ? "error" : ""}`}
      role={error ? "alert" : undefined}
    >
      <ShieldCheck aria-hidden="true" />
      <div>
        {children}
        {supportReference && (
          <button
            type="button"
            className="mt-2 min-h-11 rounded-md px-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => void copySupportReference()}
          >
            {referenceCopyState === "copied"
              ? locale === "te-IN"
                ? "సూచన సంఖ్య కాపీ అయింది"
                : "Reference copied"
              : referenceCopyState === "unavailable"
                ? locale === "te-IN"
                  ? "కాపీ చేయలేకపోయాం — పై సూచన సంఖ్యను ఎంచుకోండి"
                  : "Copy unavailable — select the reference above"
                : locale === "te-IN"
                  ? "సహాయ సూచన సంఖ్యను కాపీ చేయండి"
                  : "Copy support reference"}
          </button>
        )}
      </div>
    </div>
  );
}
export function PageTop({ title, desc }: { title: string; desc?: string }) {
  const { t } = useFixHub();
  return (
    <div className="page-top">
      <div className="breadcrumb">
        <Link to="/">{t("home")}</Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
  );
}
export function Steps() {
  const { t } = useFixHub();
  return (
    <section className="section wrap">
      <div className="center-heading">
        <h2>{t("workTitle")}</h2>
        <p>{t("workDesc")}</p>
      </div>
      <div className="steps-grid">
        {[Search, CalendarDays, BriefcaseBusiness].map((Icon, i) => (
          <div className="step-item" key={i}>
            <div className="step-art">
              <Icon aria-hidden="true" />
              <span className="step-number">{i + 1}</span>
            </div>
            <div>
              <h3>{t(`step${i + 1}` as MessageKey)}</h3>
              <p>{t(`step${i + 1}Desc` as MessageKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
export function Trust() {
  const { t } = useFixHub();
  return (
    <section className="wrap section">
      <div className="center-heading">
        <h2>{t("why")}</h2>
      </div>
      <div className="trust-row">
        {[ShieldCheck, ClipboardList, Clock, CircleHelp, Users].map((Icon, i) => (
          <div className="trust-item" key={i}>
            <Icon aria-hidden="true" />
            <span>
              {t(
                (
                  [
                    "verification",
                    "pricing",
                    "scheduling",
                    "localSupport",
                    "localBusinesses",
                  ] as MessageKey[]
                )[i] ?? "verification",
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="safety-band">
        <div>
          <h3>{t("safetyTitle")}</h3>
          <p>{t("safetyDesc")}</p>
        </div>
        <Link to="/safety" className="text-link">
          {t("safetyLink")}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
