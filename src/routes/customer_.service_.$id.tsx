import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub/services";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/service_/$id")({
  head: () => meta("Customer \u00b7 Service \u00b7 Id", true),
  component: Screen,
});
function Screen() {
  return <ServicesPage />;
}
