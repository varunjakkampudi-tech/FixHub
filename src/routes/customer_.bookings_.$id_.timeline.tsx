import { createFileRoute } from "@tanstack/react-router";
import { BookingHistory } from "@/features/fixhub/booking";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/customer_/bookings_/$id_/timeline")({
  head: () => meta("Customer \u00b7 Bookings \u00b7 Id \u00b7 Timeline", true),
  component: Screen,
});
function Screen() {
  return <BookingHistory detail={true} mode="timeline" />;
}
