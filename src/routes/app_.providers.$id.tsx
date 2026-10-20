import { createFileRoute } from "@tanstack/react-router";
import { AppProviders } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/providers/$id")({
  head: () => ({
    meta: [
      { title: "Available professionals · Fix Hub" },
      { name: "description", content: "Eligible fictional demo merchants for your service." },
      { property: "og:title", content: "Available professionals · Fix Hub" },
      {
        property: "og:description",
        content: "Eligible fictional demo merchants for your service.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppProviders id={Route.useParams().id} />;
}
