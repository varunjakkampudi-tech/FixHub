import { createFileRoute } from "@tanstack/react-router";
import { AddressEditor } from "@/features/fixhub/location-ui";
import { PageShell, PageTop, Notice } from "@/features/fixhub/shared";
import { useFixHub } from "@/features/fixhub/context";
import { useDemo } from "@/features/fixhub/demo-context";
import { lt } from "@/features/fixhub/location-copy";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/addresses")({
  head: () => meta("Customer \u00b7 Addresses", true),
  component: Screen,
});
function Screen() {
  const { locale } = useFixHub();
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
