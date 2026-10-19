// @vitest-environment node
import express from "express";
import type { Pool, PoolClient } from "pg";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createMarketplaceHandlers } from "../marketplace";

describe("address handler coordinate response contract", () => {
  it.each([
    { latitude: "16.750000", longitude: "81.680000", expected: [16.75, 81.68] },
    { latitude: "0.000000", longitude: "0.000000", expected: [0, 0] },
    { latitude: null, longitude: null, expected: [null, null] },
  ])("normalizes $latitude / $longitude in list and create responses", async ({ latitude, longitude, expected }) => {
    const customerId = "00000000-0000-4000-8000-000000000001";
    const row = { id: "00000000-0000-4000-8000-000000000002", label: "Home", address: "12 Synthetic Street", locality: "Tanuku", latitude, longitude };
    const query = vi.fn(async () => ({ rows: [row] }));
    const release = vi.fn();
    const pool = { connect: vi.fn(async () => ({ query, release } as unknown as PoolClient)) } as unknown as Pick<Pool, "connect">;
    const handlers = createMarketplaceHandlers(pool);
    // Controller test only: authentication/CSRF are exercised by the app's existing suites.
    const app = express();
    app.use(express.json());
    app.use((_req, res, next) => { res.locals.auth = { subjectId: customerId }; next(); });
    app.get("/addresses", handlers.listAddresses);
    app.post("/addresses", handlers.createAddress);

    const listed = await request(app).get("/addresses").expect(200);
    expect([listed.body.items[0].latitude, listed.body.items[0].longitude]).toEqual(expected);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("WHERE customer_id = $1"), [customerId]);
    const created = await request(app).post("/addresses").send({ label: row.label, address: row.address, locality: row.locality,
      ...(latitude !== null ? { latitude: Number(latitude), longitude: Number(longitude) } : {}) }).expect(201);
    expect([created.body.item.latitude, created.body.item.longitude]).toEqual(expected);
    expect(release).toHaveBeenCalledTimes(2);
  });
});
