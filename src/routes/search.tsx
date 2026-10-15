import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub/services";
import { meta } from "@/features/fixhub/context";
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
