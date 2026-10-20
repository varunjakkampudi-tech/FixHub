import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/service-unavailable")({
  head: () => meta("Service Unavailable", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="service-unavailable" />;
}
