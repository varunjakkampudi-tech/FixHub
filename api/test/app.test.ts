// @vitest-environment node
import { PassThrough } from "node:stream";

import pino from "pino";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApiApp } from "../app";

describe("Fix Hub demo API foundation", () => {
  it("sets security headers and provides liveness and OpenAPI docs", async () => {
    const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });
    const live = await request(app).get("/health/live").expect(200);
    expect(live.body).toEqual({ status: "alive", mode: "local-demo" });
    expect(live.headers["x-powered-by"]).toBeUndefined();
    expect(live.headers["x-content-type-options"]).toBe("nosniff");
    expect(live.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/i);

    const docs = await request(app).get("/openapi.json").expect(200);
    expect(docs.body.openapi).toBe("3.1.0");
    expect(docs.body.paths["/api/v1/demo/prices/{category}"]).toBeDefined();
    expect(
      docs.body.paths["/api/v1/customer/pricing-preview"].get.parameters.map(
        (parameter: { name: string }) => parameter.name,
      ),
    ).toEqual(["serviceId", "addressId"]);
    for (const [path, verb] of [
      ["/api/v1/customer/bookings/{id}/complete", "post"],
      ["/api/v1/customer/bookings/{id}/quote-approval", "post"],
      ["/api/v1/customer/bookings/{id}/review", "post"],
      ["/api/v1/merchant/jobs/{id}/start", "post"],
    ]) {
      const operation = docs.body.paths[path][verb];
      expect(operation.responses["400"]).toBeDefined();
      expect(operation.responses["403"]).toBeDefined();
      expect(
        operation.parameters.find(
          (parameter: { name: string }) => parameter.name === "Idempotency-Key",
        ).schema.pattern,
      ).toBe("^[A-Za-z0-9._:-]{16,128}$");
    }
    await request(app).get("/docs/").expect(200);
  });

  it("keeps production readiness false until authentication and persistent storage exist", async () => {
    const app = createApiApp({
      environment: "production",
      allowedOrigins: ["https://example.test"],
    });
    const result = await request(app).get("/health/ready").expect(503);
    expect(result.body.status).toBe("not_ready");
  });

  it("returns only explicitly labeled fictional COD price examples", async () => {
    const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });
    const result = await request(app).get("/api/v1/demo/prices/electrician").expect(200);
    expect(result.body).toMatchObject({
      demoOnly: true,
      currency: "INR",
      category: "electrician",
      total: 799,
      collectionMethod: "cash_on_service_completion_in_demo_only",
    });
    expect(result.body.items.find((item: { code: string }) => item.code === "tax")).toMatchObject({
      amount: null,
      configured: false,
    });
    expect(result.body.notice).toContain("not an offer");
  });

  it("validates path input and emits a safe error envelope", async () => {
    const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });
    const result = await request(app)
      .get("/api/v1/demo/prices/not-a-category")
      .set("origin", "http://localhost:5173")
      .expect(400);
    expect(result.body.error.code).toBe("INVALID_INPUT");
    expect(result.body.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.headers["access-control-expose-headers"]).toContain("x-request-id");
    expect(result.headers["x-request-id"]).toBe(result.body.requestId);
    expect(JSON.stringify(result.body)).not.toContain("Zod");
  });

  it("bounds JSON bodies and rejects malformed JSON without leaking parser details", async () => {
    const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });
    await request(app)
      .post("/api/v1/demo/prices/electrician")
      .set("content-type", "application/json")
      .send("{")
      .expect(400);
    const tooLarge = await request(app)
      .post("/api/v1/demo/prices/electrician")
      .set("content-type", "application/json")
      .send({ sample: "x".repeat(33 * 1024) })
      .expect(413);
    expect(tooLarge.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("allows credentialed CORS only for exact configured origins", async () => {
    const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });
    const allowed = await request(app)
      .get("/health/live")
      .set("origin", "http://localhost:5173")
      .expect(200);
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(allowed.headers["access-control-expose-headers"]).toContain("x-request-id");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");
    const rejected = await request(app)
      .get("/health/live")
      .set("origin", "https://attacker.test")
      .expect(200);
    expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns a safe 429 envelope after the configured request limit", async () => {
    const app = createApiApp({
      environment: "test",
      allowedOrigins: ["http://localhost:5173"],
      rateLimit: { windowMs: 60_000, limit: 1 },
    });
    await request(app).get("/api/v1/demo/prices/electrician").expect(200);
    const limited = await request(app).get("/api/v1/demo/prices/electrician").expect(429);
    expect(limited.body.error.code).toBe("RATE_LIMITED");
    expect(limited.headers.ratelimit).toBeDefined();
    expect(limited.headers["x-ratelimit-limit"]).toBeUndefined();
  });

  it("does not log query strings or request body/contact data", async () => {
    const lines: string[] = [];
    const stream = new PassThrough();
    stream.on("data", (chunk: Buffer) => lines.push(chunk.toString("utf8")));
    const logger = pino({ level: "info" }, stream);
    const app = createApiApp({
      environment: "test",
      allowedOrigins: ["http://localhost:5173"],
      logger,
    });
    await request(app)
      .get("/api/v1/demo/prices/electrician?email=private@example.test&token=sample-secret")
      .expect(200);
    await request(app)
      .post("/api/v1/demo/prices/electrician?email=body@example.test&token=body-secret")
      .send({
        email: "body@example.test",
        phone: "+919876543210",
        address: "1 Synthetic Road",
        password: "body-password",
        token: "body-secret",
        message: "Synthetic private support note",
      })
      .expect(404);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const output = lines.join("");
    expect(output).toContain("requestId");
    expect(output).not.toContain("private@example.test");
    expect(output).not.toContain("sample-secret");
    expect(output).not.toContain("body@example.test");
    expect(output).not.toContain("+919876543210");
    expect(output).not.toContain("Synthetic Road");
    expect(output).not.toContain("body-password");
    expect(output).not.toContain("body-secret");
    expect(output).not.toContain("Synthetic private support note");
  });
});
