import { createFileRoute } from "@tanstack/react-router";
import { BookingPage } from "@/features/fixhub24/booking";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/book_/slots")({
  head: () => meta("Customer \u00b7 Book \u00b7 Slots", true),
  component: Screen,
});
function Screen() {
  return <BookingPage step={3} />;
}
