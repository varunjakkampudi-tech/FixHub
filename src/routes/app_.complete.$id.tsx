import { createFileRoute } from "@tanstack/react-router";
import { AppComplete } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/complete/$id")({
  head: () => ({
    meta: [
      { title: "Service completed · Fix Hub" },
      { name: "description", content: "Rate your demo service." },
      { property: "og:title", content: "Service completed · Fix Hub" },
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
