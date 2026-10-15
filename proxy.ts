import { NextResponse, type NextRequest } from "next/server";
import createI18nMiddleware from "next-intl/middleware";
import { eq } from "drizzle-orm";

import { routing, isLocale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Next.js 16 `proxy` (formerly middleware).
 *
 * Responsibilities, in order:
 *   1. Forward `/api/auth/*` to Better Auth — the project ships no API routes.
 *   2. Guard the (app) and (admin) route groups.
 *   3. Hand off to next-intl for locale detection/prefixing.
 *
 * Route groups are invisible in the URL, so protection is keyed on the first
 * path segment after the locale (e.g. `/en/admin/reports` → `admin`).
 */

const handleI18n = createI18nMiddleware(routing);

const PROTECTED = new Set([
  "home",
  "circles",
  "activities",
  "host",
  "profile",
  "settings",
  "onboarding",
  "admin",
]);

/** Pages reachable without onboarding (plus admin, seeded as onboarded). */
const PRE_ONBOARDING = new Set(["onboarding", "settings", "profile"]);

async function clearSessionCookies(response: NextResponse) {
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("better-auth.session_data");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  // 1. Better Auth owns /api/auth/*.
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return auth.handler(request) as unknown as NextResponse;
  }

  // 2. Split off the locale prefix (it may be missing — next-intl will add it).
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";
  const locale = isLocale(firstSegment) ? firstSegment : routing.defaultLocale;
  const rest = isLocale(firstSegment) ? segments.slice(1) : segments;
  const head = rest[0] ?? "";

  if (!PROTECTED.has(head)) {
    return handleI18n(request);
  }

  const redirect = (to: string, init?: ResponseInit) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    return NextResponse.redirect(url, init);
  };

  // 3. Session check.
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    const target =
      rest.length > 0
        ? `/${locale}/sign-in?next=${encodeURIComponent(pathname + search)}`
        : `/${locale}/sign-in`;
    return redirect(target);
  }

  const rows = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const user = rows[0];

  if (!user || user.deletedAt) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.search = "";
    const response = NextResponse.redirect(url);
    await clearSessionCookies(response);
    return response;
  }

  // 4. Suspended users are signed out immediately.
  if (user.status === "suspended") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/sign-in`;
    url.search = "?error=suspended";
    const response = NextResponse.redirect(url);
    await clearSessionCookies(response);
    return response;
  }

  // 5. Admin area requires the admin role (pages re-check server-side too).
  if (head === "admin" && user.role !== "admin") {
    return redirect(`/${locale}/home`);
  }

  // 6. Everyone else must finish onboarding first.
  if (!user.onboardedAt && user.role !== "admin" && !PRE_ONBOARDING.has(head)) {
    return redirect(`/${locale}/onboarding`);
  }

  return handleI18n(request);
}

export const config = {
  // Skip real files and Next's own assets; keep /api/auth matched.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
