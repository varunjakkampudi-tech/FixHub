import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/access_/roles")({
  head: () => meta("Admin \u00b7 Access \u00b7 Roles", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="access/roles" />;
}
