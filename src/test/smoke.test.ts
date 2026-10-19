// @vitest-environment node
import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApiApp } from "../../api/app";

describe("Smoke Test Suite (test:smoke)", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  it("verifies Express server boots and responds on /health/live with 200 OK", async () => {
    const res = await request(app).get("/health/live");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "alive", mode: "local-demo" });
  });

  it("verifies security headers are injected by Helmet", async () => {
    const res = await request(app).get("/health/live");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("verifies OpenAPI docs endpoint is responsive", async () => {
    const res = await request(app).get("/docs/");
    expect([200, 301, 302]).toContain(res.status);
  });
});
