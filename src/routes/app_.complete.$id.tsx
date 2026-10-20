import { createFileRoute } from "@tanstack/react-router";
import { AppComplete } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app_/complete/$id")({
  head: () => ({
    meta: [
      { title: "Service completed · FixHub24" },
      { name: "description", content: "Rate your demo service." },
      { property: "og:title", content: "Service completed · FixHub24" },
      { property: "og:description", content: "Rate your demo service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppComplete id={Route.useParams().id} />;
}
