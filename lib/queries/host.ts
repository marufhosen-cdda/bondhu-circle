import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, areas, hostApplications, venues } from "@/lib/db/schema";

/** Latest host application for this member (drives the /host page state). */
export async function getHostApplication(userId: string) {
  const rows = await db
    .select()
    .from(hostApplications)
    .where(eq(hostApplications.userId, userId))
    .orderBy(desc(hostApplications.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

/** One activity with its venue/area, for the host management screen. */
export async function getHostActivity(activityId: number) {
  const rows = await db
    .select({ activity: activities, venue: venues, area: areas })
    .from(activities)
    .leftJoin(venues, eq(activities.venueId, venues.id))
    .leftJoin(areas, eq(activities.areaId, areas.id))
    .where(eq(activities.id, activityId))
    .limit(1);

  return rows[0] ?? null;
}
