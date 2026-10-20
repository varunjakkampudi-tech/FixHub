import { useFixHub24 } from "./context";
import { useDemo } from "./demo-context";
import { calculate, money, type Price, type Category } from "./demo-model";
import { ratesFor } from "./location-model";
import { dt, type DemoKey } from "./demo-copy";
export function PriceBreakdown({
  price,
  merchant = false,
  compact = false,
}: {
  price: Price;
  merchant?: boolean;
  compact?: boolean;
}) {
  const { locale } = useFixHub24();
  const d = (k: DemoKey) => dt(k, locale);
  const lines: [DemoKey, number][] = [
    ["visit", price.visit],
    ["labor", price.labor],
    ["parts", price.parts],
    ["fee", price.fee],
    ["discount", -price.discount],
    ["tax", price.tax],
  ];
  return (
    <div className="demo-price">
      <p className="demo-price-notice">{d("priceNotice")}</p>
      {compact ? (
        <>
          <div className="demo-price-row">
            <span>{d("visit")}</span>
            <strong>{money(price.visit, locale)}</strong>
          </div>
          <div className="demo-price-row total">
            <span>{d("total")}</span>
            <strong>{money(price.total, locale)}</strong>
          </div>
          {!price.rates.taxConfigured && (
            <p className="text-xs text-muted-foreground">{d("taxUnset")}</p>
          )}
        </>
      ) : (
        <>
          <dl>
            {lines.map(([label, value]) => (
              <div className="demo-price-row" key={label}>
                <dt>
                  {d(label)}
                  {label === "tax" && price.rates.taxConfigured
                    ? ` (${price.rates.taxBps / 100}%)`
                    : ""}
                </dt>
                <dd>
                  {label === "tax" && !price.rates.taxConfigured
                    ? d("taxNotConfigured")
                    : money(value, locale)}
                </dd>
              </div>
            ))}
            <div className="demo-price-row total">
              <dt>{d("total")}</dt>
              <dd>{money(price.total, locale)}</dd>
            </div>
          </dl>
          {!price.rates.taxConfigured && (
            <p className="text-xs text-muted-foreground">{d("taxUnset")}</p>
          )}
          {merchant && (
            <dl className="demo-earnings">
              {(
                [
                  ["gross", price.gross],
                  ["deduction", price.deduction],
                  ["net", price.net],
                  ["revenue", price.platformRevenue],
                ] as [DemoKey, number][]
              ).map(([label, value]) => (
                <div className="demo-price-row" key={label}>
                  <dt>{d(label)}</dt>
                  <dd>{money(value, locale)}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-xs text-muted-foreground">
            {d("version")}: {price.rates.version}
          </p>
        </>
      )}
      {(merchant ||
        price.fee > 0 ||
        price.deduction > 0 ||
        price.discount > 0 ||
        price.tax > 0) && <p className="text-xs text-muted-foreground">{d("hypothesis")}</p>}
    </div>
  );
}
export function ServicePrice({
  category,
  compact = false,
}: {
  category: string;
  compact?: boolean;
}) {
  const { state } = useDemo();
  const { draft } = useFixHub24();
  const service = state.registry.services.find((v) => v.id === category);
  const cat = service?.pricingCategory ?? (category === "appliances" ? "appliance" : category);
  if (!["electrician", "plumbing", "ac", "appliance"].includes(cat)) return null;
  return (
    <PriceBreakdown
      price={calculate(
        ratesFor(state, draft.cityId ?? "tanuku", service?.id ?? cat, cat as Category),
      )}
      compact={compact}
    />
  );
}
