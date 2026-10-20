import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  routerPath: "/customer/bookings/00000000-0000-4000-8000-000000000001",
  request: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to?: string }) => (
    <a href={to ?? "#"}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: mocks.routerPath } }),
}));

vi.mock("@/features/fixhub/api-client", () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: mocks.request,
}));

vi.mock("@/features/fixhub/shared", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
  Notice: ({ children, error }: { children: React.ReactNode; error?: boolean }) => (
    <div role={error ? "alert" : "status"}>{children}</div>
  ),
}));

import { RealBookingHistory } from "@/features/fixhub/real-booking";
import { FixHubProvider } from "@/features/fixhub/context";

const completedBooking = {
  id: "00000000-0000-4000-8000-000000000001",
  status: "completed",
  created_at: "2026-10-16T08:00:00.000Z",
  scheduled_at: null,
  visit_price_paise: 40000,
  labor_estimate_paise: 45000,
  parts_estimate_paise: null,
  currency: "INR",
  payment_method: "cash_on_completion",
  service_name: "Electrical repair",
  address_label: "Home",
  address_text: "Private street address must not appear in the record",
  locality: "Tanuku",
  business_name: "Example Electrician",
  customer_quote_accepted: true,
  customer_rating: null,
  customer_review: null,
};

function renderBooking(accepted: boolean) {
  mocks.request.mockResolvedValue({
    booking: { ...completedBooking, customer_quote_accepted: accepted },
  });
  return render(
    <FixHubProvider>
      <RealBookingHistory detail />
    </FixHubProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mocks.routerPath = "/customer/bookings/00000000-0000-4000-8000-000000000001";
  mocks.request.mockReset();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("completed booking service record", () => {
  it("prints only an eligible completed booking record and disclaims invoice/payment status", async () => {
    const print = vi.fn();
    vi.stubGlobal("print", print);
    renderBooking(true);

    expect(await screen.findByRole("heading", { name: "Service record" })).toBeInTheDocument();
    expect(screen.getByText(/not a tax invoice or payment receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/Cash payment status is not recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/Separate quote required/i)).toBeInTheDocument();
    const record = screen.getByRole("heading", { name: "Service record" }).closest("section");
    expect(record).not.toBeNull();
    expect(
      within(record!).queryByText(/Private street address must not appear/),
    ).not.toBeInTheDocument();
    const download = within(record!).getByRole("link", { name: "Download service record (.txt)" });
    expect(download).toHaveAttribute(
      "download",
      "fixhub-service-record-00000000-0000-4000-8000-000000000001.txt",
    );
    const fileContents = decodeURIComponent(
      download.getAttribute("href")!.split(",").slice(1).join(","),
    );
    expect(fileContents).toContain("Service: Electrical repair");
    expect(fileContents).toContain("Provider: Example Electrician");
    expect(fileContents).toContain("Visit charge: ₹400");
    expect(fileContents).toContain("Labour estimate: ₹450");
    expect(fileContents).toContain("Displayed quote total: ₹850");
    expect(fileContents).toContain("Payment status: Not recorded");
    expect(fileContents).toContain("not a tax invoice or payment receipt");
    expect(fileContents).not.toContain("Private street address must not appear");
    fireEvent.click(screen.getByRole("button", { name: "Print / save as PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("does not offer a service record when current quote consent is absent or stale", async () => {
    renderBooking(false);
    expect(await screen.findByText("Electrical repair")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Service record" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Download service record (.txt)" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Print / save as PDF" })).not.toBeInTheDocument();
  });

  it("explains that booking status is authoritative while provider notifications are best-effort", async () => {
    mocks.request.mockResolvedValue({ booking: { ...completedBooking, status: "offered" } });
    render(
      <FixHubProvider>
        <RealBookingHistory detail />
      </FixHubProvider>,
    );

    expect(
      await screen.findByText(/notifications to eligible providers may be delayed or unavailable/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no provider is assigned until one accepts/i)).toBeInTheDocument();
    expect(screen.getByText("Status: Waiting for a provider")).toBeInTheDocument();
    expect(screen.queryByText(/they have not been notified/i)).not.toBeInTheDocument();
  });

  it("shows an accessible booking-shaped skeleton until detail data arrives", async () => {
    let resolveBooking!: (value: { booking: typeof completedBooking }) => void;
    mocks.request.mockReturnValue(
      new Promise((resolve) => {
        resolveBooking = resolve;
      }),
    );
    render(
      <FixHubProvider>
        <RealBookingHistory detail />
      </FixHubProvider>,
    );

    const loading = screen.getByRole("status");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading booking details…")).toBeInTheDocument();
    expect(loading.querySelectorAll('[aria-hidden="true"] .animate-pulse').length).toBeGreaterThan(
      0,
    );

    await act(async () => {
      resolveBooking({ booking: { ...completedBooking, status: "offered" } });
      await Promise.resolve();
    });
    expect(await screen.findByText("Electrical repair")).toBeInTheDocument();
  });

  it("refreshes an active customer booking while the detail page is visible", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    mocks.request.mockResolvedValue({ booking: { ...completedBooking, status: "offered" } });
    render(
      <FixHubProvider>
        <RealBookingHistory detail />
      </FixHubProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.request).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(/status checks every 30 seconds while this page is open/i),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it("does not poll customer bookings in a hidden tab or after completion", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    mocks.request.mockResolvedValue({ booking: { ...completedBooking, status: "completed" } });
    render(
      <FixHubProvider>
        <RealBookingHistory detail />
      </FixHubProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.request).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it("refreshes the active customer booking as soon as a hidden tab becomes visible", async () => {
    vi.useFakeTimers();
    let visible = false;
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() =>
      visible ? "visible" : "hidden",
    );
    mocks.request.mockResolvedValue({ booking: { ...completedBooking, status: "offered" } });
    render(
      <FixHubProvider>
        <RealBookingHistory detail />
      </FixHubProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.request).toHaveBeenCalledTimes(1);
    visible = true;
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it("ignores a slow refresh response after navigating to another booking", async () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const bookingAId = "00000000-0000-4000-8000-000000000001";
    const bookingBId = "00000000-0000-4000-8000-000000000002";
    let resolveRefreshA!: (value: { booking: typeof completedBooking }) => void;
    mocks.routerPath = `/customer/bookings/${bookingAId}`;
    mocks.request
      .mockResolvedValueOnce({
        booking: {
          ...completedBooking,
          id: bookingAId,
          service_name: "Service A",
          status: "offered",
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefreshA = resolve;
          }),
      )
      .mockResolvedValueOnce({
        booking: {
          ...completedBooking,
          id: bookingBId,
          service_name: "Service B",
          status: "offered",
        },
      });
    const view = render(
      <FixHubProvider>
        <RealBookingHistory detail />
      </FixHubProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Service A")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mocks.request).toHaveBeenCalledTimes(2);

    await act(async () => {
      mocks.routerPath = `/customer/bookings/${bookingBId}`;
      view.rerender(
        <FixHubProvider>
          <RealBookingHistory detail />
        </FixHubProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Service B")).toBeInTheDocument();

    await act(async () => {
      resolveRefreshA({
        booking: {
          ...completedBooking,
          id: bookingAId,
          service_name: "Service A stale",
          status: "offered",
        },
      });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Service B")).toBeInTheDocument();
    expect(screen.queryByText("Service A stale")).not.toBeInTheDocument();
  });
});
