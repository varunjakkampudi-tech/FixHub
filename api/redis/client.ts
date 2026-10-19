import crypto from "node:crypto";

export interface RedisClientInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "PX" | "EX", duration?: number): Promise<"OK" | null>;
  setnx(key: string, value: string, ttlMs?: number): Promise<boolean>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  flushall(): Promise<void>;
  eval(script: string, keyCount: number, ...args: string[]): Promise<unknown>;
}

class InMemoryRedisClient implements RedisClientInterface {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  private isExpired(entry: { value: string; expiresAt: number | null }): boolean {
    if (entry.expiresAt === null) return false;
    return Date.now() > entry.expiresAt;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: "PX" | "EX", duration?: number): Promise<"OK"> {
    let expiresAt: number | null = null;
    if (duration !== undefined && mode) {
      const ms = mode === "EX" ? duration * 1000 : duration;
      expiresAt = Date.now() + ms;
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async setnx(key: string, value: string, ttlMs?: number): Promise<boolean> {
    const existing = await this.get(key);
    if (existing !== null) {
      return false;
    }
    await this.set(key, value, ttlMs ? "PX" : undefined, ttlMs);
    return true;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry || this.isExpired(entry)) return false;
    entry.expiresAt = Date.now() + seconds * 1000;
    return true;
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async flushall(): Promise<void> {
    this.store.clear();
  }

  async eval(script: string, _keyCount: number, ...args: string[]): Promise<unknown> {
    // Atomic release lock script emulation:
    // if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end
    if (script.includes("redis.call('get', KEYS[1]) == ARGV[1]") || script.includes('redis.call("get", KEYS[1]) == ARGV[1]')) {
      const [key, expectedValue] = args;
      const current = await this.get(key);
      if (current === expectedValue) {
        await this.del(key);
        return 1;
      }
      return 0;
    }
    return null;
  }
}

export function createRedisClient(): RedisClientInterface {
  return new InMemoryRedisClient();
}

export const defaultRedisClient = createRedisClient();
