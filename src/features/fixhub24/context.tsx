import { useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type MessageKey, type Locale } from "./locales";
import { StoreContext, type Draft } from "./store-context";
export function FixHub24Provider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en-IN");
  const [localeReady, setLocaleReady] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    service: "electrician",
    problem: "",
    address: "",
    zone: "Tanuku",
    date: "",
    time: "morning",
    photoNames: [],
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("fixhub24-locale");
    if (saved === "te-IN") setLocale(saved);
    setLocaleReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale === "te-IN" ? "te" : "en";
    if (localeReady) localStorage.setItem("fixhub24-locale", locale);
  }, [locale, localeReady]);
  const t = (key: MessageKey) => messages[key][locale === "te-IN" ? 1 : 0];
  return (
    <StoreContext.Provider
      value={{
        locale,
        setLocale,
        t,
        draft,
        updateDraft: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
        submitted,
        setSubmitted,
        cancelled,
        setCancelled,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useFixHub24() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("FixHub24Provider is required");
  return context;
}
export function meta(title: string, privatePage = false) {
  const description = `${title} · FixHub24 by Viswatra. English and Telugu local service demonstration for planned Tanuku and future Eluru/Bhimavaram markets.`;
  return {
    meta: [
      { title: `${title} | FixHub24` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | FixHub24` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(privatePage ? [{ name: "robots", content: "noindex,nofollow" }] : []),
    ],
  };
}
