import { createFileRoute } from "@tanstack/react-router";
import { BookingPage } from "@/features/fixhub/booking";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/book_/review")({
  head: () => meta("Customer \u00b7 Book \u00b7 Review", true),
  component: Screen,
});
function Screen() {
  return <BookingPage step={4} />;
}
