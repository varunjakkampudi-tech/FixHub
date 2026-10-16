import "dotenv/config";

import { z } from "zod";

import { createApiApp } from "./app";
import { authConfigFromEnvironment } from "./auth";
import { createDatabasePool } from "./database";
import { createResendEmailSender, resendConfigFromEnvironment } from "./email";
import { applyMigrations } from "./migrations";
import { createTwilioWhatsAppSender, twilioConfigFromEnvironment } from "./twilio";
import { whatsappContactEncryptionKeyFromEnvironment } from "./whatsapp-contact";
import { createNotificationOutboxDispatcher } from "./notification-outbox";

const port = z.coerce.number().int().min(1).max(65535).safeParse(process.env.API_PORT ?? "4000");
if (!port.success) throw new Error("API_PORT must be an integer between 1 and 65535");

const host = process.env.API_HOST ?? "127.0.0.1";
const production = process.env.NODE_ENV === "production";
const databasePool = createDatabasePool(process.env, (code) => console.error("Database pool error", { code }));
const authConfig = authConfigFromEnvironment(process.env);
const resendConfig = resendConfigFromEnvironment(process.env);
const verificationEnabled = process.env.FIXHUB_WHATSAPP_VERIFICATION_ENABLED === "true";
const notificationsEnabled = process.env.FIXHUB_WHATSAPP_NOTIFICATIONS_ENABLED === "true";
const whatsappEnabled = verificationEnabled || notificationsEnabled;
const twilioConfig = whatsappEnabled ? twilioConfigFromEnvironment(process.env) : null;
const whatsappEncryptionKey = whatsappEnabled ? whatsappContactEncryptionKeyFromEnvironment(process.env) : null;
const whatsappHmacSecret = whatsappEnabled ? process.env.WHATSAPP_CONTACT_HMAC_SECRET : undefined;
const verificationContentSid = process.env.TWILIO_WHATSAPP_VERIFICATION_CONTENT_SID;
const serviceContentSid = process.env.TWILIO_WHATSAPP_SERVICE_CONTENT_SID;
if (whatsappEnabled && (!twilioConfig || !whatsappEncryptionKey || !whatsappHmacSecret || !whatsappHmacSecret.trim() || Buffer.byteLength(whatsappHmacSecret, "utf8") < 32 ||
    (verificationEnabled && (!verificationContentSid || !/^HX[0-9a-fA-F]{32}$/.test(verificationContentSid))) ||
    (notificationsEnabled && (!serviceContentSid || !/^HX[0-9a-fA-F]{32}$/.test(serviceContentSid))))) {
  throw new Error("WhatsApp enablement requires complete credentials, the enabled feature's approved templates, and contact-protection keys");
}
if (production && (!databasePool || !authConfig || !resendConfig)) {
  throw new Error("Production startup requires PostgreSQL, AUTH_HMAC_SECRET, and Resend credentials");
}

if (databasePool) await applyMigrations(databasePool);
const sendAuthEmail = resendConfig ? createResendEmailSender(resendConfig) : undefined;
const app = createApiApp({
  environment: production ? "production" : "development",
  databasePool: databasePool ?? undefined,
  marketplacePool: databasePool ?? undefined,
  authConfig: authConfig ?? undefined,
  sendAuthEmail,
  whatsappContact: verificationEnabled && twilioConfig && whatsappEncryptionKey && whatsappHmacSecret && verificationContentSid
    ? {
        config: { hmacSecret: whatsappHmacSecret, encryptionKey: whatsappEncryptionKey },
        sendVerification: async (recipientE164, code) => {
          await createTwilioWhatsAppSender(twilioConfig, fetch, verificationContentSid)({ toE164: recipientE164, variables: { "1": code } });
        },
      }
    : undefined,
  runtimeDependenciesReady: async () => {
    if (!databasePool || !authConfig || !sendAuthEmail) return false;
    await databasePool.query("SELECT 1");
    return true;
  },
});
const server = app.listen(port.data, host, () => console.info(`Fix Hub API listening on http://${host}:${port.data}`));
const dispatcher = notificationsEnabled && databasePool && twilioConfig && whatsappEncryptionKey && serviceContentSid
  ? createNotificationOutboxDispatcher(databasePool, whatsappEncryptionKey, async (recipientE164, variables) =>
      createTwilioWhatsAppSender(twilioConfig, fetch, serviceContentSid)({ toE164: recipientE164, variables }),
    )
  : undefined;
const dispatcherTimer = dispatcher ? setInterval(() => {
  void dispatcher.dispatchBatch().catch((error: unknown) => {
    console.error("WhatsApp notification dispatch failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
  });
}, 5_000) : undefined;
dispatcherTimer?.unref();

function shutdown(signal: string) {
  console.info(`Received ${signal}; closing API server`);
  if (dispatcherTimer) clearInterval(dispatcherTimer);
  server.close((error) => {
    if (error) {
      console.error("API server shutdown failed", error);
      process.exitCode = 1;
    }
    if (databasePool) void databasePool.end();
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
