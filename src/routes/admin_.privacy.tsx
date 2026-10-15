import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/privacy")({
  head: () => meta("Admin \u00b7 Privacy", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="privacy" />;
}
