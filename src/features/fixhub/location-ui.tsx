import { useState } from "react";
import { MapPin, LocateFixed, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { useDemo } from "./demo-context";
import {
  addressSchema,
  formattedAddress,
  enabledServices,
  eligibility,
  type SampleAddress,
} from "./location-model";
import { MockMapAdapter } from "./map-adapter";
import { lt, type LocationKey } from "./location-copy";

export function CityPicker({ onSelected }: { onSelected?: () => void }) {
  const { locale, draft, updateDraft } = useFixHub();
  const { state } = useDemo();
  const city = state.registry.cities.find((c) => c.id === (draft.cityId ?? "tanuku"));
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={onSelected ? "modal-city" : "demo-city"}>
        {lt("city", locale)}
      </label>
      <select
        id={onSelected ? "modal-city" : "demo-city"}
        className="form-input"
        value={city?.id ?? "tanuku"}
        onChange={(e) => {
          if (e.target.value === city?.id) return;
          if (
            (draft.address || draft.date || draft.addressId) &&
            !window.confirm(lt("switchWarning", locale))
          )
            return;
          const id = e.target.value,
            locality = state.registry.localities.find(
              (l) => l.cityId === id && l.status === "active",
            );
          const service = enabledServices(state, id)[0];
          updateDraft({
            cityId: id,
            zone: locality?.names["en-IN"] ?? "",
            address: "",
            addressId: "",
            date: "",
            consent: false,
            service: enabledServices(state, id).some((s) => s.id === draft.service)
              ? draft.service
              : (service?.id ?? draft.service),
          });
          onSelected?.();
        }}
      >
        {state.registry.cities
          .filter((c) => c.status !== "archived")
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.names[locale]} · {lt(c.launch === "planned" ? "planned" : "future", locale)}
            </option>
          ))}
      </select>
      <p className="mt-2 text-xs text-muted-foreground">
        {lt(city?.launch === "planned" ? "planned" : "future", locale)}
      </p>
    </div>
  );
}
export function AddressEditor({ embedded = false }: { embedded?: boolean }) {
  const demo = useDemo();
  const { locale, draft, updateDraft } = useFixHub();
  const t = (k: LocationKey) => lt(k, locale);
  const [editing, setEditing] = useState("");
  const [house, setHouse] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pin, setPin] = useState("");
  const [instructions, setInstructions] = useState("");
  const [label, setLabel] = useState<SampleAddress["label"]>("Home");
  const [preferred, setPreferred] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const [mode, setMode] = useState<SampleAddress["mode"]>("demo");
  const [accuracy, setAccuracy] = useState<number>();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [search, setSearch] = useState("");
  const cityId = draft.cityId ?? "tanuku";
  const locals = demo.state.registry.localities.filter(
    (l) => l.cityId === cityId && l.status !== "archived",
  );
  const locality = locals.find((l) => l.names["en-IN"] === draft.zone) ?? locals[0];
  const addresses = demo.state.registry.addresses.filter((a) => a.customerId === demo.persona?.id);
  const selected = addresses.find((a) => a.id === draft.addressId);
  function load(a: SampleAddress) {
    setEditing(a.id);
    setHouse(a.house);
    setStreet(a.street);
    setLandmark(a.landmark);
    setPin(a.pin);
    setInstructions(a.instructions);
    setLabel(a.label);
    setPreferred(a.preferred);
    setLat(String(a.lat));
    setLng(String(a.lng));
    setConsent(false);
    setMode(a.mode);
    setAccuracy(a.accuracy);
    updateDraft({
      cityId: a.cityId,
      zone: demo.state.registry.localities.find((l) => l.id === a.localityId)?.names["en-IN"] ?? "",
      addressId: "",
      address: "",
    });
  }
  async function save() {
    setError("");
    if (!demo.persona || !locality || !consent) {
      setError(t("invalid"));
      return;
    }
    const parsed = addressSchema.safeParse({
      id: editing || `SAMPLE-ADDR-${crypto.randomUUID()}`,
      customerId: demo.persona.id,
      label,
      house,
      street,
      landmark,
      localityId: locality.id,
      cityId,
      state: "Andhra Pradesh",
      pin,
      instructions,
      lat: Number(lat),
      lng: Number(lng),
      accuracy,
      confirmedAt: Date.now(),
      preferred,
      consent,
      mode,
    });
    if (!parsed.success || !lat || !lng) {
      setError(t("invalid"));
      return;
    }
    const a = parsed.data;
    const result = await demo.act({ type: "address", payload: { address: a } });
    if (result.ok) {
      updateDraft({
        address: formattedAddress(a, demo.state, locale),
        addressId: a.id,
        cityId: a.cityId,
        zone: locality.names["en-IN"],
      });
      setEditing("");
      setConsent(false);
    }
  }
  return (
    <section className="min-w-0 space-y-4" aria-label={t("addresses")}>
      {!embedded && <CityPicker />}
      <p className="text-sm text-muted-foreground">{t("boundary")}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) => (
          <article key={a.id} className="service-card !p-4">
            <strong>
              {t(a.label === "Home" ? "home" : a.label === "Work" ? "work" : "other")}{" "}
              {a.preferred ? "★" : ""}
            </strong>
            <p>{formattedAddress(a, demo.state, locale)}</p>
            {Date.now() - a.confirmedAt > 86400000 && <p>{t("stale")}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={draft.addressId === a.id ? "default" : "outline"}
                onClick={() => {
                  if (Date.now() - a.confirmedAt > 86400000) {
                    load(a);
                    setError(t("stale"));
                    return;
                  }
                  if (a.cityId !== cityId && !window.confirm(t("switchWarning"))) return;
                  updateDraft({
                    addressId: a.id,
                    address: formattedAddress(a, demo.state, locale),
                    cityId: a.cityId,
                    zone:
                      demo.state.registry.localities.find((l) => l.id === a.localityId)?.names[
                        "en-IN"
                      ] ?? "",
                    date: a.cityId === cityId ? draft.date : "",
                  });
                }}
              >
                {t("use")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("edit")}
                onClick={() => load(a)}
              >
                <Pencil />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("delete")}
                onClick={async () => {
                  if (!window.confirm(t("delete"))) return;
                  const r = await demo.act({
                    type: "address",
                    payload: { action: "delete", addressId: a.id },
                  });
                  if (r.ok && draft.addressId === a.id) updateDraft({ addressId: "", address: "" });
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <h2 className="text-xl">{t("address")}</h2>
      {selected && (
        <p className="text-primary">✓ {formattedAddress(selected, demo.state, locale)}</p>
      )}
      <label className="form-label">
        {t("locality")}
        <select
          className="form-input mt-2"
          value={locality?.id ?? ""}
          onChange={(e) => {
            const l = locals.find((l) => l.id === e.target.value);
            if (!l) return;
            updateDraft({ zone: l.names["en-IN"], addressId: "", address: "" });
            setLat(String(l.center[0]));
            setLng(String(l.center[1]));
            setMode("demo");
            setConsent(false);
          }}
        >
          {locals.map((l) => (
            <option value={l.id} key={l.id}>
              {l.names[locale]} · {lt(l.status === "active" ? "active" : "comingSoon", locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="form-label">
        {t("search")}
        <input
          className="form-input mt-2"
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {search &&
        locals
          .filter((l) =>
            `${l.names["en-IN"]} ${l.names["te-IN"]}`.toLowerCase().includes(search.toLowerCase()),
          )
          .map((l) => (
            <Button
              key={l.id}
              type="button"
              variant="outline"
              onClick={() => {
                updateDraft({ zone: l.names["en-IN"], addressId: "", address: "" });
                setLandmark(`SAMPLE ${l.names[locale]}`);
                setLat(String(l.center[0]));
                setLng(String(l.center[1]));
                setSearch("");
                setConsent(false);
                setMode("demo");
              }}
            >
              DEMO · {l.names[locale]}
            </Button>
          ))}
      <Button
        type="button"
        variant="outline"
        disabled={gpsBusy}
        onClick={async () => {
          setGpsBusy(true);
          setError("");
          try {
            const p = await new MockMapAdapter().currentLocation();
            setLat(String(p.lat));
            setLng(String(p.lng));
            setAccuracy(p.accuracy);
            setMode("gps");
            setConsent(false);
            setError(t("gpsNotice"));
          } catch (e) {
            setError(t(e instanceof Error && e.message === "denied" ? "denied" : "timeout"));
          } finally {
            setGpsBusy(false);
          }
        }}
      >
        <LocateFixed />
        {t("gps")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("mapsPending")}</p>
      <div
        className="relative flex aspect-[2/1] min-h-40 w-full items-center justify-center overflow-hidden rounded-md border bg-muted"
        role="group"
        aria-label={t("demoMap")}
      >
        <div className="absolute inset-4 grid grid-cols-4 gap-2" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <div className="border bg-background" key={i} />
          ))}
        </div>
        <Button
          type="button"
          className="relative h-auto min-h-11 max-w-[90%] whitespace-normal"
          onClick={() => {
            if (!locality) return;
            setLat(String(locality.center[0]));
            setLng(String(locality.center[1]));
            setMode("demo");
            setAccuracy(undefined);
            setConsent(false);
          }}
        >
          <MapPin />
          {t("demoMap")}
        </Button>
      </div>
      <p className="text-xs">{t("mapConfirmation")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["lat", lat, setLat],
            ["lng", lng, setLng],
          ] as const
        ).map(([k, v, set]) => (
          <label key={k} className="form-label">
            {t(k)}
            <input
              type="number"
              step="0.000001"
              className="form-input mt-2"
              value={v}
              onChange={(e) => {
                set(e.target.value);
                setConsent(false);
              }}
            />
          </label>
        ))}
      </div>
      {accuracy !== undefined && (
        <p>
          {t("accuracy")}: {Math.round(accuracy)}
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setHouse("SAMPLE 1");
          setStreet("SAMPLE Service Street");
          setLandmark("SAMPLE Landmark");
          setPin(cityId === "eluru" ? "534001" : cityId === "bhimavaram" ? "534201" : "534211");
          if (locality) {
            setLat(String(locality.center[0]));
            setLng(String(locality.center[1]));
          }
          setMode("demo");
          setAccuracy(undefined);
          setConsent(false);
        }}
      >
        {t("load")}
      </Button>
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["house", house, setHouse],
            ["street", street, setStreet],
            ["landmark", landmark, setLandmark],
            ["pin", pin, setPin],
          ] as const
        ).map(([k, v, set]) => (
          <label key={k} className="form-label">
            {t(k)}
            <input
              className="form-input mt-2"
              maxLength={k === "pin" ? 6 : 120}
              inputMode={k === "pin" ? "numeric" : "text"}
              value={v}
              onChange={(e) => {
                set(e.target.value);
                setConsent(false);
              }}
            />
          </label>
        ))}
      </div>
      <p>{t("state")}</p>
      <label className="form-label">
        {t("instructions")}
        <textarea
          className="form-input mt-2"
          value={instructions}
          maxLength={300}
          onChange={(e) => {
            setInstructions(e.target.value);
            setConsent(false);
          }}
        />
      </label>
      <label className="form-label">
        {t("addresses")}
        <select
          className="form-input mt-2"
          value={label}
          onChange={(e) => setLabel(e.target.value as SampleAddress["label"])}
        >
          {(["Home", "Work", "Other"] as const).map((l) => (
            <option key={l} value={l}>
              {t(l === "Home" ? "home" : l === "Work" ? "work" : "other")}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={preferred}
          onChange={(e) => setPreferred(e.target.checked)}
        />
        {t("preferred")}
      </label>
      <label className="flex min-h-11 items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 size-5 shrink-0"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>{t(mode === "gps" ? "gpsConsent" : "consent")}</span>
      </label>
      {(error || demo.error) && (
        <p role="alert" className="text-destructive">
          {error || demo.error}
        </p>
      )}
      <Button type="button" disabled={demo.busy || !consent} onClick={save}>
        {t(mode === "gps" ? "saveGps" : "save")}
      </Button>
    </section>
  );
}
export function SampleProviders({ serviceId }: { serviceId: string }) {
  const { state } = useDemo();
  const { draft, locale } = useFixHub();
  const service = state.registry.services.find((s) => s.id === serviceId);
  const address = state.registry.addresses.find((a) => a.id === draft.addressId);
  const eligible = service
    ? state.merchants.filter(
        (m) =>
          eligibility(state, m, {
            category: service.pricingCategory,
            serviceId,
            zone: draft.zone,
            slot: draft.time,
            date: draft.date || undefined,
            location: address,
          }).length === 0,
      )
    : [];
  return (
    <div className="my-4">
      <h3>{lt("sampleProviders", locale)}</h3>
      {eligible.length ? (
        eligible.map((m) => (
          <p key={m.id} className="py-2">
            {m.name} · DEMO
          </p>
        ))
      ) : (
        <p>{lt("noProviders", locale)}</p>
      )}
    </div>
  );
}
