import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/technician_/settings")({
  head: () => meta("Technician \u00b7 Settings", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="settings" />;
}
