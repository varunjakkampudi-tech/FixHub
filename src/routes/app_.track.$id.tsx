import { createFileRoute } from "@tanstack/react-router";
import { AppTrack } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/track/$id")({
  head: () => ({
    meta: [
      { title: "Service status · Fix Hub" },
      { name: "description", content: "Follow your demo request status." },
      { property: "og:title", content: "Service status · Fix Hub" },
      { property: "og:description", content: "Follow your demo request status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppTrack id={Route.useParams().id} />;
}
