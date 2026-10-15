import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub/services";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/services_/$category_/$service")({
  head: () => meta("Services \u00b7 Category \u00b7 Service", false),
  component: Screen,
});
function Screen() {
  return <ServicesPage category={Route.useParams().category} service={Route.useParams().service} />;
}
