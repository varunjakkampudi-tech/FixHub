import { createFileRoute } from "@tanstack/react-router";
import { BookingPage } from "@/features/fixhub24/booking";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/book_/photos")({
  head: () => meta("Customer \u00b7 Book \u00b7 Photos", true),
  component: Screen,
});
function Screen() {
  return <BookingPage step={2} />;
}
