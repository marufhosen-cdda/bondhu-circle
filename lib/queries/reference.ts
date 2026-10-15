import "server-only";

import { asc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/lib/db";
import { areas, interests } from "@/lib/db/schema";

/** All Dhaka areas, grouped by zone. Cached per request. */
export const getAreas = cache(async () => {
  return db.select().from(areas).orderBy(asc(areas.zone), asc(areas.nameEn));
});

export const getAreaById = cache(async (id: number) => {
  const rows = await db.select().from(areas).where(eq(areas.id, id)).limit(1);
  return rows[0] ?? null;
});

/** Interest catalogue used by onboarding and activity categories. */
export const getInterests = cache(async () => {
  return db.select().from(interests).orderBy(asc(interests.nameEn));
});

export const getInterestById = cache(async (id: number) => {
  const rows = await db.select().from(interests).where(eq(interests.id, id)).limit(1);
  return rows[0] ?? null;
});

export type AreaRow = typeof areas.$inferSelect;
export type InterestRow = typeof interests.$inferSelect;
