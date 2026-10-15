import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/consent")({
  head: () => meta("Consent", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="consent" />;
}
