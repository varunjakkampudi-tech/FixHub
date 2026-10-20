import { createContext, type Context } from "react";
import type { Locale, MessageKey } from "./locales";

export type Draft = {
  service: string;
  problem: string;
  address: string;
  cityId?: string;
  addressId?: string;
  zone: string;
  date: string;
  time: string;
  photoNames: string[];
  consent: boolean;
};
export type Store = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  draft: Draft;
  updateDraft: (patch: Partial<Draft>) => void;
  submitted: boolean;
  setSubmitted: (value: boolean) => void;
  cancelled: boolean;
  setCancelled: (value: boolean) => void;
};

// A live module update must not give existing providers and new consumers
// different React context identities. This holds the context, not user data.
const hotData = import.meta.hot?.data as { fixHubContext?: Context<Store | null> } | undefined;
export const StoreContext = hotData?.fixHubContext ?? createContext<Store | null>(null);
if (hotData) hotData.fixHubContext = StoreContext;
