import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub/support";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/contact")({
  head: () => meta("Contact", false),
  component: Screen,
});
function Screen() {
  return <SupportPage />;
}
