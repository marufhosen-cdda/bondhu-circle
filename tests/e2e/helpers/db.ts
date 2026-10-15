import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

/**
 * Test-side database access.
 *
 * The smoke test drives the real UI, so it needs the codes the dev server
 * "sends": Better Auth stores OTPs in the `verifications` table (plain text by
 * default), which is exactly what lets the test complete a genuine OTP
 * sign-in instead of stubbing authentication.
 */
function loadEnvFile() {
  const file = join(process.cwd(), ".env");
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile();

if (!process.env.DATABASE_URL) {
  throw new Error("tests/e2e needs DATABASE_URL (set it in .env or the environment)");
}

export const sql = postgres(process.env.DATABASE_URL, { max: 2 });

/** Latest OTP for an email address or phone number. */
export async function readOtp(fragment: string): Promise<string> {
  const rows = await sql<{ value: string }[]>`
    select value from verifications
    where identifier like ${`%${fragment}%`}
    order by created_at desc
    limit 1
  `;

  const value = rows[0]?.value;
  if (!value) throw new Error(`No OTP stored for ${fragment} yet`);

  // Stored as "<code>" or "<code>:<attempts>".
  return value.split(":")[0];
}

/** An approved, upcoming, mixed-gender activity with a free seat. */
export async function findBookableActivityId(): Promise<number> {
  const rows = await sql<{ id: number }[]>`
    select a.id
    from activities a
    where a.status = 'approved'
      and a.starts_at > now()
      and a.women_only = false
      and (
        select count(*) from rsvps r
        where r.activity_id = a.id and r.status = 'going'
      ) < a.capacity
    order by a.starts_at asc
    limit 1
  `;

  const id = rows[0]?.id;
  if (!id) throw new Error("No bookable activity found — run `npm run db:seed` first");
  return id;
}

/** Venue address for an activity, used to assert the post-RSVP reveal. */
export async function activityAddress(activityId: number): Promise<string | null> {
  const rows = await sql<{ address: string | null }[]>`
    select v.address
    from activities a
    left join venues v on v.id = a.venue_id
    where a.id = ${activityId}
    limit 1
  `;
  return rows[0]?.address ?? null;
}

export async function closeDb() {
  await sql.end({ timeout: 5 });
}
