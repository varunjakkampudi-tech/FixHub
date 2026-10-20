import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/merchants_/$id_/verify")({
  head: () => meta("Admin \u00b7 Merchants \u00b7 Id \u00b7 Verify", true),
  component: Screen,
});
function Screen() {
  return <AdminPage page="merchants/$id/verify" />;
}
