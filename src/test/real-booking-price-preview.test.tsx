import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to?: string }) => (
    <a href={to ?? "#"}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: "/customer/book/new" } }),
}));

vi.mock("@/features/fixhub24/api-client", () => ({
  ApiError: class ApiError extends Error {},
  apiRequest: mocks.request,
}));

vi.mock("@/features/fixhub24/shared", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
  Notice: ({ children }: { children: React.ReactNode }) => <div role="status">{children}</div>,
}));

import { RealBookingPage } from "@/features/fixhub24/real-booking";
import { FixHub24Provider } from "@/features/fixhub24/context";

const serviceId = "10000000-0000-4000-8000-000000000001";
const addressId = "20000000-0000-4000-8000-000000000001";
const alternateAddressId = "20000000-0000-4000-8000-000000000002";

function setupPricePreview(available: boolean) {
  mocks.request.mockImplementation(async (path: string, options?: RequestInit) => {
    if (path === "/api/v1/services")
      return {
        items: [
          {
            id: serviceId,
            name: "Electrical repair",
            category: "electrician",
            description: "Electrical repairs",
          },
        ],
      };
    if (path === "/api/v1/customer/addresses" && options?.method === "POST")
      return {
        item: { id: "30000000-0000-4000-8000-000000000001", ...JSON.parse(String(options.body)) },
      };
    if (path === "/api/v1/customer/addresses")
      return {
        items: [
          {
            id: addressId,
            label: "Home",
            address: "Private address",
            locality: "Tanuku",
            latitude: 16.75,
            longitude: 81.68,
          },
        ],
      };
    if (path.startsWith("/api/v1/customer/pricing-preview?"))
      return {
        available,
        currency: "INR",
        paymentMethod: "cash_on_completion",
        minTotalPaise: available ? 40000 : null,
        maxTotalPaise: available ? 55000 : null,
        partsIncluded: false,
      };
    throw new Error(`Unexpected request: ${path}`);
  });
  return render(
    <FixHub24Provider>
      <RealBookingPage />
    </FixHub24Provider>,
  );
}

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
  localStorage.clear();
});

describe("customer booking price preview", () => {
  it("blocks saving an older pin while a new location lookup is pending", async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    let finish!: PositionCallback;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          finish = success;
        },
      },
    });
    try {
      setupPricePreview(true);
      fireEvent.change(await screen.findByLabelText("Saved addresses"), { target: { value: "" } });
      fireEvent.change(screen.getByLabelText("Full address"), {
        target: { value: "12 Synthetic Street" },
      });
      fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "16.75" } });
      fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "81.68" } });
      const save = screen.getByRole("button", { name: "Save address and location" });
      expect(save).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Use my current location" }));
      expect(save).toBeDisabled();
      fireEvent.click(save);
      expect(mocks.request.mock.calls.some(([, options]) => options?.method === "POST")).toBe(
        false,
      );
      act(() => finish({ coords: { latitude: 16.76, longitude: 81.69 } } as GeolocationPosition));
      expect(save).toBeEnabled();
      const pin = screen.getByRole("link", { name: "Check this pin in Google Maps" });
      expect(new URL(pin.getAttribute("href")!).searchParams.get("query")).toBe("16.76,81.69");
      expect(pin).toHaveAttribute("rel", "noopener noreferrer");
    } finally {
      if (previous) Object.defineProperty(navigator, "geolocation", previous);
      else Reflect.deleteProperty(navigator, "geolocation");
    }
  });

  it("blocks submitting a saved address while replacement GPS coordinates are pending", async () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: vi.fn() },
    });
    try {
      setupPricePreview(true);
      fireEvent.change(await screen.findByLabelText("Saved addresses"), {
        target: { value: addressId },
      });
      fireEvent.change(screen.getByLabelText("Service"), { target: { value: serviceId } });
      const submit = screen.getByRole("button", { name: "Find eligible providers" });
      expect(submit).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "Use my current location" }));
      expect(submit).toBeDisabled();
      expect(
        screen.queryByRole("link", { name: "Check this pin in Google Maps" }),
      ).not.toBeInTheDocument();
    } finally {
      if (previous) Object.defineProperty(navigator, "geolocation", previous);
      else Reflect.deleteProperty(navigator, "geolocation");
    }
  });

  it("keeps address inputs fixed until a pending save finishes", async () => {
    setupPricePreview(true);
    fireEvent.change(await screen.findByLabelText("Saved addresses"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Full address"), {
      target: { value: "12 Synthetic Street" },
    });
    fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "16.75" } });
    fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "81.68" } });
    let finish!: (value: unknown) => void;
    const implementation = mocks.request.getMockImplementation()!;
    mocks.request.mockImplementation((path: string, options?: RequestInit) =>
      path === "/api/v1/customer/addresses" && options?.method === "POST"
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : implementation(path, options),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save address and location" }));
    for (const name of [
      "Full address",
      "Address label",
      "Locality / town",
      "Saved addresses",
      "Latitude",
      "Longitude",
    ]) {
      expect(screen.getByLabelText(name)).toBeDisabled();
    }
    await act(async () =>
      finish({
        item: {
          id: "30000000-0000-4000-8000-000000000001",
          label: "Home",
          address: "12 Synthetic Street",
          locality: "Tanuku",
          latitude: 16.75,
          longitude: 81.68,
        },
      }),
    );
    expect(screen.getByLabelText("Full address")).toBeEnabled();
    expect(screen.getByLabelText("Saved addresses")).toHaveValue(
      "30000000-0000-4000-8000-000000000001",
    );
  });

  it("shows accessible loading placeholders until services and saved addresses are ready", async () => {
    let resolveServices!: (value: {
      items: { id: string; name: string; category: string; description: string }[];
    }) => void;
    let resolveAddresses!: (value: {
      items: {
        id: string;
        label: string;
        address: string;
        locality: string;
        latitude: number;
        longitude: number;
      }[];
    }) => void;
    mocks.request.mockImplementation((path: string) => {
      if (path === "/api/v1/services")
        return new Promise((resolve) => {
          resolveServices = resolve;
        });
      if (path === "/api/v1/customer/addresses")
        return new Promise((resolve) => {
          resolveAddresses = resolve;
        });
      if (path.startsWith("/api/v1/customer/pricing-preview?"))
        return Promise.resolve({
          available: false,
          currency: "INR",
          paymentMethod: "cash_on_completion",
          minTotalPaise: null,
          maxTotalPaise: null,
          partsIncluded: false,
        });
      throw new Error(`Unexpected request: ${path}`);
    });

    render(
      <FixHub24Provider>
        <RealBookingPage />
      </FixHub24Provider>,
    );
    expect(screen.getByRole("status", { name: "Loading services" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("status", { name: "Loading saved addresses" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.queryByRole("combobox", { name: "Service" })).not.toBeInTheDocument();

    await act(async () => {
      resolveServices({
        items: [
          {
            id: serviceId,
            name: "Electrical repair",
            category: "electrician",
            description: "Electrical repairs",
          },
        ],
      });
      resolveAddresses({
        items: [
          {
            id: addressId,
            label: "Home",
            address: "Private address",
            locality: "Tanuku",
            latitude: 16.75,
            longitude: 81.68,
          },
        ],
      });
    });

    expect(await screen.findByRole("combobox", { name: "Service" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading services" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading saved addresses" }),
    ).not.toBeInTheDocument();
  });

  it("shows an in-area indicative price range and keeps payment cash-only", async () => {
    setupPricePreview(true);

    expect(
      await screen.findByRole("heading", { name: "Indicative price in your area" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(document.body.textContent).toContain("₹400 – ₹550"));
    expect(screen.getByText(/not a guaranteed quote/i)).toBeInTheDocument();
    expect(screen.getByText(/Parts may be quoted separately/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cash on completion" })).toBeInTheDocument();
    expect(screen.getAllByText(/No online payment is collected/i)).toHaveLength(2);
    expect(mocks.request).toHaveBeenCalledWith(
      expect.stringContaining(
        `/api/v1/customer/pricing-preview?serviceId=${serviceId}&addressId=${addressId}`,
      ),
    );
  });

  it("does not invent a price when no verified in-area provider rate is available", async () => {
    setupPricePreview(false);

    expect(
      await screen.findByText(/No current in-area provider price is available/i),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("₹400 – ₹550");
  });

  it("submits a selected saved address and announces a reduced-motion-aware pending state", async () => {
    let resolveBooking!: (value: { booking: { id: string } }) => void;
    mocks.request.mockImplementation((path: string, options?: RequestInit) => {
      if (path === "/api/v1/services")
        return Promise.resolve({
          items: [
            {
              id: serviceId,
              name: "Electrical repair",
              category: "electrician",
              description: "Electrical repairs",
            },
          ],
        });
      if (path === "/api/v1/customer/addresses")
        return Promise.resolve({
          items: [
            {
              id: addressId,
              label: "Home",
              address: "Private address",
              locality: "Tanuku",
              latitude: 16.75,
              longitude: 81.68,
            },
            {
              id: alternateAddressId,
              label: "Work",
              address: "Second private address",
              locality: "Velpur",
              latitude: 16.72,
              longitude: 81.69,
            },
          ],
        });
      if (path.startsWith("/api/v1/customer/pricing-preview?"))
        return Promise.resolve({
          available: true,
          currency: "INR",
          paymentMethod: "cash_on_completion",
          minTotalPaise: 40000,
          maxTotalPaise: 55000,
          partsIncluded: false,
        });
      if (path === "/api/v1/customer/bookings" && options?.method === "POST")
        return new Promise((resolve) => {
          resolveBooking = resolve;
        });
      throw new Error(`Unexpected request: ${path}`);
    });

    render(
      <FixHub24Provider>
        <RealBookingPage />
      </FixHub24Provider>,
    );
    const submit = await screen.findByRole("button", { name: "Find eligible providers" });
    expect(screen.getByLabelText("Full address")).toHaveValue("Private address");
    expect(screen.getByLabelText("Locality / town")).toHaveValue("Tanuku");
    expect(screen.getByLabelText("Latitude")).toHaveValue(16.75);
    fireEvent.change(screen.getByLabelText("Saved addresses"), {
      target: { value: alternateAddressId },
    });
    expect(screen.getByLabelText("Full address")).toHaveValue("Second private address");
    expect(screen.getByLabelText("Locality / town")).toHaveValue("Velpur");
    expect(screen.getByLabelText("Longitude")).toHaveValue(81.69);
    expect(screen.getByRole("button", { name: "Address saved" })).toBeDisabled();
    fireEvent.click(submit);

    const progress = await screen.findByRole("status");
    expect(progress).toHaveTextContent("Sending your request. Please wait.");
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-label", "Request in progress");
    expect(submit.querySelector("svg")).toHaveClass("animate-spin", "motion-reduce:animate-none");
    expect(submit.closest("form")).toHaveAttribute("aria-busy", "true");
    expect(mocks.request).toHaveBeenCalledWith(
      "/api/v1/customer/bookings",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ serviceId, addressId: alternateAddressId, note: "" }),
      }),
    );

    await act(async () => {
      resolveBooking({ booking: { id: "30000000-0000-4000-8000-000000000001" } });
    });
    await waitFor(() => expect(submit.closest("form")).toHaveAttribute("aria-busy", "false"));
    expect(screen.queryByText("Sending your request. Please wait.")).not.toBeInTheDocument();
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
      expect(
        await screen.findByText("Location pin set for this service request"),
      ).toBeInTheDocument();
      expect(savedAddress).toHaveValue("");
      expect(screen.getByRole("button", { name: "Find eligible providers" })).toBeDisabled();

      fireEvent.change(screen.getByLabelText("Full address"), {
        target: { value: "A different service address" },
      });
      expect(
        screen.queryByText("Location pin set for this service request"),
      ).not.toBeInTheDocument();
      expect(
        await screen.findByText(/Address changed\. Share its location again/i),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Find eligible providers" })).toBeDisabled();
    } finally {
      if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation);
      else Reflect.deleteProperty(navigator, "geolocation");
    }
  });

  it("shows location lookup progress and ignores a late GPS result after the address changes", async () => {
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    let resolvePosition: PositionCallback | undefined;
    const position = { coords: { latitude: 16.75, longitude: 81.68 } } as GeolocationPosition;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          resolvePosition = success;
        },
      },
    });

    try {
      setupPricePreview(true);
      await screen.findByLabelText("Saved addresses");
      const locationButton = screen.getByRole("button", { name: "Use my current location" });
      fireEvent.click(locationButton);

      expect(await screen.findByRole("button", { name: "Finding your location…" })).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your location is not saved unless you choose “Save address and location.”",
      );

      fireEvent.change(screen.getByLabelText("Full address"), {
        target: { value: "A different service address" },
      });
      expect(screen.getByRole("button", { name: "Use my current location" })).toBeEnabled();
      expect(screen.queryByText("Finding your location…")).not.toBeInTheDocument();

      expect(resolvePosition).toBeDefined();
      act(() => resolvePosition?.(position));
      expect(screen.getByLabelText("Full address")).toHaveValue("A different service address");
      expect(screen.getByLabelText("Latitude")).toHaveValue(null);
      expect(
        screen.queryByText("Location pin set for this service request"),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Address changed. Share its location again",
      );
    } finally {
      if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation);
      else Reflect.deleteProperty(navigator, "geolocation");
    }
  });

  it("allows a manually entered coordinate pair when geolocation permission is denied", async () => {
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, "geolocation");
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (_success: PositionCallback, failure: PositionErrorCallback) =>
          failure({
            code: 1,
            message: "denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError),
      },
    });

    try {
      setupPricePreview(true);
      const savedAddress = await screen.findByLabelText("Saved addresses");
      fireEvent.change(screen.getByLabelText("Full address"), {
        target: { value: "12 Test Street" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Use my current location" }));
      expect(await screen.findByText(/Location permission was not granted/i)).toBeInTheDocument();

      const saveButton = screen.getByRole("button", { name: "Save address and location" });
      expect(saveButton).toBeDisabled();
      fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "91" } });
      fireEvent.change(screen.getByLabelText("Longitude"), { target: { value: "81.68" } });
      expect(saveButton).toBeDisabled();
      fireEvent.change(screen.getByLabelText("Latitude"), { target: { value: "16.75" } });
      expect(saveButton).toBeEnabled();
      fireEvent.click(saveButton);

      await waitFor(() =>
        expect(mocks.request).toHaveBeenCalledWith(
          "/api/v1/customer/addresses",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              label: "Home",
              address: "12 Test Street",
              locality: "Tanuku",
              latitude: 16.75,
              longitude: 81.68,
            }),
          }),
        ),
      );
      await waitFor(() => expect(savedAddress).toHaveValue("30000000-0000-4000-8000-000000000001"));
    } finally {
      if (originalGeolocation) Object.defineProperty(navigator, "geolocation", originalGeolocation);
      else Reflect.deleteProperty(navigator, "geolocation");
    }
  });
});
