import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub24/services";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/search")({
  head: () => meta("Search", false),
  component: Screen,
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
});
function Screen() {
  return <ServicesPage query={Route.useSearch().q} />;
}
