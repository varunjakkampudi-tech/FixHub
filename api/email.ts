import { z } from "zod";

const resendResponse = z.object({ id: z.string().min(1) }).passthrough();

export type ResendConfig = { apiKey: string; from: string; apiBaseUrl?: string };

export function resendConfigFromEnvironment(environment: NodeJS.ProcessEnv): ResendConfig | null {
  const apiKey = environment.RESEND_API_KEY;
  const from = environment.RESEND_FROM_EMAIL;
  if (!apiKey && !from) return null;
  if (!apiKey || !from)
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured together");
  if (!/^.+<[^<>\s@]+@[^<>\s@]+>$/.test(from))
    throw new Error("RESEND_FROM_EMAIL must use the format Name <address@example.com>");
  return { apiKey, from, apiBaseUrl: environment.RESEND_API_BASE_URL };
}

export function createResendEmailSender(config: ResendConfig, fetchImpl: typeof fetch = fetch) {
  const base = config.apiBaseUrl ?? "https://api.resend.com";
  const endpoint = new URL("/emails", base);
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost")
    throw new Error("Resend endpoint must use HTTPS");

  return async (recipient: string, code: string): Promise<void> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const result = await fetchImpl(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: config.from,
          to: [recipient],
          subject: "Your Fix Hub sign-in code",
          text: `Your Fix Hub sign-in code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this message.`,
          tags: [{ name: "purpose", value: "sign-in" }],
        }),
      });
      const body = await result.json().catch(() => null);
      if (!result.ok || !resendResponse.safeParse(body).success)
        throw new Error("Email delivery failed");
    } finally {
      clearTimeout(timeout);
    }
  };
}
