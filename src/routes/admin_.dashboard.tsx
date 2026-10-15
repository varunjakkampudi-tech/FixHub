import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub/registry-admin";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/dashboard")({
  head: () => meta("FixHub demo dashboard", true),
  component: Screen,
});
function Screen() {
  return <RegistryAdmin page="dashboard" />;
}
