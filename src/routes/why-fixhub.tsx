import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/why-fixhub")({
  head: () => meta("Why Fixhub", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="why-fixhub" />;
}
