import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/fixhub24/account";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/settings")({
  head: () => meta("Customer \u00b7 Settings", true),
  component: Screen,
});
function Screen() {
  return <AccountPage page="settings" />;
}
