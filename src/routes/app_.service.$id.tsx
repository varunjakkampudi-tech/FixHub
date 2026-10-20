import { createFileRoute } from "@tanstack/react-router";
import { AppService } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app_/service/$id")({
  head: () => ({
    meta: [
      { title: "Service details · FixHub24" },
      { name: "description", content: "Service details and itemised demo estimate." },
      { property: "og:title", content: "Service details · FixHub24" },
      { property: "og:description", content: "Service details and itemised demo estimate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppService id={Route.useParams().id} />;
}
