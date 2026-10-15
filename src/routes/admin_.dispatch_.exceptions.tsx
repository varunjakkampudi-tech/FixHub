import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/dispatch_/exceptions")({
  head: () => meta("Admin \u00b7 Dispatch \u00b7 Exceptions", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="dispatch/exceptions" />;
}
