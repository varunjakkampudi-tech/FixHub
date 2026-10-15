import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CircleHelp } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { type MessageKey } from "./locales";
import { PageShell, PageTop, Steps, Trust, Notice, Empty, LocaleControl, Modal } from "./shared";
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
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!message.trim()) {
                    setError(true);
                    return;
                  }
                  setError(false);
                  setSaved(true);
                }}
              >
                <div className="form-group">
                  <label htmlFor="contact-message" className="form-label">
                    {t("message")}
                  </label>
                  <textarea
                    id="contact-message"
                    className="form-input min-h-36"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                {error && <Notice error>{t("required")}</Notice>}
                <Notice warning>{t("routePreview")}</Notice>
                <Button type="submit">{t("sendDemo")}</Button>
                {saved && (
                  <div className="mt-5" role="status">
                    <Notice>
                      {t("saved")} · {t("demo")}
                    </Notice>
                  </div>
                )}
              </form>
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
export { DemoAuth as AuthPage } from "./demo-pages";
function LegacyAuthPage({ mode = "sign-in" }: { mode?: string }) {
  const { t } = useFixHub();
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const choose = mode === "register";
  const otp = mode.includes("otp") || mode.includes("verification");
  const blocked =
    mode.includes("suspended") || mode.includes("denied") || mode === "account-pending";
  return (
    <PageShell>
      <main id="main" className="wrap">
        <div className="mx-auto max-w-lg pb-10">
          <PageTop title={t(choose ? "register" : "authTitle")} desc={t("authDesc")} />
          {choose ? (
            <div className="grid gap-4">
              {[
                ["/customer/register", "customer"],
                ["/merchant/onboarding", "merchant"],
              ].map(([to, key]) => (
                <Button asChild variant="outline" key={to}>
                  <Link to={to ?? "/"}>
                    {t(key as MessageKey)}
                    <ArrowRight />
                  </Link>
                </Button>
              ))}
            </div>
          ) : blocked ? (
            <Empty
              title={mode.includes("pending") ? "pending" : "restricted"}
              desc="restrictedDesc"
              action={
                <Button asChild>
                  <Link to="/help">{t("help")}</Link>
                </Button>
              }
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const valid = otp ? /^\d{6}$/.test(input) : input.trim().length >= 5;
                if (!valid) {
                  setError(true);
                  return;
                }
                setError(false);
                if (otp) setSuccess(true);
                else setConfirm(true);
              }}
            >
              <Notice warning>{t("authDesc")}</Notice>
              <div className="form-group">
                <label className="form-label" htmlFor="auth-input">
                  {t(otp ? "otp" : mode.includes("password") ? "password" : "phone")}
                </label>
                <input
                  id="auth-input"
                  className="form-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  autoComplete="off"
                  inputMode={otp ? "numeric" : "text"}
                  maxLength={otp ? 6 : 100}
                  type={mode.includes("password") ? "password" : "text"}
                  aria-invalid={error}
                />
              </div>
              {otp && <p className="mb-5 text-sm text-muted-foreground">{t("otpDesc")}</p>}
              {error && <Notice error>{t("required")}</Notice>}
              <Button className="w-full" type="submit">
                {t(otp ? "verify" : "sendCode")}
              </Button>
              <div className="mt-5 flex flex-wrap justify-between gap-4">
                <Link to="/register" className="text-link">
                  {t("register")}
                </Link>
                <Link to="/forgot-password" className="text-link">
                  {t("password")}
                </Link>
              </div>
              {success && (
                <div className="mt-5">
                  <Notice>
                    {t("saved")} · {t("demo")}
                  </Notice>
                  <Button asChild>
                    <Link to="/customer">{t("customer")}</Link>
                  </Button>
                </div>
              )}
            </form>
          )}
        </div>
      </main>
      <Modal open={confirm} onOpenChange={setConfirm} title={t("otp")} description={t("otpDesc")}>
        <Button asChild>
          <Link to="/otp" onClick={() => setConfirm(false)}>
            {t("next")}
          </Link>
        </Button>
      </Modal>
    </PageShell>
  );
}
