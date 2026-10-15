import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

/** Current Better Auth session (or null). */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Full row from `users`, including status/role/profile columns. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  return rows[0] ?? null;
}

export type GuardedUser = User;

function nextPath(pathname?: string) {
  return pathname ? `?next=${encodeURIComponent(pathname)}` : "";
}

/**
 * Server Action / page guard: must be signed in, not suspended.
 * Suspended users are signed out and parked on the sign-in screen.
 */
export async function requireUser(nextPathname?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getLocale();
    redirect(`/${locale}/sign-in${nextPath(nextPathname)}`);
  }
  if (user.status === "suspended") {
    await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
    const locale = await getLocale();
    redirect(`/${locale}/sign-in?error=suspended`);
  }
  return user;
}

/** Admin-only guard used by every (admin) page. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    const locale = await getLocale();
    redirect(`/${locale}/home`);
  }
  return user;
}

/** Phone verification is required before joining circles or activities. */
export async function requireVerifiedPhone(): Promise<User> {
  const user = await requireUser();
  if (!user.phoneNumberVerified) {
    const locale = await getLocale();
    redirect(`/${locale}/onboarding?step=phone`);
  }
  return user;
}

/** Onboarding completion check used by the (app) pages. */
export async function requireOnboarded(): Promise<User> {
  const user = await requireUser();
  if (!user.onboardedAt) {
    const locale = await getLocale();
    redirect(`/${locale}/onboarding`);
  }
  return user;
}
