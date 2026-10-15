import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/reset-password")({
  head: () => meta("Reset Password", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="reset-password" />;
}
