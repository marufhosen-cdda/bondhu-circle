import { getTranslations } from "next-intl/server";
import { CalendarPlus, Clock3, Plus, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireOnboarded } from "@/lib/session";
import { getHostApplication } from "@/lib/queries/host";
import { getHostActivities } from "@/lib/queries/activities";
import { PageHeader } from "@/components/features/shared/page-header";
import { EmptyState } from "@/components/features/shared/empty-state";
import { HostApplicationForm } from "@/components/features/host/host-application-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/motion";
import { formatDateTime } from "@/lib/dates";

export async function generateMetadata() {
  const t = await getTranslations("host.dashboard");
  return { title: t("title") };
}

const STATUS_VARIANT: Record<string, "warning" | "success" | "destructive" | "secondary"> =
  {
    pending: "warning",
    approved: "success",
    cancelled: "destructive",
    completed: "secondary",
  };

export default async function HostPage() {
  const user = await requireOnboarded();
  const [t, ta, th] = await Promise.all([
    getTranslations("host.dashboard"),
    getTranslations("host.apply"),
    getTranslations("host"),
  ]);

  const isHost = user.role === "host" || user.role === "admin";

  if (!isHost) {
    const application = await getHostApplication(user.id);

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title={ta("title")} subtitle={ta("subtitle")} />

        {application?.status === "pending" ? (
          <Alert>
            <Clock3 aria-hidden />
            <AlertTitle>{ta("pending")}</AlertTitle>
            <AlertDescription>{ta("subtitle")}</AlertDescription>
          </Alert>
        ) : null}

        {application?.status === "rejected" ? (
          <Alert variant="destructive">
            <AlertTitle>{ta("rejected")}</AlertTitle>
            <AlertDescription>{ta("subtitle")}</AlertDescription>
          </Alert>
        ) : null}

        <FadeUp>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{ta("motivation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <HostApplicationForm />
            </CardContent>
          </Card>
        </FadeUp>
      </div>
    );
  }

  const activities = await getHostActivities(user.id);
  const now = new Date();
  const upcoming = activities.filter(
    (row) => row.activity.startsAt >= now && row.activity.status !== "cancelled",
  );
  const past = activities.filter(
    (row) => row.activity.startsAt < now || row.activity.status === "cancelled",
  );

  function ActivityRow({
    row,
  }: {
    row: Awaited<ReturnType<typeof getHostActivities>>[number];
  }) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/host/${row.activity.id}`}
              className="truncate text-sm font-medium hover:underline"
            >
              {row.activity.title}
            </Link>
            <Badge variant={STATUS_VARIANT[row.activity.status]}>
              {th(`status.${row.activity.status}`)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(row.activity.startsAt, user.locale)}
            {row.venueName ? ` · ${row.venueName}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden />
            {row.goingCount}/{row.activity.capacity}
          </span>
          {row.waitlistCount > 0 ? <span>+{row.waitlistCount}</span> : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/host/${row.activity.id}`}>{t("attendees")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        subtitle={ta("subtitle")}
        actions={
          <Button asChild>
            <Link href="/host/new">
              <Plus aria-hidden />
              {t("create")}
            </Link>
          </Button>
        }
      />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarPlus className="size-5 text-primary" aria-hidden />
          {t("myActivities")}
        </h2>

        {activities.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title={t("noActivities")}
            actionLabel={t("create")}
            actionHref="/host/new"
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((row) => (
              <ActivityRow key={row.activity.id} row={row} />
            ))}
            {past.length ? (
              <div className="pt-2">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {th("status.completed")}
                </p>
                <div className="space-y-3">
                  {past.map((row) => (
                    <ActivityRow key={row.activity.id} row={row} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
