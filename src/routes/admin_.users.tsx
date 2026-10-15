import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub/registry-admin";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/users")({
  head: () => meta("FixHub demo users", true),
  component: Screen,
});
function Screen() {
  return <RegistryAdmin page="users" />;
}
