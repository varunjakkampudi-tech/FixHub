import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/faq")({
  head: () => meta("Faq", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="faq" />;
}
