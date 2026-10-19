// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApiApp } from "../../api/app";
import { defaultRepository } from "../../api/db/repository";
import { defaultAuthService } from "../../api/services/auth-service";
import { defaultDistributedLock } from "../../api/redis/lock";

describe("Critical Test Suite (test:critical)", () => {
  const app = createApiApp({ environment: "test", allowedOrigins: ["http://localhost:5173"] });

  beforeEach(() => {
    defaultRepository.reset();
  });

  it("enforces atomic single-winner concurrency via Redlock on simultaneous acceptance", async () => {
    // 1. Customer token
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${custToken}`)
      .send({
        category: "electrician",
        serviceTitle: "Critical race test wiring trip",
        description: "Power cut in living room and burning smell from MCB.",
        address: "Main Road, Tanuku",
        latitude: 16.7566,
        longitude: 81.6811,
      })
      .expect(201);
    const bookingId = bookingRes.body.booking.id;

    // 2. Prepare tokens for two distinct merchants
    const merch1 = defaultRepository.users.get("usr-merch-001")!;
    const token1 = defaultAuthService.generateToken(merch1);

    const merch2 = defaultRepository.users.get("usr-merch-002")!;
    merch2.role = "merchant";
    defaultRepository.merchants.get("mch-002")!.categories.push("electrician");
    const token2 = defaultAuthService.generateToken(merch2);

    // 3. Two merchants race simultaneously to accept the job
    const [raceA, raceB] = await Promise.all([
      request(app)
        .post(`/api/v1/bookings/${bookingId}/accept`)
        .set("Authorization", `Bearer ${token1}`)
        .send({ merchantId: "mch-001" }),
      request(app)
        .post(`/api/v1/bookings/${bookingId}/accept`)
        .set("Authorization", `Bearer ${token2}`)
        .send({ merchantId: "mch-002" }),
    ]);

    const statuses = [raceA.status, raceB.status].sort();
    // Exactly one merchant succeeds (200), competitor is rejected (409 Conflict)
    expect(statuses).toEqual([200, 409]);
  });

  it("proves Redlock lock acquisition and release semantics", async () => {
    const lockKey = "critical:test-mutex";
    const handle = await defaultDistributedLock.acquire(lockKey, 3000, 0);
    expect(handle).not.toBeNull();

    // Secondary attempt fails immediately with 0 retries
    const secondHandle = await defaultDistributedLock.acquire(lockKey, 3000, 0);
    expect(secondHandle).toBeNull();

    // Release with matching handle succeeds
    const released = await defaultDistributedLock.release(handle!);
    expect(released).toBe(true);

    // After release, acquisition succeeds again
    const thirdHandle = await defaultDistributedLock.acquire(lockKey, 3000, 0);
    expect(thirdHandle).not.toBeNull();
    if (thirdHandle) await defaultDistributedLock.release(thirdHandle);
  });

  it("verifies strict role-based data isolation (Customer cannot resolve disputes)", async () => {
    const customer = defaultRepository.users.get("usr-cust-001")!;
    const custToken = defaultAuthService.generateToken(customer);

    // Attempting dispute resolution with customer token should be rejected (403 Forbidden)
    const forbiddenRes = await request(app)
      .post("/api/v1/disputes/disp-sample-1/resolve")
      .set("Authorization", `Bearer ${custToken}`)
      .send({ resolution: "unauthorized action", refundAmount: 100 });
    expect(forbiddenRes.status).toBe(403);
  });
});
