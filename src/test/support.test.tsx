import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/features/fixhub/api-client", () => ({
  resolveApiSession: mocks.session,
  apiRequest: mocks.request,
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      _code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/features/fixhub/context", () => ({ useFixHub: () => ({ locale: "en-IN" }) }));
vi.mock("@/features/fixhub/shared", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageTop: ({ title }: { title: string }) => <h1>{title}</h1>,
  Notice: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
import { SupportPage } from "@/features/fixhub/support";
import { ApiError } from "@/features/fixhub/api-client";

const ticket = {
  id: "00000000-0000-4000-8000-000000000001",
  booking_id: null,
  subject: "Synthetic request",
  description: "Synthetic service issue details",
  status: "open",
  response_text: null,
  version: 2,
  created_at: "2026-10-16T12:00:00Z",
};
afterEach(() => {
  cleanup();
  mocks.session.mockReset();
  mocks.request.mockReset();
});

describe("support requests and staff inbox", () => {
  it.each([false, true])(
    "clears private tickets when a write loses permission (staff=%s)",
    async (staff) => {
      mocks.session.mockResolvedValue({
        mode: "authenticated",
        roles: [staff ? "support" : "customer"],
      });
      mocks.request.mockImplementation(async (_path: string, options?: RequestInit) => {
        if (options?.method === "POST")
          throw new ApiError(403, "ROLE_REQUIRED", "Support access revoked");
        return { items: [ticket], nextCursor: null };
      });
      render(<SupportPage staff={staff} />);
      await screen.findByText("Synthetic request");
      if (staff) {
        fireEvent.change(screen.getByLabelText("Reply visible to the requester"), {
          target: { value: "Synthetic staff response" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Save reply and status" }));
      } else {
        fireEvent.change(screen.getByLabelText("Subject"), {
          target: { value: "Another synthetic request" },
        });
        fireEvent.change(screen.getByLabelText("What happened?"), {
          target: { value: "Synthetic follow-up details" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Send request" }));
      }
      expect(await screen.findByRole("alert")).toHaveTextContent("Support access revoked");
      expect(screen.queryByText("Synthetic request")).not.toBeInTheDocument();
    },
  );

  it("retries a failed next page without losing the first page", async () => {
    mocks.session.mockResolvedValue({ mode: "authenticated", roles: ["customer"] });
    let attempts = 0;
    mocks.request.mockImplementation(async (path: string) => {
      if (path.includes("cursor=")) {
        if (++attempts === 1) throw new ApiError(503, "UNAVAILABLE", "Synthetic next-page failure");
        return {
          items: [
            {
              ...ticket,
              id: "00000000-0000-4000-8000-000000000002",
              subject: "Second synthetic request",
            },
          ],
          nextCursor: null,
        };
      }
      return { items: [ticket], nextCursor: "synthetic-cursor" };
    });
    render(<SupportPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Load more requests" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Synthetic next-page failure");
    fireEvent.click(screen.getByRole("button", { name: "Load more requests" }));
    expect(await screen.findByText("Second synthetic request")).toBeInTheDocument();
    expect(screen.getByText("Synthetic request")).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it("clears the private inbox when a refresh loses staff permission", async () => {
    mocks.session.mockResolvedValue({ mode: "authenticated", roles: ["support"] });
    mocks.request
      .mockResolvedValueOnce({ items: [ticket], nextCursor: null })
      .mockRejectedValue(new ApiError(403, "ROLE_REQUIRED", "Staff access revoked"));
    render(<SupportPage staff />);
    await screen.findByText("Synthetic request");
    fireEvent.click(screen.getByRole("button", { name: "Refresh requests" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Staff access revoked");
    expect(screen.queryByText("Synthetic request")).not.toBeInTheDocument();
  });

  it("requires sign-in instead of presenting a fake contact success", async () => {
    mocks.session.mockResolvedValue({ mode: "unauthenticated", roles: [] });
    render(<SupportPage />);
    expect(
      await screen.findByRole("link", { name: "Sign in to request help with your account" }),
    ).toHaveAttribute("href", "/sign-in");
    expect(screen.queryByRole("button", { name: "Send request" })).not.toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("never calls the staff API for a customer session", async () => {
    mocks.session.mockResolvedValue({ mode: "authenticated", roles: ["customer"] });
    render(<SupportPage staff />);
    expect(await screen.findByText(/cannot access this support view/)).toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it("reuses the same retry key after an uncertain create failure and confirms only a server receipt", async () => {
    mocks.session.mockResolvedValue({ mode: "authenticated", roles: ["merchant"] });
    let attempts = 0;
    mocks.request.mockImplementation(async (_path: string, options?: RequestInit) => {
      if (options?.method === "POST") {
        if (++attempts === 1) throw new ApiError(503, "UNAVAILABLE", "Temporary support failure");
        return { ticket };
      }
      return { items: [], nextCursor: null };
    });
    render(<SupportPage />);
    fireEvent.change(await screen.findByLabelText("Subject"), {
      target: { value: "Synthetic request" },
    });
    fireEvent.change(screen.getByLabelText("What happened?"), {
      target: { value: "Synthetic service issue details" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Temporary support failure");
    expect(screen.queryByText(/Request recorded/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    expect(await screen.findByText(/Request recorded/)).toHaveTextContent(ticket.id);
    const posts = mocks.request.mock.calls.filter(([, options]) => options?.method === "POST");
    expect(posts).toHaveLength(2);
    expect(posts[0][1].headers["Idempotency-Key"]).toBe(posts[1][1].headers["Idempotency-Key"]);
    expect(screen.getByLabelText("Subject")).toHaveValue("");
  });

  it("shows the requester's latest staff reply as text", async () => {
    mocks.session.mockResolvedValue({ mode: "authenticated", roles: ["customer"] });
    mocks.request.mockResolvedValue({
      items: [{ ...ticket, status: "resolved", response_text: "<script>synthetic</script>" }],
      nextCursor: null,
    });
    render(<SupportPage />);
    expect(await screen.findByText("<script>synthetic</script>")).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText(/Resolved/)).toBeInTheDocument();
  });

  it("submits a staff reply with the displayed version and preserves conflicts", async () => {
    mocks.session.mockResolvedValue({ mode: "authenticated", roles: ["support"] });
    mocks.request.mockImplementation(async (_path: string, options?: RequestInit) => {
      if (options?.method === "POST")
        throw new ApiError(409, "SUPPORT_VERSION_CONFLICT", "Refresh before replying.");
      return { items: [ticket], nextCursor: null };
    });
    render(<SupportPage staff />);
    fireEvent.change(await screen.findByLabelText("Reply visible to the requester"), {
      target: { value: "Synthetic staff response" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save reply and status" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Refresh before replying.");
    const post = mocks.request.mock.calls.find(([, options]) => options?.method === "POST");
    expect(JSON.parse(post?.[1].body)).toEqual({
      response: "Synthetic staff response",
      status: "in_review",
      expectedVersion: 2,
    });
    expect(screen.getByLabelText("Reply visible to the requester")).toHaveValue(
      "Synthetic staff response",
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save reply and status" })).toBeEnabled(),
    );
  });
});
