import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub/registry-admin";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/merchants_/$id")({
  head: () => meta("Admin \u00b7 Merchants \u00b7 Id", true),
  component: Screen,
});
function Screen() {
  const { id } = Route.useParams();
  return <RegistryAdmin page="merchants" id={id} />;
}
