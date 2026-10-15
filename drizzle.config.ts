import { defineConfig } from "drizzle-kit";

// drizzle-kit loads `.env` itself; make sure it is present for type-safe reads.
try {
  process.loadEnvFile();
} catch {
  // no .env — the error below will explain what is missing
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  strict: true,
  verbose: true,
});
