import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub/context";
import { CommunicationsPage } from "@/features/fixhub/communications-ui";
export const Route = createFileRoute("/communications_/conversation")({
  head: () => meta("Communications Conversation · Fictional Twilio Demo", true),
  component: () => <CommunicationsPage page="conversation" />,
});
