import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/technician")({
  head: () => meta("Technician", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="overview" />;
}
