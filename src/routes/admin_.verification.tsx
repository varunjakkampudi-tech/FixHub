import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/verification")({
  head: () => meta("Admin \u00b7 Verification", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="verification" />;
}
