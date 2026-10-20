import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn(), navigate: vi.fn(), resolveMode: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to?: string }) => (
    <a href={to ?? "#"}>{children}</a>
  ),
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/features/fixhub24/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(_status: number, _code: string, message: string) {
      super(message);
    }
  },
  apiRequest: mocks.request,
  resolveApiSessionMode: mocks.resolveMode,
}));

vi.mock("@/features/fixhub24/context", () => ({ useFixHub24: () => ({ locale: "en-IN" }) }));

vi.mock("@/features/fixhub24/shared", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
  Notice: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { RealAuth } from "@/features/fixhub24/real-auth";
import { AccountPage } from "@/features/fixhub24/account";
import { ApiError } from "@/features/fixhub24/api-client";

afterEach(() => {
  cleanup();
  mocks.request.mockReset();
  mocks.navigate.mockReset();
  mocks.resolveMode.mockReset();
});

describe("passwordless email sign-in", () => {
  it("resends a code to the same email and keeps the code-entry step open", async () => {
    mocks.request.mockResolvedValue({
      message: "If this address can receive sign-in messages, a code has been sent.",
    });
    render(<RealAuth />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
    expect(await screen.findByLabelText("Six-digit code")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByLabelText("Six-digit code"));
    expect(mocks.request).toHaveBeenNthCalledWith(
      1,
      "/api/v1/auth/code",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "person@example.test" }),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(2));
    expect(mocks.request).toHaveBeenNthCalledWith(
      2,
      "/api/v1/auth/code",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "person@example.test" }),
      }),
    );
    expect(screen.getByLabelText("Six-digit code")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use a different email" })).toBeInTheDocument();
  });

  it("shows the server rate-limit message when another code cannot be sent", async () => {
    mocks.request
      .mockResolvedValueOnce({ message: "A code has been sent." })
      .mockRejectedValueOnce(
        new ApiError(429, "RATE_LIMITED", "Too many sign-in attempts. Please try again later."),
      );
    render(<RealAuth />);

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
    fireEvent.click(await screen.findByRole("button", { name: "Resend code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many sign-in attempts. Please try again later.",
    );
    expect(screen.getByLabelText("Six-digit code")).toBeInTheDocument();
  });
});

describe("account deletion request", () => {
  it("announces progress while recording the request without implying records were erased", async () => {
    mocks.resolveMode.mockResolvedValue("authenticated");
    let finishRequest: ((result: { requestId: string }) => void) | undefined;
    mocks.request.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishRequest = resolve;
        }),
    );
    render(<AccountPage page="settings/delete-account" />);

    fireEvent.click(await screen.findByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Submit deletion request" }));

    const busyButton = await screen.findByRole("button", { name: "Recording…" });
    expect(busyButton).toBeDisabled();
    expect(busyButton).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent(
      "This does not confirm that records have been deleted.",
    );

    await act(async () => finishRequest?.({ requestId: "synthetic-request-1" }));
    expect(
      await screen.findByText(
        /Request synthetic-request-1 is recorded and account access is disabled/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not confirmation that all records have been deleted/),
    ).toBeInTheDocument();
  });
});
