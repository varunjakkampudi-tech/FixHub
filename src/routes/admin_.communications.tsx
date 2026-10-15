import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub/context";
import { CommunicationsPage } from "@/features/fixhub/communications-ui";
export const Route = createFileRoute("/admin_/communications")({
  head: () => meta("Communications Setup · Fictional Twilio Demo", true),
  component: () => <CommunicationsPage page="setup" />,
});
