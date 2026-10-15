import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/access-denied")({
  head: () => meta("Access Denied", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="access-denied" />;
}
