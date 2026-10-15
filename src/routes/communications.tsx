import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub/context";
import { CommunicationsPage } from "@/features/fixhub/communications-ui";
export const Route = createFileRoute("/communications")({
  head: () => meta("Communications Inbox · Fictional Twilio Demo", true),
  component: () => <CommunicationsPage page="inbox" />,
});
