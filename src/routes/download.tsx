import { createFileRoute } from "@tanstack/react-router";
import { PublicPage } from "@/features/fixhub24/public";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/download")({
  head: () => meta("Download", false),
  component: Screen,
});
function Screen() {
  return <PublicPage page="download" />;
}
