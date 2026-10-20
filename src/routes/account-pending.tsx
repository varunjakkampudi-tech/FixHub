import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/account-pending")({
  head: () => meta("Account Pending", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="account-pending" />;
}
