import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/fixhub24/account";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/settings_/language")({
  head: () => meta("Customer \u00b7 Settings \u00b7 Language", true),
  component: Screen,
});
function Screen() {
  return <AccountPage page="settings/language" />;
}
