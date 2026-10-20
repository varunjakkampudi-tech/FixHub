import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminHealthDiagnostics } from "@/features/fixhub/admin-health";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin API health diagnostics", () => {
  it("shows separate liveness and readiness results from the API", async () => {
    const fetch = vi.fn(
      async (input: RequestInfo | URL) =>
        new Response(
          JSON.stringify(
            input === "/health/live"
              ? { status: "alive", mode: "local-demo" }
              : { status: "ready", mode: "local-demo" },
          ),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetch);

    render(<AdminHealthDiagnostics locale="en-IN" />);

    expect(await screen.findByText("alive · local-demo")).toBeInTheDocument();
    expect(screen.getByText("ready · local-demo")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/health/live",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/health/ready",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("reports liveness without waiting for a slower readiness dependency", async () => {
    let finishReady!: (response: Response) => void;
    const fetch = vi.fn((input: RequestInfo | URL) =>
      input === "/health/live"
        ? Promise.resolve(
            new Response(JSON.stringify({ status: "alive", mode: "local-demo" }), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          )
        : new Promise<Response>((resolve) => {
            finishReady = resolve;
          }),
    );
    vi.stubGlobal("fetch", fetch);

    render(<AdminHealthDiagnostics locale="en-IN" />);

    expect(await screen.findByText("alive · local-demo")).toBeInTheDocument();
    expect(screen.getByText("Checking…")).toBeInTheDocument();
    finishReady(
      new Response(JSON.stringify({ status: "ready", mode: "local-demo" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    expect(await screen.findByText("ready · local-demo")).toBeInTheDocument();
  });

  it("shows a safe correlation reference on failure without exposing raw error details", async () => {
    const requestId = "11111111-2222-4333-8444-555555555555";
    const fetch = vi.fn(async (input: RequestInfo | URL) =>
      input === "/health/live"
        ? new Response(JSON.stringify({ status: "alive", mode: "local-demo" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          })
        : new Response(
            JSON.stringify({
              error: { code: "INTERNAL_ERROR", message: "sensitive internal detail" },
              requestId,
            }),
            {
              status: 500,
              headers: { "content-type": "application/json", "x-request-id": requestId },
            },
          ),
    );
    vi.stubGlobal("fetch", fetch);

    render(<AdminHealthDiagnostics locale="en-IN" />);

    expect(await screen.findByText("Check unavailable.")).toBeInTheDocument();
    expect(screen.getByText(requestId)).toBeInTheDocument();
    expect(screen.queryByText("sensitive internal detail")).not.toBeInTheDocument();
  });
});
