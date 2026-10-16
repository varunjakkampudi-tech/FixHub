import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub/support";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/support")({
  head: () => meta("Merchant \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <SupportPage />;
}
