import { createFileRoute } from "@tanstack/react-router";
import { MerchantPage } from "@/features/fixhub24/workspaces";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/merchant_/jobs_/$id")({
  head: () => meta("Merchant \u00b7 Jobs \u00b7 Id", true),
  component: Screen,
});
function Screen() {
  return <MerchantPage page="jobs/$id" />;
}
