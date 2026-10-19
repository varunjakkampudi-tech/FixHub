import crypto from "node:crypto";
import { type RedisClientInterface, defaultRedisClient } from "./client";

export interface LockHandle {
  resource: string;
  value: string;
  acquiredAt: number;
  ttlMs: number;
}

export class DistributedLock {
  constructor(private redis: RedisClientInterface = defaultRedisClient) {}

  /**
   * Attempts to acquire an exclusive lock on resource.
   * Uses atomic SETNX with TTL. Retries if retryCount > 0.
   */
  async acquire(
    resource: string,
    ttlMs: number = 10000,
    retryCount: number = 3,
    retryDelayMs: number = 100
  ): Promise<LockHandle | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = crypto.randomUUID();

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const acquired = await this.redis.setnx(lockKey, lockValue, ttlMs);
      if (acquired) {
        return {
          resource,
          value: lockValue,
          acquiredAt: Date.now(),
          ttlMs,
        };
      }
      if (attempt < retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
    return null;
  }

  /**
   * Safely releases the lock only if the token value matches (atomic release).
   */
  async release(handle: LockHandle): Promise<boolean> {
    const lockKey = `lock:${handle.resource}`;
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const res = await this.redis.eval(luaScript, 1, lockKey, handle.value);
    return res === 1;
  }

  /**
   * Runs an async callback inside an exclusive lock.
   */
  async withLock<T>(
    resource: string,
    ttlMs: number,
    fn: () => Promise<T>,
    retryCount: number = 3,
    retryDelayMs: number = 100
  ): Promise<T> {
    const handle = await this.acquire(resource, ttlMs, retryCount, retryDelayMs);
    if (!handle) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }
    try {
      return await fn();
    } finally {
      await this.release(handle);
    }
  }
}

export const defaultDistributedLock = new DistributedLock(defaultRedisClient);
