import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/fixhub/home";
import { meta } from "@/features/fixhub/context";
export const Route = createFileRoute("/")({
  head: () => meta("Local service experts in Tanuku"),
  component: HomePage,
});
