// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRedisClient } from "../redis/client";
import { DistributedLock } from "../redis/lock";

describe("Redis & Distributed Locking (Redlock)", () => {
  it("acquires and releases a distributed lock successfully", async () => {
    const redis = createRedisClient();
    const lock = new DistributedLock(redis);

    const resource = "booking:12345";
    const handle = await lock.acquire(resource, 5000);
    expect(handle).not.toBeNull();
    expect(handle?.resource).toBe(resource);

    // Second acquire on the same resource fails while locked
    const conflictHandle = await lock.acquire(resource, 5000, 0);
    expect(conflictHandle).toBeNull();

    // Release lock
    const released = await lock.release(handle!);
    expect(released).toBe(true);

    // Can acquire again after release
    const reacquiredHandle = await lock.acquire(resource, 5000);
    expect(reacquiredHandle).not.toBeNull();
    await lock.release(reacquiredHandle!);
  });

  it("fails to release lock if token value does not match", async () => {
    const redis = createRedisClient();
    const lock = new DistributedLock(redis);

    const resource = "booking:67890";
    const handle = await lock.acquire(resource, 5000);
    expect(handle).not.toBeNull();

    const fakeHandle = { ...handle!, value: "wrong-uuid-token" };
    const released = await lock.release(fakeHandle);
    expect(released).toBe(false);

    // Real lock still held
    const conflictHandle = await lock.acquire(resource, 5000, 0);
    expect(conflictHandle).toBeNull();

    // Release with real handle
    await lock.release(handle!);
  });

  it("executes code safely using withLock helper", async () => {
    const redis = createRedisClient();
    const lock = new DistributedLock(redis);

    const resource = "booking:with-lock-test";
    let executed = false;

    const result = await lock.withLock(resource, 5000, async () => {
      executed = true;
      return "SUCCESS_VALUE";
    });

    expect(executed).toBe(true);
    expect(result).toBe("SUCCESS_VALUE");

    // Lock was automatically released
    const newHandle = await lock.acquire(resource, 5000, 0);
    expect(newHandle).not.toBeNull();
    await lock.release(newHandle!);
  });
});
