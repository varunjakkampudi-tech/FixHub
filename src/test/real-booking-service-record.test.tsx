import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  routerPath: "/customer/bookings/00000000-0000-4000-8000-000000000001",
  request: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to?: string }) => <a href={to ?? "#"}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) => select({ location: { pathname: mocks.routerPath } }),
}));

vi.mock("@/features/fixhub/api-client", () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: mocks.request,
}));

vi.mock("@/features/fixhub/shared", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
  Notice: ({ children, error }: { children: React.ReactNode; error?: boolean }) => <div role={error ? "alert" : "status"}>{children}</div>,
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
  mocks.request.mockResolvedValue({ booking: { ...completedBooking, customer_quote_accepted: accepted } });
  return render(<FixHubProvider><RealBookingHistory detail /></FixHubProvider>);
}

afterEach(() => {
  cleanup();
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
    expect(within(record!).queryByText(/Private street address must not appear/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Print / save as PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it("does not offer a service record when current quote consent is absent or stale", async () => {
    renderBooking(false);
    expect(await screen.findByText("Electrical repair")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Service record" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Print / save as PDF" })).not.toBeInTheDocument();
  });
});
