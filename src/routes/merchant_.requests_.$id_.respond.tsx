import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/requests_/$id_/respond")({
  head: () => meta("Merchant \u00b7 Requests \u00b7 Id \u00b7 Respond", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="requests/$id/respond" />;
}
