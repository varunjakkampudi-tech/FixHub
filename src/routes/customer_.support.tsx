import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub/support";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/support")({
  head: () => meta("Customer \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <SupportPage />;
}
