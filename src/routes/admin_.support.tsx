import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub24/support";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/support")({
  head: () => meta("Admin \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <SupportPage staff />;
}
