import "server-only";

import { z } from "zod";

// Standalone scripts (`tsx`) don't get Next's .env loading — do it ourselves.
// `loadEnvFile` never overrides variables already present in the environment.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file: validation below reports what is missing.
  }
}

/**
 * All environment variables are validated once, at import time, with Zod.
 * A missing variable fails fast with a readable message instead of surfacing
 * as a runtime error deep inside a request.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL must be a postgresql:// connection string" })
    .refine((v) => v.startsWith("postgres"), {
      message: "DATABASE_URL must start with postgres:// or postgresql://",
    }),

  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 chars"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  SMS_PROVIDER: z.enum(["console", "twilio"]).default("console"),
  SMS_FROM: z.string().default("Bondhu"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Bondhu Circle <onboarding@resend.dev>"),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  MATCHING_DAY: z.coerce.number().int().min(0).max(6).default(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}\n\nCopy .env.example to .env and fill it in.`);
}

export const env = parsed.data;

/** True when real email delivery is configured (otherwise we log to console). */
export const emailEnabled = Boolean(env.RESEND_API_KEY);

/** True when real SMS delivery is configured (otherwise we log to console). */
export const smsEnabled = env.SMS_PROVIDER === "twilio" && Boolean(env.TWILIO_ACCOUNT_SID);

/** True when R2 uploads are configured (otherwise we write to ./public/uploads). */
export const r2Enabled = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
);
