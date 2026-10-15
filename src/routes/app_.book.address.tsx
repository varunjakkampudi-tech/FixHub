import { createFileRoute } from "@tanstack/react-router";
import { AppBookAddress } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/book/address")({
  head: () => ({
    meta: [
      { title: "Address and time · Fix Hub" },
      { name: "description", content: "Pick a sample address, date and time slot." },
      { property: "og:title", content: "Address and time · Fix Hub" },
      { property: "og:description", content: "Pick a sample address, date and time slot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ category: String(s["category"] ?? "electrician"), merchant: String(s["merchant"] ?? ""), date: String(s["date"] ?? "") }),
  component: Screen,
});
function Screen() {
  return <AppBookAddress search={Route.useSearch()} />;
}
