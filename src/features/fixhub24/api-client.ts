export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(requestId ? `${message} (Reference: ${requestId})` : message);
    this.name = "ApiError";
  }
}

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fixhub24_csrf=") || part.startsWith("__Host-fixhub24_csrf="));
  if (!value) return undefined;
  const separator = value.indexOf("=");
  try {
    return decodeURIComponent(value.slice(separator + 1));
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("content-type"))
    headers.set("content-type", "application/json");
  const csrf = csrfToken();
  if (csrf && init.method && init.method.toUpperCase() !== "GET") headers.set("x-csrf-token", csrf);
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : null;
    const details =
      error && typeof error === "object" ? (error as { code?: unknown; message?: unknown }) : {};
    const bodyRequestId =
      body && typeof body === "object" && "requestId" in body
        ? (body as { requestId?: unknown }).requestId
        : undefined;
    const requestId = [bodyRequestId, response.headers.get("x-request-id")]
      .find(
        (value): value is string =>
          typeof value === "string" &&
          /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value.trim()),
      )
      ?.trim();
    throw new ApiError(
      response.status,
      typeof details.code === "string" ? details.code : "REQUEST_FAILED",
      typeof details.message === "string" ? details.message : "The request could not be completed.",
      requestId,
    );
  }
  return body as T;
}

export type ApiSessionMode = "authenticated" | "unauthenticated" | "demo" | "unavailable";
export type ApiSession = { mode: ApiSessionMode; roles: string[] };

export async function resolveApiSession(): Promise<ApiSession> {
  try {
    const response = await fetch("/api/v1/auth/me", {
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (response.status === 404) return { mode: "demo", roles: [] };
    if (response.status === 401) return { mode: "unauthenticated", roles: [] };
    if (!response.ok) return { mode: "unavailable", roles: [] };
    const result = (await response.json()) as { authenticated?: unknown; roles?: unknown };
    const roles = Array.isArray(result.roles)
      ? result.roles.filter((role): role is string => typeof role === "string")
      : [];
    return result.authenticated === true
      ? { mode: "authenticated", roles }
      : { mode: "unavailable", roles: [] };
  } catch {
    return { mode: "unavailable", roles: [] };
  }
}

export async function resolveApiSessionMode(): Promise<ApiSessionMode> {
  return (await resolveApiSession()).mode;
}

export async function hasAuthenticatedApiSession(): Promise<boolean> {
  return (await resolveApiSessionMode()) === "authenticated";
}
