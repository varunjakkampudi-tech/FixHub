import { createFileRoute } from "@tanstack/react-router";
import { SubmittedPage } from "@/features/fixhub24/booking";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/customer_/book_/submitted")({
  head: () => meta("Customer \u00b7 Book \u00b7 Submitted", true),
  component: Screen,
});
function Screen() {
  return <SubmittedPage />;
}
