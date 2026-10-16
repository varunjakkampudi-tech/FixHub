import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/fixhub/support";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/support")({
  head: () => meta("Admin \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <SupportPage staff />;
}
