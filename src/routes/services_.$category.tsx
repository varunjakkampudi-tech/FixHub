import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub24/services";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/services_/$category")({
  head: () => meta("Services \u00b7 Category", false),
  component: Screen,
});
function Screen() {
  return <ServicesPage category={Route.useParams().category} />;
}
