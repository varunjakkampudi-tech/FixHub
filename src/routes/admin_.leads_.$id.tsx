import { createFileRoute } from "@tanstack/react-router";
import { RegistryAdmin } from "@/features/fixhub24/registry-admin";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/admin_/leads_/$id")({
  head: () => meta("FixHub24 demo leads", true),
  component: Screen,
});
function Screen() {
  const { id } = Route.useParams();
  return <RegistryAdmin page="leads" id={id} />;
}
