import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/technician_/work-photos")({
  head: () => meta("Technician \u00b7 Work Photos", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="work-photos" />;
}
