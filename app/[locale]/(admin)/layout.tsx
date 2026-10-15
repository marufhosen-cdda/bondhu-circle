import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  Gauge,
  LayoutGrid,
  ListChecks,
  MapPinned,
  ShieldAlert,
  Users,
  VenetianMask,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";

/**
 * Admin shell.
 *
 * `proxy.ts` also guards `/admin`, but the authoritative check is here: a
 * non-admin (or suspended) session never renders this tree.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = await getTranslations();

  const links = [
    { href: "/admin", label: t("admin.overview.title"), icon: LayoutGrid },
    { href: "/admin/users", label: t("admin.users.title"), icon: Users },
    { href: "/admin/reports", label: t("admin.reports.title"), icon: ShieldAlert },
    { href: "/admin/host-applications", label: t("admin.hosts.title"), icon: ListChecks },
    { href: "/admin/activities", label: t("admin.activities.title"), icon: ListChecks },
    { href: "/admin/venues", label: t("admin.venues.title"), icon: MapPinned },
    { href: "/admin/circles", label: t("admin.circles.title"), icon: VenetianMask },
    { href: "/admin/metrics", label: t("admin.metrics.title"), icon: Gauge },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("common.appName")}
            </Link>
            <span className="text-sm font-semibold">{t("admin.overview.title")}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </div>

        <nav aria-label={t("admin.overview.title")} className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto pb-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <link.icon className="size-4" aria-hidden />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}

