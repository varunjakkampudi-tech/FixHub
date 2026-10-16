// @vitest-environment node
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApiApp } from "../app";
import { distanceKm, eligibleCandidates } from "../marketplace";

describe("marketplace boundaries", () => {
  it("measures distance and excludes providers without verified coordinates or within-radius coverage", () => {
    expect(distanceKm(0, 0, 0, 1)).toBeGreaterThan(111);
    expect(distanceKm(0, 0, 0, 1)).toBeLessThan(112);
    const candidates = [
      { merchant_id: "near", business_name: "Near", visit_price_paise: 100, labor_from_paise: 200, latitude: 16.75, longitude: 81.68, service_radius_km: 5 },
      { merchant_id: "far", business_name: "Far", visit_price_paise: 50, labor_from_paise: 100, latitude: 17.5, longitude: 82.5, service_radius_km: 5 },
      { merchant_id: "unknown", business_name: "Unknown", visit_price_paise: 50, labor_from_paise: 100, latitude: null, longitude: null, service_radius_km: 100 },
    ];
    expect(eligibleCandidates(candidates, { latitude: 16.75, longitude: 81.68 }).map(({ merchant_id }) => merchant_id)).toEqual(["near"]);
    expect(eligibleCandidates(candidates, null)).toEqual([]);
  });

  it("creates an owner-scoped COD booking and replays only an identical idempotent request", async () => {
    const subjectId = randomUUID();
    const addressId = randomUUID();
    const serviceId = "10000000-0000-4000-8000-000000000001";
    const idempotency = new Map<string, { hash: Buffer; body?: unknown }>();
    const localMerchantId = randomUUID();
    const nearbyMerchantId = randomUUID();
    const distantMerchantId = randomUUID();
    let challengeId = "";
    let challengeHash: Buffer | undefined;
    let sentCode = "";
    const offerRows: unknown[][] = [];
    const outboxRows: { eventType: string; values: unknown[]; sql: string }[] = [];
    const outboxStatements: string[] = [];
    const createdBookingIds: string[] = [];
    const transactionStatements: string[] = [];
    let offerInsertCount = 0;
    let failOfferInsertAt: number | null = null;
    let transactionSnapshot: {
      idempotency: [string, { hash: Buffer; body?: unknown }][];
      offerRows: unknown[][];
      outboxRows: { eventType: string; values: unknown[]; sql: string }[];
      outboxStatements: string[];
      createdBookingIds: string[];
    } | null = null;
    let providersAvailable = true;
    let merchantCandidates = [
      { merchant_id: localMerchantId, business_name: "Local Electrician", latitude: "16.75", longitude: "81.68", service_radius_km: "5", visit_price_paise: "25000", labor_from_paise: "30000" },
      { merchant_id: nearbyMerchantId, business_name: "Nearby Electrician", latitude: "16.76", longitude: "81.69", service_radius_km: "5", visit_price_paise: "30000", labor_from_paise: "10000" },
      { merchant_id: distantMerchantId, business_name: "Distant Electrician", latitude: "18.75", longitude: "83.68", service_radius_km: "5", visit_price_paise: "10000", labor_from_paise: "10000" },
    ];
    const query = vi.fn(async (sql: string, values: unknown[] = []) => {
      if (sql === "BEGIN") {
        transactionStatements.push(sql);
        transactionSnapshot = {
          idempotency: [...idempotency.entries()].map(([key, value]) => [key, { hash: Buffer.from(value.hash), body: value.body }]),
          offerRows: offerRows.map((row) => [...row]),
          outboxRows: outboxRows.map((row) => ({ ...row, values: [...row.values] })),
          outboxStatements: [...outboxStatements],
          createdBookingIds: [...createdBookingIds],
        };
        return { rows: [] };
      }
      if (sql === "COMMIT") {
        transactionStatements.push(sql);
        transactionSnapshot = null;
        return { rows: [] };
      }
      if (sql === "ROLLBACK") {
        transactionStatements.push(sql);
        if (transactionSnapshot) {
          idempotency.clear();
          for (const [key, value] of transactionSnapshot.idempotency) idempotency.set(key, value);
          offerRows.splice(0, offerRows.length, ...transactionSnapshot.offerRows);
          outboxRows.splice(0, outboxRows.length, ...transactionSnapshot.outboxRows);
          outboxStatements.splice(0, outboxStatements.length, ...transactionSnapshot.outboxStatements);
          createdBookingIds.splice(0, createdBookingIds.length, ...transactionSnapshot.createdBookingIds);
          transactionSnapshot = null;
        }
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO email_login_challenge")) { challengeId = String(values[0]); challengeHash = values[2] as Buffer; }
      if (sql.includes("SELECT count(*)::text AS count FROM email_login_challenge")) return { rows: [{ count: "0" }] };
      if (sql.includes("SELECT id, code_hmac, attempt_count FROM email_login_challenge")) return { rows: challengeHash ? [{ id: challengeId, code_hmac: challengeHash, attempt_count: 0 }] : [] };
      if (sql.includes("INSERT INTO identity_subject")) return { rows: [{ id: subjectId }] };
      if (sql.includes("SELECT s.subject_id")) return { rows: [{ subject_id: subjectId, roles: ["customer"] }] };
      if (sql.includes("INSERT INTO request_idempotency")) {
        const key = `${values[0]}:${values[1]}:${values[2]}`;
        if (idempotency.has(key)) return { rows: [] };
        idempotency.set(key, { hash: values[3] as Buffer });
        return { rows: [{ idempotency_key: values[2] }] };
      }
      if (sql.includes("DELETE FROM request_idempotency")) {
        idempotency.delete(`${values[0]}:${values[1]}:${values[2]}`);
      }
      if (sql.includes("SELECT request_hash, response_body FROM request_idempotency")) {
        const key = `${values[0]}:${values[1]}:${values[2]}`;
        const record = idempotency.get(key);
        return { rows: record ? [{ request_hash: record.hash, response_body: record.body }] : [] };
      }
      if (sql.includes("UPDATE request_idempotency SET response_body")) {
        const key = `${values[0]}:${values[1]}:${values[2]}`;
        const record = idempotency.get(key)!;
        record.body = JSON.parse(String(values[3]));
      }
      if (sql.includes("SELECT latitude, longitude FROM customer_address")) return { rows: [{ latitude: "16.75", longitude: "81.68" }] };
      if (sql.includes("SELECT id, name FROM service_catalog") || sql.includes("SELECT id FROM service_catalog")) return { rows: [{ id: serviceId, name: "General electrical service" }] };
      if (sql.includes("SELECT m.subject_id AS merchant_id")) {
        const limit = Number(sql.match(/\bLIMIT\s+(\d+)\b/i)?.[1] ?? Number.MAX_SAFE_INTEGER);
        return { rows: providersAvailable ? merchantCandidates.slice(0, limit) : [] };
      }
      if (sql.includes("INSERT INTO service_booking")) createdBookingIds.push(String(values[0]));
      if (sql.includes("INSERT INTO booking_offer")) {
        offerInsertCount += 1;
        if (offerInsertCount === failOfferInsertAt) throw new Error("injected second eligible offer write failure");
        offerRows.push(values);
      }
      if (sql.includes("INSERT INTO transactional_outbox")) {
        outboxRows.push({ eventType: sql.match(/VALUES \(\$1, '([^']+)'/)?.[1] ?? "unknown", values, sql });
        outboxStatements.push(sql);
      }
      return { rows: [] };
    });
    const client = { query, release: vi.fn() } as unknown as PoolClient;
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
    const app = createApiApp({
      environment: "test",
      allowedOrigins: ["http://localhost:5173"],
      databasePool: pool,
      marketplacePool: pool,
      authConfig: { hmacSecret: "another-secure-test-secret-over-32-bytes", production: false, webOrigins: [] },
      sendAuthEmail: async (_email, code) => { sentCode = code; },
    });
    await request(app).post("/api/v1/auth/code").send({ email: "user@example.test" }).expect(202);
    const verified = await request(app).post("/api/v1/auth/verify").send({ email: "user@example.test", code: sentCode }).expect(200);
    const cookies = verified.headers["set-cookie"];
    const cookieList = Array.isArray(cookies) ? cookies : [cookies];
    const csrfCookie = cookieList.find((cookie) => cookie.startsWith("fixhub_csrf="))!;
    const sessionCookie = cookieList.find((cookie) => cookie.startsWith("fixhub_session="))!;
    const csrf = decodeURIComponent(csrfCookie.split(";", 1)[0].split("=", 2)[1]);
    const requestWithAuth = (method: "get" | "post", url: string) => request(app)[method](url)
      .set("Cookie", `${sessionCookie.split(";", 1)[0]}; ${csrfCookie.split(";", 1)[0]}`)
      .set("x-csrf-token", csrf);

    await request(app).get("/api/v1/customer/pricing-preview").query({ serviceId, addressId }).expect(401);
    await requestWithAuth("post", "/api/v1/customer/addresses")
      .send({ label: "Home", address: "12 Main Street", locality: "Tanuku", latitude: 16.75, longitude: 81.68 })
      .expect(201);
    const pricePreview = await requestWithAuth("get", "/api/v1/customer/pricing-preview")
      .query({ serviceId, addressId })
      .expect(200);
    expect(pricePreview.body).toEqual({
      available: true,
      currency: "INR",
      paymentMethod: "cash_on_completion",
      minTotalPaise: 40000,
      maxTotalPaise: 55000,
      partsIncluded: false,
    });
    expect(JSON.stringify(pricePreview.body)).not.toContain("Local Electrician");
    providersAvailable = false;
    const unavailablePreview = await requestWithAuth("get", "/api/v1/customer/pricing-preview")
      .query({ serviceId, addressId })
      .expect(200);
    expect(unavailablePreview.body).toMatchObject({ available: false, minTotalPaise: null, maxTotalPaise: null });
    const retryKey = "provider-retry-000001";
    await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", retryKey)
      .send({ serviceId, addressId, note: "Retry after provider becomes available" })
      .expect(409);
    providersAvailable = true;
    await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", retryKey)
      .send({ serviceId, addressId, note: "Retry after provider becomes available" })
      .expect(201);

    const body = { serviceId, addressId, note: "Ceiling fan repair" };
    const first = await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", "request-key-00000001")
      .send(body)
      .expect(201);
    expect(first.body.booking).toMatchObject({
      serviceId,
      status: "offered",
      paymentMethod: "cash_on_completion",
      eligibleProviderCandidates: 2,
      notificationStatus: "not_dispatched",
      estimate: { visitPaise: 30000, laborFromPaise: 10000, totalFromPaise: 40000 },
    });
    expect(first.body.booking.notice).toBe("Request and eligible offers are saved. WhatsApp delivery is attempted asynchronously only when enabled and permitted; an accepted offer in FixHub confirms assignment.");
    expect(offerRows).toHaveLength(4);
    expect(outboxRows).toHaveLength(6);
    expect(outboxStatements.filter((sql) => sql.includes("'request.created'"))).toHaveLength(2);
    expect(outboxStatements.filter((sql) => sql.includes("'merchant.booking_offer'"))).toHaveLength(4);
    const customerEvents = outboxRows.filter((row) => row.eventType === "request.created");
    expect(customerEvents).toHaveLength(2);
    expect(customerEvents.map((row) => String(row.values[1])).sort()).toEqual([...createdBookingIds].sort());
    for (const row of customerEvents) {
      const [eventId, aggregateId, idempotencyKey] = row.values;
      expect(eventId).toEqual(expect.any(String));
      expect(createdBookingIds).toContain(aggregateId);
      expect(idempotencyKey).toBe(`request-created:${aggregateId}`);
      expect(row.values).toHaveLength(3);
      expect(row.sql).toContain("VALUES ($1, 'request.created', $2, '{}'::jsonb, $3)");
    }
    expect(new Set(customerEvents.map((row) => row.values[0])).size).toBe(customerEvents.length);
    const merchantEvents = outboxRows.filter((row) => row.eventType === "merchant.booking_offer");
    expect(merchantEvents).toHaveLength(4);
    expect(new Set(offerRows.map((row) => row[2])).size).toBe(2);
    expect(offerRows.every((row) => ([localMerchantId, nearbyMerchantId] as string[]).includes(String(row[2])))).toBe(true);
    expect(JSON.stringify(outboxRows)).not.toContain(distantMerchantId);
    for (const bookingId of createdBookingIds) {
      const offersForBooking = merchantEvents.filter((row) => row.values[1] === bookingId);
      expect(offersForBooking).toHaveLength(2);
      expect(new Set(offersForBooking.map((row) => JSON.parse(String(row.values[2])).merchantId)))
        .toEqual(new Set([localMerchantId, nearbyMerchantId]));
      for (const row of offersForBooking) {
        const payload = JSON.parse(String(row.values[2])) as { bookingId: string; offerId: string; merchantId: string };
        expect(payload.bookingId).toBe(bookingId);
        expect(offerRows.some((offer) => offer[0] === payload.offerId && offer[1] === bookingId && offer[2] === payload.merchantId)).toBe(true);
        expect(row.values[3]).toBe(`booking-offer:${payload.offerId}`);
      }
    }
    expect(JSON.stringify(outboxRows)).not.toContain("12 Main Street");

    const replay = await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", "request-key-00000001")
      .send(body)
      .expect(200);
    expect(replay.body).toEqual(first.body);
    expect(offerRows).toHaveLength(4);

    const conflict = await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", "request-key-00000001")
      .send({ ...body, note: "different request" })
      .expect(409);
    expect(conflict.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
    expect(offerRows).toHaveLength(4);

    const wideFanoutCandidates = Array.from({ length: 501 }, (_, index) => ({
      merchant_id: randomUUID(),
      business_name: `Eligible Electrician ${String(index + 1).padStart(3, "0")}`,
      latitude: "16.75",
      longitude: "81.68",
      service_radius_km: "5",
      visit_price_paise: "25000",
      labor_from_paise: "30000",
    }));
    merchantCandidates = wideFanoutCandidates;
    const wideFanout = await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", "fanout-wide-0000001")
      .send(body)
      .expect(201);
    expect(wideFanout.body.booking.eligibleProviderCandidates).toBe(501);
    const wideFanoutOffers = offerRows.filter((offer) => offer[1] === wideFanout.body.booking.id);
    expect(wideFanoutOffers).toHaveLength(501);
    expect(new Set(wideFanoutOffers.map((offer) => offer[2])).size).toBe(501);
    expect(outboxRows.filter((row) => row.eventType === "merchant.booking_offer" && row.values[1] === wideFanout.body.booking.id)).toHaveLength(501);

    const offersBeforeFailure = offerRows.length;
    const outboxBeforeFailure = outboxRows.length;
    const bookingsBeforeFailure = createdBookingIds.length;
    const rollbackKey = "offer-write-failure-0001";
    failOfferInsertAt = offerInsertCount + 2;
    transactionStatements.length = 0;
    const failedFanout = await requestWithAuth("post", "/api/v1/customer/bookings")
      .set("Idempotency-Key", rollbackKey)
      .send({ ...body, note: "Rollback when an eligible offer write fails" })
      .expect(500);
    expect(failedFanout.body).toMatchObject({
      error: { code: "INTERNAL_ERROR", message: "The request could not be completed." },
      requestId: expect.any(String),
    });
    expect(transactionStatements).toEqual(["BEGIN", "ROLLBACK"]);
    expect(offerRows).toHaveLength(offersBeforeFailure);
    expect(outboxRows).toHaveLength(outboxBeforeFailure);
    expect(createdBookingIds).toHaveLength(bookingsBeforeFailure);
    expect(idempotency.has(`${subjectId}:POST:/api/v1/customer/bookings:${rollbackKey}`)).toBe(false);
  });
});
