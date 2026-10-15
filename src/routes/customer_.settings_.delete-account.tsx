import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/fixhub/account";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/settings_/delete-account")({
  head: () => meta("Customer \u00b7 Settings \u00b7 Delete Account", true),
  component: Screen,
});
function Screen() {
  return <AccountPage page="settings/delete-account" />;
}
