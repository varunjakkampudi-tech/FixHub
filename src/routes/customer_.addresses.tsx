import { createFileRoute } from "@tanstack/react-router";
import { AddressEditor } from "@/features/fixhub24/location-ui";
import { PageShell, PageTop, Notice } from "@/features/fixhub24/shared";
import { useFixHub24 } from "@/features/fixhub24/context";
import { useDemo } from "@/features/fixhub24/demo-context";
import { lt } from "@/features/fixhub24/location-copy";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/addresses")({
  head: () => meta("Customer \u00b7 Addresses", true),
  component: Screen,
});
function Screen() {
  const { locale } = useFixHub24();
  const { persona } = useDemo();
  return (
    <PageShell>
      <main id="main" className="wrap pb-10">
        <PageTop title={lt("addresses", locale)} />
        {persona?.role === "customer" ? (
          <AddressEditor />
        ) : (
          <Notice warning>{lt("terms", locale)}</Notice>
        )}
      </main>
    </PageShell>
  );
}
