import { createFileRoute } from "@tanstack/react-router";
import { BookingHistory } from "@/features/fixhub/booking";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/bookings")({
  head: () => meta("Customer \u00b7 Bookings", true),
  component: Screen,
});
function Screen() {
  return <BookingHistory mode="bookings" />;
}
