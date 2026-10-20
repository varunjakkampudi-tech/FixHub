import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub24/context";
import { CommunicationsPage } from "@/features/fixhub24/communications-ui";
export const Route = createFileRoute("/communications_/verify")({
  head: () => meta("Communications Verify · Fictional Twilio Demo", true),
  component: () => <CommunicationsPage page="verify" />,
});
