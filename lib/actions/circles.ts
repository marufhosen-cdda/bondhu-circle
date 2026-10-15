"use server";

import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { ActionError, type ActionContext, createAction } from "@/lib/actions/action";
import { db } from "@/lib/db";
import {
  circleMembers,
  circleMessages,
  circleRequests,
  circles,
  pollOptions,
  pollVotes,
  polls,
} from "@/lib/db/schema";
import {
  circleMessageSchema,
  circleRequestSchema,
  createPollSchema,
  leaveCircleSchema,
  pollVoteSchema,
} from "@/lib/validations";
import { notify } from "@/lib/notify";

/** Membership gate shared by every circle action. */
async function requireMember(circleId: number, userId: string) {
  const rows = await db
    .select({ member: circleMembers, circle: circles })
    .from(circleMembers)
    .innerJoin(circles, eq(circleMembers.circleId, circles.id))
    .where(
      and(
        eq(circleMembers.circleId, circleId),
        eq(circleMembers.userId, userId),
        eq(circles.status, "active"),
        sql`${circles.deletedAt} is null`,
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) throw new ActionError("errors.unauthorized");
  if (row.member.status === "left" || row.member.status === "declined") {
    throw new ActionError("errors.unauthorized");
  }
  return row.member;
}

/** Post a lightweight comment. No real-time — the page revalidates on write. */
export const postCircleMessage = createAction({
  schema: circleMessageSchema,
  authorize: "user",
  rateLimit: { key: "message" },
  revalidate: (input) => [`/circles/${input.circleId}`],
  handler: async (input, { user }: ActionContext) => {
    await requireMember(input.circleId, user.id);

    // Hide messages from anyone the author blocked (or who blocked them).
    const rows = await db
      .insert(circleMessages)
      .values({ circleId: input.circleId, userId: user.id, body: input.body })
      .returning();

    const message = rows[0];
    if (!message) throw new ActionError("errors.generic");

    const fellowMembers = await db
      .select({ userId: circleMembers.userId })
      .from(circleMembers)
      .where(
        and(
          eq(circleMembers.circleId, input.circleId),
          sql`${circleMembers.userId} <> ${user.id}`,
          eq(circleMembers.status, "active"),
        ),
      );

    for (const m of fellowMembers) {
      await notify({
        userId: m.userId,
        type: "generic",
        title: user.name,
        body: input.body.slice(0, 120),
        href: `/circles/${input.circleId}`,
        payload: { circleId: input.circleId, messageId: message.id },
      });
    }

    return { messageId: message.id };
  },
});

/**
 * Vote on the meetup time poll. Voting again replaces the previous choice,
 * all inside one transaction.
 */
export const votePoll = createAction({
  schema: pollVoteSchema,
  revalidate: ["/circles", "/home"],
  handler: async (input, { user }: ActionContext) => {
    const pollRows = await db.select().from(polls).where(eq(polls.id, input.pollId)).limit(1);
    const poll = pollRows[0];
    if (!poll) throw new ActionError("errors.notFoundTitle");
    if (poll.status !== "open") throw new ActionError("errors.generic");

    await requireMember(poll.circleId, user.id);

    const optionRows = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, input.pollId));
    const validIds = new Set(optionRows.map((o) => o.id));
    if (!input.optionIds.every((id) => validIds.has(id))) {
      throw new ActionError("errors.validation");
    }

    await db.transaction(async (tx) => {
      await tx.delete(pollVotes).where(eq(pollVotes.pollId, input.pollId));
      await tx
        .insert(pollVotes)
        .values(input.optionIds.map((optionId) => ({ pollId: input.pollId, optionId, userId: user.id })));
    });

    return { voted: input.optionIds.length };
  },
});

/** Any active member can propose another time poll for the circle. */
export const createPoll = createAction({
  schema: createPollSchema,
  revalidate: (input) => [`/circles/${input.circleId}`],
  handler: async (input, { user }: ActionContext) => {
    await requireMember(input.circleId, user.id);

    const created = await db.transaction(async (tx) => {
      const [poll] = await tx
        .insert(polls)
        .values({ circleId: input.circleId, title: input.title, status: "open" })
        .returning();

      await tx
        .insert(pollOptions)
        .values(input.options.map((o) => ({ pollId: poll.id, label: o.label })));

      return poll;
    });

    return { pollId: created.id };
  },
});

/** Leave a circle. The seat goes back to the matching pool. */
export const leaveCircle = createAction({
  schema: leaveCircleSchema,
  revalidate: (input) => [`/circles/${input.circleId}`, "/circles", "/home"],
  handler: async (input, { user }: ActionContext) => {
    const member = await requireMember(input.circleId, user.id);
    await db
      .update(circleMembers)
      .set({ status: "left", leftAt: new Date() })
      .where(eq(circleMembers.id, member.id));

    // A circle with fewer than 3 active members goes back to forming.
    const remaining = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(circleMembers)
      .where(
        and(
          eq(circleMembers.circleId, input.circleId),
          eq(circleMembers.status, "active"),
          sql`${circleMembers.userId} <> ${user.id}`,
        ),
      );

    if ((remaining[0]?.count ?? 0) < 3) {
      await db
        .update(circles)
        .set({ status: "forming", updatedAt: new Date() })
        .where(eq(circles.id, input.circleId));
    }

    return { left: true };
  },
});

/** "Request a new circle" with an optional private reason. */
export const requestCircle = createAction({
  schema: circleRequestSchema,
  rateLimit: { key: "circleRequest" },
  revalidate: ["/circles"],
  handler: async (input, { user }: ActionContext) => {
    const openCount = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(circleRequests)
      .where(
        and(eq(circleRequests.userId, user.id), eq(circleRequests.status, "open")),
      );

    if ((openCount[0]?.count ?? 0) > 0) throw new ActionError("circles.request.submitted");

    const rows = await db
      .insert(circleRequests)
      .values({ userId: user.id, reason: input.reason || null })
      .returning();

    return { requestId: rows[0]?.id ?? 0 };
  },
});
