import { communicationsSeed } from "./communications-model";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DemoContext } from "./demo-context";
import {
  seed,
  transition,
  scenarioSeed,
  type DemoState,
  type Command,
  type Result,
} from "./demo-model";
import { registrySeed } from "./location-model";
import { useFixHub } from "./context";
import { dt, eventLabel, type DemoKey } from "./demo-copy";
import { ct, type CommKey } from "./communications-copy";
const key = "fixhub-fictional-demo-v1";
function read(): DemoState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw) as DemoState;
    if (!s.registry) {
      s.registry = registrySeed();
      const expanded = seed(1792080000000);
      s.merchants = [
        ...s.merchants,
        ...expanded.merchants.filter((m) => !s.merchants.some((old) => old.id === m.id)),
      ];
      s.personas = [
        ...s.personas,
        ...expanded.personas.filter((p) => !s.personas.some((old) => old.id === p.id)),
      ];
    }
    s.communications ??= communicationsSeed();
    return s.schema === 1 &&
      Array.isArray(s.bookings) &&
      Array.isArray(s.personas) &&
      Array.isArray(s.notifications) &&
      Array.isArray(s.commands) &&
      s.policy &&
      Array.isArray(s.merchants)
      ? s
      : null;
  } catch {
    return null;
  }
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale, draft, updateDraft } = useFixHub();
  const [state, setState] = useState(() => seed(1792080000000));
  const ref = useRef(state);
  const [ready, setReady] = useState(false);
  const [personaId, setPersonaId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  const [lastBookingId, setLastBookingId] = useState("");
  const localeRef = useRef(locale);
  const personaRef = useRef(personaId);
  localeRef.current = locale;
  personaRef.current = personaId;
  function apply(s: DemoState) {
    ref.current = s;
    setState(s);
  }
  function publish(s: DemoState) {
    localStorage.setItem(key, JSON.stringify(s));
    apply(s);
    channel.current?.postMessage({ revision: s.revision });
  }
  useEffect(() => {
    const existing = read();
    const initial = existing ?? seed();
    apply(initial);
    if (!existing) localStorage.setItem(key, JSON.stringify(initial));
    const saved = sessionStorage.getItem("fixhub-demo-persona") ?? "";
    setPersonaId(saved);
    if (saved) {
      try {
        const savedDraft = sessionStorage.getItem(`fixhub-demo-draft-${saved}`);
        if (savedDraft) updateDraft(JSON.parse(savedDraft));
      } catch {
        /* keep safe defaults */
      }
    }
    setLastBookingId(sessionStorage.getItem("fixhub-demo-last-booking") ?? "");
    if (saved) {
      const preferred = localStorage.getItem(`fixhub-demo-language-${saved}`);
      if (preferred === "en-IN" || preferred === "te-IN") setLocale(preferred);
    }
    const sync = () => {
      const next = read();
      if (next) apply(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) sync();
    };
    window.addEventListener("storage", onStorage);
    if (typeof BroadcastChannel !== "undefined") {
      channel.current = new BroadcastChannel("fixhub-fictional-demo");
      channel.current.onmessage = sync;
    }
    setReady(true);
    return () => {
      window.removeEventListener("storage", onStorage);
      channel.current?.close();
    };
  }, []);
  useEffect(() => {
    if (ready && personaId) localStorage.setItem(`fixhub-demo-language-${personaId}`, locale);
  }, [locale, personaId, ready]);
  useEffect(() => {
    if (ready && personaId && state.personas.find((p) => p.id === personaId)?.role === "customer")
      sessionStorage.setItem(`fixhub-demo-draft-${personaId}`, JSON.stringify(draft));
  }, [draft, ready, personaId]);
  const previousNotifications = useRef(new Set<string>());
  const notificationPersona = useRef("");
  useEffect(() => {
    const relevant = state.notifications.filter((n) => n.to === personaId);
    const added = relevant.filter((n) => !previousNotifications.current.has(n.id));
    if (notificationPersona.current === personaId && personaId && added.length)
      toast(eventLabel(added[added.length - 1]?.event ?? "created", locale), {
        description: added[added.length - 1]?.bookingId ?? "DEMO",
      });
    previousNotifications.current = new Set(relevant.map((n) => n.id));
    notificationPersona.current = personaId;
  }, [state.notifications, personaId, locale]);
  const inFlight = useRef(false);
  async function locked<T>(task: () => T | Promise<T>) {
    if (navigator.locks) return navigator.locks.request("fixhub-fictional-demo-write", task);
    return task();
  }
  async function act(command: Omit<Command, "actor" | "id"> & { id?: string }): Promise<Result> {
    if (inFlight.current) return { state: ref.current, ok: false, code: "busy" };
    inFlight.current = true;
    setBusy(true);
    setError("");
    let result: Result;
    try {
      result = await locked(() => {
        const current = read() ?? ref.current;
        const r = transition(current, {
          ...command,
          id: command.id ?? crypto.randomUUID(),
          actor: personaRef.current,
        });
        if (r.ok) publish(r.state);
        else apply(current);
        return r;
      });
      const map: Record<string, DemoKey> = {
        permission: "permission",
        session: "session",
        not_found: "notFound",
        expired: "expired",
        closed: "closed",
        conflict: "conflict",
        capacity: "capacityError",
        status: "status",
        approval: "approval",
        price_changed: "priceChanged",
        invalid_price: "invalidPrice",
        required: "required",
        timeout: "timeoutError",
        offline: "offlineError",
      };
      if (!result.ok) {
        const communicationsErrors: Record<string, CommKey> = {
          consent: "consentRequired",
          policy: "policyBlocked",
          template_required: "templateRequired",
          stale: "stale",
          rate_limited: "rate_limited",
        };
        const commKey =
          command.type === "communications" ? communicationsErrors[result.code] : undefined;
        const message = commKey
          ? ct(commKey, localeRef.current)
          : result.code === "referenced"
            ? localeRef.current === "te-IN"
              ? "ఈ రికార్డు వాడుకలో ఉంది. తొలగించకుండా భద్రపరచండి."
              : "This record is referenced. Archive instead of deleting."
            : dt(map[result.code] ?? "status", localeRef.current);
        setError(message);
        toast.error(message);
      } else {
        toast.success(
          dt(result.code === "duplicate" ? "duplicateResult" : "ok", localeRef.current),
        );
        if (command.type === "create" && result.bookingId) {
          setLastBookingId(result.bookingId);
          sessionStorage.setItem("fixhub-demo-last-booking", result.bookingId);
        }
      }
    } catch {
      result = { state: ref.current, ok: false, code: "storage" };
      setError(
        localeRef.current === "te-IN"
          ? "బ్రౌజర్ నిల్వ అందుబాటులో లేదు."
          : "Browser storage unavailable. Demo changes were not saved.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
    return result;
  }
  function login(id: string) {
    if (!ref.current.personas.some((p) => p.id === id && !p.deactivated)) return;
    const preferred = localStorage.getItem(`fixhub-demo-language-${id}`);
    const oldId = personaRef.current;
    if (oldId && ref.current.personas.find((p) => p.id === oldId)?.role === "customer")
      sessionStorage.setItem(`fixhub-demo-draft-${oldId}`, JSON.stringify(draft));
    if (ref.current.personas.find((p) => p.id === id)?.role === "customer" && oldId !== id) {
      const saved = sessionStorage.getItem(`fixhub-demo-draft-${id}`);
      try {
        updateDraft(
          saved
            ? JSON.parse(saved)
            : {
                service: "electrician",
                problem: "",
                address: "",
                cityId: "tanuku",
                addressId: "",
                zone: "Tanuku",
                date: "",
                time: "morning",
                photoNames: [],
                consent: false,
              },
        );
      } catch {
        updateDraft({ problem: "", address: "", date: "", consent: false });
      }
    }
    sessionStorage.setItem("fixhub-demo-persona", id);
    setPersonaId(id);
    personaRef.current = id;
    previousNotifications.current = new Set();
    notificationPersona.current = "";
    setError("");
    if (preferred === "en-IN" || preferred === "te-IN") setLocale(preferred);
  }
  function logout() {
    sessionStorage.removeItem("fixhub-demo-persona");
    sessionStorage.removeItem("fixhub-demo-last-booking");
    setPersonaId("");
    personaRef.current = "";
    setLastBookingId("");
    sessionStorage.removeItem(`fixhub-demo-draft-${personaId}`);
    updateDraft({
      problem: "",
      address: "",
      cityId: "tanuku",
      addressId: "",
      zone: "Tanuku",
      date: "",
      time: "morning",
      photoNames: [],
      consent: false,
    });
    setError("");
  }
  async function reset(scenario = "normal") {
    await locked(() => {
      const next = scenarioSeed(scenario);
      next.revision = (read()?.revision ?? 0) + 1;
      publish(next);
    });
    setLastBookingId("");
    updateDraft({
      problem: "",
      address: "",
      cityId: "tanuku",
      addressId: "",
      zone: "Tanuku",
      date: "",
      time: "morning",
      photoNames: [],
      consent: false,
    });
    for (const p of ref.current.personas) sessionStorage.removeItem(`fixhub-demo-draft-${p.id}`);
    sessionStorage.removeItem("fixhub-demo-last-booking");
    setError("");
    toast(dt("reset", localeRef.current));
  }
  return (
    <DemoContext.Provider
      value={{
        state,
        ready,
        persona: state.personas.find((p) => p.id === personaId && !p.deactivated) ?? null,
        busy,
        lastBookingId,
        act,
        login,
        logout,
        reset,
        error,
        clearError: () => setError(""),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
