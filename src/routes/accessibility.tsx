import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/accessibility")({
  head: () => meta("Accessibility", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="accessibility" />;
}
