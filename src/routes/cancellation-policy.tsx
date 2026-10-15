import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/cancellation-policy")({
  head: () => meta("Cancellation Policy", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="cancellation-policy" />;
}
