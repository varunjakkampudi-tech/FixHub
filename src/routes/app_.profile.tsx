import { createFileRoute } from "@tanstack/react-router";
import { AppProfile } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/profile")({
  head: () => ({
    meta: [
      { title: "My profile · Fix Hub" },
      { name: "description", content: "Your demo profile, addresses and settings." },
      { property: "og:title", content: "My profile · Fix Hub" },
      { property: "og:description", content: "Your demo profile, addresses and settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),

  component: Screen,
});
function Screen() {
  return <AppProfile />;
}
