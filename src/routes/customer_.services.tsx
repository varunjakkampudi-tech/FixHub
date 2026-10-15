import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub/services";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/services")({
  head: () => meta("Customer \u00b7 Services", true),
  component: Screen,
});
function Screen() {
  return <ServicesPage />;
}
