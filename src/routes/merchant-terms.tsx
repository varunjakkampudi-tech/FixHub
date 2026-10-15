import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant-terms")({
  head: () => meta("Merchant Terms", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="merchant-terms" />;
}
