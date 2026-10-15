import { getTranslations } from "next-intl/server";
import {
  CalendarClock,
  CircleDot,
  Flag,
  ListChecks,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { getAdminOverview } from "@/lib/queries/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/motion";

export async function generateMetadata() {
  const t = await getTranslations("admin.overview");
  return { title: t("title") };
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [t, tu, { totals, recentSignups }] = await Promise.all([
    getTranslations("admin.overview"),
    getTranslations("admin.users"),
    getAdminOverview(),
  ]);

  const kpis = [
    { key: "totalUsers", value: totals.totalUsers, icon: Users, href: "/admin/users" },
    { key: "newThisWeek", value: totals.newThisWeek, icon: UserPlus, href: "/admin/users" },
    {
      key: "upcomingActivities",
      value: totals.upcomingActivities,
      icon: CalendarClock,
      href: "/admin/activities",
    },
    { key: "openReports", value: totals.openReports, icon: Flag, href: "/admin/reports" },
    { key: "activeCircles", value: totals.activeCircles, icon: CircleDot, href: "/admin/circles" },
    {
      key: "pendingApprovals",
      value: totals.pendingActivities + totals.pendingApplications + totals.pendingRequests,
      icon: ListChecks,
      href: "/admin/activities",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <StaggerItem key={kpi.key}>
            <Link href={kpi.href} className="block">
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 pt-6">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <kpi.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-2xl font-semibold tabular-nums">{kpi.value}</p>
                    <p className="text-sm text-muted-foreground">{t(kpi.key)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            {t("recentSignups")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {recentSignups.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-3">
                <Avatar className="size-9">
                  {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${user.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {user.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {user.areaName ?? "—"} · {tu("joined")}{" "}
                    {user.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{user.role}</Badge>
                  {user.status === "suspended" ? (
                    <Badge variant="destructive">{tu("suspended")}</Badge>
                  ) : null}
                  {user.onboardedAt ? <Badge variant="success">{tu("onboarded")}</Badge> : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
