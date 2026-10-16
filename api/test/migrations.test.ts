// @vitest-environment node
import type { Pool, PoolClient } from "pg";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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
    if (normalized.startsWith("ALTER TABLE service_booking") && normalized.includes("DROP NOT NULL")) executed.push("003_nullable_parts_estimate.sql");
    if (normalized.startsWith("ALTER TABLE service_booking") && normalized.includes("ADD COLUMN customer_quote_accepted_at")) executed.push("004_customer_quote_consent.sql");
    return { rows: [] };
  });
  const client = { query, release: vi.fn() } as unknown as PoolClient;
  const pool = { connect: vi.fn().mockResolvedValue(client) } as unknown as Pick<Pool, "connect">;
  return { pool, rows, executed, query };
}

describe("database migrations", () => {
  it("applies migrations in order and records them idempotently", async () => {
    const fixture = migrationPool();
    expect(await applyMigrations(fixture.pool)).toEqual(["001_identity.sql", "002_marketplace.sql", "003_nullable_parts_estimate.sql", "004_customer_quote_consent.sql"]);
    expect(fixture.executed).toEqual(["001_identity.sql", "002_marketplace.sql", "003_nullable_parts_estimate.sql", "004_customer_quote_consent.sql"]);
    expect(fixture.rows.size).toBe(4);
    expect(await applyMigrations(fixture.pool)).toEqual([]);
    expect(fixture.executed).toHaveLength(4);
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

  it("upgrades a database with the original identity and marketplace migrations already applied", async () => {
    const identitySql = await readFile(new URL("../migrations/001_identity.sql", import.meta.url), "utf8");
    const identityChecksum = createHash("sha256").update(identitySql.replace(/\r\n/g, "\n")).digest("hex");
    // This is the checksum recorded by the pre-PR-17 migration history at f5c4b93.
    // Do not derive it from the current source: this test must catch edits to 002.
    const originalMarketplaceChecksum = "d60f1e18469f43ec987d6bf268af468439c49fba18edd4016f53e3f3d12fc674";
    const currentMarketplaceSql = await readFile(new URL("../migrations/002_marketplace.sql", import.meta.url), "utf8");
    expect(createHash("sha256").update(currentMarketplaceSql.replace(/\r\n/g, "\n")).digest("hex")).toBe(originalMarketplaceChecksum);
    const previous = { "001_identity.sql": identityChecksum, "002_marketplace.sql": originalMarketplaceChecksum };
    const fixture = migrationPool(previous);
    expect(await applyMigrations(fixture.pool)).toEqual(["003_nullable_parts_estimate.sql", "004_customer_quote_consent.sql"]);
    expect(fixture.executed).toEqual(["003_nullable_parts_estimate.sql", "004_customer_quote_consent.sql"]);
  });

  it("recovers databases that recorded the exact accidental PR 17 marketplace checksum", async () => {
    const identitySql = await readFile(new URL("../migrations/001_identity.sql", import.meta.url), "utf8");
    const identityChecksum = createHash("sha256").update(identitySql.replace(/\r\n/g, "\n")).digest("hex");
    const fixture = migrationPool({
      "001_identity.sql": identityChecksum,
      "002_marketplace.sql": "f474bbedece28a7503b92fc24d82e84114c3ed585ed58aa2adfa9fcdc41f4e35",
    });
    expect(await applyMigrations(fixture.pool)).toEqual(["003_nullable_parts_estimate.sql", "004_customer_quote_consent.sql"]);
    expect(fixture.executed).toEqual(["003_nullable_parts_estimate.sql", "004_customer_quote_consent.sql"]);
  });
});
