import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub24/context";
import { CommunicationsPage } from "@/features/fixhub24/communications-ui";
export const Route = createFileRoute("/communications_/conversation")({
  head: () => meta("Communications Conversation · Fictional Twilio Demo", true),
  component: () => <CommunicationsPage page="conversation" />,
});
