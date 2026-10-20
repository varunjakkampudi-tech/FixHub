// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { createResendEmailSender, resendConfigFromEnvironment } from "../email";

describe("Resend adapter", () => {
  it("requires the API key and sender to be configured together", () => {
    expect(resendConfigFromEnvironment({})).toBeNull();
    expect(() => resendConfigFromEnvironment({ RESEND_API_KEY: "re_test" })).toThrow();
    expect(() =>
      resendConfigFromEnvironment({
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "noreply@example.test",
      }),
    ).toThrow();
    expect(
      resendConfigFromEnvironment({
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "Fix Hub <noreply@example.test>",
      })?.from,
    ).toBe("Fix Hub <noreply@example.test>");
  });

  it("sends only a fixed-format sign-in email through the configured transport", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    const send = createResendEmailSender(
      { apiKey: "test-secret", from: "Fix Hub <noreply@example.test>" },
      fetch as unknown as typeof globalThis.fetch,
    );
    await send("customer@example.test", "012345");
    const [url, options] = fetch.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toBe("https://api.resend.com/emails");
    expect((options.headers as Record<string, string>).authorization).toBe("Bearer test-secret");
    expect(JSON.parse(String(options.body))).toMatchObject({
      from: "Fix Hub <noreply@example.test>",
      to: ["customer@example.test"],
      subject: "Your Fix Hub sign-in code",
    });
    expect(JSON.stringify(options)).not.toContain("re_test");
  });

  it("converts provider rejection into a generic delivery failure", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response('{"message":"private provider details"}', { status: 401 }));
    const send = createResendEmailSender(
      { apiKey: "test-secret", from: "Fix Hub <noreply@example.test>" },
      fetch as unknown as typeof globalThis.fetch,
    );
    await expect(send("customer@example.test", "012345")).rejects.toThrow("Email delivery failed");
  });

  it("aborts a stalled provider request at the eight-second bound", async () => {
    vi.useFakeTimers();
    try {
      const fetch = vi.fn(
        (_url: URL, options?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () => reject(new Error("request aborted")), {
              once: true,
            });
          }),
      );
      const send = createResendEmailSender(
        { apiKey: "test-secret", from: "Fix Hub <noreply@example.test>" },
        fetch as unknown as typeof globalThis.fetch,
      );
      const sending = send("customer@example.test", "012345");
      const observed = sending.then(
        () => ({ error: null as unknown }),
        (error: unknown) => ({ error }),
      );

      await vi.advanceTimersByTimeAsync(8_000);
      await expect(observed).resolves.toMatchObject({
        error: expect.objectContaining({ message: "request aborted" }),
      });
      expect(fetch).toHaveBeenCalledTimes(1);
      const options = fetch.mock.calls[0]?.[1] as RequestInit | undefined;
      expect(options?.signal?.aborted).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
