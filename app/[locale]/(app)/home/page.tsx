import { getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck, CalendarPlus, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireOnboarded } from "@/lib/session";
import { getMyCircle } from "@/lib/queries/circles";
import { getMyRsvps, getPendingFeedback, getSuggestedActivities } from "@/lib/queries/activities";
import { PageHeader } from "@/components/features/shared/page-header";
import { EmptyState } from "@/components/features/shared/empty-state";
import { ActivityCard } from "@/components/features/activities/activity-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stagger, StaggerItem, FadeUp } from "@/components/motion";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await requireOnboarded();
  const locale = user.locale;

  const [t, circle, upcoming, suggested, pendingFeedback] = await Promise.all([
    getTranslations("home"),
    getMyCircle(user.id),
    getMyRsvps(user.id),
    getSuggestedActivities(user.id, user.areaId, 6),
    getPendingFeedback(user.id),
  ]);

  const now = new Date();
  const nextUp = upcoming.filter((r) => r.activity.startsAt > now).slice(0, 3);
  const pastUp = upcoming.filter((r) => r.activity.startsAt <= now).slice(-2);

  return (
    <div className="space-y-10">
      <PageHeader
        title={t("greeting", { name: user.name.split(" ")[0] })}
        subtitle={t("subtitle")}
      />

      {/* ------------------------------------------------------- Your circle */}
      {circle ? (
        <FadeUp>
          <Card className="overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{circle.circle.name}</CardTitle>
                  <Badge variant={circle.circle.status === "active" ? "success" : "secondary"}>
                    {circle.circle.status === "active"
                      ? t("yourCircle")
                      : t("formingTitle")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("members", { count: circle.members.length })} · {circle.circle.zone}
                </p>
              </div>

              <div className="flex -space-x-2">
                {circle.members.slice(0, 5).map((m) => (
                  <Avatar key={m.user.id} className="size-9 border-2 border-background">
                    {m.user.avatarUrl ? <AvatarImage src={m.user.avatarUrl} alt="" /> : null}
                    <AvatarFallback>
                      {m.user.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardHeader>

            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t("nextMeetup")}</p>
                {circle.nextActivities.length ? (
                  <p className="mt-1">
                    {circle.nextActivities[0].activity.title} ·{" "}
                    {formatDateTime(circle.nextActivities[0].activity.startsAt, locale)}
                  </p>
                ) : (
                  <p className="mt-1">{t("noMeetupYet")}</p>
                )}
                {circle.poll ? (
                  <Badge variant="outline" className="mt-2">
                    {circle.poll.poll.status === "open" ? t("pollOpen") : t("pollClosed")}
                  </Badge>
                ) : null}
              </div>

              <Button asChild>
                <Link href={`/circles/${circle.circle.id}`}>
                  {t("viewCircle")} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeUp>
      ) : (
        <FadeUp>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>{t("formingTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("formingText")}</p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t("formingHint")}</p>
              <Button variant="outline" asChild>
                <Link href="/activities">{t("suggested")} </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeUp>
      )}

      {/* --------------------------------------------------- Feedback prompt */}
      {pendingFeedback.length > 0 ? (
        <FadeUp>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" aria-hidden />
                {t("feedbackPrompt")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t("feedbackPromptText")}</p>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/activities/${pendingFeedback[0].activity.id}?feedback=1`}>
                  {t("feedbackCta")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </FadeUp>
      ) : null}

      {/* -------------------------------------------------------- Upcoming */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarCheck className="size-5 text-primary" aria-hidden />
            {t("upcoming")}
          </h2>
        </div>

        {nextUp.length === 0 ? (
          <EmptyState
            title={t("upcomingEmpty")}
            actionLabel={t("suggested")}
            actionHref="/activities"
          />
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nextUp.map((row) => (
              <StaggerItem key={row.rsvp.id}>
                <ActivityCard
                  activity={{
                    id: row.activity.id,
                    title: row.activity.title,
                    startsAt: row.activity.startsAt,
                    costBdt: row.activity.costBdt,
                    capacity: row.activity.capacity,
                    womenOnly: row.activity.womenOnly,
                    status: row.activity.status,
                    areaName: row.areaName,
                    venueName: row.venueName,
                    categorySlug: row.categorySlug,
                    categoryName: row.categoryName,
                  }}
                  locale={locale}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {pastUp.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {pastUp.map((r) => r.activity.title).join(" · ")}
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------------- Suggested */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarPlus className="size-5 text-primary" aria-hidden />
            {t("suggested")}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/activities">
              {t("suggestedEmpty") ? "See all" : "See all"} <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>

        {suggested.length === 0 ? (
          <EmptyState title={t("suggestedEmpty")} actionLabel="See all" actionHref="/activities" />
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggested.map((row) => (
              <StaggerItem key={row.activity.id}>
                <ActivityCard
                  activity={{
                    id: row.activity.id,
                    title: row.activity.title,
                    startsAt: row.activity.startsAt,
                    costBdt: row.activity.costBdt,
                    capacity: row.activity.capacity,
                    womenOnly: row.activity.womenOnly,
                    status: row.activity.status,
                    areaName: row.areaName,
                    categorySlug: row.categorySlug,
                    categoryName: row.categoryName,
                    goingCount: row.goingCount,
                  }}
                  locale={locale}
                />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
