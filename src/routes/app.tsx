import { createFileRoute } from "@tanstack/react-router";
import { AppWelcome } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Welcome · Fix Hub" },
      { name: "description", content: "Fix Hub home services in Tanuku — demo app preview." },
      { property: "og:title", content: "Welcome · Fix Hub" },
      { property: "og:description", content: "Fix Hub home services in Tanuku — demo app preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppWelcome  />;
}
