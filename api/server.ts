import "dotenv/config";

import pino from "pino";
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
const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
const databasePool = createDatabasePool(process.env, (code) => logger.error({ code }, "Database pool error"));
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
  logger,
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
const server = app.listen(port.data, host, () => logger.info({ host, port: port.data }, "Fix Hub API listening"));
const dispatcher = notificationsEnabled && databasePool && twilioConfig && whatsappEncryptionKey && serviceContentSid
  ? createNotificationOutboxDispatcher(databasePool, whatsappEncryptionKey, async (recipientE164, variables) =>
      createTwilioWhatsAppSender(twilioConfig, fetch, serviceContentSid)({ toE164: recipientE164, variables }),
    )
  : undefined;
const dispatcherTimer = dispatcher ? setInterval(() => {
  void dispatcher.dispatchBatch().catch((error: unknown) => {
    logger.error({ errorType: error instanceof Error ? error.name : "UnknownError" }, "WhatsApp notification dispatch failed");
  });
}, 5_000) : undefined;
dispatcherTimer?.unref();

function shutdown(signal: string) {
  logger.info({ signal }, "Closing API server");
  if (dispatcherTimer) clearInterval(dispatcherTimer);
  server.close((error) => {
    if (error) {
      logger.error({ errorType: error.name }, "API server shutdown failed");
      process.exitCode = 1;
    }
    if (databasePool) {
      void databasePool.end().then(() => {
        logger.info("Database pool closed");
      }, (poolError: unknown) => {
        logger.error({ errorType: poolError instanceof Error ? poolError.name : "UnknownError" }, "Database pool shutdown failed");
        process.exitCode = 1;
      });
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
