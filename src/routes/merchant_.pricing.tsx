import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/pricing")({
  head: () => meta("Merchant \u00b7 Pricing", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="pricing" />;
}
