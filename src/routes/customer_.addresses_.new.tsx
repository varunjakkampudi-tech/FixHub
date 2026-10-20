import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/fixhub24/account";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/addresses_/new")({
  head: () => meta("Customer \u00b7 Addresses \u00b7 New", true),
  component: Screen,
});
function Screen() {
  return <AccountPage page="addresses/new" />;
}
