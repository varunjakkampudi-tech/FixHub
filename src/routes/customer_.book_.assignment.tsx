import { createFileRoute } from "@tanstack/react-router";
import { MatchingPage } from "@/features/fixhub24/recovery";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/book_/assignment")({
  head: () => meta("Customer \u00b7 Book \u00b7 Assignment", true),
  component: Screen,
});
function Screen() {
  return <MatchingPage assignment={true} />;
}
