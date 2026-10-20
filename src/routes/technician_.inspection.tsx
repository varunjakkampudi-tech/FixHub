import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/technician_/inspection")({
  head: () => meta("Technician \u00b7 Inspection", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="inspection" />;
}
