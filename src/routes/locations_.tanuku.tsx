import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/locations_/tanuku")({
  head: () => meta("Locations \u00b7 Tanuku", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="locations/tanuku" />;
}
