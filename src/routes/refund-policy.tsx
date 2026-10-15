import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/refund-policy")({
  head: () => meta("Refund Policy", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="refund-policy" />;
}
