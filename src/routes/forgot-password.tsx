import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/forgot-password")({
  head: () => meta("Forgot Password", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="forgot-password" />;
}
