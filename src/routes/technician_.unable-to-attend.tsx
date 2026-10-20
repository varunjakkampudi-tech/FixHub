import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/technician_/unable-to-attend")({
  head: () => meta("Technician \u00b7 Unable To Attend", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="unable-to-attend" />;
}
