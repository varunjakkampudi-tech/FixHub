import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/technician_/support")({
  head: () => meta("Technician \u00b7 Support", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="support" />;
}
