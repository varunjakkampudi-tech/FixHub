import { createHash } from "node:crypto";
import cors from "cors";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import helmet from "helmet";
import pino, { type Logger } from "pino";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { z } from "zod";

import { calculate, initialPolicy } from "../src/features/fixhub/demo-model";
import { openApiDocument } from "./openapi";
import { createAuthHandlers, type AuthConfig, type EmailSender } from "./auth";
import { createMarketplaceHandlers } from "./marketplace";
import { createMerchantHandlers } from "./merchant";
import type { Pool } from "pg";

const categories = ["electrician", "plumbing", "ac", "appliance"] as const;
const categoryParams = z.object({ category: z.enum(categories) }).strict();
const originSchema = z
  .string()
  .url()
  .refine((value) => {
    const parsed = new URL(value);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.origin === value;
  }, "Expected an origin without a path, query, or fragment");

export type ApiAppOptions = {
  allowedOrigins?: string[];
  logger?: Logger;
  rateLimit?: { windowMs: number; limit: number };
  environment?: "development" | "test" | "production";
  databasePool?: Pick<Pool, "connect">;
  marketplacePool?: Pick<Pool, "connect">;
  authConfig?: AuthConfig;
  sendAuthEmail?: EmailSender;
  runtimeDependenciesReady?: boolean | (() => Promise<boolean>);
  productionApproval?: boolean;
};

function configuredOrigins(): string[] {
  const configured = process.env.FIXHUB_WEB_ORIGINS;
  const values = configured
    ? configured.split(",").map((value) => value.trim()).filter(Boolean)
    : ["http://localhost:5173", "http://127.0.0.1:5173"];
  const checked = z.array(originSchema).min(1).safeParse(values);
  if (!checked.success) throw new Error("FIXHUB_WEB_ORIGINS must be a comma-separated list of exact origins");
  return checked.data;
}

function requestLogger(logger: Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: () => crypto.randomUUID(),
    customAttributeKeys: { reqId: "requestId" },
    serializers: {
      req(req) {
        return { method: req.method, requestId: req.id };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
      err(err) {
        return { type: err.name };
      },
    },
    customLogLevel(_req, res, error) {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.route?.path ?? "unmatched"} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.route?.path ?? "unmatched"} ${res.statusCode}`,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers.set-cookie",
        "password",
        "token",
        "email",
        "phone",
        "address",
      ],
      censor: "[REDACTED]",
    },
  });
}

export function createApiApp(options: ApiAppOptions = {}) {
  const app = express();
  const environment = options.environment ?? (process.env.NODE_ENV === "production" ? "production" : "development");
  const origins = options.allowedOrigins ?? configuredOrigins();
  const logger = options.logger ?? pino({ level: environment === "test" ? "silent" : process.env.LOG_LEVEL ?? "info" });

  app.disable("x-powered-by");
  app.use(requestLogger(logger));
  app.use((req, res, next) => {
    res.setHeader("x-request-id", String(req.id));
    next();
  });
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (origin === undefined || origins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      exposedHeaders: ["x-request-id"],
      optionsSuccessStatus: 204,
    }),
  );

  app.get("/health/live", (_req, res) => res.status(200).json({ status: "alive", mode: "local-demo" }));
  app.get("/health/ready", async (_req, res) => {
    let ready = options.runtimeDependenciesReady === true;
    if (typeof options.runtimeDependenciesReady === "function") {
      try { ready = await options.runtimeDependenciesReady(); } catch { ready = false; }
    }
    if (environment === "production" && (!ready || options.productionApproval !== true)) {
      return res.status(503).json({ status: "not_ready", reason: "production_release_gates_unverified" });
    }
    return res.status(200).json({ status: "ready", mode: "local-demo" });
  });
  app.get("/openapi.json", (_req, res) => res.status(200).json(openApiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  const apiLimiter = rateLimit({
    windowMs: options.rateLimit?.windowMs ?? 60_000,
    limit: options.rateLimit?.limit ?? 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler(req, res) {
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many requests. Please try again shortly." },
        requestId: req.id,
      });
    },
  });
  app.use("/api/v1", apiLimiter);
  app.use(express.json({ limit: "32kb", strict: true }));

  if (options.databasePool && options.authConfig && options.sendAuthEmail) {
    const auth = createAuthHandlers(options.databasePool, options.authConfig, options.sendAuthEmail);
    const authLimiter = (limit: number) => rateLimit({
      windowMs: 15 * 60_000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      keyGenerator(req) {
        const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "invalid";
        return `${ipKeyGenerator(req.ip ?? "unknown")}:${createHash("sha256").update(email).digest("hex")}`;
      },
      handler(req, res) {
        res.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many sign-in attempts. Please try again later." }, requestId: req.id });
      },
    });
    app.post("/api/v1/auth/code", authLimiter(5), auth.requestCode);
    app.post("/api/v1/auth/verify", authLimiter(10), auth.verifyCode);
    app.get("/api/v1/auth/me", auth.requireSession, (_req, res) =>
      res.status(200).json({ authenticated: true, ...res.locals.auth }),
    );
    app.post("/api/v1/auth/logout", auth.requireSession, auth.logout);
    const customerRole = auth.requireAnyRole("customer");
    const merchantRole = auth.requireAnyRole("merchant");
    app.post("/api/v1/customer/account-deletion", auth.requireSession, customerRole, auth.requestAccountDeletion);

    if (options.marketplacePool) {
      const marketplace = createMarketplaceHandlers(options.marketplacePool);
      app.get("/api/v1/services", marketplace.listServices);
      app.get("/api/v1/customer/addresses", auth.requireSession, customerRole, marketplace.listAddresses);
      app.post("/api/v1/customer/addresses", auth.requireSession, customerRole, marketplace.createAddress);
      app.get("/api/v1/customer/bookings", auth.requireSession, customerRole, marketplace.listBookings);
      app.post("/api/v1/customer/bookings", auth.requireSession, customerRole, marketplace.createBooking);
      app.get("/api/v1/customer/bookings/:id", auth.requireSession, customerRole, marketplace.getBooking);
      const merchant = createMerchantHandlers(options.marketplacePool);
      app.get("/api/v1/merchant/offers", auth.requireSession, merchantRole, merchant.listOffers);
      app.post("/api/v1/merchant/offers/:id/response", auth.requireSession, merchantRole, merchant.respondToOffer);
      app.get("/api/v1/merchant/jobs", auth.requireSession, merchantRole, merchant.listJobs);
    }
  }

  app.get("/api/v1/demo/prices/:category", (req, res) => {
    const parsed = categoryParams.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        error: { code: "INVALID_INPUT", message: "The requested sample category is not supported." },
        requestId: req.id,
      });
    }
    const { category } = parsed.data;
    const price = calculate(initialPolicy[category]);
    return res.status(200).json({
      demoOnly: true,
      currency: "INR",
      category,
      items: [
        { code: "visit", amount: price.visit },
        { code: "labor_sample", amount: price.labor },
        { code: "parts_allowance_sample", amount: price.parts },
        { code: "platform_fee_sample", amount: price.fee },
        { code: "discount_sample", amount: -price.discount },
        { code: "tax", amount: null, configured: false },
      ],
      total: price.total,
      collectionMethod: "cash_on_service_completion_in_demo_only",
      priceVersion: price.rates.version,
      notice: "Fictional estimate only; not an offer, merchant quote, tax determination, booking, or payment instruction.",
    });
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "The requested API resource was not found." },
      requestId: res.getHeader("x-request-id") ?? null,
    });
  });

  const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    const candidate = error as { status?: unknown; type?: unknown; name?: unknown };
    if (candidate.type === "entity.too.large" || candidate.status === 413) {
      return res.status(413).json({
        error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the allowed size." },
        requestId: req.id,
      });
    }
    if (candidate.type === "entity.parse.failed" || candidate.status === 400) {
      return res.status(400).json({
        error: { code: "INVALID_JSON", message: "Request body must contain valid JSON." },
        requestId: req.id,
      });
    }
    req.log.error({ errorType: typeof candidate.name === "string" ? candidate.name : "UnknownError" }, "Unhandled API error");
    return res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "The request could not be completed." },
      requestId: req.id,
    });
  };
  app.use(errorHandler);
  return app;
}
