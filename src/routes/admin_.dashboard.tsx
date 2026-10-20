import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub24/registry-admin";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/dashboard")({
  head: () => meta("FixHub24 demo dashboard", true),
  component: Screen,
});
function Screen() {
  return <RegistryAdmin page="dashboard" />;
}
