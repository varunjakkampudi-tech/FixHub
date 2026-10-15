import { createFileRoute } from "@tanstack/react-router";
import { AppBookConfirm } from "@/features/fixhub/app-screens";
export const Route = createFileRoute("/app_/book/confirm")({
  head: () => ({
    meta: [
      { title: "Confirm booking · Fix Hub" },
      { name: "description", content: "Review the itemised estimate and send a demo request." },
      { property: "og:title", content: "Confirm booking · Fix Hub" },
      { property: "og:description", content: "Review the itemised estimate and send a demo request." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ category: String(s["category"] ?? "electrician"), merchant: String(s["merchant"] ?? ""), date: String(s["date"] ?? "") }),
  component: Screen,
});
function Screen() {
  return <AppBookConfirm search={Route.useSearch()} />;
}
