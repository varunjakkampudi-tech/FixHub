import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/register")({
  head: () => meta("Customer \u00b7 Register", true),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="customer/register" />;
}
