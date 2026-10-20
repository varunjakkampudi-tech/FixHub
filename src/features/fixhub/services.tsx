import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { servicePhoto } from "./service-photos";
import { Button } from "@/components/ui/button";
import { useFixHub } from "./context";
import { PageShell, PageTop, SearchBox, CategoryIcon, Empty, Notice } from "./shared";
import { useState } from "react";
import { ServicePrice } from "./demo-price";
import { useDemo } from "./demo-context";
import { CityPicker, SampleProviders } from "./location-ui";
import { enabledServices } from "./location-model";
export function ServicesPage({
  category,
  service,
  query = "",
}: {
  category?: string;
  service?: string;
  query?: string;
}) {
  const { t, locale, updateDraft, draft } = useFixHub();
  const navigate = useNavigate();
  const [search, setSearch] = useState(query);
  const { state } = useDemo();
  const available = enabledServices(state, draft.cityId ?? "tanuku");
  const selected = available.find(
    (c) => c.id === (category === "appliances" ? "appliance" : category),
  );
  const title = selected?.names[locale] ?? t("discover");
  const list = category
    ? selected
      ? [selected]
      : []
    : available.filter((c) =>
        `${c.names["en-IN"]} ${c.names["te-IN"]}`.toLowerCase().includes(search.toLowerCase()),
      );
  return (
    <PageShell>
      <main id="main" className="wrap pb-10">
        <PageTop title={title} desc={selected ? selected.description[locale] : t("discoverDesc")} />
        <CityPicker />
        {!selected && (
          <div className="mb-8">
            <SearchBox initial={query} onSearch={setSearch} />
          </div>
        )}
        {list.length === 0 ? (
          <Empty
            title="noResults"
            desc="discoverDesc"
            action={
              <Button
                onClick={() => {
                  setSearch("");
                  navigate({ to: "/services" });
                }}
              >
                {t("clear")}
              </Button>
            }
          />
        ) : !selected ? (
          <ul className="svc-rows">
            {list.map((c) => {
              const photo = servicePhoto(c.id);
              return (
                <li key={c.id}>
                  <Link to="/services/$category" params={{ category: c.id }} className="svc-row">
                    <span className="svc-thumb">
                      {photo ? (
                        <img src={photo} alt="" loading="lazy" width={944} height={704} />
                      ) : (
                        <CategoryIcon id={c.id} />
                      )}
                    </span>
                    <span className="svc-text">
                      <strong>{c.names[locale]}</strong>
                      <span>{c.description[locale]}</span>
                      <em className="svc-price">{locale === "te-IN" ? "అంచనా ధర లోపల చూడండి" : "See estimated price"}</em>
                    </span>
                    <ChevronRight className="svc-chev" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
            <li className="svc-sample-note">{locale === "te-IN" ? "చిత్రాలు నమూనా మాత్రమే — నిజమైన నిపుణులు కాదు." : "Photos are SAMPLE images — not real FixHub professionals."}</li>
          </ul>
        ) : (
          <div className="content-grid">
            {list.map((c) => (
              <article className="service-card" key={c.id}>
                {servicePhoto(c.id) ? (
                  <figure className="svc-hero">
                    <img src={servicePhoto(c.id)} alt="" width={944} height={704} />
                    <figcaption>SAMPLE</figcaption>
                  </figure>
                ) : (
                  <CategoryIcon id={c.id} />
                )}
                <h2>{c.names[locale]}</h2>
                <p>{c.description[locale]}</p>
                <ServicePrice category={c.id} compact={!selected} />
                <SampleProviders serviceId={c.id} />
                {selected ? (
                  <>
                    <Notice>{t("serviceInfo")}</Notice>
                    <Button asChild onClick={() => updateDraft({ service: c.id })}>
                      <Link to="/customer/book/new">
                        {t("book")}
                        <ArrowRight />
                      </Link>
                    </Button>
                    {!service && (
                      <Link
                        to="/services/$category/$service"
                        params={{ category: c.id, service: "home-service" }}
                        className="text-link mt-4 block"
                      >
                        {t("inspection")}
                        <ArrowRight size={15} />
                      </Link>
                    )}
                  </>
                ) : (
                  <Link to="/services/$category" params={{ category: c.id }} className="text-link">
                    {t("choose")}
                    <ArrowRight size={15} />
                  </Link>
                )}
              </article>
            ))}
            {selected && (
              <aside className="summary-panel">
                <h2>{t("safetyTitle")}</h2>
                <p className="mb-5 text-sm text-muted-foreground">{t("safetyDesc")}</p>
                <Link to="/pricing" className="text-link">
                  {t("price")}
                  <ArrowRight size={15} />
                </Link>
                <br />
                <Link to="/help" className="text-link">
                  {t("help")}
                  <ArrowRight size={15} />
                </Link>
              </aside>
            )}
          </div>
        )}
      </main>
    </PageShell>
  );
}
