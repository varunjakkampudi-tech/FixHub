import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/features/fixhub/public";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/otp-expired")({
  head: () => meta("Otp Expired", false),
  component: Screen,
});
function Screen() {
  return <AuthPage mode="otp-expired" />;
}
