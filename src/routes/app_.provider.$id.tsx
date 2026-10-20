import { createFileRoute } from "@tanstack/react-router";
import { AppProvider } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app_/provider/$id")({
  head: () => ({
    meta: [
      { title: "Professional profile · FixHub24" },
      { name: "description", content: "Fictional demo merchant profile." },
      { property: "og:title", content: "Professional profile · FixHub24" },
      { property: "og:description", content: "Fictional demo merchant profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppProvider id={Route.useParams().id} />;
}
