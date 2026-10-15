import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDemo } from "./demo-context";
import { useFixHub } from "./context";
import { PageShell, PageTop, Notice, Modal } from "./shared";
import { DemoBookingDetail, DemoPage, DemoNotifications } from "./demo-pages";
import { PriceBreakdown } from "./demo-price";
import {
  calculate,
  money,
  type Category,
  type Command,
  type Merchant,
  type Persona,
} from "./demo-model";
import {
  eligibility,
  entitySchemas,
  ratesFor,
  offerState,
  type Entity,
  type Names,
  placeLabel,
} from "./location-model";
import { lt, type LocationKey } from "./location-copy";
import { statusLabel, categoryLabel, eventLabel } from "./demo-copy";

const links = [
  ["/admin/communications", "communications"],
  ["/admin/dashboard", "dashboard"],
  ["/admin/cities", "cities"],
  ["/admin/categories", "categories"],
  ["/admin/services", "services"],
  ["/admin/merchants", "merchants"],
  ["/admin/leads", "leads"],
  ["/admin/dispatch", "dispatch"],
  ["/admin/users", "users"],
  ["/admin/technicians", "technicians"],
  ["/admin/operations", "operations"],
  ["/admin/pricing", "pricing"],
  ["/admin/notifications", "notifications"],
  ["/admin/support", "support"],
  ["/admin/audit", "audit"],
  ["/admin/analytics", "analytics"],
  ["/admin/settings", "settings"],
] as const;
type RecordRow = { id: string; names?: Names; [key: string]: unknown };
const blankNames = { "en-IN": "", "te-IN": "", "hi-IN": "" };
export function RegistryAdmin({ page = "dashboard", id }: { page?: string; id?: string }) {
  const demo = useDemo();
  const { locale } = useFixHub();
  const t = (k: LocationKey) => lt(k, locale);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(id ?? "");
  const [edit, setEdit] = useState<RecordRow | null>(null);
  const [entity, setEntity] = useState<Entity>("cities");
  const [editingKind, setEditingKind] = useState("registry");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{
    type: Command["type"];
    payload: Record<string, unknown>;
  } | null>(null);
  const [priceCity, setPriceCity] = useState("tanuku");
  const [priceService, setPriceService] = useState("electrician");
  const [priceEdit, setPriceEdit] = useState<{
    visit: string;
    labor: string;
    parts: string;
    fee: string;
    commissionBps: string;
    discount: string;
  } | null>(null);
  const [undo, setUndo] = useState<{
    type: Command["type"];
    payload: Record<string, unknown>;
  } | null>(null);
  const admin = demo.persona?.role === "admin";
  const allowed =
    admin ||
    (demo.persona?.role === "operations" &&
      ["leads", "dispatch", "support", "notifications", "dashboard", "audit"].includes(page));
  const currentPage = (
    page.startsWith("merchants")
      ? "merchants"
      : page === "overview"
        ? "dashboard"
        : page === "bookings"
          ? "leads"
          : page === "customers"
            ? "users"
            : page === "areas" || page === "locations"
              ? "cities"
              : page
  ) as LocationKey;
  const patch = (key: string, value: unknown) =>
    setEdit((old) => (old ? { ...old, [key]: value } : old));
  const field = (key: string, label: LocationKey, value: unknown, type = "text") => (
    <label className="form-label" key={key}>
      {t(label)}
      <input
        className="form-input mt-2"
        type={type}
        maxLength={300}
        value={String(value ?? "")}
        onChange={(e) => patch(key, type === "number" ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
  const selectField = (
    key: string,
    label: LocationKey,
    value: unknown,
    options: { value: string; label: string }[],
  ) => (
    <label className="form-label">
      {t(label)}
      <select
        className="form-input mt-2"
        value={String(value ?? "")}
        onChange={(e) => patch(key, e.target.value)}
      >
        {options.map((o) => (
          <option value={o.value} key={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const checks = (
    key: string,
    label: LocationKey,
    values: unknown,
    options: { value: string; label: string }[],
  ) => (
    <fieldset className="min-w-0">
      <legend className="form-label mb-2">{t(label)}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.value} className="flex min-h-11 items-center gap-3">
            <input
              className="size-5 shrink-0"
              type="checkbox"
              checked={Array.isArray(values) && values.includes(o.value)}
              onChange={(e) =>
                patch(
                  key,
                  e.target.checked
                    ? [...(Array.isArray(values) ? values : []), o.value]
                    : (Array.isArray(values) ? values : []).filter((v) => v !== o.value),
                )
              }
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
  const cityOptions = demo.state.registry.cities.map((c) => ({
    value: c.id,
    label: c.names[locale],
  }));
  const serviceOptions = demo.state.registry.services.map((c) => ({
    value: c.id,
    label: c.names[locale],
  }));
  function start(kind: string, record: RecordRow, which: Entity = entity) {
    setEditingKind(kind);
    setEntity(which);
    setEdit(structuredClone(record));
    setReason("");
    setError("");
  }
  function fresh(which: Entity): RecordRow {
    const base = { id: "", names: { ...blankNames } };
    if (which === "cities")
      return {
        ...base,
        status: "coming-soon",
        launch: "future-demo",
        center: [16.7, 81.5],
        fixture: true,
      };
    if (which === "localities")
      return {
        ...base,
        cityId: id ?? city ?? "tanuku",
        status: "active",
        center: [16.7, 81.5],
        fixture: true,
      };
    if (which === "areas")
      return {
        id: "",
        cityId: id ?? city ?? "tanuku",
        localityId: demo.state.registry.localities[0]?.id ?? "",
        active: true,
        serviceIds: [],
        radiusKm: 3,
        center: [16.7, 81.5],
        fixture: true,
      };
    if (which === "categories") return { ...base, archived: false };
    return {
      ...base,
      categoryId: demo.state.registry.categories[0]?.id ?? "electrician",
      pricingCategory: "electrician",
      description: { ...blankNames },
      cityIds: [],
      archived: false,
    };
  }
  async function confirmAction() {
    if (!pending) return;
    const r = await demo.act(pending);
    if (r.ok) {
      setPending(null);
      setEdit(null);
      setError("");
    } else setError(t("validation"));
  }
  function requestSave() {
    if (!edit || !reason.trim()) {
      setError(t("validation"));
      return;
    }
    if (editingKind === "registry") {
      const parsed = entitySchemas[entity].safeParse(edit);
      if (!parsed.success) {
        setError(t("validation"));
        return;
      }
      const before = (demo.state.registry[entity] as { id: string }[]).find(
        (r) => r.id === edit.id,
      );
      if (before)
        setUndo({
          type: "registry",
          payload: {
            entity,
            recordId: edit.id,
            record: before,
            reason: "SAMPLE undo previous edit",
          },
        });
      setPending({
        type: "registry",
        payload: { entity, recordId: edit.id, record: parsed.data, reason },
      });
    } else
      setPending({
        type: editingKind === "merchant" ? "merchant_edit" : "person_edit",
        payload: { record: edit, reason },
      });
  }
  function registryList(which: Entity, records?: RecordRow[]) {
    const source = records ?? (demo.state.registry[which] as unknown as RecordRow[]);
    const rows = source.filter((r) =>
      `${r.id} ${JSON.stringify(r.names ?? "")}`.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <h2>
            {which === "localities"
              ? t("locality")
              : which === "areas"
                ? t("radius")
                : t(which as LocationKey)}
          </h2>
          {admin && (
            <Button onClick={() => start("registry", fresh(which), which)}>{t("new")}</Button>
          )}
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {rows.map((r) => (
            <article className="service-card !p-4" key={r.id}>
              <h3>{r.names?.[locale] ?? r.id}</h3>
              <p className="text-xs break-words">
                {r.id} ·{" "}
                {r["status"]
                  ? lt(
                      r["status"] === "active"
                        ? "active"
                        : r["status"] === "paused"
                          ? "paused"
                          : r["status"] === "archived"
                            ? "archived"
                            : "comingSoon",
                      locale,
                    )
                  : r["archived"]
                    ? t("archived")
                    : t("active")}
              </p>
              {which === "cities" && (
                <div>
                  <p>{t(r["launch"] === "planned" ? "planned" : "future")}</p>
                  <Button asChild variant="outline">
                    <Link to="/admin/cities/$id" params={{ id: r.id }}>
                      {t("details")}
                    </Link>
                  </Button>
                </div>
              )}
              {which === "services" && (
                <p>
                  {(r["cityIds"] as string[])
                    .map((id) => demo.state.registry.cities.find((c) => c.id === id)?.names[locale])
                    .join(" · ")}
                </p>
              )}
              {which === "areas" && <p>{Number(r["radiusKm"])} km · DEMO</p>}
              {admin && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button variant="outline" onClick={() => start("registry", r, which)}>
                    {t("edit")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const updated = { ...r };
                      if (which === "areas") updated["active"] = !r["active"];
                      else if ("archived" in r) updated["archived"] = !r["archived"];
                      else updated["status"] = r["status"] === "active" ? "paused" : "active";
                      start("registry", updated, which);
                    }}
                  >
                    {r["status"] === "paused" || r["archived"] ? t("restore") : t("archive")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setReason("");
                      setPending({
                        type: "registry",
                        payload: {
                          entity: which,
                          recordId: r.id,
                          action: "delete",
                          reason: "SAMPLE guarded deletion",
                        },
                      });
                    }}
                  >
                    {t("delete")}
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
        {rows.length === 0 && <p>{t("noData")}</p>}
      </section>
    );
  }
  const leadRecords = demo.state.bookings.filter(
    (b) =>
      (!id || !page.includes("lead") || b.id === id) &&
      (!city || (b.cityId ?? b.location?.cityId ?? "tanuku") === city) &&
      (!merchant || b.merchantId === merchant || b.offers.includes(merchant)) &&
      (!category || b.category === category) &&
      (!status || b.status === status) &&
      (!from || b.date >= from) &&
      (!to || b.date <= to) &&
      `${b.id} ${b.zone} ${b.problem}`.toLowerCase().includes(query.toLowerCase()),
  );
  const lead = leadRecords.find((b) => b.id === selected) ?? leadRecords[0];
  const filter = (
    label: LocationKey,
    value: string,
    set: (v: string) => void,
    options: { value: string; label: string }[],
  ) => (
    <label className="form-label">
      {t(label)}
      <select className="form-input mt-2" value={value} onChange={(e) => set(e.target.value)}>
        <option value="">{t("all")}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  let content: ReactNode;
  if (currentPage === "cities")
    content = (
      <div className="space-y-8">
        {registryList(
          "cities",
          id
            ? (demo.state.registry.cities.filter((c) => c.id === id) as unknown as RecordRow[])
            : undefined,
        )}
        {id && (
          <>
            {registryList(
              "localities",
              demo.state.registry.localities.filter(
                (l) => l.cityId === id,
              ) as unknown as RecordRow[],
            )}
            {registryList(
              "areas",
              demo.state.registry.areas.filter((a) => a.cityId === id) as unknown as RecordRow[],
            )}
            {registryList(
              "services",
              demo.state.registry.services.filter((s) =>
                s.cityIds.includes(id),
              ) as unknown as RecordRow[],
            )}
          </>
        )}
      </div>
    );
  else if (currentPage === "categories" || currentPage === "services")
    content = registryList(currentPage);
  else if (currentPage === "merchants") {
    const rows = demo.state.merchants.filter(
      (m) =>
        (!id || m.id === id) &&
        (!city || m.cityIds?.includes(city)) &&
        (!category || m.skills.includes(category as Category)) &&
        (!status || m.status === status) &&
        `${m.id} ${m.name}`.toLowerCase().includes(query.toLowerCase()),
    );
    content = (
      <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {filter("city", city, setCity, cityOptions)}
          {filter(
            "categories",
            category,
            setCategory,
            demo.state.registry.categories.map((c) => ({ value: c.id, label: c.names[locale] })),
          )}
          {filter(
            "status",
            status,
            setStatus,
            (["active", "pending", "suspended", "unavailable"] as const).map((v) => ({
              value: v,
              label: t(v),
            })),
          )}
        </div>
        {admin && (
          <Button
            onClick={() =>
              start("merchant", {
                id: "",
                name: "SAMPLE ",
                status: "pending",
                verification: "pending",
                capacity: 1,
                hours: "08:00–20:00",
                cityIds: [],
                zones: [],
                skills: [],
                serviceIds: [],
                workDays: [0, 1, 2, 3, 4, 5, 6],
                blackouts: [],
                travelRadiusKm: 3,
              })
            }
          >
            {t("new")}
          </Button>
        )}
        <div className="grid gap-4 xl:grid-cols-2 mt-4">
          {rows.map((m) => (
            <article className="service-card" key={m.id}>
              <h2>{m.name}</h2>
              <p>
                {t(m.status)} · {m.capacity} {t("capacity")}
              </p>
              <p>{placeLabel(m.zones.join(" · "), locale)}</p>
              <p>
                {m.hours} · {m.skills.map((c) => categoryLabel(c, locale)).join(" · ")}
              </p>
              <p>{t("terms")}</p>
              <Button asChild variant="outline">
                <Link to="/admin/merchants/$id" params={{ id: m.id }}>
                  {t("details")}
                </Link>
              </Button>
              {admin && (
                <Button
                  className="ml-2"
                  variant="outline"
                  onClick={() =>
                    start("merchant", {
                      ...m,
                      cityIds: m.cityIds ?? ["tanuku"],
                      serviceIds: m.serviceIds ?? m.skills,
                      verification:
                        m.verification ??
                        (m.status === "pending"
                          ? "pending"
                          : m.status === "suspended"
                            ? "suspended"
                            : "approved"),
                      workDays: m.workDays ?? [0, 1, 2, 3, 4, 5, 6],
                      blackouts: m.blackouts ?? [],
                      travelRadiusKm: m.travelRadiusKm ?? 3,
                    } as unknown as RecordRow)
                  }
                >
                  {t("edit")}
                </Button>
              )}
              <h3 className="mt-4">{t("leads")}</h3>
              {demo.state.bookings
                .filter((b) => b.merchantId === m.id || b.offers.includes(m.id))
                .map((b) => (
                  <p key={b.id} className="py-2">
                    <Link className="text-link" to="/admin/leads/$id" params={{ id: b.id }}>
                      {b.id}
                    </Link>{" "}
                    ·{" "}
                    {b.merchantId === m.id
                      ? statusLabel(b.status, locale)
                      : lt(offerState(b, m.id) as LocationKey, locale)}
                  </p>
                ))}
            </article>
          ))}
        </div>
        {!rows.length && <p>{t("noData")}</p>}
      </>
    );
  } else if (currentPage === "leads" || currentPage === "dispatch")
    content = (
      <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {filter("city", city, setCity, cityOptions)}
          {filter(
            "merchants",
            merchant,
            setMerchant,
            demo.state.merchants.map((m) => ({ value: m.id, label: m.name })),
          )}
          {filter(
            "categories",
            category,
            setCategory,
            demo.state.registry.categories.map((c) => ({ value: c.id, label: c.names[locale] })),
          )}
          {filter(
            "status",
            status,
            setStatus,
            [...new Set(demo.state.bookings.map((b) => b.status))].map((v) => ({
              value: v,
              label: statusLabel(v, locale),
            })),
          )}
          <label className="form-label">
            {t("fromDate")}
            <input
              className="form-input mt-2"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="form-label">
            {t("toDate")}
            <input
              className="form-input mt-2"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
        <div className="demo-master-detail">
          <div className="demo-job-list">
            {leadRecords.map((b) => (
              <Button
                key={b.id}
                className="demo-job-button"
                variant={lead?.id === b.id ? "secondary" : "outline"}
                onClick={() => setSelected(b.id)}
              >
                <span>
                  <strong>
                    {b.id} · {placeLabel(b.cityName ?? "Tanuku", locale)}
                  </strong>
                  <span>
                    {categoryLabel(b.category, locale)} · {statusLabel(b.status, locale)}
                  </span>
                  <span>
                    {placeLabel(b.zone, locale)} · {b.date} · {money(b.estimate.total, locale)}
                  </span>
                </span>
              </Button>
            ))}
            {!leadRecords.length && <p>{t("noData")}</p>}
          </div>
          {lead && (
            <section className="min-w-0">
              <Button asChild variant="outline">
                <Link to="/admin/leads/$id" params={{ id: lead.id }}>
                  {t("details")}
                </Link>
              </Button>
              <h3 className="mt-4">{t("dispatch")}</h3>
              <div className="space-y-2 my-4">
                {demo.state.merchants.map((m) => {
                  const reasons = eligibility(demo.state, m, {
                    category: lead.category,
                    zone: lead.zone,
                    slot: lead.slot,
                    date: lead.date,
                    serviceId: lead.serviceId,
                    location: lead.location,
                  });
                  return (
                    <div className="border-b py-3" key={m.id}>
                      <strong>{m.name}</strong>
                      <p>{reasons.length ? reasons.map((r) => t(r)).join(" · ") : t("eligible")}</p>
                      {lead.offers.includes(m.id) && (
                        <p>{lt(offerState(lead, m.id) as LocationKey, locale)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <DemoBookingDetail key={lead.id} booking={lead} />
            </section>
          )}
        </div>
      </>
    );
  else if (["users", "technicians", "operations"].includes(currentPage)) {
    const rows = demo.state.personas.filter(
      (p) =>
        (currentPage === "users" ||
          p.role === (currentPage === "technicians" ? "technician" : "operations")) &&
        `${p.id} ${p.name}`.toLowerCase().includes(query.toLowerCase()),
    );
    content = (
      <>
        <Button
          onClick={() =>
            start("person", {
              id: "",
              name: "SAMPLE ",
              role:
                currentPage === "technicians"
                  ? "technician"
                  : currentPage === "operations"
                    ? "operations"
                    : "customer",
              deactivated: false,
              unavailable: false,
              merchantId: "",
            })
          }
        >
          {t("new")}
        </Button>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          {rows.map((p) => (
            <article key={p.id} className="service-card">
              <h3>{p.name}</h3>
              <p>
                {t("role")}:{" "}
                {locale === "te-IN"
                  ? {
                      customer: "కస్టమర్",
                      merchant: "వ్యాపారి",
                      technician: "సాంకేతిక నిపుణుడు",
                      operations: "నిర్వహణ",
                      admin: "అడ్మిన్",
                    }[p.role]
                  : p.role}{" "}
                · {p.deactivated ? t("deactivated") : t("active")}
              </p>
              <p className="text-xs">{p.id}</p>
              <Button
                disabled={p.id === demo.persona?.id}
                variant="outline"
                onClick={() =>
                  start("person", {
                    ...p,
                    deactivated: p.deactivated ?? false,
                    unavailable: p.unavailable ?? false,
                    merchantId: p.merchantId ?? "",
                  } as unknown as RecordRow)
                }
              >
                {t("edit")}
              </Button>
            </article>
          ))}
        </div>
      </>
    );
  } else if (currentPage === "pricing") {
    const service =
      demo.state.registry.services.find((s) => s.id === priceService) ??
      demo.state.registry.services[0];
    const rates = service
      ? ratesFor(demo.state, priceCity, service.id, service.pricingCategory)
      : demo.state.policy.electrician;
    const values = priceEdit ?? {
      visit: String(rates.visit),
      labor: String(rates.labor),
      parts: String(rates.parts),
      fee: String(rates.fee),
      commissionBps: String(rates.commissionBps),
      discount: String(rates.discount),
    };
    content = (
      <div className="content-grid">
        <section className="space-y-4">
          <label className="form-label">
            {t("city")}
            <select
              className="form-input mt-2"
              value={priceCity}
              onChange={(e) => {
                setPriceCity(e.target.value);
                setPriceEdit(null);
              }}
            >
              {cityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            {t("services")}
            <select
              className="form-input mt-2"
              value={priceService}
              onChange={(e) => {
                setPriceService(e.target.value);
                setPriceEdit(null);
              }}
            >
              {serviceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {(
            [
              ["visit", "fee"],
              ["labor", "labor"],
              ["parts", "parts"],
              ["fee", "pricing"],
              ["commissionBps", "pricing"],
              ["discount", "pricing"],
            ] as const
          ).map(([k, label]) => (
            <label className="form-label block" key={k}>
              {k === "fee"
                ? locale === "te-IN"
                  ? "ప్లాట్‌ఫారమ్ రుసుము · డెమో ఊహ"
                  : "Platform fee · demo hypothesis"
                : k === "commissionBps"
                  ? locale === "te-IN"
                    ? "కమీషన్ బేసిస్ పాయింట్లు · డిఫాల్ట్ 0"
                    : "Commission basis points · default 0"
                  : k === "discount"
                    ? locale === "te-IN"
                      ? "డెమో తగ్గింపు"
                      : "Demo discount"
                    : t(label)}
              <input
                className="form-input mt-2"
                type="number"
                min="0"
                step="0.01"
                value={values[k]}
                onChange={(e) => setPriceEdit({ ...values, [k]: e.target.value })}
              />
            </label>
          ))}
          <Notice warning>{t("collection")}</Notice>
          <Button
            onClick={() => {
              const next = {
                ...rates,
                ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v)])),
              };
              try {
                calculate(next);
                setPending({
                  type: "policy",
                  payload: {
                    category: service?.pricingCategory ?? "electrician",
                    cityId: priceCity,
                    serviceId: service?.id ?? "electrician",
                    rates: next,
                  },
                });
              } catch {
                setError(t("validation"));
              }
            }}
          >
            {t("saveChanges")}
          </Button>
        </section>
        <aside className="summary-panel">
          <PriceBreakdown price={calculate(rates)} merchant />
          <p>{t("fixture")}</p>
        </aside>
      </div>
    );
  } else if (currentPage === "notifications") content = <DemoNotifications showTitle={false} />;
  else if (currentPage === "support")
    content = (
      <div className="grid gap-4 md:grid-cols-2">
        {demo.state.tickets
          .filter((s) => `${s.id} ${s.message}`.toLowerCase().includes(query.toLowerCase()))
          .map((ticket) => (
            <article className="service-card" key={ticket.id}>
              <h3>{ticket.id}</h3>
              <p>{ticket.message}</p>
              <p>{t(ticket.status === "resolved" ? "resolved" : "open")}</p>
              <Button
                variant="outline"
                onClick={() =>
                  setPending({
                    type: "ticket_edit",
                    payload: {
                      ticketId: ticket.id,
                      status: ticket.status === "resolved" ? "open" : "resolved",
                    },
                  })
                }
              >
                {t(ticket.status === "resolved" ? "open" : "resolved")}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/admin/leads/$id" params={{ id: ticket.bookingId }}>
                  {t("details")}
                </Link>
              </Button>
            </article>
          ))}
      </div>
    );
  else if (currentPage === "audit")
    content = (
      <section>
        <h2>{t("audit")}</h2>
        {demo.state.registry.history
          .filter((h) =>
            `${h.entity} ${h.id} ${h.reason}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((h, i) => (
            <article key={i} className="border-b py-4">
              <strong>{h.id}</strong>
              <p>{h.reason}</p>
              <p className="text-xs">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(h.at)}{" "}
                · {h.actor}
              </p>
            </article>
          ))}
        <h3 className="mt-6">{t("notifications")}</h3>
        {demo.state.audit.map((e) => (
          <p className="border-b py-3" key={e.id}>
            {e.bookingId} · {e.actor} · {eventLabel(e.event, locale)}
          </p>
        ))}
      </section>
    );
  else if (currentPage === "settings")
    content = (
      <>
        <Notice>{t("boundary")}</Notice>
        <Notice warning>{t("mapsPending")}</Notice>
        <Button asChild>
          <Link to="/demo">{t("reset")}</Link>
        </Button>
      </>
    );
  else
    content = (
      <>
        <Notice>{t("fixture")}</Notice>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 my-6">
          {(
            [
              ["cities", demo.state.registry.cities.filter((c) => c.status === "active").length],
              ["services", demo.state.registry.services.filter((s) => !s.archived).length],
              ["pending", demo.state.merchants.filter((m) => m.status === "pending").length],
              ["leads", demo.state.bookings.length],
            ] as const
          ).map(([k, n]) => (
            <article key={k} className="service-card">
              <strong className="text-3xl">{new Intl.NumberFormat(locale).format(n)}</strong>
              <h2>{t(k)}</h2>
            </article>
          ))}
        </div>
        <h2>{t("leads")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...new Set(demo.state.bookings.map((b) => b.status))].map((status) => (
            <p className="border-b py-3" key={status}>
              {statusLabel(status, locale)} ·{" "}
              {demo.state.bookings.filter((b) => b.status === status).length}
            </p>
          ))}
        </div>
        <h2 className="mt-6">{t("dispatch")}</h2>
        {demo.state.bookings
          .filter((b) => ["no_availability", "expired", "disputed"].includes(b.status))
          .map((b) => (
            <p className="py-2" key={b.id}>
              <Link className="text-link" to="/admin/leads/$id" params={{ id: b.id }}>
                {b.id} · {statusLabel(b.status, locale)}
              </Link>
            </p>
          ))}
      </>
    );
  return (
    <PageShell role="admin">
      <main id="main" className="wrap pb-10">
        <PageTop
          title={`${locale === "te-IN" ? "డెమో నిర్వహణ" : "Demo administration"} · ${lt(currentPage in { ...Object.fromEntries(links.map(([, k]) => [k, true])) } ? currentPage : "dashboard", locale)}`}
          desc={t("terms")}
        />
        {!allowed ? (
          <Notice warning>
            {locale === "te-IN"
              ? "ఈ డెమో పాత్రకు అనుమతి లేదు. పాత్రను మార్చండి."
              : "This demo role cannot open this screen. Switch persona."}
          </Notice>
        ) : (
          <div className="grid min-w-0 gap-6 md:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[190px_minmax(0,1fr)]">
            <nav className="flex flex-wrap md:flex-col gap-2" aria-label={t("dashboard")}>
              {links
                .filter(
                  ([, k]) =>
                    admin ||
                    [
                      "dashboard",
                      "leads",
                      "dispatch",
                      "support",
                      "notifications",
                      "audit",
                    ].includes(k),
                )
                .map(([to, k]) => (
                  <Button
                    key={to}
                    asChild
                    variant={currentPage === k ? "secondary" : "ghost"}
                    className="justify-start h-auto min-h-11 whitespace-normal"
                  >
                    <Link to={to}>{t(k)}</Link>
                  </Button>
                ))}
            </nav>
            <div className="min-w-0">
              <label className="form-label">
                {t("searchRecords")}
                <input
                  className="form-input mt-2 mb-6"
                  value={query}
                  maxLength={120}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {content}
              {undo && admin && (
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => {
                    setPending(undo);
                    setUndo(null);
                  }}
                >
                  {t("undo")}
                </Button>
              )}
              {(error || demo.error) && (
                <p role="alert" className="text-destructive my-3">
                  {error || demo.error}
                </p>
              )}
            </div>
          </div>
        )}
        <Modal
          open={Boolean(edit)}
          onOpenChange={(open) => {
            if (!open) setEdit(null);
          }}
          title={t("edit")}
          description={t("safeDelete")}
        >
          {edit && (
            <div className="space-y-4">
              {field("id", "id", edit.id)}
              {editingKind === "registry" && edit.names && (
                <>
                  {(["en-IN", "te-IN"] as const).map((lang) => (
                    <label className="form-label block" key={lang}>
                      {t(lang === "en-IN" ? "english" : "telugu")}
                      <input
                        maxLength={120}
                        className="form-input mt-2"
                        value={edit.names?.[lang] ?? ""}
                        onChange={(e) => patch("names", { ...edit.names, [lang]: e.target.value })}
                      />
                    </label>
                  ))}
                </>
              )}
              {editingKind === "registry" && (
                <>
                  {"status" in edit &&
                    selectField(
                      "status",
                      "status",
                      edit["status"],
                      (["active", "paused", "coming-soon", "archived"] as const).map((v) => ({
                        value: v,
                        label: t(v === "coming-soon" ? "comingSoon" : v),
                      })),
                    )}
                  {"archived" in edit && (
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        className="size-5"
                        type="checkbox"
                        checked={Boolean(edit["archived"])}
                        onChange={(e) => patch("archived", e.target.checked)}
                      />
                      {t("archived")}
                    </label>
                  )}
                  {"cityId" in edit && selectField("cityId", "city", edit["cityId"], cityOptions)}
                  {"launch" in edit &&
                    selectField("launch", "status", edit["launch"], [
                      { value: "planned", label: t("planned") },
                      { value: "future-demo", label: t("future") },
                    ])}
                  {"categoryId" in edit &&
                    selectField(
                      "categoryId",
                      "categories",
                      edit["categoryId"],
                      demo.state.registry.categories.map((c) => ({
                        value: c.id,
                        label: c.names[locale],
                      })),
                    )}
                  {"pricingCategory" in edit &&
                    selectField(
                      "pricingCategory",
                      "pricing",
                      edit["pricingCategory"],
                      (["electrician", "plumbing", "ac", "appliance"] as Category[]).map((c) => ({
                        value: c,
                        label: categoryLabel(c, locale),
                      })),
                    )}
                  {"description" in edit &&
                    (["en-IN", "te-IN"] as const).map((lang) => (
                      <label className="form-label block" key={lang}>
                        {t("description")} · {lang}
                        <textarea
                          className="form-input mt-2"
                          maxLength={120}
                          value={String((edit["description"] as Names)[lang])}
                          onChange={(e) =>
                            patch("description", {
                              ...(edit["description"] as Names),
                              [lang]: e.target.value,
                            })
                          }
                        />
                      </label>
                    ))}
                  {"cityIds" in edit && checks("cityIds", "cities", edit["cityIds"], cityOptions)}
                  {"localityId" in edit &&
                    selectField(
                      "localityId",
                      "locality",
                      edit["localityId"],
                      demo.state.registry.localities
                        .filter((l) => l.cityId === edit["cityId"])
                        .map((l) => ({ value: l.id, label: l.names[locale] })),
                    )}
                  {"serviceIds" in edit &&
                    checks("serviceIds", "services", edit["serviceIds"], serviceOptions)}
                  {"radiusKm" in edit && field("radiusKm", "radius", edit["radiusKm"], "number")}
                  {"active" in edit && (
                    <label className="flex min-h-11 items-center gap-3">
                      <input
                        type="checkbox"
                        className="size-5"
                        checked={Boolean(edit["active"])}
                        onChange={(e) => patch("active", e.target.checked)}
                      />
                      {t("enabled")}
                    </label>
                  )}
                  {"center" in edit && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[0, 1].map((n) => (
                        <label key={n} className="form-label">
                          {t(n === 0 ? "lat" : "lng")} · DEMO
                          <input
                            className="form-input mt-2"
                            type="number"
                            step="0.000001"
                            value={String((edit["center"] as number[])[n])}
                            onChange={(e) => {
                              const c = [...(edit["center"] as number[])];
                              c[n] = Number(e.target.value);
                              patch("center", c);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
              {editingKind !== "registry" && field("name", "english", edit["name"])}
              {editingKind === "merchant" && (
                <>
                  {selectField(
                    "status",
                    "status",
                    edit["status"],
                    (["active", "pending", "suspended", "unavailable"] as const).map((v) => ({
                      value: v,
                      label: t(v),
                    })),
                  )}
                  {selectField(
                    "verification",
                    "verification",
                    edit["verification"],
                    (["approved", "pending", "rejected", "suspended"] as const).map((v) => ({
                      value: v,
                      label: t(v),
                    })),
                  )}
                  {field("capacity", "capacity", edit["capacity"], "number")}
                  {field("hours", "hours", edit["hours"])}
                  {checks("cityIds", "cities", edit["cityIds"], cityOptions)}
                  {checks(
                    "zones",
                    "locality",
                    edit["zones"],
                    demo.state.registry.localities
                      .filter((l) => (edit["cityIds"] as string[]).includes(l.cityId))
                      .map((l) => ({ value: l.names["en-IN"], label: l.names[locale] })),
                  )}
                  {checks(
                    "skills",
                    "categories",
                    edit["skills"],
                    (["electrician", "plumbing", "ac", "appliance"] as Category[]).map((c) => ({
                      value: c,
                      label: categoryLabel(c, locale),
                    })),
                  )}
                  {checks("serviceIds", "services", edit["serviceIds"], serviceOptions)}
                  {field("travelRadiusKm", "radius", edit["travelRadiusKm"], "number")}
                  <label className="form-label block">
                    {t("workDays")}
                    <input
                      className="form-input mt-2"
                      value={(edit["workDays"] as number[]).join(",")}
                      onChange={(e) => patch("workDays", e.target.value.split(",").map(Number))}
                    />
                  </label>
                  <label className="form-label block">
                    {t("blackouts")}
                    <input
                      className="form-input mt-2"
                      value={(edit["blackouts"] as string[]).join(",")}
                      onChange={(e) =>
                        patch(
                          "blackouts",
                          e.target.value ? e.target.value.split(",").map((v) => v.trim()) : [],
                        )
                      }
                    />
                  </label>
                </>
              )}
              {editingKind === "person" && (
                <>
                  {selectField(
                    "role",
                    "role",
                    edit["role"],
                    (
                      [
                        "customer",
                        "merchant",
                        "technician",
                        "operations",
                        "admin",
                      ] as Persona["role"][]
                    ).map((role) => ({
                      value: role,
                      label:
                        locale === "te-IN"
                          ? {
                              customer: "కస్టమర్",
                              merchant: "వ్యాపారి",
                              technician: "నిపుణుడు",
                              operations: "నిర్వహణ",
                              admin: "అడ్మిన్",
                            }[role]
                          : role,
                    })),
                  )}
                  {selectField("merchantId", "merchants", edit["merchantId"], [
                    { value: "", label: "—" },
                    ...demo.state.merchants.map((m) => ({ value: m.id, label: m.name })),
                  ])}
                  {(["deactivated", "unavailable"] as const).map((key) => (
                    <label key={key} className="flex min-h-11 items-center gap-3">
                      <input
                        className="size-5"
                        type="checkbox"
                        checked={Boolean(edit[key])}
                        onChange={(e) => patch(key, e.target.checked)}
                      />
                      {t(key)}
                    </label>
                  ))}
                </>
              )}
              <label className="form-label block">
                {t("reason")}
                <textarea
                  className="form-input mt-2"
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
              <Button disabled={demo.busy} onClick={requestSave}>
                {t("saveChanges")}
              </Button>
            </div>
          )}
        </Modal>
        <Modal
          open={Boolean(pending)}
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={t("changes")}
          description={t("safeDelete")}
        >
          <p className="mb-4">{t("fixture")}</p>
          <Button disabled={demo.busy} onClick={confirmAction}>
            {t("confirm")}
          </Button>
          <Button variant="ghost" onClick={() => setPending(null)}>
            {t("cancel")}
          </Button>
          {error && (
            <p role="alert" className="text-destructive mt-4">
              {error}
            </p>
          )}
        </Modal>
      </main>
    </PageShell>
  );
}
