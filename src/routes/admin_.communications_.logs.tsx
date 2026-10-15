import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub/context";
import { CommunicationsPage } from "@/features/fixhub/communications-ui";
export const Route = createFileRoute("/admin_/communications_/logs")({
  head: () => meta("Communications Logs · Fictional Twilio Demo", true),
  component: () => <CommunicationsPage page="logs" />,
});
