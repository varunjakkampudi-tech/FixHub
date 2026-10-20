import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub24/services";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/services")({
  head: () => meta("Services", false),
  component: Screen,
});
function Screen() {
  return <ServicesPage />;
}
