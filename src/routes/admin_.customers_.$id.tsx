import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/customers_/$id")({
  head: () => meta("Admin \u00b7 Customers \u00b7 Id", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="customers/$id" />;
}
