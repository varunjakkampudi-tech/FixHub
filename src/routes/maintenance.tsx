import { createFileRoute } from "@tanstack/react-router";
import { RecoveryPage } from "@/features/fixhub/recovery";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/maintenance")({
  head: () => meta("Maintenance", false),
  component: Screen,
});
function Screen() {
  return <RecoveryPage mode="maintenance" />;
}
