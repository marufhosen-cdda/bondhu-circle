"use server";

import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActionError, type ActionContext, createAction } from "@/lib/actions/action";
import { db } from "@/lib/db";
import { activities, hostApplications, rsvps, users, venues } from "@/lib/db/schema";
import {
  activityFormSchema,
  checkinSchema,
  hostApplicationSchema,
  updateActivitySchema,
} from "@/lib/validations";
import { sendHostApprovalEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
void sendHostApprovalEmail;

function assertHostRole(role: string) {
  if (role !== "host" && role !== "admin") throw new ActionError("errors.unauthorized");
}

/** Apply to become a host. Approved hosts create activities after review. */
export const applyToHost = createAction({
  schema: hostApplicationSchema,
  rateLimit: { key: "report" },
  revalidate: ["/host"],
  handler: async (input, { user }: ActionContext) => {
    if (user.role === "host" || user.role === "admin") {
      throw new ActionError("host.apply.alreadyApproved");
    }

    const existing = await db
      .select()
      .from(hostApplications)
      .where(eq(hostApplications.userId, user.id))
      .limit(1);

    const current = existing[0];
    if (current?.status === "approved") {
      throw new ActionError("host.apply.alreadyApproved");
    }
    if (current?.status === "pending") {
      throw new ActionError("host.apply.pending");
    }

    if (current) {
      await db
        .update(hostApplications)
        .set({ motivation: input.motivation, experience: input.experience, status: "pending" })
        .where(eq(hostApplications.id, current.id));
    } else {
      await db
        .insert(hostApplications)
        .values({ userId: user.id, motivation: input.motivation, experience: input.experience });
    }

    await notify({
      userId: user.id,
      type: "host_approval",
      title: "Application received",
      body: "A real person reviews every application.",
      href: "/host",
      payload: {},
    });

    return { submitted: true };
  },
});

/** Create an activity (starts as `pending` admin approval). */
export const createActivity = createAction({
  schema: activityFormSchema,
  handler: async (input, { user }: ActionContext) => {
    assertHostRole(user.role);

    const venueRows = await db
      .select()
      .from(venues)
      .where(eq(venues.id, input.venueId))
      .limit(1);
    const venue = venueRows[0];
    if (!venue || !venue.approved || !venue.isPublic) {
      throw new ActionError("host.form.venueHint", { venueId: ["host.form.venueHint"] });
    }

    const startsAt = new Date(`${input.date}T${input.startTime}:00+06:00`);
    const endsAt = new Date(`${input.date}T${input.endTime}:00+06:00`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new ActionError("errors.validation", { date: ["Invalid date"] });
    }

    const rows = await db
      .insert(activities)
      .values({
        hostId: user.id,
        title: input.title,
        description: input.description,
        categoryInterestId: input.categoryInterestId,
        venueId: venue.id,
        areaId: venue.areaId,
        startsAt,
        endsAt,
        capacity: input.capacity,
        costBdt: input.costBdt,
        imageUrl: input.imageUrl || null,
        womenOnly: input.womenOnly,
        status: "pending",
      })
      .returning();

    const activity = rows[0];
    await notify({
      userId: user.id,
      type: "host_approval",
      title: "Activity submitted",
      body: input.title,
      href: "/host",
      payload: { activityId: activity.id },
    });

    return { activityId: activity.id };
  },
  revalidate: ["/host", "/activities"],
  tags: ["activities"],
});

/** Edit an activity the host owns (admin may edit any). */
export const updateActivity = createAction({
  schema: updateActivitySchema,
  revalidate: (input) => [`/activities/${input.id}`, "/host", "/activities"],
  tags: ["activities"],
  handler: async (input, { user }: ActionContext) => {
    assertHostRole(user.role);

    const rows = await db.select().from(activities).where(eq(activities.id, input.id)).limit(1);
    const activity = rows[0];
    if (!activity) throw new ActionError("errors.notFoundTitle");
    if (activity.hostId !== user.id && user.role !== "admin") {
      throw new ActionError("errors.unauthorized");
    }

    const venueRows = await db.select().from(venues).where(eq(venues.id, input.venueId)).limit(1);
    const venue = venueRows[0];
    if (!venue || !venue.approved || !venue.isPublic) {
      throw new ActionError("host.form.venueHint", { venueId: ["host.form.venueHint"] });
    }

    const startsAt = new Date(`${input.date}T${input.startTime}:00+06:00`);
    const endsAt = new Date(`${input.date}T${input.endTime}:00+06:00`);

    await db
      .update(activities)
      .set({
        title: input.title,
        description: input.description,
        categoryInterestId: input.categoryInterestId,
        venueId: venue.id,
        areaId: venue.areaId,
        startsAt,
        endsAt,
        capacity: input.capacity,
        costBdt: input.costBdt,
        imageUrl: input.imageUrl || null,
        womenOnly: input.womenOnly,
        // Host edits to a live activity go back into review.
        status: activity.status === "approved" ? "pending" : activity.status,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, input.id));

    return { activityId: input.id };
  },
});

/** Cancel an activity and tell everyone who planned to come. */
export const cancelActivity = createAction({
  schema: updateActivitySchema.pick({ id: true }),
  revalidate: (input) => [`/activities/${input.id}`, "/host", "/activities", "/home"],
  tags: ["activities"],
  handler: async (input, { user }: ActionContext) => {
    assertHostRole(user.role);

    const rows = await db.select().from(activities).where(eq(activities.id, input.id)).limit(1);
    const activity = rows[0];
    if (!activity) throw new ActionError("errors.notFoundTitle");
    if (activity.hostId !== user.id && user.role !== "admin") {
      throw new ActionError("errors.unauthorized");
    }

    await db
      .update(activities)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(activities.id, input.id));

    const attendees = await db
      .select({ rsvp: rsvps, user: users })
      .from(rsvps)
      .innerJoin(users, eq(rsvps.userId, users.id))
      .where(
        and(eq(rsvps.activityId, input.id), inArray(rsvps.status, ["going", "waitlist"])),
      );

    for (const a of attendees) {
      await notify({
        userId: a.user.id,
        type: "activity_reminder",
        title: activity.title,
        body: "Cancelled",
        href: `/activities/${activity.id}`,
        payload: { activityId: activity.id, cancelled: true },
      });
    }

    return { cancelled: true, notified: attendees.length };
  },
});

/** Mark an attendee as checked in (host or admin only). */
export const toggleCheckin = createAction({
  schema: checkinSchema,
  revalidate: (input) => [`/activities/${input.activityId}`, "/host"],
  handler: async (input, { user }: ActionContext) => {
    assertHostRole(user.role);

    const rows = await db
      .select()
      .from(activities)
      .where(eq(activities.id, input.activityId))
      .limit(1);
    const activity = rows[0];
    if (!activity) throw new ActionError("errors.notFoundTitle");
    if (activity.hostId !== user.id && user.role !== "admin") {
      throw new ActionError("errors.unauthorized");
    }

    const rsvpRows = await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.activityId, input.activityId), eq(rsvps.userId, input.userId)))
      .limit(1);

    if (!rsvpRows.length) throw new ActionError("errors.notFoundTitle");

    await db
      .update(rsvps)
      .set({ checkedIn: input.checkedIn, updatedAt: new Date() })
      .where(and(eq(rsvps.activityId, input.activityId), eq(rsvps.userId, input.userId)));

    return { checkedIn: input.checkedIn };
  },
});
