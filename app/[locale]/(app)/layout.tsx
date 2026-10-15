import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";
import { NavLinks } from "@/components/features/nav/nav-links";
import { BottomNav } from "@/components/features/nav/bottom-nav";
import { NotificationBell } from "@/components/features/nav/notification-bell";
import { UserMenu } from "@/components/features/nav/user-menu";

/**
 * Shell for every signed-in route: desktop top bar + mobile bottom nav.
 * The proxy already guards these paths; the server-side check here is the
 * authoritative one (the proxy can be bypassed by misconfigured rewrites).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const t = await getTranslations("common");
  const isHost = user.role === "host" || user.role === "admin";

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/home"
              className="flex items-center gap-2 font-semibold tracking-tight"
              aria-label={t("appName")}
            >
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                ব
              </span>
              <span className="hidden sm:inline">Bondhu Circle</span>
            </Link>
            <NavLinks isHost={isHost} />
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LocaleSwitcher />
            <NotificationBell userId={user.id} />
            <UserMenu
              user={{
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
              }}
            />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">
        {children}
      </main>

      <BottomNav isHost={isHost} isMember />
    </div>
  );
}
