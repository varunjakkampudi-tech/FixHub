import { createFileRoute } from "@tanstack/react-router";
import { AppWelcome } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Welcome · FixHub24" },
      { name: "description", content: "FixHub24 home services in Tanuku — demo app preview." },
      { property: "og:title", content: "Welcome · FixHub24" },
      {
        property: "og:description",
        content: "FixHub24 home services in Tanuku — demo app preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppWelcome />;
}
