import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub/registry-admin";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/admin_/leads_/$id")({
  head: () => meta("FixHub demo leads", true),
  component: Screen,
});
function Screen() {
  const { id } = Route.useParams();
  return <RegistryAdmin page="leads" id={id} />;
}
