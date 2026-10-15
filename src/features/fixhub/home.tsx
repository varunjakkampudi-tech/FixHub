import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  ShieldCheck,
  ClipboardCheck,
  House,
  BriefcaseBusiness,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import technicianImage from "@/assets/fixhub-technician.jpg";
import { useFixHub } from "./context";
import { useDemo } from "./demo-context";
import { lt } from "./location-copy";
import { PageShell, SearchBox, CategoryGrid, Steps, Trust, Brand, CategoryIcon } from "./shared";
export function HomePage() {
  const { t, locale, draft } = useFixHub();
  const { state } = useDemo();
  const city = state.registry.cities.find((c) => c.id === (draft.cityId ?? "tanuku"));
  const navigate = useNavigate();
  return (
    <PageShell>
      <main id="main">
        <section className="hero">
          <img
            className="hero-photo"
            src={technicianImage}
            alt="A local service technician with tools in an Andhra Pradesh neighbourhood"
            width={1536}
            height={1024}
            fetchPriority="high"
          />
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">
                <MapPin size={12} className="text-orange" />
                {t("local")}
              </span>
              <h1>
                {t("hero1")}
                <br />
                {t("hero2")} <em>{city?.names[locale] ?? t("hero3")}</em>
              </h1>
              <p className="hero-description">
                {lt(city?.launch === "planned" ? "planned" : "future", locale)}
              </p>
              <SearchBox onSearch={(q) => navigate({ to: "/search", search: { q } })} />
              <div className="hero-booking">
                <Link className="text-link" to="/app">
                  {locale === "te-IN" ? "యాప్ ప్రివ్యూ తెరవండి" : "Open the app preview"}
                  <ArrowRight size={15} />
                </Link>
                <Link className="text-link" to="/customer/book/new">
                  {t("book")}
                  <ArrowRight size={15} />
                </Link>
              </div>
              <div className="hero-assurances">
                <span>
                  <ShieldCheck />
                  {t("verification")}
                </span>
                <span>
                  <ClipboardCheck />
                  {t("pricing")}
                </span>
                <span>
                  <MapPin />
                  {t("localSupport")}
                </span>
              </div>
            </div>
          </div>
          <div className="hero-note" lang="te">
            మీ ఇంటి సేవలు
            <br />
            ఇప్పుడు మరింత సులభం.
          </div>
        </section>
        <section className="wrap section">
          <div className="section-heading">
            <h2>{t("popular")}</h2>
            <Link to="/services" className="text-link">
              {t("allServices")}
              <ArrowRight size={15} />
            </Link>
          </div>
          <CategoryGrid />
          <div className="specific-banner">
            <House className="specific-icon" aria-hidden="true" />
            <div>
              <h3>{t("specific")}</h3>
              <p>{t("specificDesc")}</p>
            </div>
            <Button asChild>
              <Link to="/customer/book/new">
                {t("find")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
        <Steps />
        <Trust />
        <section className="wrap section">
          <div className="partner-band">
            <BriefcaseBusiness className="partner-art" aria-hidden="true" />
            <div>
              <h2>{t("partnerTitle")}</h2>
              <p>{t("partnerDesc")}</p>
            </div>
            <Button asChild variant="partner">
              <Link to="/partners">
                {t("join")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="app-section">
            <div>
              <h2>{t("appTitle")}</h2>
              <p>{t("appDesc")}</p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="status">
                  <Smartphone size={15} />
                  {t("coming")}
                </span>
                <Link className="text-link" to="/download">
                  {t("appMore")}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <div className="app-device" aria-hidden="true">
              <div className="phone">
                <Brand />
                <div className="mt-4 text-center text-[10px] font-bold">{t("specific")}</div>
                <div className="phone-grid">
                  {["electrician", "plumbing", "ac", "painting", "cleaning", "carpentry"].map(
                    (id) => (
                      <CategoryIcon key={id} id={id} />
                    ),
                  )}
                </div>
              </div>
              <div className="max-w-36">
                <Smartphone size={36} className="mb-3 text-primary" />
                <p className="text-xs">{t("coming")}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
