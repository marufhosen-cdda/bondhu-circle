import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "@/lib/env";

/**
 * Applies every SQL file in ./drizzle to DATABASE_URL.
 * Run with: npm run db:generate && npm run db:migrate
 */
async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log(`Migrating ${env.DATABASE_URL.replace(/:[^:@/]*@/, ":***@")} …`);
  await migrate(db, { migrationsFolder: "./drizzle" });

  const tables = await client`
    select tablename from pg_tables
    where schemaname = 'public' and tablename not like '\\_drizzle%'
    order by tablename`;
  console.log(`Done. ${tables.length} tables: ${tables.map((r) => r.tablename).join(", ")}`);

  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
