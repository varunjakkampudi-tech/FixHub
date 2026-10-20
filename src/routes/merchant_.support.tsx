import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub24/support";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/merchant_/support")({
  head: () => meta("Merchant \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <SupportPage />;
}
