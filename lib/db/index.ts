import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

/**
 * Server-only Drizzle client.
 *
 * `postgres()` is used in prepared-query mode so the same instance can be
 * shared across requests without leaking per-request state.
 */
const client = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
