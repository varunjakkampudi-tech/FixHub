import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest, ApiError, hasAuthenticatedApiSession, resolveApiSession } from "@/features/fixhub/api-client";

afterEach(() => vi.unstubAllGlobals());

describe("Fix Hub API client", () => {
  it("uses cookie credentials and sends the CSRF token for mutations", async () => {
    vi.stubGlobal("document", { cookie: "fixhub_csrf=csrf%2Ftoken" });
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "booking-1" }), { status: 201 }));
    vi.stubGlobal("fetch", fetch);

    const result = await apiRequest<{ id: string }>("/api/v1/customer/bookings", { method: "POST", body: "{}" });
    expect(result).toEqual({ id: "booking-1" });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
    expect(new Headers(options.headers).get("x-csrf-token")).toBe("csrf/token");
    expect(new Headers(options.headers).get("content-type")).toBe("application/json");
  });

  it("returns only the safe error envelope and does not leak response internals", async () => {
    const requestId = "f437441e-3772-445d-bc99-3abe5a41307e";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" }, requestId, sql: "secret query" }), { status: 404 })));
    await expect(apiRequest("/api/v1/customer/bookings/missing")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
      message: `Not found (Reference: ${requestId})`,
      requestId,
    } satisfies Partial<ApiError>);
  });

  it("uses only a validated request ID from the response header when the body value is malformed", async () => {
    const requestId = "3ff32010-00ef-4db9-99c4-fe60c8c97e87";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "REQUEST_FAILED", message: "Try again" }, requestId: "<script>" }), {
      status: 500,
      headers: { "x-request-id": requestId },
    })));
    await expect(apiRequest("/api/v1/customer/bookings")).rejects.toMatchObject({
      message: `Try again (Reference: ${requestId})`,
      requestId,
    } satisfies Partial<ApiError>);
  });

  it("does not treat a missing API or expired session as authenticated", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await expect(hasAuthenticatedApiSession()).resolves.toBe(false);
  });

  it("preserves provisioned roles from the authenticated API session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ authenticated: true, roles: ["merchant", 4] }), { status: 200 })));
    await expect(resolveApiSession()).resolves.toEqual({ mode: "authenticated", roles: ["merchant"] });
  });
});
