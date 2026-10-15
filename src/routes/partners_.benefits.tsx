import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/partners_/benefits")({
  head: () => meta("Partners \u00b7 Benefits", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="partners/benefits" />;
}
