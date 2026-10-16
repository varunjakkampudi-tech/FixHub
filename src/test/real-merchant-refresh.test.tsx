import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) => (
    <button disabled={disabled} onClick={onClick}>{children}</button>
  ),
}));

vi.mock("@/features/fixhub/api-client", () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: mocks.request,
}));

vi.mock("@/features/fixhub/context", () => ({ useFixHub: () => ({ locale: "en-US" }) }));

vi.mock("@/features/fixhub/shared", () => ({
  Notice: ({ children, error }: { children: React.ReactNode; error?: boolean }) => <div role={error ? "alert" : "status"}>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import { RealMerchantPage } from "@/features/fixhub/real-merchant";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mocks.request.mockReset();
  vi.restoreAllMocks();
});

describe("merchant incoming-offer refresh", () => {
  it("refreshes offers every 30 seconds only while the requests page is visible", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    mocks.request.mockResolvedValue({ items: [] });

    render(<RealMerchantPage page="requests" />);
    await act(async () => { await Promise.resolve(); });
    expect(mocks.request).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/checks every 30 seconds while this page is open/i)).toHaveAttribute("aria-live", "off");
    expect(screen.getByText(/no notification is sent when the browser is closed/i)).toBeInTheDocument();
  });

  it("does not poll the assigned-jobs page", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    mocks.request.mockResolvedValue({ items: [] });

    render(<RealMerchantPage page="jobs" />);
    await act(async () => { await Promise.resolve(); });
    expect(mocks.request).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it("queues a refresh tick that arrives while a request is still in flight", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    let resolveFirst!: (value: { items: never[] }) => void;
    mocks.request
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValue({ items: [] });

    render(<RealMerchantPage page="requests" />);
    expect(mocks.request).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mocks.request).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst({ items: [] });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it("does not refresh offers while the browser tab is hidden", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    mocks.request.mockResolvedValue({ items: [] });

    render(<RealMerchantPage page="requests" />);
    await act(async () => { await Promise.resolve(); });
    expect(mocks.request).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it("refreshes incoming offers immediately when the tab becomes visible", async () => {
    vi.useFakeTimers();
    let visible = false;
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visible ? "visible" : "hidden");
    mocks.request.mockResolvedValue({ items: [] });

    render(<RealMerchantPage page="requests" />);
    await act(async () => { await Promise.resolve(); });
    expect(mocks.request).toHaveBeenCalledTimes(1);
    visible = true;
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); await Promise.resolve(); });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });
});
