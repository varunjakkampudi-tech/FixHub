import { Link } from "@tanstack/react-router";
import { DemoAuth } from "./demo-pages";
import { RealAuth } from "./real-auth";
import { useState } from "react";
import { ArrowRight, CircleHelp } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { type MessageKey } from "./locales";
import { PageShell, PageTop, Steps, Trust, Notice, Empty, LocaleControl } from "./shared";
export function FAQ() {
  const { t } = useFixHub();
  return (
    <Accordion.Root type="single" collapsible className="mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Accordion.Item key={i} value={String(i)} className="border-b">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-bold">
              {t(`faq${i}` as MessageKey)}
              <span aria-hidden="true">+</span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-5 text-sm text-muted-foreground">
            {t(`faq${i}A` as MessageKey)}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
const publicTitles: Record<string, MessageKey> = {
  "how-it-works": "how",
  "why-fixhub": "why",
  "service-areas": "area",
  "locations/tanuku": "location",
  partners: "partners",
  "partners/benefits": "partnerTitle",
  "partners/faq": "faq",
  about: "about",
  contact: "contact",
  help: "help",
  faq: "faq",
  safety: "safety",
  pricing: "price",
  download: "download",
  privacy: "privacy",
  terms: "terms",
  "cancellation-policy": "cancelPolicy",
  "refund-policy": "refund",
  "merchant-terms": "termsMerchant",
  cookies: "cookies",
  accessibility: "accessibility",
  "service-unavailable": "unavailableTitle",
};
export function PublicPage({ page }: { page: string }) {
  const { t } = useFixHub();
  const [saved, setSaved] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const title = t(publicTitles[page] ?? "help");
  const legal = [
    "privacy",
    "terms",
    "cancellation-policy",
    "refund-policy",
    "merchant-terms",
  ].includes(page);
  return (
    <PageShell>
      <main id="main">
        <div className="wrap">
          <PageTop
            title={title}
            desc={
              legal
                ? t("legalDraft")
                : page === "about"
                  ? t("aboutDesc")
                  : page.includes("partner")
                    ? t("partnerDesc")
                    : page === "contact"
                      ? t("contactDesc")
                      : page === "service-areas" || page === "locations/tanuku"
                        ? t("areasDesc")
                        : t("helpDesc")
            }
          />
        </div>
        {page === "how-it-works" ? (
          <Steps />
        ) : page === "why-fixhub" || page === "safety" ? (
          <Trust />
        ) : (
          <div className="wrap prose-content">
            {legal ? (
              <>
                <Notice warning>{t("legalDesc")}</Notice>
                <h2>{t("policyScope")}</h2>
                <p>{t("security")}</p>
                <p>{t("quoteNote")}</p>
                <p>{t("availabilityNote")}</p>
                <h2>{t("policyReview")}</h2>
                <p>{t("legalDesc")}</p>
                <Link className="text-link" to="/help">
                  {t("help")}
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : page === "cookies" ? (
              <>
                <Notice>{t("cookieHelp")}</Notice>
                <label className="mb-5 flex min-h-11 items-center justify-between gap-4">
                  {t("essential")}
                  <input type="checkbox" checked disabled className="size-5 accent-primary" />
                </label>
                <label className="mb-5 flex min-h-11 items-center justify-between gap-4">
                  {t("analytics")}
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="size-5 accent-primary"
                  />
                </label>
                <Button onClick={() => setSaved(true)}>{t("save")}</Button>
                {saved && (
                  <div className="mt-5">
                    <Notice>{t("saved")}</Notice>
                  </div>
                )}
              </>
            ) : page === "contact" ? (
              <Button asChild><Link to="/customer/support">{t("help")}</Link></Button>
            ) : page === "download" ? (
              <>
                <h2>{t("appTitle")}</h2>
                <p>{t("appDesc")}</p>
                <Notice>{t("coming")}</Notice>
                <Button asChild>
                  <Link to="/services">
                    {t("services")}
                    <ArrowRight />
                  </Link>
                </Button>
              </>
            ) : page === "about" ? (
              <>
                <h2>{t("made")}</h2>
                <p>{t("aboutDesc")}</p>
                <p>{t("safetyDesc")}</p>
                <Button asChild>
                  <Link to="/services">{t("services")}</Link>
                </Button>
              </>
            ) : page === "accessibility" ? (
              <>
                <h2>{t("accessibility")}</h2>
                <p>{t("accessDesc")}</p>
                <h2>{t("language")}</h2>
                <LocaleControl />
                <p className="mt-4">{t("languageHelp")}</p>
                <Link to="/contact" className="text-link">
                  {t("contact")}
                </Link>
              </>
            ) : page === "service-areas" || page === "locations/tanuku" ? (
              <>
                <Notice>{t("areasDesc")}</Notice>
                <h2>
                  {t("location")} · {t("state")}
                </h2>
                <Button asChild>
                  <Link to="/services">{t("services")}</Link>
                </Button>
              </>
            ) : page.startsWith("partners") ? (
              <>
                <Notice>{t("onboardDesc")}</Notice>
                <h2>{t("partnerTitle")}</h2>
                <p>{t("partnerDesc")}</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/merchant/onboarding">
                      {t("onboard")}
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/merchant">{t("merchant")}</Link>
                  </Button>
                </div>
                <h2>{t("faq")}</h2>
                <FAQ />
              </>
            ) : page === "service-unavailable" ? (
              <Empty
                title="unavailableTitle"
                desc="unavailableDesc"
                action={
                  <Button asChild>
                    <Link to="/services">{t("retry")}</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <FAQ />
                <div className="specific-banner">
                  <CircleHelp className="specific-icon" />
                  <div>
                    <h3>{t("specific")}</h3>
                    <p>{t("contactDesc")}</p>
                  </div>
                  <Button asChild>
                    <Link to="/contact">
                      {t("contact")}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </PageShell>
  );
}
export function AuthPage({ mode = "sign-in" }: { mode?: string }) {
  if (mode === "sign-in" || mode.includes("register")) return <RealAuth mode={mode} />;
  return <DemoAuth mode={mode} />;
}
