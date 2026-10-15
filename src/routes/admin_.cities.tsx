import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub/registry-admin";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/cities")({
  head: () => meta("FixHub demo cities", true),
  component: Screen,
});
function Screen() {
  return <RegistryAdmin page="cities" />;
}
