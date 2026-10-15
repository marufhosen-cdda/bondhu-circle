"use server";

import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { ActionError, type ActionContext, createAction } from "@/lib/actions/action";
import { db } from "@/lib/db";
import { blocks, reports, users } from "@/lib/db/schema";
import { blockSchema, reportSchema } from "@/lib/validations";

/**
 * Report a user, activity or message.
 *
 * The report itself is private: the reporter keeps seeing the content, and the
 * reported party never learns who reported them.
 */
export const reportAction = createAction({
  schema: reportSchema,
  rateLimit: { key: "report" },
  revalidate: ["/"],
  handler: async (input, { user }: ActionContext) => {
    if (input.targetType === "user" && input.targetId === user.id) {
      throw new ActionError("errors.validation");
    }

    // One open report per target per reporter.
    const existing = await db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, user.id),
          eq(reports.targetType, input.targetType),
          eq(reports.targetId, input.targetId),
        ),
      )
      .limit(1);

    if (existing.length) throw new ActionError("safety.report.already");

    const rows = await db
      .insert(reports)
      .values({
        reporterId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details || null,
      })
      .returning();

    return { reportId: rows[0]?.id ?? 0 };
  },
});

/**
 * Block a member. Blocked pairs never share a circle, and each side's messages
 * are hidden from the other (enforced at read time by `getBlockedIds`).
 */
export const blockAction = createAction({
  schema: blockSchema,
  revalidate: (input) => [`/profile/${input.userId}`, "/settings"],
  handler: async (input, { user }: ActionContext) => {
    if (input.userId === user.id) throw new ActionError("errors.validation");

    const target = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!target.length) throw new ActionError("errors.notFoundTitle");

    const existing = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, input.userId)))
      .limit(1);

    if (!existing.length) {
      await db.insert(blocks).values({ blockerId: user.id, blockedId: input.userId });
    }

    // Leaving any shared circle keeps the two apart from now on.
    await db.execute(sql`
      update circle_members cm set status = 'left', left_at = now()
      where cm.status = 'active'
        and cm.user_id in (${user.id}, ${input.userId})
        and exists (
          select 1 from circle_members other
          where other.circle_id = cm.circle_id
            and other.user_id in (${user.id}, ${input.userId})
            and other.status = 'active'
            and other.user_id <> cm.user_id
        )
    `);

    return { blocked: true };
  },
});

/** Unblock from the settings block list. */
export const unblockAction = createAction({
  schema: blockSchema,
  revalidate: ["/settings"],
  handler: async (input, { user }: ActionContext) => {
    await db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, input.userId)));
    return { unblocked: true };
  },
});
