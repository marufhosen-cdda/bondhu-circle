"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, Home, MessagesSquare, Mic2, User } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom navigation (4 tabs + profile). Fixed to the bottom edge with
 * safe-area padding so it sits above the iOS/Android home indicator.
 */
export function BottomNav({ isHost, isMember }: { isHost: boolean; isMember: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    { href: "/home", key: "home" as const, icon: Home },
    { href: "/activities", key: "activities" as const, icon: CalendarDays },
    { href: "/circles", key: "circles" as const, icon: MessagesSquare },
    ...(isHost ? [{ href: "/host", key: "host" as const, icon: Mic2 }] : []),
    { href: isMember ? "/profile/me" : "/home", key: "profile" as const, icon: User },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
