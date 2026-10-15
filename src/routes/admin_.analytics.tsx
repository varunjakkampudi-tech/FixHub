import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/analytics")({
  head: () => meta("Admin \u00b7 Analytics", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="analytics" />;
}
