"use client";

import { useTranslations } from "next-intl";
import { CalendarDays, Home, MessagesSquare, Mic2 } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/home", key: "home", icon: Home, show: "always" },
  { href: "/activities", key: "activities", icon: CalendarDays, show: "always" },
  { href: "/circles", key: "circles", icon: MessagesSquare, show: "always" },
  { href: "/host", key: "host", icon: Mic2, show: "host" },
] as const;

/** Desktop top-nav links; the active route is highlighted. */
export function NavLinks({ isHost }: { isHost: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
      {items
        .filter((item) => item.show === "always" || isHost)
        .map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              {t(item.key as "home")}
            </Link>
          );
        })}
    </nav>
  );
}
