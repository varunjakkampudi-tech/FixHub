import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub24/context";
import { DemoPage } from "@/features/fixhub24/demo-pages";
export const Route = createFileRoute("/demo")({
  head: () => meta("End-to-End Marketplace Demo", true),
  component: DemoPage,
});
