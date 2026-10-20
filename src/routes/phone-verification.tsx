import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/phone-verification")({
  head: () => meta("Phone Verification", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="phone-verification" />;
}
