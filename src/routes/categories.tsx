import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/features/fixhub/services";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/categories")({
  head: () => meta("Categories", false),
  component: Screen,
});
function Screen() {
  return <ServicesPage />;
}
