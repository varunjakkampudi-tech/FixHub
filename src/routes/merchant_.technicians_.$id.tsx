import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/technicians_/$id")({
  head: () => meta("Merchant \u00b7 Technicians \u00b7 Id", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="technicians/$id" />;
}
