import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/technician")({
  head: () => meta("Technician", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="overview" />;
}
