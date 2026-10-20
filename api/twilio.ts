import { z } from "zod";

const accountSidPattern = /^AC[0-9a-fA-F]{32}$/;
const apiKeyPattern = /^SK[0-9a-fA-F]{32}$/;
const contentSidPattern = /^HX[0-9a-fA-F]{32}$/;
const e164Pattern = /^\+[1-9]\d{7,14}$/;
const twilioMessage = z
  .object({ sid: z.string().regex(/^SM[0-9a-fA-F]{32}$/), status: z.string().min(1).max(32) })
  .passthrough();

export type TwilioWhatsAppConfig = {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
  from: string;
  contentSid: string;
};

export type WhatsAppMessage = {
  toE164: string;
  variables: Record<string, string>;
};

export function twilioConfigFromEnvironment(
  environment: NodeJS.ProcessEnv,
): TwilioWhatsAppConfig | null {
  const accountSid = environment.TWILIO_ACCOUNT_SID;
  const apiKey = environment.TWILIO_API_KEY_SID;
  const apiSecret = environment.TWILIO_API_KEY_SECRET;
  const from = environment.TWILIO_WHATSAPP_FROM;
  const contentSid =
    environment.TWILIO_WHATSAPP_CONTENT_SID ||
    environment.TWILIO_WHATSAPP_VERIFICATION_CONTENT_SID ||
    environment.TWILIO_WHATSAPP_SERVICE_CONTENT_SID;
  if (
    ![
      accountSid,
      apiKey,
      apiSecret,
      from,
      contentSid,
      environment.TWILIO_WHATSAPP_VERIFICATION_CONTENT_SID,
      environment.TWILIO_WHATSAPP_SERVICE_CONTENT_SID,
    ].some(Boolean)
  )
    return null;
  if (!accountSid || !apiKey || !apiSecret || !from || !contentSid)
    throw new Error(
      "Twilio WhatsApp credentials, sender and approved content template must be configured together",
    );
  if (!accountSidPattern.test(accountSid) || !apiKeyPattern.test(apiKey) || apiSecret.length < 32)
    throw new Error("Twilio credentials are malformed");
  if (!/^whatsapp:\+[1-9]\d{7,14}$/.test(from) || !contentSidPattern.test(contentSid))
    throw new Error("Twilio WhatsApp sender or Content SID is malformed");
  return { accountSid, apiKey, apiSecret, from, contentSid };
}

export function createTwilioWhatsAppSender(
  config: TwilioWhatsAppConfig,
  fetchImpl: typeof fetch = fetch,
  contentSid = config.contentSid,
) {
  if (
    !accountSidPattern.test(config.accountSid) ||
    !apiKeyPattern.test(config.apiKey) ||
    config.apiSecret.length < 32 ||
    !/^whatsapp:\+[1-9]\d{7,14}$/.test(config.from) ||
    !contentSidPattern.test(contentSid)
  ) {
    throw new Error("Twilio WhatsApp configuration is invalid");
  }
  const endpoint = new URL(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
  );
  return async ({
    toE164,
    variables,
  }: WhatsAppMessage): Promise<{ messageSid: string; status: string }> => {
    if (!e164Pattern.test(toE164)) throw new Error("WhatsApp recipient must be an E.164 number");
    const entries = Object.entries(variables);
    if (
      entries.length < 1 ||
      entries.length > 10 ||
      entries.some(
        ([key, value]) =>
          !/^\d{1,2}$/.test(key) ||
          typeof value !== "string" ||
          !value.trim() ||
          value.length > 500 ||
          /[\u0000-\u001f\u007f-\u009f]| {5}/u.test(value),
      )
    ) {
      throw new Error("WhatsApp template variables are invalid");
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const form = new URLSearchParams({
        From: config.from,
        To: `whatsapp:${toE164}`,
        ContentSid: contentSid,
        ContentVariables: JSON.stringify(variables),
      });
      const authorization = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
      const response = await fetchImpl(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          authorization: `Basic ${authorization}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form,
      });
      const body = await response.json().catch(() => null);
      const parsed = twilioMessage.safeParse(body);
      if (!response.ok || !parsed.success) throw new Error("WhatsApp provider request failed");
      return { messageSid: parsed.data.sid, status: parsed.data.status };
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function createTwilioBookingNotificationSender(
  config: TwilioWhatsAppConfig,
  templates: { contextContentSid: string; statusContentSid: string },
  fetchImpl: typeof fetch = fetch,
) {
  if (templates.contextContentSid === templates.statusContentSid)
    throw new Error("Booking context and status require distinct approved templates");
  const sendContext = createTwilioWhatsAppSender(config, fetchImpl, templates.contextContentSid);
  const sendStatus = createTwilioWhatsAppSender(config, fetchImpl, templates.statusContentSid);
  return async (toE164: string, variables: Record<string, string>) => {
    const fields = Object.keys(variables).sort().join(",");
    if (fields === "1,2,3") return sendContext({ toE164, variables });
    if (fields === "1") return sendStatus({ toE164, variables });
    throw new Error("Booking notification template fields are invalid");
  };
}
