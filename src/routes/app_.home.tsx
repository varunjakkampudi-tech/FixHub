import { createFileRoute } from "@tanstack/react-router";
import { AppHome } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app_/home")({
  head: () => ({
    meta: [
      { title: "Home · FixHub24" },
      { name: "description", content: "Find home services near you in the FixHub24 demo app." },
      { property: "og:title", content: "Home · FixHub24" },
      {
        property: "og:description",
        content: "Find home services near you in the FixHub24 demo app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppHome />;
}
