import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub24/support";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/contact")({
  head: () => meta("Contact", false),
  component: Screen,
});
function Screen() {
  return <SupportPage />;
}
