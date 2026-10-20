import { Pool, type PoolClient, type PoolConfig } from "pg";
import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  }, "DATABASE_URL must use the postgres or postgresql protocol");

const positiveInteger = (fallback: number, maximum: number) =>
  z.coerce.number().int().min(1).max(maximum).default(fallback);

export type DatabaseEnvironment = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  DATABASE_POOL_MAX?: string;
};

export function databaseConfigFromEnvironment(environment: DatabaseEnvironment): PoolConfig | null {
  if (!environment.DATABASE_URL) return null;

  const connectionString = databaseUrlSchema.parse(environment.DATABASE_URL);
  const max = positiveInteger(10, 50).parse(environment.DATABASE_POOL_MAX ?? "10");
  const production = environment.NODE_ENV === "production";

  return {
    connectionString,
    application_name: "fixhub-api",
    max,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 5_000,
    query_timeout: 7_000,
    idle_in_transaction_session_timeout: 10_000,
    ...(production ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

export function createDatabasePool(
  environment: DatabaseEnvironment,
  onPoolError: (errorCode: string) => void = () => undefined,
): Pool | null {
  const config = databaseConfigFromEnvironment(environment);
  if (!config) return null;

  const pool = new Pool(config);
  pool.on("error", (error: NodeJS.ErrnoException) => {
    // Never log connection strings, server messages, or query data.
    onPoolError(typeof error.code === "string" ? error.code : "DATABASE_POOL_ERROR");
  });
  return pool;
}

export async function inTransaction<T>(
  pool: Pick<Pool, "connect">,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let transactionOpen = false;
  let released = false;
  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const result = await operation(client);
    await client.query("COMMIT");
    transactionOpen = false;
    return result;
  } catch (error) {
    if (transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch {
        client.release(true);
        released = true;
        throw error;
      }
    }
    throw error;
  } finally {
    if (!released) client.release();
  }
}
