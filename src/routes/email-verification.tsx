import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/email-verification")({
  head: () => meta("Email Verification", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="email-verification" />;
}
