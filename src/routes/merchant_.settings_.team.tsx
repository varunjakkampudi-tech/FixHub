import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/merchant_/settings_/team")({
  head: () => meta("Merchant \u00b7 Settings \u00b7 Team", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="settings/team" />;
}
