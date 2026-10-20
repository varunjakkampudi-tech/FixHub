import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/how-it-works")({
  head: () => meta("How It Works", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="how-it-works" />;
}
