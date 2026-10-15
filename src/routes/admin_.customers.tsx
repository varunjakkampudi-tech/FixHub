import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/customers")({
  head: () => meta("Admin \u00b7 Customers", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="customers" />;
}
