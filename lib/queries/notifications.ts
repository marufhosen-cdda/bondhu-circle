import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

/** Latest notifications for the bell / centre. */
export async function listNotifications(userId: string, limit = 20) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: string) {
  const rows = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(notifications)
    .where(sql`${notifications.userId} = ${userId} and ${notifications.readAt} is null`);
  return rows[0]?.count ?? 0;
}
