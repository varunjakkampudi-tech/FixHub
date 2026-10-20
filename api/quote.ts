import { createHash } from "node:crypto";

export type BookingQuote = {
  visit_price_paise: number | string;
  labor_estimate_paise: number | string;
  parts_estimate_paise: number | string | null;
  currency: string;
  payment_method: string;
};

/** Hash the exact displayed quote terms so a later price edit invalidates consent. */
export function bookingQuoteHash(quote: BookingQuote): Buffer {
  const canonical = JSON.stringify({
    visitPricePaise: Number(quote.visit_price_paise),
    laborEstimatePaise: Number(quote.labor_estimate_paise),
    partsEstimatePaise:
      quote.parts_estimate_paise === null ? null : Number(quote.parts_estimate_paise),
    currency: quote.currency,
    paymentMethod: quote.payment_method,
  });
  return createHash("sha256").update(canonical).digest();
}
