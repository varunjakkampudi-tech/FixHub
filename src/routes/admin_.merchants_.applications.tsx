import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/merchants_/applications")({
  head: () => meta("Admin \u00b7 Merchants \u00b7 Applications", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="merchants/applications" />;
}
