// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  createTwilioBookingNotificationSender,
  createTwilioWhatsAppSender,
  twilioConfigFromEnvironment,
} from "../twilio";

const config = {
  accountSid: `AC${"a".repeat(32)}`,
  apiKey: `SK${"b".repeat(32)}`,
  apiSecret: "c".repeat(40),
  from: "whatsapp:+14155238886",
  contentSid: `HX${"d".repeat(32)}`,
};

describe("Twilio WhatsApp adapter", () => {
  it("requires complete credentials, a WhatsApp sender, and a content template", () => {
    expect(twilioConfigFromEnvironment({})).toBeNull();
    expect(() => twilioConfigFromEnvironment({ TWILIO_ACCOUNT_SID: config.accountSid })).toThrow();
    expect(
      twilioConfigFromEnvironment({
        TWILIO_ACCOUNT_SID: config.accountSid,
        TWILIO_API_KEY_SID: config.apiKey,
        TWILIO_API_KEY_SECRET: config.apiSecret,
        TWILIO_WHATSAPP_FROM: config.from,
        TWILIO_WHATSAPP_CONTENT_SID: config.contentSid,
      }),
    ).toEqual(config);
    expect(
      twilioConfigFromEnvironment({
        TWILIO_ACCOUNT_SID: config.accountSid,
        TWILIO_API_KEY_SID: config.apiKey,
        TWILIO_API_KEY_SECRET: config.apiSecret,
        TWILIO_WHATSAPP_FROM: config.from,
        TWILIO_WHATSAPP_CONTENT_SID: "",
        TWILIO_WHATSAPP_VERIFICATION_CONTENT_SID: config.contentSid,
      }),
    ).toEqual(config);
  });

  it("sends a mocked approved-template request using Twilio's form API and Basic auth", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sid: `SM${"e".repeat(32)}`, status: "queued" }), {
        status: 201,
      }),
    );
    const send = createTwilioWhatsAppSender(config, fetch as unknown as typeof globalThis.fetch);
    const result = await send({
      toE164: "+919876543210",
      variables: { "1": "REF-123", "2": "Tanuku" },
    });
    expect(result).toEqual({ messageSid: `SM${"e".repeat(32)}`, status: "queued" });
    const [url, options] = fetch.mock.calls[0] as [URL, RequestInit];
    expect(url.href).toBe(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    );
    const headers = new Headers(options.headers);
    expect(headers.get("authorization")).toBe(
      `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
    );
    const form = new URLSearchParams(String(options.body));
    expect(form.get("From")).toBe(config.from);
    expect(form.get("To")).toBe("whatsapp:+919876543210");
    expect(form.get("ContentSid")).toBe(config.contentSid);
    expect(JSON.parse(form.get("ContentVariables") ?? "{}")).toEqual({
      "1": "REF-123",
      "2": "Tanuku",
    });
    expect(JSON.stringify(options)).not.toContain(config.apiSecret);
  });

  it("allows the verification flow to use its dedicated approved template", async () => {
    const verificationSid = `HX${"f".repeat(32)}`;
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ sid: `SM${"e".repeat(32)}`, status: "queued" }), {
        status: 201,
      }),
    );
    const send = createTwilioWhatsAppSender(
      config,
      fetch as unknown as typeof globalThis.fetch,
      verificationSid,
    );
    await send({ toE164: "+919876543210", variables: { "1": "123456" } });
    const [, options] = fetch.mock.calls[0] as [URL, RequestInit];
    expect(new URLSearchParams(String(options.body)).get("ContentSid")).toBe(verificationSid);
    expect(new URLSearchParams(String(options.body)).get("ContentSid")).not.toBe(config.contentSid);
  });

  it("rejects invalid recipients and never exposes provider rejection details", async () => {
    const failedFetch = vi
      .fn()
      .mockResolvedValue(new Response("provider secret detail", { status: 401 }));
    const send = createTwilioWhatsAppSender(
      config,
      failedFetch as unknown as typeof globalThis.fetch,
    );
    await expect(send({ toE164: "1234", variables: { "1": "x" } })).rejects.toThrow("E.164");
    expect(failedFetch).not.toHaveBeenCalled();
    await expect(send({ toE164: "+919876543210", variables: { "1": "x" } })).rejects.toThrow(
      "WhatsApp provider request failed",
    );
  });

  it("selects separate templates for booking context and status without relying on placeholder defaults", async () => {
    const fetch = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ sid: `SM${"e".repeat(32)}`, status: "queued" }), {
          status: 201,
        }),
    );
    const statusSid = `HX${"f".repeat(32)}`;
    const send = createTwilioBookingNotificationSender(
      config,
      { contextContentSid: config.contentSid, statusContentSid: statusSid },
      fetch,
    );
    const payloads: Record<string, string>[] = [
      { "1": "New service request", "2": "Plumbing", "3": "Tanuku" },
      { "1": "Provider accepted" },
    ];
    for (const variables of payloads) {
      await send("+919876543210", variables);
    }
    expect(
      fetch.mock.calls.map(([, options]) =>
        new URLSearchParams(String(options.body)).get("ContentSid"),
      ),
    ).toEqual([config.contentSid, statusSid]);
    expect(
      fetch.mock.calls.map(([, options]) =>
        JSON.parse(new URLSearchParams(String(options.body)).get("ContentVariables") ?? "{}"),
      ),
    ).toEqual(payloads);
    await expect(send("+919876543210", { "1": "Status", "2": "Unexpected" })).rejects.toThrow(
      "template fields",
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(() =>
      createTwilioBookingNotificationSender(
        config,
        { contextContentSid: config.contentSid, statusContentSid: config.contentSid },
        fetch,
      ),
    ).toThrow("distinct");
  });

  it.each(["", "   ", "line\nbreak", "tab\tvalue", "five     spaces"])(
    "rejects invalid template value %j before sending",
    async (value) => {
      const fetch = vi.fn();
      const send = createTwilioWhatsAppSender(config, fetch);
      await expect(send({ toE164: "+919876543210", variables: { "1": value } })).rejects.toThrow(
        "template variables",
      );
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
