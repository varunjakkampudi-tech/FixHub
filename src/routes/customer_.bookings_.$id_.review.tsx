import { createFileRoute } from "@tanstack/react-router";
import { BookingHistory } from "@/features/fixhub24/booking";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/bookings_/$id_/review")({
  head: () => meta("Customer \u00b7 Bookings \u00b7 Id \u00b7 Review", true),
  component: Screen,
});
function Screen() {
  return <BookingHistory detail={true} mode="review" />;
}
