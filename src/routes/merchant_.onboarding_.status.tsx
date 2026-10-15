import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/onboarding_/status")({
  head: () => meta("Merchant \u00b7 Onboarding \u00b7 Status", true),
  component: Screen,
});
function Screen() {
  return <OnboardingPage step={10} />;
}
