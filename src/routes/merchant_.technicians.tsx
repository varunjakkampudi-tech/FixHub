import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/merchant_/technicians")({
  head: () => meta("Merchant \u00b7 Technicians", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="technicians" />;
}
