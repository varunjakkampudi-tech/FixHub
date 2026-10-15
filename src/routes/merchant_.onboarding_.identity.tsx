import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/features/fixhub/workspaces";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/merchant_/onboarding_/identity")({
  head: () => meta("Merchant \u00b7 Onboarding \u00b7 Identity", true),
  component: Screen,
});
function Screen() {
  return <OnboardingPage step={1} />;
}
