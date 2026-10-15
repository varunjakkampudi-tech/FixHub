import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/access-denied")({
  head: () => meta("Admin \u00b7 Access Denied", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="access-denied" />;
}
