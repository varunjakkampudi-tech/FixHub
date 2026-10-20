import { money, type Price } from "./demo-model";

export type DemoBillLine = { label: string; amount: number | null; note?: string };

export function demoBillLines(price: Price, locale: "en-IN" | "te-IN" | "hi-IN"): DemoBillLine[] {
  const telugu = locale === "te-IN";
  return [
    { label: telugu ? "సందర్శన ఛార్జీ" : "Visit charge", amount: price.visit },
    { label: telugu ? "పని" : "Labour", amount: price.labor },
    { label: telugu ? "భాగాల అంచనా" : "Parts allowance", amount: price.parts },
    { label: telugu ? "ప్లాట్‌ఫారమ్ ఛార్జీ" : "Platform fee", amount: price.fee },
    { label: telugu ? "తగ్గింపు" : "Discount", amount: price.discount === 0 ? 0 : -price.discount },
    price.rates.taxConfigured
      ? { label: telugu ? "పన్ను" : "Tax", amount: price.tax }
      : {
          label: telugu ? "పన్ను" : "Tax",
          amount: null,
          note: telugu ? "ఈ డెమోలో కాన్ఫిగర్ చేయలేదు" : "Not configured in this demo",
        },
  ];
}

export function demoServiceRecordFile(
  reference: string,
  service: string,
  price: Price,
  locale: "en-IN" | "te-IN" | "hi-IN",
) {
  const telugu = locale === "te-IN";
  const safeLine = (value: string) =>
    value.replace(/[\r\n\u0000-\u001f\u007f]/g, " ").slice(0, 120);
  const safeReference = safeLine(reference).trim() || "demo-record";
  const safeService =
    safeLine(service).trim() || (telugu ? "సేవ పేర్కొనలేదు" : "Service not specified");
  const content = [
    telugu ? "ఫిక్స్ హబ్ — సేవా రికార్డు · డెమో" : "FIXHUB2424 — SERVICE RECORD · DEMO",
    telugu
      ? "డెమో మాత్రమే — పన్ను ఇన్వాయిస్ లేదా చెల్లింపు రసీదు కాదు"
      : "DEMO ONLY — NOT A TAX INVOICE OR PAYMENT RECEIPT",
    `${telugu ? "రిఫరెన్స్" : "Reference"}: ${safeReference}`,
    `${telugu ? "సేవ" : "Service"}: ${safeService}`,
    "",
    ...demoBillLines(price, locale).map(
      ({ label, amount, note }) => `${label}: ${amount === null ? note : money(amount, locale)}`,
    ),
    `${telugu ? "ఆమోదించిన మొత్తం" : "Approved total"}: ${money(price.total, locale)}`,
    "",
    telugu
      ? "ఈ డెమోలో నగదు వసూలు జరగలేదు లేదా నమోదు చేయలేదు. ఇది చెల్లింపు రుజువు లేదా పన్ను ఇన్వాయిస్ కాదు."
      : "Cash collection is outside this demo. No payment was processed or recorded; this is not proof of payment or a tax invoice.",
  ].join("\r\n");
  const filenameReference =
    safeReference
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "record";
  return {
    filename: `fixhub24-demo-service-record-${filenameReference}.txt`,
    href: `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
    content,
  };
}
