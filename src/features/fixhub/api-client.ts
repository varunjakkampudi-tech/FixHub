export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function csrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("fixhub_csrf=") || part.startsWith("__Host-fixhub_csrf="));
  if (!value) return undefined;
  const separator = value.indexOf("=");
  try { return decodeURIComponent(value.slice(separator + 1)); } catch { return undefined; }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("content-type")) headers.set("content-type", "application/json");
  const csrf = csrfToken();
  if (csrf && init.method && init.method.toUpperCase() !== "GET") headers.set("x-csrf-token", csrf);
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body ? body.error : null;
    const details = error && typeof error === "object" ? error as { code?: unknown; message?: unknown } : {};
    throw new ApiError(
      response.status,
      typeof details.code === "string" ? details.code : "REQUEST_FAILED",
      typeof details.message === "string" ? details.message : "The request could not be completed.",
    );
  }
  return body as T;
}

export type ApiSessionMode = "authenticated" | "unauthenticated" | "demo" | "unavailable";

export async function resolveApiSessionMode(): Promise<ApiSessionMode> {
  try {
    const response = await fetch("/api/v1/auth/me", { credentials: "include", headers: { accept: "application/json" } });
    if (response.status === 404) return "demo";
    if (response.status === 401) return "unauthenticated";
    if (!response.ok) return "unavailable";
    const result = await response.json() as { authenticated?: unknown };
    return result.authenticated === true ? "authenticated" : "unavailable";
  } catch { return "unavailable"; }
}

export async function hasAuthenticatedApiSession(): Promise<boolean> {
  return (await resolveApiSessionMode()) === "authenticated";
}
