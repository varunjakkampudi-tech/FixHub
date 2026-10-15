import { createContext, useContext, type Context } from "react";
import type { DemoState, Persona, Command, Result } from "./demo-model";
export type DemoStore = {
  state: DemoState;
  ready: boolean;
  persona: Persona | null;
  busy: boolean;
  lastBookingId: string;
  act: (command: Omit<Command, "actor" | "id"> & { id?: string }) => Promise<Result>;
  login: (id: string) => void;
  logout: () => void;
  reset: (scenario?: string) => Promise<void>;
  error: string;
  clearError: () => void;
};
const data = import.meta.hot?.data as { demoContext?: Context<DemoStore | null> } | undefined;
export const DemoContext = data?.demoContext ?? createContext<DemoStore | null>(null);
if (data) data.demoContext = DemoContext;
export function useDemo() {
  const store = useContext(DemoContext);
  if (!store) throw new Error("DemoProvider is required");
  return store;
}
