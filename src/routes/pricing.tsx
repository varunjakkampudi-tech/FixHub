import { createFileRoute } from "@tanstack/react-router";
import { DemoPage } from "@/features/fixhub/demo-pages";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/pricing")({
  head: () => meta("Pricing", false),
  component: Screen,
});
function Screen() {
  return <DemoPage />;
}
