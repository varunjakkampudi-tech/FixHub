import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub24/support";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/support")({
  head: () => meta("Customer \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <SupportPage />;
}
