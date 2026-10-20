import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub24/registry-admin";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/leads")({
  head: () => meta("FixHub24 demo leads", true),
  component: Screen,
});
function Screen() {
  return <RegistryAdmin page="leads" />;
}
