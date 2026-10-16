import "dotenv/config";

import { z } from "zod";

import { createApiApp } from "./app";
import { authConfigFromEnvironment } from "./auth";
import { createDatabasePool } from "./database";
import { createResendEmailSender, resendConfigFromEnvironment } from "./email";
import { applyMigrations } from "./migrations";

const port = z.coerce.number().int().min(1).max(65535).safeParse(process.env.API_PORT ?? "4000");
if (!port.success) throw new Error("API_PORT must be an integer between 1 and 65535");

const host = process.env.API_HOST ?? "127.0.0.1";
const production = process.env.NODE_ENV === "production";
const databasePool = createDatabasePool(process.env, (code) => console.error("Database pool error", { code }));
const authConfig = authConfigFromEnvironment(process.env);
const resendConfig = resendConfigFromEnvironment(process.env);
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
  runtimeDependenciesReady: async () => {
    if (!databasePool || !authConfig || !sendAuthEmail) return false;
    await databasePool.query("SELECT 1");
    return true;
  },
});
const server = app.listen(port.data, host, () => console.info(`Fix Hub API listening on http://${host}:${port.data}`));

function shutdown(signal: string) {
  console.info(`Received ${signal}; closing API server`);
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
