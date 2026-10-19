// @vitest-environment node
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApiApp } from "../app";
import { defaultRepository } from "../db/repository";
import { defaultAuthService } from "../services/auth-service";

describe("Merchants API", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("lists all active merchants", async () => {
    const res = await request(app).get("/api/v1/merchants").expect(200);
    expect(res.body.merchants).toBeDefined();
    expect(res.body.count).toBeGreaterThanOrEqual(3);
  });

  it("filters merchants by service category", async () => {
    const res = await request(app).get("/api/v1/merchants?category=plumbing").expect(200);
    expect(res.body.merchants.length).toBeGreaterThanOrEqual(1);
    expect(res.body.merchants.every((m: any) => m.categories.includes("plumbing"))).toBe(true);
  });

  it("gets merchant profile and technician roster by ID", async () => {
    const res = await request(app).get("/api/v1/merchants/mch-001").expect(200);
    expect(res.body.merchant.id).toBe("mch-001");
    expect(res.body.merchant.businessName).toContain("Sri Lakshmi Electricals");
    expect(res.body.technicians).toBeDefined();
    expect(res.body.technicians.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 404 for non-existent merchant ID", async () => {
    const res = await request(app).get("/api/v1/merchants/mch-999").expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("onboards a new merchant", async () => {
    // Register and authenticate a user as merchant
    const user = defaultRepository.users.get("usr-merch-001")!;
    const token = defaultAuthService.generateToken(user);

    const res = await request(app)
      .post("/api/v1/merchants/onboarding")
      .set("Authorization", `Bearer ${token}`)
      .send({
        businessName: "Krishna Aircon Services",
        description: "Specialized AC repair and installation technicians in Tanuku.",
        categories: ["ac"],
        coverageZones: ["Tanuku-Central", "Tanuku-East"],
        address: "Bypass Road, Tanuku",
        latitude: 16.76,
        longitude: 81.68,
      })
      .expect(201);

    expect(res.body.merchant.businessName).toBe("Krishna Aircon Services");
    expect(res.body.merchant.categories).toContain("ac");
  });

  it("allows merchant to toggle availability", async () => {
    const user = defaultRepository.users.get("usr-merch-001")!;
    const token = defaultAuthService.generateToken(user);

    const res = await request(app)
      .patch("/api/v1/merchants/mch-001/availability")
      .set("Authorization", `Bearer ${token}`)
      .send({ isAvailable: false })
      .expect(200);

    expect(res.body.merchant.isAvailable).toBe(false);
  });

  it("allows merchant to add a new technician", async () => {
    const user = defaultRepository.users.get("usr-merch-001")!;
    const token = defaultAuthService.generateToken(user);

    const res = await request(app)
      .post("/api/v1/merchants/mch-001/technicians")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "S. Anjaneyulu",
        phone: "+919848099885",
        skills: ["electrician", "inverter-repair"],
      })
      .expect(201);

    expect(res.body.technician.name).toBe("S. Anjaneyulu");
    expect(res.body.technician.skills).toContain("inverter-repair");
  });
});
