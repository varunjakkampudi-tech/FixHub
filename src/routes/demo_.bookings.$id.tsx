import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub/context";
import { DemoBookingRoute } from "@/features/fixhub/demo-pages";
export const Route = createFileRoute("/demo_/bookings/$id")({
  head: () => meta("Demo Booking Timeline and Quote", true),
  component: Screen,
});
function Screen() {
  const { id } = Route.useParams();
  return <DemoBookingRoute id={id} />;
}
