import { createFileRoute } from "@tanstack/react-router";
import { TechnicianPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/technician_/jobs_/$id")({
  head: () => meta("Technician \u00b7 Jobs \u00b7 Id", true),
  component: Screen,
});
function Screen() {
  return <TechnicianPage page="jobs/$id" />;
}
