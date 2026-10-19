import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/fixhub/context", () => ({ useFixHub: () => ({ locale: "en-IN" }) }));

import { Notice } from "@/features/fixhub/shared";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("support reference notice", () => {
  it("copies a validated reference ID from an API error", async () => {
    const requestId = "f437441e-3772-445d-bc99-3abe5a41307e";
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<Notice error>{`Booking failed (Reference: ${requestId})`}</Notice>);
    fireEvent.click(screen.getByRole("button", { name: "Copy support reference" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(requestId));
    expect(await screen.findByRole("button", { name: "Reference copied" })).toBeInTheDocument();
  });

  it("does not offer copying for malformed reference text", () => {
    render(<Notice error>{"Booking failed (Reference: <script>)"}</Notice>);
    expect(screen.queryByRole("button", { name: /copy support reference/i })).not.toBeInTheDocument();
  });
});
