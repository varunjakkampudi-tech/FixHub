import { createFileRoute } from "@tanstack/react-router";
import { AppBookDetails } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/book/details")({
  head: () => ({
    meta: [
      { title: "Booking details · Fix Hub" },
      { name: "description", content: "Choose what you need for your demo booking." },
      { property: "og:title", content: "Booking details · Fix Hub" },
      { property: "og:description", content: "Choose what you need for your demo booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ category: String(s["category"] ?? "electrician"), merchant: String(s["merchant"] ?? ""), date: String(s["date"] ?? "") }),
  component: Screen,
});
function Screen() {
  return <AppBookDetails search={Route.useSearch()} />;
}
