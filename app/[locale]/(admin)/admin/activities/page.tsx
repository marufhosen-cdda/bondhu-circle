import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { listAdminActivities } from "@/lib/queries/admin";
import { ActivityReviewActions } from "@/components/features/admin/activity-review-actions";
import { EmptyState } from "@/components/features/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "approved", "cancelled", "completed"] as const;

export async function generateMetadata() {
  const t = await getTranslations("admin.activities");
  return { title: t("title") };
}

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const admin = await requireAdmin();
  const { status } = await searchParams;
  const active = STATUSES.find((s) => s === status) ?? "pending";

  const [t, th, rows] = await Promise.all([
    getTranslations("admin.activities"),
    getTranslations("host.status"),
    listAdminActivities(active),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <nav aria-label={t("filterStatus")} className="flex flex-wrap gap-2">
        {STATUSES.map((option) => (
          <Link
            key={option}
            href={`/admin/activities?status=${option}`}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm transition-colors",
              option === active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {th(option)}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.activity.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/activities/${row.activity.id}`}
                    className="text-base font-medium hover:underline"
                  >
                    {row.activity.title}
                  </Link>
                  <Badge
                    variant={
                      row.activity.status === "pending"
                        ? "warning"
                        : row.activity.status === "approved"
                          ? "success"
                          : "outline"
                    }
                  >
                    {th(row.activity.status)}
                  </Badge>
                  {row.activity.womenOnly ? <Badge variant="outline">women only</Badge> : null}
                </div>

                <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDateTime(row.activity.startsAt, admin.locale)}</span>
                  <span>
                    {row.venueName ?? "—"}
                    {row.areaName ? ` · ${row.areaName}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden />
                    {row.goingCount}/{row.activity.capacity}
                  </span>
                  <Link href={`/profile/${row.hostId}`} className="hover:underline">
                    {row.hostName}
                  </Link>
                </p>

                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {row.activity.description}
                </p>

                <ActivityReviewActions
                  activityId={row.activity.id}
                  status={row.activity.status}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
