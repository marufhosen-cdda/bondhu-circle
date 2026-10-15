import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";

/**
 * Targets the viewer has reported.
 *
 * Reported content disappears from *their* view immediately (see the
 * `safety.report.hiddenNote` string) while an admin decides what to do. The
 * reported party is never told, and nobody else loses access.
 */
export async function getMyReportedIds(
  userId: string,
  targetType: "user" | "activity" | "message",
): Promise<Set<string>> {
  const rows = await db
    .select({ targetId: reports.targetId })
    .from(reports)
    .where(and(eq(reports.reporterId, userId), eq(reports.targetType, targetType)));

  return new Set(rows.map((r) => r.targetId));
}
