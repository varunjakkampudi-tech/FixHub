// @vitest-environment node
import type { Pool, PoolClient, PoolConfig } from "pg";
import { describe, expect, it, vi } from "vitest";

import { databaseConfigFromEnvironment, inTransaction } from "../database";

function fakeClient(query: (sql: string) => Promise<unknown> = async () => ({ rows: [] })) {
  const release = vi.fn();
  const client = { query: vi.fn(query), release } as unknown as PoolClient;
  return { client, release, query: vi.mocked(client.query) };
}

describe("database foundation", () => {
  it("requires PostgreSQL URLs and bounds pool configuration", () => {
    expect(databaseConfigFromEnvironment({})).toBeNull();
    expect(() =>
      databaseConfigFromEnvironment({ DATABASE_URL: "https://db.example.test" }),
    ).toThrow();
    expect(() =>
      databaseConfigFromEnvironment({ DATABASE_URL: "postgres://db", DATABASE_POOL_MAX: "51" }),
    ).toThrow();

    const config = databaseConfigFromEnvironment({
      DATABASE_URL: "postgres://user:secret@localhost/fixhub24",
      DATABASE_POOL_MAX: "12",
      NODE_ENV: "production",
    }) as PoolConfig;
    expect(config.max).toBe(12);
    expect(config.connectionTimeoutMillis).toBe(3000);
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
    expect(config.query_timeout).toBeLessThan(10_000);
  });

  it("commits a successful transaction and returns the client once", async () => {
    const { client, release, query } = fakeClient();
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;

    const value = await inTransaction(pool, async (transaction) => {
      await transaction.query("SELECT 1");
      return "done";
    });

    expect(value).toBe("done");
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "SELECT 1", "COMMIT"]);
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith();
  });

  it("rolls back a failed operation and preserves the original error", async () => {
    const { client, release, query } = fakeClient();
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
    const failure = new Error("operation failed");

    await expect(
      inTransaction(pool, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "ROLLBACK"]);
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith();
  });

  it("discards a client whose rollback fails without double release", async () => {
    const { client, release, query } = fakeClient(async (sql) => {
      if (sql === "ROLLBACK") throw new Error("rollback failed");
      return { rows: [] };
    });
    const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
    const failure = new Error("operation failed");

    await expect(
      inTransaction(pool, async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(query.mock.calls.map(([sql]) => sql)).toEqual(["BEGIN", "ROLLBACK"]);
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith(true);
  });
});
