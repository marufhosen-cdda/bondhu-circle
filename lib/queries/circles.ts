import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  circleMembers,
  circleMessages,
  circles,
  pollOptions,
  pollVotes,
  polls,
  users,
  activities,
  venues,
  areas,
} from "@/lib/db/schema";

/** The user's current circle (if any), with everything the page needs. */
export async function getMyCircle(userId: string) {
  const membership = await db
    .select({ member: circleMembers, circle: circles })
    .from(circleMembers)
    .innerJoin(circles, eq(circleMembers.circleId, circles.id))
    .where(
      and(
        eq(circleMembers.userId, userId),
        inArray(circleMembers.status, ["invited", "active"]),
        eq(circles.status, "active"),
        sql`${circles.deletedAt} is null`,
      ),
    )
    .limit(1);

  const row = membership[0];
  if (!row) return null;

  return getCircleBundle(row.circle.id, row.member.id, userId);
}

/** Membership-scoped bundle used by the circle page. */
export async function getCircleBundle(circleId: number, membershipId: number, userId: string) {
  const circleRows = await db.select().from(circles).where(eq(circles.id, circleId)).limit(1);
  const circle = circleRows[0];
  if (!circle) return null;

  const members = await db
    .select({
      membership: circleMembers,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        gender: users.gender,
        birthYear: users.birthYear,
        areaId: users.areaId,
      },
    })
    .from(circleMembers)
    .innerJoin(users, eq(circleMembers.userId, users.id))
    .where(eq(circleMembers.circleId, circleId))
    .orderBy(asc(circleMembers.createdAt));

  const nextActivities = await db
    .select({
      activity: activities,
      venueName: venues.name,
      areaName: areas.nameEn,
    })
    .from(activities)
    .leftJoin(venues, eq(activities.venueId, venues.id))
    .leftJoin(areas, eq(activities.areaId, areas.id))
    .where(and(eq(activities.circleId, circleId), eq(activities.status, "approved")))
    .orderBy(asc(activities.startsAt))
    .limit(3);

  const pollRows = await db
    .select({ poll: polls })
    .from(polls)
    .where(eq(polls.circleId, circleId))
    .orderBy(desc(polls.createdAt))
    .limit(1);

  const poll = pollRows[0]?.poll ?? null;
  let pollBundle: PollBundle | null = null;

  if (poll) {
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll.id))
      .orderBy(asc(pollOptions.id));

    const votes = await db
      .select()
      .from(pollVotes)
      .where(eq(pollVotes.pollId, poll.id));

    pollBundle = {
      poll,
      options: options.map((o) => ({
        ...o,
        voteCount: votes.filter((v) => v.optionId === o.id).length,
        votedByMe: votes.some((v) => v.optionId === o.id && v.userId === userId),
      })),
      myVoteCount: votes.filter((v) => v.userId === userId).length,
      totalVotes: votes.length,
    };
  }

  const messages = await db
    .select({
      message: circleMessages,
      user: { id: users.id, name: users.name, avatarUrl: users.avatarUrl },
    })
    .from(circleMessages)
    .innerJoin(users, eq(circleMessages.userId, users.id))
    .where(eq(circleMessages.circleId, circleId))
    .orderBy(asc(circleMessages.createdAt))
    .limit(200);

  const myMembership = members.find((m) => m.membership.id === membershipId);

  return {
    circle,
    members,
    myMembership,
    nextActivities,
    poll: pollBundle,
    messages,
  };
}

export interface PollBundle {
  poll: typeof polls.$inferSelect;
  options: (typeof pollOptions.$inferSelect & { voteCount: number; votedByMe: boolean })[];
  myVoteCount: number;
  totalVotes: number;
}

/** Membership lookup used to enforce "visible only to members". */
export async function getCircleMembership(circleId: number, userId: string) {
  const rows = await db
    .select()
    .from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Every circle, for the admin overview. */
export async function listCircles() {
  return db
    .select({
      circle: circles,
      memberCount: sql<number>`(select count(*) from circle_members cm where cm.circle_id = ${circles.id} and cm.status = 'active')`.mapWith(Number),
      zoneLabel: circles.zone,
    })
    .from(circles)
    .orderBy(desc(circles.createdAt));
}

/** Members currently in an active circle — used by matching to exclude them. */
export async function getActiveCircleMemberIds() {
  const rows = await db
    .select({ userId: circleMembers.userId })
    .from(circleMembers)
    .innerJoin(circles, eq(circleMembers.circleId, circles.id))
    .where(
      and(
        inArray(circleMembers.status, ["invited", "active"]),
        eq(circles.status, "active"),
        sql`${circles.deletedAt} is null`,
      ),
    );
  return new Set(rows.map((r) => r.userId));
}
