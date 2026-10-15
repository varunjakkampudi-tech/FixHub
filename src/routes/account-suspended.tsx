import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/account-suspended")({
  head: () => meta("Account Suspended", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="account-suspended" />;
}
