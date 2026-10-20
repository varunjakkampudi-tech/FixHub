import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/access-denied")({
  head: () => meta("Admin \u00b7 Access Denied", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="access-denied" />;
}
