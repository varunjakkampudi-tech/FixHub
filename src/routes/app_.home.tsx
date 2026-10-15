import { createFileRoute } from "@tanstack/react-router";
import { AppHome } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/home")({
  head: () => ({
    meta: [
      { title: "Home · Fix Hub" },
      { name: "description", content: "Find home services near you in the Fix Hub demo app." },
      { property: "og:title", content: "Home · Fix Hub" },
      { property: "og:description", content: "Find home services near you in the Fix Hub demo app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppHome  />;
}
