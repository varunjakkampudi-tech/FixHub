import { createFileRoute } from "@tanstack/react-router";
import { RecoveryPage } from "@/features/fixhub24/recovery";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/offline")({
  head: () => meta("Offline", false),
  component: Screen,
});
function Screen() {
  return <RecoveryPage mode="offline" />;
}
