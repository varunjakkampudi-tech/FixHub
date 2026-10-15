import { createFileRoute } from "@tanstack/react-router";
import { AppService } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/service/$id")({
  head: () => ({
    meta: [
      { title: "Service details · Fix Hub" },
      { name: "description", content: "Service details and itemised demo estimate." },
      { property: "og:title", content: "Service details · Fix Hub" },
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
