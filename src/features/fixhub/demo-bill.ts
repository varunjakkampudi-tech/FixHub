import type { Price } from "./demo-model";

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
