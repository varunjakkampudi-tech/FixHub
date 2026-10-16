import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Globe,
  Heart,
  Home,
  IndianRupee,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Timer,
  UserRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { useDemo } from "./demo-context";
import { calculate, categoriesDemo, money, type Booking, type Category } from "./demo-model";
import { demoBillLines } from "./demo-bill";
import { enabledServices, formattedAddress, ratesFor, placeLabel } from "./location-model";
import { servicePhoto } from "./service-photos";
import { Brand, CategoryIcon, LocaleControl } from "./shared";

type Loc = "en-IN" | "te-IN" | "hi-IN";
const L = (locale: Loc, en: string, te: string) => (locale === "te-IN" ? te : en);

function useApp() {
  const fx = useFixHub();
  const demo = useDemo();
  const locale = fx.locale as Loc;
  const cityId = fx.draft.cityId ?? "tanuku";
  const city = demo.state.registry.cities.find((c) => c.id === cityId);
  return { ...fx, ...demo, locale, cityId, city, tr: (en: string, te: string) => L(locale, en, te) };
}

/* ---------- shell ---------- */
function Top({ title, back = true, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const router = useRouter();
  const { tr } = useApp();
  return (
    <header className="app-top">
      {back ? (
        <button className="app-icon-btn" onClick={() => router.history.back()} aria-label={tr("Back", "వెనుకకు")}>
          <ArrowLeft />
        </button>
      ) : (
        <span />
      )}
      {title && <h1 className="app-top-title">{title}</h1>}
      <span className="app-top-right">{right}</span>
    </header>
  );
}
function DemoStrip() {
  const { tr } = useApp();
  return (
    <p className="app-demo-strip" role="note">
      {tr(
        "DEMO preview · sample data, no real bookings or payments",
        "DEMO ప్రివ్యూ · నమూనా సమాచారం, నిజమైన బుకింగ్‌లు లేదా చెల్లింపులు లేవు",
      )}
    </p>
  );
}
export function AppShell({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="app-screen">
      <DemoStrip />
      <main id="main" className="app-main">
        {children}
      </main>
      {nav && <AppNav />}
    </div>
  );
}
function AppNav() {
  const { tr } = useApp();
  const items: [typeof Home, string, string][] = [
    [Home, "/app/home", tr("Home", "హోమ్")],
    [CalendarDays, "/customer/bookings", tr("Bookings", "బుకింగ్‌లు")],
    [CircleHelp, "/help", tr("Support", "సహాయం")],
    [UserRound, "/app/profile", tr("Profile", "ప్రొఫైల్")],
  ];
  return (
    <nav className="app-nav" aria-label={tr("App navigation", "యాప్ నావిగేషన్")}>
      {items.map(([I, to, label]) => (
        <Link key={to} to={to} activeProps={{ className: "active" }}>
          <I aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
function Steps({ step }: { step: 1 | 2 | 3 }) {
  const { tr } = useApp();
  const labels = [tr("Service", "సేవ"), tr("Address & time", "చిరునామా & సమయం"), tr("Confirm", "నిర్ధారణ")];
  return (
    <ol className="app-steps" aria-label={tr("Booking steps", "బుకింగ్ దశలు")}>
      {labels.map((l, i) => (
        <li key={l} className={i + 1 <= step ? "on" : ""} aria-current={i + 1 === step ? "step" : undefined}>
          <span>{i + 1}</span>
          {l}
        </li>
      ))}
    </ol>
  );
}
function catOf(id: string): Category {
  const c = id === "appliances" ? "appliance" : id;
  return (categoriesDemo as string[]).includes(c) ? (c as Category) : "electrician";
}
function usePrice(category: Category) {
  const { state, cityId } = useApp();
  return useMemo(() => calculate(ratesFor(state, cityId, category, category)), [state, cityId, category]);
}

/* ---------- 1. Splash ---------- */
export function AppWelcome() {
  const { tr, city, locale } = useApp();
  return (
    <AppShell nav={false}>
      <section className="app-welcome">
        <div className="app-welcome-brand">
          <Brand />
          <p>
            {tr("Home services in", "ఇంటి సేవలు")} {city?.names[locale] ?? "Tanuku"}
          </p>
        </div>
        <img src={servicePhoto("ac")} alt="" className="app-welcome-photo" width={944} height={704} />
        <p className="app-sample-tag">{tr("SAMPLE photo", "నమూనా చిత్రం")}</p>
        <ul className="app-checks">
          <li><ShieldCheck />{tr("Merchants reviewed before going live (planned)", "ప్రారంభానికి ముందు వ్యాపారుల పరిశీలన (ప్రణాళిక)")}</li>
          <li><ClipboardCheck />{tr("Itemised estimate before you book", "బుక్ చేసే ముందు వివరమైన అంచనా")}</li>
          <li><Timer />{tr("You approve any final quote", "తుది కోట్‌ను మీరే ఆమోదిస్తారు")}</li>
        </ul>
        <div className="app-welcome-lang"><Globe aria-hidden="true" /><LocaleControl /></div>
        <Button asChild size="lg" className="app-cta">
          <Link to="/app/home">{tr("Get started", "ప్రారంభించండి")}<ArrowRight /></Link>
        </Button>
        <p className="app-small">
          {tr("Already have a demo account?", "ఇప్పటికే డెమో ఖాతా ఉందా?")} <Link to="/sign-in" className="text-link">{tr("Sign in", "సైన్ ఇన్")}</Link>
        </p>
      </section>
    </AppShell>
  );
}

/* ---------- 2. Home ---------- */
export function AppHome() {
  const { tr, locale, state, cityId, city, persona } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const services = enabledServices(state, cityId);
  const hour = new Date().getHours();
  const greet = hour < 12 ? tr("Good morning", "శుభోదయం") : hour < 17 ? tr("Good afternoon", "శుభ మధ్యాహ్నం") : tr("Good evening", "శుభ సాయంత్రం");
  const active = state.bookings.find((b) => b.customerId === persona?.id && !["complete", "cancelled", "expired"].includes(b.status));
  return (
    <AppShell>
      <header className="app-home-top">
        <div>
          <Brand />
          <Link to="/customer/location" className="app-loc"><MapPin aria-hidden="true" />{city?.names[locale] ?? "Tanuku"}<ChevronRight aria-hidden="true" /></Link>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/customer/notifications" className="app-icon-btn" aria-label={tr("Notifications", "నోటిఫికేషన్‌లు")}><Bell /></Link>
          <LocaleControl />
        </div>
      </header>
      <section className="app-greet">
        <h1>{greet}</h1>
        <p>{tr("Find help for your home today", "ఈరోజు మీ ఇంటికి సహాయం పొందండి")}</p>
        <form className="app-search" role="search" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }}>
          <Search aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Search for services…", "సేవల కోసం వెతకండి…")} aria-label={tr("Search for services", "సేవల కోసం వెతకండి")} />
        </form>
      </section>
      {active && (
        <Link to="/app/track/$id" params={{ id: active.id }} className="app-alert">
          <Timer aria-hidden="true" />
          <span><strong>{tr("Your request", "మీ అభ్యర్థన")} {active.id}</strong><br />{statusLabel(active, locale)}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
      {services.length === 0 ? (
        <p className="app-empty">{tr("No verified providers in your location yet.", "మీ ప్రాంతంలో ఇంకా ధృవీకరించిన సేవాదారులు లేరు.")}</p>
      ) : (
        <div className="app-tiles">
          {services.map((s) => (
            <Link key={s.id} to="/app/service/$id" params={{ id: s.categoryId }} className="app-tile">
              <CategoryIcon id={s.categoryId} />
              <span>{s.names[locale]}</span>
            </Link>
          ))}
        </div>
      )}
      <Link to="/customer/book/new" className="app-help-card">
        <CircleHelp aria-hidden="true" />
        <span><strong>{tr("Need help?", "సహాయం కావాలా?")}</strong><br />{tr("Tell us the problem and we’ll suggest a service.", "సమస్య చెప్పండి, సరైన సేవను సూచిస్తాం.")}</span>
        <ChevronRight aria-hidden="true" />
      </Link>
      <div className="app-section-head">
        <h2>{tr("Popular near you", "మీ దగ్గర ప్రసిద్ధమైనవి")}</h2>
        <Link to="/services" className="text-link">{tr("See all", "అన్నీ")}</Link>
      </div>
      <div className="app-carousel">
        {services.filter((s) => servicePhoto(s.categoryId)).map((s) => (
          <Link key={s.id} to="/app/service/$id" params={{ id: s.categoryId }} className="app-photo-card">
            <img src={servicePhoto(s.categoryId)} alt="" loading="lazy" width={944} height={704} />
            <span>{s.names[locale]}</span>
          </Link>
        ))}
      </div>
      <p className="app-sample-tag">{tr("Photos are SAMPLE images, not real professionals.", "చిత్రాలు నమూనా మాత్రమే, నిజమైన నిపుణులు కాదు.")}</p>
    </AppShell>
  );
}

/* ---------- 4. Service details ---------- */
export function AppService({ id }: { id: string }) {
  const { tr, locale, state, cityId, updateDraft } = useApp();
  const category = catOf(id);
  const svc = enabledServices(state, cityId).find((s) => s.categoryId === category);
  const price = usePrice(category);
  const [tab, setTab] = useState<"overview" | "included" | "faq">("overview");
  const name = svc?.names[locale] ?? category;
  return (
    <AppShell nav={false}>
      <div className="app-hero">
        {servicePhoto(category) && <img src={servicePhoto(category)} alt="" width={944} height={704} />}
        <span className="app-sample-badge">SAMPLE</span>
        <Top />
      </div>
      <section className="app-body">
        <h1 className="app-h1">{name}</h1>
        <p className="app-muted">{tr("Inspection, repair and maintenance at your home.", "మీ ఇంటి వద్ద పరిశీలన, మరమ్మత్తు, నిర్వహణ.")}</p>
        <div className="app-badges">
          <span><ShieldCheck />{tr("Reviewed merchants (DEMO)", "పరిశీలించిన వ్యాపారులు (DEMO)")}</span>
          <span><IndianRupee />{tr("Itemised estimate", "వివరమైన అంచనా")}</span>
          <span><Check />{tr("You approve quotes", "కోట్ మీ ఆమోదంతో")}</span>
        </div>
        <div className="app-tabs" role="tablist">
          {(["overview", "included", "faq"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {k === "overview" ? tr("Overview", "సారాంశం") : k === "included" ? tr("What’s included", "ఏమి ఉంటుంది") : "FAQ"}
            </button>
          ))}
        </div>
        {tab === "overview" && (
          <p className="app-muted">{tr("A sample merchant visits, inspects the issue and shares a quote. Work starts only after you approve it.", "నమూనా వ్యాపారి వచ్చి సమస్యను పరిశీలించి కోట్ ఇస్తారు. మీరు ఆమోదించిన తర్వాతే పని మొదలవుతుంది.")}</p>
        )}
        {tab === "included" && (
          <ul className="app-list">
            <li>✓ {tr("Visit and inspection", "సందర్శన మరియు పరిశీలన")}</li>
            <li>✓ {tr("Estimated labour", "అంచనా శ్రమ ఖర్చు")}</li>
            <li>✕ {tr("Parts beyond the allowance — quoted separately", "పరిమితికి మించిన భాగాలు — వేరుగా కోట్")}</li>
          </ul>
        )}
        {tab === "faq" && (
          <dl className="app-list">
            <dt>{tr("Can the price change?", "ధర మారవచ్చా?")}</dt>
            <dd>{tr("Only with a new quote that you approve.", "మీరు ఆమోదించే కొత్త కోట్‌తో మాత్రమే.")}</dd>
          </dl>
        )}
        <div className="app-price-box">
          <div><span>{tr("Illustrative inspection fee", "అంచనా పరిశీలన రుసుము")}</span><strong>{money(price.visit, locale)}</strong></div>
          <div><span>{tr("Estimated labour", "అంచనా శ్రమ")}</span><strong>{money(price.labor, locale)}</strong></div>
          <div><span>{tr("Parts allowance", "భాగాల పరిమితి")}</span><strong>{money(price.parts, locale)}</strong></div>
          <div className="total"><span>{tr("Estimated total (DEMO)", "అంచనా మొత్తం (DEMO)")}</span><strong>{money(price.total, locale)}</strong></div>
          <p>{tr("Planned payment: cash after service completion (COD). DEMO only; no cash is requested or collected.", "ప్రతిపాదిత చెల్లింపు: సేవ పూర్తయ్యాక నగదు (COD). DEMO మాత్రమే; నగదు అడగరు లేదా వసూలు చేయరు.")}</p>
          <p>{tr("Final quote may vary after inspection and needs your approval.", "పరిశీలన తర్వాత తుది కోట్ మారవచ్చు; మీ ఆమోదం అవసరం.")}</p>
        </div>
      </section>
      <div className="app-sticky">
        <Button asChild size="lg" className="app-cta" onClick={() => updateDraft({ service: category })}>
          <Link to="/app/providers/$id" params={{ id: category }}>{tr("Book", "బుక్ చేయండి")} {name}</Link>
        </Button>
      </div>
    </AppShell>
  );
}

/* ---------- 5. Providers ---------- */
function eligibleMerchants(state: ReturnType<typeof useDemo>["state"], cityId: string, category: Category) {
  return state.merchants.filter(
    (m) => m.skills.includes(category) && (m.cityIds ?? ["tanuku"]).includes(cityId) && m.status === "active" && (m.verification ?? "approved") === "approved",
  );
}
function initials(name: string) {
  return name.replace(/SAMPLE|DEMO/g, "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("");
}
export function AppProviders({ id }: { id: string }) {
  const { tr, locale, state, cityId, city } = useApp();
  const category = catOf(id);
  const price = usePrice(category);
  const list = eligibleMerchants(state, cityId, category);
  const days = nextDays(4, locale);
  const [day, setDay] = useState(days[0]!.iso);
  return (
    <AppShell nav={false}>
      <Top title={tr("Available professionals", "అందుబాటులో ఉన్న నిపుణులు")} />
      <section className="app-body">
        <div className="app-chips" role="radiogroup" aria-label={tr("Date", "తేదీ")}>
          {days.map((d) => (
            <button key={d.iso} role="radio" aria-checked={day === d.iso} onClick={() => setDay(d.iso)}>
              <span>{d.week}</span>{d.label}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="app-empty">{tr("No verified providers for this service in", "ఈ సేవకు ధృవీకరించిన సేవాదారులు లేరు:")} {city?.names[locale]}.</p>
        ) : (
          <ul className="app-cards">
            {list.map((m) => (
              <li key={m.id} className="app-pro">
                <Link to="/app/provider/$id" params={{ id: m.id }} className="app-pro-head">
                  <span className="app-avatar">{initials(m.name)}</span>
                  <span className="min-w-0">
                    <strong>{m.name}</strong>
                    <span className="app-muted">{m.hours}</span>
                    <span className="app-badge-sm"><ShieldCheck />{tr("DEMO verification", "DEMO ధృవీకరణ")}</span>
                  </span>
                </Link>
                <div className="app-pro-foot">
                  <span><strong>{money(price.total, locale)}</strong> {tr("est.", "అంచనా")}</span>
                  <Button asChild size="sm">
                    <Link to="/app/book/details" search={{ category, merchant: m.id, date: day }}>{tr("Book now", "బుక్ చేయండి")}</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="app-sample-tag">{tr("Fictional merchants. No ratings are shown because none are verified.", "కల్పిత వ్యాపారులు. ధృవీకరించిన రేటింగ్‌లు లేవు కాబట్టి చూపడం లేదు.")}</p>
      </section>
    </AppShell>
  );
}

/* ---------- 6. Provider profile ---------- */
export function AppProvider({ id }: { id: string }) {
  const { tr, locale, state } = useApp();
  const m = state.merchants.find((x) => x.id === id);
  const team = state.personas.filter((p) => p.role === "technician" && p.merchantId === id);
  if (!m) return <AppShell><Top /><p className="app-empty">{tr("Provider not found.", "సేవాదారు కనబడలేదు.")}</p></AppShell>;
  const cat = m.skills[0] ?? "electrician";
  return (
    <AppShell nav={false}>
      <Top />
      <section className="app-body">
        <div className="app-profile-head">
          <span className="app-avatar lg">{initials(m.name)}</span>
          <div className="min-w-0">
            <h1 className="app-h1">{m.name}</h1>
            <span className="app-badge-sm"><ShieldCheck />{tr("Verification: DEMO fixture", "ధృవీకరణ: DEMO నమూనా")}</span>
          </div>
        </div>
        <dl className="app-facts">
          <div><dt>{tr("Areas", "ప్రాంతాలు")}</dt><dd>{placeLabel(m.zones.join(", "), locale)}</dd></div>
          <div><dt>{tr("Hours", "సమయాలు")}</dt><dd>{m.hours}</dd></div>
          <div><dt>{tr("Team", "బృందం")}</dt><dd>{team.length}</dd></div>
        </dl>
        <h2 className="app-h2">{tr("Services offered", "అందించే సేవలు")}</h2>
        <div className="app-pills">
          {m.skills.map((s) => <span key={s}>{state.registry.services.find((v) => v.categoryId === s)?.names[locale] ?? s}</span>)}
        </div>
        <h2 className="app-h2">{tr("Demo team", "డెమో బృందం")}</h2>
        <ul className="app-list">{team.map((t) => <li key={t.id}>{t.name}</li>)}</ul>
        <h2 className="app-h2">{tr("Reviews", "సమీక్షలు")}</h2>
        <p className="app-muted">{tr("No verified reviews yet.", "ఇంకా ధృవీకరించిన సమీక్షలు లేవు.")}</p>
      </section>
      <div className="app-sticky">
        <Button asChild size="lg" className="app-cta">
          <Link to="/app/book/details" search={{ category: cat, merchant: m.id, date: "" }}>{tr("Book now", "బుక్ చేయండి")}</Link>
        </Button>
      </div>
    </AppShell>
  );
}

/* ---------- 7. Booking details ---------- */
const needs = [
  ["General service", "సాధారణ సేవ"],
  ["Repair", "మరమ్మత్తు"],
  ["Installation", "ఇన్‌స్టాలేషన్"],
  ["Not sure — inspect first", "ఖచ్చితంగా తెలియదు — ముందు పరిశీలన"],
] as const;
export type BookSearch = { category: string; merchant: string; date: string };
export function AppBookDetails({ search }: { search: BookSearch }) {
  const { tr, locale, state, cityId, draft, updateDraft } = useApp();
  const category = catOf(search.category);
  const price = usePrice(category);
  const navigate = useNavigate();
  const svc = enabledServices(state, cityId).find((s) => s.categoryId === category);
  const m = state.merchants.find((x) => x.id === search.merchant);
  const [need, setNeed] = useState(draft.problem.split(":")[0] || needs[0][0]);
  return (
    <AppShell nav={false}>
      <Top title={`${tr("Book", "బుక్")} ${svc?.names[locale] ?? ""}`} />
      <section className="app-body">
        <Steps step={1} />
        <div className="app-summary">
          {servicePhoto(category) && <img src={servicePhoto(category)} alt="" width={944} height={704} />}
          <div className="min-w-0">
            <strong>{svc?.names[locale]}</strong>
            <span className="app-muted">{m?.name ?? tr("Best eligible merchant", "అర్హత గల వ్యాపారి")}</span>
            <span>{money(price.total, locale)} {tr("est.", "అంచనా")}</span>
          </div>
        </div>
        <fieldset className="app-radios">
          <legend className="app-h2">{tr("What do you need?", "మీకు ఏమి కావాలి?")}</legend>
          {needs.map(([en, te]) => (
            <label key={en} className={need === en ? "on" : ""}>
              <input type="radio" name="need" checked={need === en} onChange={() => setNeed(en)} />
              {L(locale, en, te)}
            </label>
          ))}
        </fieldset>
      </section>
      <div className="app-sticky">
        <Button size="lg" className="app-cta" onClick={() => {
          updateDraft({ service: category, problem: `${need}: ${svc?.names["en-IN"] ?? category}` });
          navigate({ to: "/app/book/address", search });
        }}>{tr("Continue", "కొనసాగించండి")}</Button>
      </div>
    </AppShell>
  );
}

/* ---------- 8. Address & time ---------- */
const slots = [
  ["morning", "9 AM – 12 PM", "ఉ. 9 – మ. 12"],
  ["afternoon", "12 PM – 3 PM", "మ. 12 – 3"],
  ["evening", "3 PM – 6 PM", "మ. 3 – సా. 6"],
] as const;
function nextDays(n: number, locale: Loc) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return {
      iso: d.toLocaleDateString("en-CA"),
      week: d.toLocaleDateString(locale, { weekday: "short" }),
      label: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
    };
  });
}
export function AppBookAddress({ search }: { search: BookSearch }) {
  const { tr, locale, state, cityId, persona, draft, updateDraft, act, login } = useApp();
  const navigate = useNavigate();
  const days = nextDays(4, locale);
  async function addSample() {
    if (persona?.role !== "customer") login("sample-c1");
    const loc = state.registry.localities.find((l) => l.cityId === cityId);
    if (!loc) return;
    const a = {
      id: `ADDR-${Date.now()}`, customerId: persona?.role === "customer" ? persona.id : "sample-c1",
      label: "Home" as const, house: "SAMPLE 1-1", street: "Sample Street", landmark: "DEMO landmark",
      localityId: loc.id, cityId, state: "Andhra Pradesh" as const, pin: "534211", instructions: "",
      lat: loc.center[0], lng: loc.center[1], confirmedAt: Date.now(), preferred: true, consent: true as const, mode: "demo" as const,
    };
    const r = await act({ type: "address", payload: { address: a } });
    if (r.ok) setAddr(a.id);
  }
  const owner = persona?.role === "customer" ? persona.id : "sample-c1";
  const addresses = state.registry.addresses.filter((a) => a.customerId === owner && a.cityId === cityId);
  const [addr, setAddr] = useState(draft.addressId ?? addresses.find((a) => a.preferred)?.id ?? addresses[0]?.id ?? "");
  const [date, setDate] = useState(search.date || draft.date || days[0]!.iso);
  const [slot, setSlot] = useState(draft.time || "morning");
  const [notes, setNotes] = useState("");
  const ready = !!addr && !!date;
  return (
    <AppShell nav={false}>
      <Top title={tr("Address & time", "చిరునామా & సమయం")} />
      <section className="app-body">
        <Steps step={2} />
        <h2 className="app-h2">{tr("Service address", "సేవ చిరునామా")}</h2>
        {addresses.length === 0 ? (
          <div className="app-empty">
            <p>{tr("No saved address in this city yet.", "ఈ నగరంలో ఇంకా చిరునామా లేదు.")}</p>
            <Button variant="outline" className="mt-3" onClick={addSample}>{tr("Use a fictional SAMPLE address", "కల్పిత నమూనా చిరునామా వాడండి")}</Button>
            <Link className="text-link mt-3 block" to="/customer/addresses/new">{tr("Enter an address manually", "చిరునామా నమోదు చేయండి")}</Link>
          </div>
        ) : (
          <div className="app-radios">
            {addresses.map((a) => (
              <label key={a.id} className={addr === a.id ? "on" : ""}>
                <input type="radio" name="addr" checked={addr === a.id} onChange={() => setAddr(a.id)} />
                <MapPin aria-hidden="true" className="shrink-0" />
                <span className="min-w-0"><strong>{a.label}</strong><br /><span className="app-muted">{formattedAddress(a, state, locale)}</span></span>
              </label>
            ))}
            <Link to="/customer/addresses" className="text-link">{tr("Change or add address", "చిరునామా మార్చండి")}</Link>
          </div>
        )}
        <h2 className="app-h2">{tr("Preferred date", "కోరిన తేదీ")}</h2>
        <div className="app-chips" role="radiogroup">
          {days.map((d) => (
            <button key={d.iso} role="radio" aria-checked={date === d.iso} onClick={() => setDate(d.iso)}><span>{d.week}</span>{d.label}</button>
          ))}
        </div>
        <h2 className="app-h2">{tr("Preferred time", "కోరిన సమయం")}</h2>
        <div className="app-chips" role="radiogroup">
          {slots.map(([k, en, te]) => (
            <button key={k} role="radio" aria-checked={slot === k} onClick={() => setSlot(k)}>{L(locale, en, te)}</button>
          ))}
        </div>
        <label className="app-h2 block" htmlFor="notes">{tr("Additional notes (optional)", "అదనపు వివరాలు (ఐచ్ఛికం)")}</label>
        <textarea id="notes" className="app-input" rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("e.g. Not cooling properly", "ఉదా: సరిగా చల్లబడటం లేదు")} />
      </section>
      <div className="app-sticky">
        <Button size="lg" className="app-cta" disabled={!ready} onClick={() => {
          updateDraft({ addressId: addr, date, time: slot, problem: notes ? `${draft.problem} — ${notes}` : draft.problem });
          navigate({ to: "/app/book/confirm", search });
        }}>{tr("Continue", "కొనసాగించండి")}</Button>
      </div>
    </AppShell>
  );
}

/* ---------- 9. Confirm ---------- */
export function AppBookConfirm({ search }: { search: BookSearch }) {
  const { tr, locale, state, cityId, persona, draft, act, login, busy } = useApp();
  const navigate = useNavigate();
  const category = catOf(search.category);
  const price = usePrice(category);
  const svc = enabledServices(state, cityId).find((s) => s.categoryId === category);
  const address = state.registry.addresses.find((a) => a.id === draft.addressId);
  const submission = useRef<string | null>(null);
  const [error, setError] = useState("");
  const slot = slots.find((s) => s[0] === draft.time);
  async function confirm() {
    if (busy) return;
    if (!address || !draft.date) return setError(tr("Please choose an address and date.", "చిరునామా, తేదీ ఎంచుకోండి."));
    if (persona?.role !== "customer") login("sample-c1");
    submission.current ??= crypto.randomUUID();
    const locality = state.registry.localities.find((l) => l.id === address.localityId);
    const r = await act({
      type: "create",
      id: submission.current,
      payload: {
        category, cityId, serviceId: svc?.id ?? category,
        location: address,
        zone: locality?.names["en-IN"] ?? "Tanuku",
        problem: draft.problem || category, date: draft.date, slot: draft.time,
        priceVersion: price.rates.version, priceTotal: price.total,
      },
    });
    if (!r.ok) { submission.current = null; return setError(tr("Couldn’t send the request. Try again.", "అభ్యర్థన పంపలేకపోయాం. మళ్లీ ప్రయత్నించండి.") + ` (${r.code})`); }
    navigate({ to: "/app/track/$id", params: { id: r.bookingId ?? "" } });
  }
  return (
    <AppShell nav={false}>
      <Top title={tr("Confirm booking", "బుకింగ్ నిర్ధారణ")} />
      <section className="app-body">
        <Steps step={3} />
        <div className="app-summary">
          {servicePhoto(category) && <img src={servicePhoto(category)} alt="" width={944} height={704} />}
          <div className="min-w-0"><strong>{svc?.names[locale]}</strong><span className="app-muted">{draft.problem}</span></div>
        </div>
        <ul className="app-rows">
          <li><CalendarDays />{draft.date} · {slot ? L(locale, slot[1], slot[2]) : ""}</li>
          <li><MapPin />{address ? formattedAddress(address, state, locale) : "—"}</li>
        </ul>
        <div className="app-price-box">
          <div><span>{tr("Inspection / visit", "పరిశీలన / సందర్శన")}</span><strong>{money(price.visit, locale)}</strong></div>
          <div><span>{tr("Estimated labour", "అంచనా శ్రమ")}</span><strong>{money(price.labor, locale)}</strong></div>
          <div><span>{tr("Parts allowance", "భాగాల పరిమితి")}</span><strong>{money(price.parts, locale)}</strong></div>
          {price.fee > 0 && <div><span>{tr("Platform fee", "ప్లాట్‌ఫామ్ రుసుము")}</span><strong>{money(price.fee, locale)}</strong></div>}
          {price.discount > 0 && <div><span>{tr("Discount", "తగ్గింపు")}</span><strong>−{money(price.discount, locale)}</strong></div>}
          <div><span>{tr("Tax", "పన్ను")}</span><strong>{price.rates.taxConfigured ? money(price.tax, locale) : tr("Not configured", "కాన్ఫిగర్ చేయలేదు")}</strong></div>
          <div className="total"><span>{tr("Estimated total (DEMO)", "అంచనా మొత్తం (DEMO)")}</span><strong>{money(price.total, locale)}</strong></div>
        </div>
        {!price.rates.taxConfigured && <p className="app-note">{tr("Tax is not configured and is excluded from this estimate. Confirm any applicable amount before service.", "పన్ను ఇంకా కాన్ఫిగర్ చేయలేదు; ఈ అంచనాలో చేర్చలేదు. సేవకు ముందు వర్తించే మొత్తాన్ని నిర్ధారించండి.")}</p>}
        <p className="app-note">{tr("Planned payment: cash after service completion (COD). DEMO only; no cash is requested or collected.", "ప్రతిపాదిత చెల్లింపు: సేవ పూర్తయ్యాక నగదు (COD). DEMO మాత్రమే; నగదు అడగరు లేదా వసూలు చేయరు.")}</p>
        <p className="app-note"><ShieldCheck aria-hidden="true" />{tr("A merchant must accept first. Any final price needs your approval.", "ముందు వ్యాపారి అంగీకరించాలి. తుది ధరకు మీ ఆమోదం అవసరం.")}</p>
        {error && <p className="app-error" role="alert">{error}</p>}
      </section>
      <div className="app-sticky">
        <Button size="lg" className="app-cta" disabled={busy} onClick={confirm}>{busy ? tr("Sending…", "పంపుతోంది…") : tr("Send DEMO request", "DEMO అభ్యర్థన పంపండి")}</Button>
        <p className="app-small">{tr("By confirming you agree to the", "నిర్ధారించడం ద్వారా మీరు అంగీకరిస్తున్నారు:")} <Link to="/terms" className="text-link">{tr("Terms", "నిబంధనలు")}</Link></p>
      </div>
    </AppShell>
  );
}

/* ---------- 10. Tracking ---------- */
const flow: { keys: string[]; en: string; te: string }[] = [
  { keys: ["matching", "awaiting_response"], en: "Request sent — finding a merchant", te: "అభ్యర్థన పంపబడింది — వ్యాపారి కోసం వెతుకుతోంది" },
  { keys: ["accepted", "scheduled"], en: "Merchant accepted", te: "వ్యాపారి అంగీకరించారు" },
  { keys: ["travel"], en: "Professional on the way", te: "నిపుణుడు దారిలో ఉన్నారు" },
  { keys: ["arrived", "inspection", "awaiting_quote", "quote_rejected"], en: "Arrived · inspection & quote", te: "చేరారు · పరిశీలన & కోట్" },
  { keys: ["approved", "in_progress"], en: "Service in progress", te: "సేవ జరుగుతోంది" },
  { keys: ["complete"], en: "Completed", te: "పూర్తయింది" },
];
function statusLabel(b: Booking, locale: Loc) {
  const f = flow.find((x) => x.keys.includes(b.status));
  if (f) return L(locale, f.en, f.te);
  return L(locale, "Closed: " + b.status.replace("_", " "), "ముగిసింది: " + b.status.replace("_", " "));
}
export function AppTrack({ id }: { id: string }) {
  const { tr, locale, state } = useApp();
  const b = state.bookings.find((x) => x.id === id);
  if (!b) return <AppShell><Top /><p className="app-empty">{tr("Booking not found.", "బుకింగ్ కనబడలేదు.")}</p></AppShell>;
  const idx = flow.findIndex((x) => x.keys.includes(b.status));
  const m = state.merchants.find((x) => x.id === b.merchantId);
  const tech = state.personas.find((p) => p.id === b.technicianId);
  return (
    <AppShell>
      <Top title={tr("Service status", "సేవ స్థితి")} right={<span className="app-muted text-xs">{b.id}</span>} />
      <section className="app-body">
        {idx < 0 && <p className="app-error" role="status">{statusLabel(b, locale)}</p>}
        <ol className="app-timeline" aria-live="polite">
          {flow.map((f, i) => (
            <li key={f.en} className={i < idx || b.status === "complete" ? "done" : i === idx ? "now" : ""}>
              <span className="dot">{i < idx || b.status === "complete" ? <Check /> : null}</span>
              <span>{L(locale, f.en, f.te)}</span>
            </li>
          ))}
        </ol>
        {m && (
          <div className="app-pro-head card">
            <span className="app-avatar">{initials(m.name)}</span>
            <span className="min-w-0"><strong>{m.name}</strong><span className="app-muted">{tech ? tech.name : tr("Technician not assigned yet", "ఇంకా టెక్నీషియన్ కేటాయించలేదు")}</span></span>
            <Link to="/communications/conversation" className="app-icon-btn" aria-label={tr("Messages (DEMO)", "సందేశాలు (DEMO)")}><Bell /></Link>
          </div>
        )}
        <div className="app-map-demo" role="img" aria-label={tr("DEMO map placeholder — no live tracking", "DEMO మ్యాప్ — ప్రత్యక్ష ట్రాకింగ్ లేదు")}>
          <MapPin aria-hidden="true" />
          <span>{tr("DEMO preview · live tracking is not connected", "DEMO ప్రివ్యూ · ప్రత్యక్ష ట్రాకింగ్ అనుసంధానించలేదు")}</span>
        </div>
        {b.status === "awaiting_quote" && (
          <Button asChild className="app-cta"><Link to="/customer/bookings/$id/quote" params={{ id: b.id }}>{tr("Review quote", "కోట్ చూడండి")}</Link></Button>
        )}
        {b.status === "complete" && (
          <Button asChild className="app-cta"><Link to="/app/complete/$id" params={{ id: b.id }}>{tr("Rate your experience", "మీ అనుభవాన్ని రేట్ చేయండి")}</Link></Button>
        )}
        <div className="app-links">
          <Link to="/customer/bookings/$id/cancel" params={{ id: b.id }} className="text-link">{tr("Cancel request", "అభ్యర్థన రద్దు")}</Link>
          <Link to="/demo" className="text-link">{tr("Advance as merchant/technician (Demo Center)", "వ్యాపారి/టెక్నీషియన్‌గా ముందుకు (డెమో సెంటర్)")}</Link>
        </div>
      </section>
    </AppShell>
  );
}

/* ---------- 11. Completed ---------- */
export function AppComplete({ id }: { id: string }) {
  const { tr, locale, state } = useApp();
  const b = state.bookings.find((x) => x.id === id);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const final = b?.approvedQuote ?? b?.estimate;
  const bill = b?.status === "complete" && b.approvedQuote ? b.approvedQuote : null;
  return (
    <AppShell nav={false}>
      <Top />
      <section className="app-body text-center">
        <span
          className={`app-success ${b?.status === "complete" ? "app-success-complete" : "app-success-pending"}`}
          aria-hidden="true"
        >
          {b?.status === "complete" ? <Check /> : <Timer />}
        </span>
        <h1 className="app-h1">{b?.status === "complete" ? tr("Service completed", "సేవ పూర్తయింది") : tr("Not completed yet", "ఇంకా పూర్తి కాలేదు")}</h1>
        <p className="app-muted">{tr("Thank you for trying Fix Hub (DEMO).", "Fix Hub (DEMO) ఉపయోగించినందుకు ధన్యవాదాలు.")}</p>
        {final && <p className="app-price-line">{tr("Approved amount (DEMO receipt)", "ఆమోదించిన మొత్తం (DEMO రసీదు)")}: <strong>{money(final.total, locale)}</strong></p>}
        {bill && b && (
          <section className="app-bill" aria-labelledby="demo-bill-title">
            <div className="app-bill-heading">
              <div>
                <h2 id="demo-bill-title" className="app-h2">{tr("Service bill · DEMO", "సేవా బిల్లు · DEMO")}</h2>
                <p className="app-muted">{tr("Reference", "రిఫరెన్స్")}: {b.id}</p>
              </div>
              <span className="app-demo-badge">DEMO</span>
            </div>
            <p className="app-muted">{tr("Service", "సేవ")}: {b.category}</p>
            <dl className="app-bill-lines">
              {demoBillLines(bill, locale).map((line) => (
                <div key={line.label}>
                  <dt>{line.label}</dt>
                  <dd>{line.amount === null ? line.note : money(line.amount, locale)}</dd>
                </div>
              ))}
              <div className="app-bill-total">
                <dt>{tr("Approved total", "ఆమోదించిన మొత్తం")}</dt>
                <dd>{money(bill.total, locale)}</dd>
              </div>
            </dl>
            <p className="app-note">{tr("Cash collection is outside this demo. No payment was processed or recorded; this is not proof of payment or a tax invoice.", "నగదు చెల్లింపు ఈ డెమో వెలుపల ఉంటుంది. చెల్లింపు ప్రాసెస్ లేదా రికార్డ్ చేయలేదు; ఇది చెల్లింపు రుజువు లేదా పన్ను ఇన్వాయిస్ కాదు.")}</p>
            <div className="app-bill-actions">
              <Button type="button" className="app-cta" onClick={() => window.print()}>
                {tr("Print / save bill as PDF", "బిల్లును ప్రింట్ / PDFగా సేవ్ చేయండి")}
              </Button>
              <p className="app-small">{tr("Choose “Save as PDF” in your browser’s print dialog to download a copy.", "కాపీ డౌన్‌లోడ్ చేయడానికి బ్రౌజర్ ప్రింట్ డైలాగ్‌లో “PDFగా సేవ్ చేయండి” ఎంచుకోండి.")}</p>
            </div>
          </section>
        )}
        {sent ? (
          <p className="app-note justify-center" role="status"><Check />{tr("Thanks! Review saved in this demo only.", "ధన్యవాదాలు! సమీక్ష ఈ డెమోలో మాత్రమే.")}</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (stars) setSent(true); }}>
            <fieldset>
              <legend className="app-h2">{tr("Rate your experience", "మీ అనుభవాన్ని రేట్ చేయండి")}</legend>
              <div className="app-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`${n}`} aria-pressed={stars >= n} onClick={() => setStars(n)}><Star className={stars >= n ? "on" : ""} /></button>
                ))}
              </div>
            </fieldset>
            <textarea className="app-input" rows={4} maxLength={500} aria-label={tr("Your feedback", "మీ అభిప్రాయం")} value={text} onChange={(e) => setText(e.target.value)} placeholder={tr("Tell us about your experience…", "మీ అనుభవం చెప్పండి…")} />
            <Button size="lg" className="app-cta mt-4" disabled={!stars}>{tr("Submit review", "సమీక్ష పంపండి")}</Button>
          </form>
        )}
        <div className="app-links justify-center">
          {b && <Link to="/customer/bookings/$id/complaint" params={{ id: b.id }} className="text-link">{tr("Raise an issue", "సమస్య తెలియజేయండి")}</Link>}
          {b && <Link to="/app/service/$id" params={{ id: b.category }} className="text-link">{tr("Book again", "మళ్లీ బుక్")}</Link>}
        </div>
      </section>
    </AppShell>
  );
}

/* ---------- 12. Profile ---------- */
export function AppProfile() {
  const { tr, persona, logout, login, locale } = useApp();
  const navigate = useNavigate();
  const rows: [typeof Home, string, string, string?][] = [
    [CalendarDays, tr("My bookings", "నా బుకింగ్‌లు"), "/customer/bookings"],
    [Heart, tr("Saved professionals", "సేవ్ చేసిన నిపుణులు"), "/customer/bookings"],
    [MapPin, tr("Addresses", "చిరునామాలు"), "/customer/addresses"],
    [Wallet, tr("Payments (DEMO, none connected)", "చెల్లింపులు (DEMO)"), "/customer/settings"],
    [CircleHelp, tr("Help & support", "సహాయం"), "/customer/support"],
    [Globe, tr("Language", "భాష"), "/customer/settings/language", locale === "te-IN" ? "తెలుగు" : "English"],
    [Bell, tr("Notifications", "నోటిఫికేషన్‌లు"), "/customer/notifications"],
    [ShieldCheck, tr("Privacy", "గోప్యత"), "/customer/settings/privacy"],
  ];
  return (
    <AppShell>
      <Top title={tr("My profile", "నా ప్రొఫైల్")} back={false} />
      <section className="app-body">
        <div className="app-profile-head">
          <span className="app-avatar lg">{persona ? initials(persona.name) : "?"}</span>
          <div className="min-w-0">
            <strong>{persona?.name ?? tr("Not signed in", "సైన్ ఇన్ కాలేదు")}</strong>
            <p className="app-muted">{tr("Fictional demo account · no phone stored", "కల్పిత డెమో ఖాతా · ఫోన్ నిల్వ లేదు")}</p>
          </div>
        </div>
        {!persona && <Button className="app-cta" onClick={() => login("sample-c1")}>{tr("Continue as SAMPLE Customer A", "SAMPLE కస్టమర్ Aగా కొనసాగండి")}</Button>}
        <ul className="app-menu">
          {rows.map(([I, label, to, extra]) => (
            <li key={label}><Link to={to}><I aria-hidden="true" /><span>{label}</span>{extra && <em>{extra}</em>}<ChevronRight aria-hidden="true" /></Link></li>
          ))}
          {persona && (
            <li><button onClick={() => { logout(); navigate({ to: "/app" }); }}><LogOut aria-hidden="true" /><span>{tr("Log out", "లాగ్ అవుట్")}</span></button></li>
          )}
        </ul>
      </section>
    </AppShell>
  );
}
