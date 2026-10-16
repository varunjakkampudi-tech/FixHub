import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to?: string }) => <a href={to ?? "#"}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) => select({ location: { pathname: "/customer/book/new" } }),
}));

vi.mock("@/features/fixhub/api-client", () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: mocks.request,
}));

vi.mock("@/features/fixhub/shared", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
  Notice: ({ children }: { children: React.ReactNode }) => <div role="status">{children}</div>,
}));

import { RealBookingPage } from "@/features/fixhub/real-booking";
import { FixHubProvider } from "@/features/fixhub/context";

const serviceId = "10000000-0000-4000-8000-000000000001";
const addressId = "20000000-0000-4000-8000-000000000001";

function setupPricePreview(available: boolean) {
  mocks.request.mockImplementation(async (path: string) => {
    if (path === "/api/v1/services") return { items: [{ id: serviceId, name: "Electrical repair", category: "electrician", description: "Electrical repairs" }] };
    if (path === "/api/v1/customer/addresses") return { items: [{ id: addressId, label: "Home", address: "Private address", locality: "Tanuku", latitude: 16.75, longitude: 81.68 }] };
    if (path.startsWith("/api/v1/customer/pricing-preview?")) return {
      available,
      currency: "INR",
      paymentMethod: "cash_on_completion",
      minTotalPaise: available ? 40000 : null,
      maxTotalPaise: available ? 55000 : null,
      partsIncluded: false,
    };
    throw new Error(`Unexpected request: ${path}`);
  });
  return render(<FixHubProvider><RealBookingPage /></FixHubProvider>);
}

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
  localStorage.clear();
});

describe("customer booking price preview", () => {
  it("shows an in-area indicative price range and keeps payment cash-only", async () => {
    setupPricePreview(true);

    expect(await screen.findByRole("heading", { name: "Indicative price in your area" })).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).toContain("₹400 – ₹550"));
    expect(screen.getByText(/not a guaranteed quote/i)).toBeInTheDocument();
    expect(screen.getByText(/Parts may be quoted separately/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cash on completion" })).toBeInTheDocument();
    expect(screen.getAllByText(/No online payment is collected/i)).toHaveLength(2);
    expect(mocks.request).toHaveBeenCalledWith(expect.stringContaining(`/api/v1/customer/pricing-preview?serviceId=${serviceId}&addressId=${addressId}`));
  });

  it("does not invent a price when no verified in-area provider rate is available", async () => {
    setupPricePreview(false);

    expect(await screen.findByText(/No current in-area provider price is available/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("₹400 – ₹550");
  });

  it("clears the selected destination and prior pin when the address is edited", async () => {
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    const position = { coords: { latitude: 16.75, longitude: 81.68 } } as GeolocationPosition;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: (success: PositionCallback) => success(position) },
    });

    try {
      setupPricePreview(true);
      const savedAddress = await screen.findByLabelText("Saved addresses");
      expect(savedAddress).toHaveValue(addressId);

      fireEvent.click(screen.getByRole("button", { name: "Use my current location" }));
      expect(await screen.findByText("Location shared for this service request")).toBeInTheDocument();
      expect(savedAddress).toHaveValue("");
      expect(screen.getByRole("button", { name: "Find eligible providers" })).toBeDisabled();

      fireEvent.change(screen.getByLabelText("Full address"), { target: { value: "A different service address" } });
      expect(screen.queryByText("Location shared for this service request")).not.toBeInTheDocument();
      expect(await screen.findByText(/Address changed\. Share its location again/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Find eligible providers" })).toBeDisabled();
    } finally {
      if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation);
      else Reflect.deleteProperty(navigator, "geolocation");
    }
  });
});
