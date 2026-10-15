import { createFileRoute } from "@tanstack/react-router";
import { MatchingPage } from "@/features/fixhub/recovery";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/book_/matching")({
  head: () => meta("Customer \u00b7 Book \u00b7 Matching", true),
  component: Screen,
});
function Screen() {
  return <MatchingPage assignment={false} />;
}
