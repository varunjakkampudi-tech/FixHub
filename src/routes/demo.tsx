import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/features/fixhub/context";
import { DemoPage } from "@/features/fixhub/demo-pages";
export const Route = createFileRoute("/demo")({
  head: () => meta("End-to-End Marketplace Demo", true),
  component: DemoPage,
});
