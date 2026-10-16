// @vitest-environment node
import type { Pool, PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

import { applyMigrations } from "../migrations";

function migrationPool(seed: Record<string, string> = {}) {
  const rows = new Map(Object.entries(seed).map(([name, checksum]) => [name, { checksum }]));
  const executed: string[] = [];
  const query = vi.fn(async (sql: string, values: unknown[] = []) => {
    const normalized = sql.trim();
    if (normalized.startsWith("SELECT name FROM schema_migration")) return { rows: [...rows.keys()].map((name) => ({ name })) };
    if (normalized.startsWith("SELECT checksum FROM schema_migration")) {
      const stored = rows.get(String(values[0]));
      return { rows: stored ? [{ checksum: stored.checksum }] : [] };
    }
    if (normalized.startsWith("INSERT INTO schema_migration")) {
      rows.set(String(values[0]), { checksum: String(values[1]) });
      return { rows: [] };
    }
    if (normalized.startsWith("CREATE TABLE identity_subject")) executed.push("001_identity.sql");
    if (normalized.startsWith("CREATE TABLE identity_role")) executed.push("002_marketplace.sql");
    return { rows: [] };
  });
  const client = { query, release: vi.fn() } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
  return { pool, rows, executed, query };
}

describe("database migrations", () => {
  it("applies migrations in order and records them idempotently", async () => {
    const fixture = migrationPool();
    expect(await applyMigrations(fixture.pool)).toEqual(["001_identity.sql", "002_marketplace.sql"]);
    expect(fixture.executed).toEqual(["001_identity.sql", "002_marketplace.sql"]);
    expect(fixture.rows.size).toBe(2);
    expect(await applyMigrations(fixture.pool)).toEqual([]);
    expect(fixture.executed).toHaveLength(2);
  });

  it("fails closed when the source migration set omits a recorded migration", async () => {
    const fixture = migrationPool({ "000_removed.sql": "previous-checksum" });
    await expect(applyMigrations(fixture.pool)).rejects.toThrow("missing from source");
    expect(fixture.executed).toHaveLength(0);
  });

  it("fails closed when an applied migration checksum has drifted", async () => {
    const fixture = migrationPool({ "001_identity.sql": "wrong-checksum" });
    await expect(applyMigrations(fixture.pool)).rejects.toThrow("Applied migration checksum changed");
    expect(fixture.executed).toHaveLength(0);
  });
});
