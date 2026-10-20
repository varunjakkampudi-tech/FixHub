import { createFileRoute } from "@tanstack/react-router";
import { AppProfile } from "@/features/fixhub24/app-screens";
export const Route = createFileRoute("/app_/profile")({
  head: () => ({
    meta: [
      { title: "My profile · FixHub24" },
      { name: "description", content: "Your demo profile, addresses and settings." },
      { property: "og:title", content: "My profile · FixHub24" },
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
