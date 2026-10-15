import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub/services";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/services")({
  head: () => meta("Services", false),
  component: Screen,
});
function Screen() {
  return <ServicesPage />;
}
