import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/fixhub/account";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/profile")({
  head: () => meta("Customer \u00b7 Profile", true),
  component: Screen,
});
function Screen() {
  return <AccountPage page="profile" />;
}
