import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/merchant_/onboarding_/pending")({
  head: () => meta("Merchant \u00b7 Onboarding \u00b7 Pending", true),
  component: Screen,
});
function Screen() {
  return <OnboardingPage step={9} />;
}
