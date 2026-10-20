import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/features/fixhub24/home";
import { meta } from "@/features/fixhub24/context";
export const Route = createFileRoute("/")({
  head: () => meta("Local service experts in Tanuku"),
  component: HomePage,
});
