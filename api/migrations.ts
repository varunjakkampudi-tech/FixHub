import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";

import { inTransaction } from "./database";

const migrationDirectory = fileURLToPath(new URL("./migrations/", import.meta.url));
const migrationNamePattern = /^\d{3}_[a-z0-9_]+\.sql$/;
// PR #17 accidentally published a second checksum for 002_marketplace.sql.
// Accept that exact known revision during recovery; all other drift still fails closed.
const knownHistoricalChecksums: Record<string, ReadonlySet<string>> = {
  "002_marketplace.sql": new Set([
    "f474bbedece28a7503b92fc24d82e84114c3ed585ed58aa2adfa9fcdc41f4e35",
  ]),
};

export async function applyMigrations(pool: Pick<Pool, "connect">): Promise<string[]> {
  const names = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  if (names.some((name) => !migrationNamePattern.test(name)) || new Set(names).size !== names.length) {
    throw new Error("Database migration filenames must be unique and follow NNN_name.sql");
  }

  const applied: string[] = [];
  await inTransaction(pool, async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migration (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
      )
    `);
    await client.query("SELECT pg_advisory_xact_lock(hashtext('fixhub-schema-migrations'))");
    const recorded = await client.query<{ name: string }>("SELECT name FROM schema_migration");
    const available = new Set(names);
    const missing = recorded.rows.map(({ name }) => name).filter((name) => !available.has(name));
    if (missing.length) throw new Error(`Recorded database migrations are missing from source: ${missing.join(", ")}`);

    for (const name of names) {
      const sql = await readFile(new URL(`./migrations/${name}`, import.meta.url), "utf8");
      const checksum = createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");
      const previous = await client.query<{ checksum: string }>(
        "SELECT checksum FROM schema_migration WHERE name = $1",
        [name],
      );
      if (previous.rows.length) {
        const recordedChecksum = previous.rows[0].checksum;
        if (recordedChecksum !== checksum && !knownHistoricalChecksums[name]?.has(recordedChecksum)) {
          throw new Error(`Applied migration checksum changed: ${name}`);
        }
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO schema_migration (name, checksum) VALUES ($1, $2)", [name, checksum]);
      applied.push(name);
    }
  });
  return applied;
}
