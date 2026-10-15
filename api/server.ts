import "dotenv/config";

import { z } from "zod";

import { createApiApp } from "./app";

const port = z.coerce.number().int().min(1).max(65535).safeParse(process.env.API_PORT ?? "4000");
if (!port.success) throw new Error("API_PORT must be an integer between 1 and 65535");

const host = process.env.API_HOST ?? "127.0.0.1";
const app = createApiApp();
const server = app.listen(port.data, host, () => {
  console.info(`Fix Hub local demo API listening on http://${host}:${port.data}`);
});

function shutdown(signal: string) {
  console.info(`Received ${signal}; closing API server`);
  server.close((error) => {
    if (error) {
      console.error("API server shutdown failed", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
