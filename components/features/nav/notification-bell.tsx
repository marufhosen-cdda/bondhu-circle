import { Bell } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getTranslations } from "next-intl/server";

/** Unread badge is computed server-side; no polling, no client state. */
export async function NotificationBell({ userId }: { userId: string }) {
  const [count, t] = await Promise.all([getUnreadCount(userId), getTranslations("nav")]);

  return (
    <Link
      href="/notifications"
      aria-label={`${t("notifications")}${count > 0 ? ` (${count})` : ""}`}
      className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
