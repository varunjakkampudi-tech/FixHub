import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub24/context";
import { DemoBookingRoute } from "@/features/fixhub24/demo-pages";
export const Route = createFileRoute("/demo_/bookings/$id")({
  head: () => meta("Demo Booking Timeline and Quote", true),
  component: Screen,
});
function Screen() {
  const { id } = Route.useParams();
  return <DemoBookingRoute id={id} />;
}
