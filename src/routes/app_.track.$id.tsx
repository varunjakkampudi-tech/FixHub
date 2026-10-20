import { createFileRoute } from "@tanstack/react-router";
import { AppTrack } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app_/track/$id")({
  head: () => ({
    meta: [
      { title: "Service status · FixHub24" },
      { name: "description", content: "Follow your demo request status." },
      { property: "og:title", content: "Service status · FixHub24" },
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
