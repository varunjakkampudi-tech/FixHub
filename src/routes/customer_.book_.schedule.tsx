import { createFileRoute } from "@tanstack/react-router";
import { BookingPage } from "@/features/fixhub/booking";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/book_/schedule")({
  head: () => meta("Customer \u00b7 Book \u00b7 Schedule", true),
  component: Screen,
});
function Screen() {
  return <BookingPage step={3} />;
}
