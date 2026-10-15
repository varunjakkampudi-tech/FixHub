import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FixHubProvider } from "@/features/fixhub/context";
import { DemoProvider } from "@/features/fixhub/demo-provider";
import { useDemo } from "@/features/fixhub/demo-context";

function SessionSummary() {
  const { persona, error } = useDemo();
  return (
    <>
      <p>{persona?.id ?? "No active demo session"}</p>
      {error && <p>{error}</p>}
    </>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe("demo startup hydration", () => {
  it("restores the browser demo session before rendering session-dependent content", async () => {
    sessionStorage.setItem("fixhub-demo-persona", "sample-m1");

    render(
      <FixHubProvider>
        <DemoProvider>
          <SessionSummary />
        </DemoProvider>
      </FixHubProvider>,
    );

    expect(await screen.findByText("sample-m1")).toBeInTheDocument();
    expect(screen.queryByText("Getting your service preview ready")).not.toBeInTheDocument();
  });

  it("leaves the loading state and explains when browser storage cannot initialize", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });

    render(
      <FixHubProvider>
        <DemoProvider>
          <SessionSummary />
        </DemoProvider>
      </FixHubProvider>,
    );

    expect(await screen.findByText("No active demo session")).toBeInTheDocument();
    expect(
      screen.getByText("Browser storage is unavailable. Changes may not be saved in this preview."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Getting your service preview ready")).not.toBeInTheDocument();
  });
});
