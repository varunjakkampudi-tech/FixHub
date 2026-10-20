import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/health")({
  head: () => meta("Admin \u00b7 Health", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="health" />;
}
