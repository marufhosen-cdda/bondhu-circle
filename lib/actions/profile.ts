"use server";

import "server-only";

import { eq, sql } from "drizzle-orm";

import { ActionError, type ActionContext, createAction } from "@/lib/actions/action";
import { db } from "@/lib/db";
import {
  activities,
  availability,
  circleMembers,
  feedback,
  notifications,
  preferences,
  rsvps,
  userInterests,
  userSettings,
  users,
} from "@/lib/db/schema";
import {
  deleteAccountSchema,
  notificationPrefsSchema,
  profileSchema,
  settingsSchema,
} from "@/lib/validations";

/** Edit public profile fields. */
export const updateProfile = createAction({
  schema: profileSchema,
  revalidate: (_input, user) => [`/profile/${user.id}`, "/settings", "/home"],
  handler: async (input, { user }: ActionContext): Promise<{ id: string }> => {
    const [updated] = await db
      .update(users)
      .set({
        name: input.name,
        gender: input.gender || null,
        birthYear: input.birthYear ?? null,
        bio: input.bio || null,
        avatarUrl: input.avatarUrl || null,
        areaId: input.areaId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    if (!updated) throw new ActionError("errors.generic");
    return { id: updated.id };
  },
});

/** Notification preferences (settings page). */
export const updateNotificationPrefs = createAction({
  schema: notificationPrefsSchema,
  revalidate: ["/settings"],
  handler: async (input, { user }: ActionContext) => {
    await db
      .insert(userSettings)
      .values({ userId: user.id, ...input, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...input, updatedAt: new Date() },
      });
    return { saved: true };
  },
});

/** Preferred language stored on the user record (URL prefix stays the source of truth for rendering). */
export const updateLanguage = createAction({
  schema: settingsSchema,
  revalidate: ["/settings", "/"],
  handler: async (input, { user }: ActionContext) => {
    await db.update(users).set({ locale: input.locale, updatedAt: new Date() }).where(eq(users.id, user.id));
    return { locale: input.locale };
  },
});

/**
 * Delete the account and remove personal data.
 *
 * Rows created by other people (circle messages already posted) keep their
 * content but lose the author link, so circles do not break apart.
 */
export const deleteAccount = createAction({
  schema: deleteAccountSchema,
  revalidate: ["/", "/sign-in"],
  handler: async (input, { user }: ActionContext) => {
    if (input.confirm !== "DELETE") throw new ActionError("settings.deleteError");

    await db.transaction(async (tx) => {
      await tx.delete(userInterests).where(eq(userInterests.userId, user.id));
      await tx.delete(availability).where(eq(availability.userId, user.id));
      await tx.delete(preferences).where(eq(preferences.userId, user.id));
      await tx.delete(userSettings).where(eq(userSettings.userId, user.id));
      await tx.delete(notifications).where(eq(notifications.userId, user.id));
      await tx.delete(feedback).where(eq(feedback.userId, user.id));
      await tx
        .update(rsvps)
        .set({ status: "cancelled" })
        .where(eq(rsvps.userId, user.id));
      await tx
        .update(circleMembers)
        .set({ status: "left", leftAt: new Date() })
        .where(eq(circleMembers.userId, user.id));
      await tx
        .update(activities)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          sql`${activities.hostId} = ${user.id} and ${activities.status} in ('pending', 'approved')`,
        );

      // Remove identity: the account row is kept (anonymous) so sessions can
      // be invalidated and foreign keys stay valid.
      await tx
        .update(users)
        .set({
          name: "Deleted member",
          email: `deleted+${user.id}@bondhu.invalid`,
          bio: null,
          avatarUrl: null,
          phoneNumber: null,
          phoneNumberVerified: false,
          gender: null,
          birthYear: null,
          areaId: null,
          status: "suspended",
          onboardedAt: null,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await tx.execute(sql`delete from sessions where user_id = ${user.id}`);
      await tx.execute(sql`delete from accounts where user_id = ${user.id}`);
    });

    return { deleted: true };
  },
});
