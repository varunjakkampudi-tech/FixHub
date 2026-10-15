import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/settings_/security")({
  head: () => meta("Merchant \u00b7 Settings \u00b7 Security", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="settings/security" />;
}
