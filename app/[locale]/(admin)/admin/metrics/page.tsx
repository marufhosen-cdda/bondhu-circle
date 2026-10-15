import { getTranslations } from "next-intl/server";
import { Activity, HeartHandshake, Repeat, Star, Timer } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { getAdminMetrics } from "@/lib/queries/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/motion";

export async function generateMetadata() {
  const t = await getTranslations("admin.metrics");
  return { title: t("title") };
}

function percent(value: number | null): string | null {
  return value === null ? null : `${Math.round(value * 100)}%`;
}

export default async function AdminMetricsPage() {
  await requireAdmin();
  const [t, metrics] = await Promise.all([getTranslations("admin.metrics"), getAdminMetrics()]);

  const cards = [
    {
      key: "signupToMeetup",
      value: percent(metrics.signupToMeetupRate),
      hint: t("ofTotal", {
        value: metrics.totals.attendedCount,
        total: metrics.totals.onboardingCount,
      }),
      icon: Activity,
    },
    {
      key: "repeat30",
      value: percent(metrics.repeatRate),
      hint: t("attendance"),
      icon: Repeat,
    },
    {
      key: "wantAgain",
      value: percent(metrics.wantAgainRate),
      hint: t("ofTotal", { value: metrics.totals.feedbackCount, total: metrics.totals.feedbackCount }),
      icon: HeartHandshake,
    },
    {
      key: "avgComfort",
      value: metrics.avgComfort === null ? null : `${metrics.avgComfort} / 5`,
      hint: t("attendance"),
      icon: Star,
    },
    {
      key: "medianToCircle",
      value:
        metrics.medianDaysToCircle === null
          ? null
          : `${Math.round(metrics.medianDaysToCircle)} d`,
      hint: t("northStarHint"),
      icon: Timer,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <FadeUp>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">{t("northStar")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("northStarHint")}</p>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tabular-nums text-primary">{metrics.northStar}</p>
          </CardContent>
        </Card>
      </FadeUp>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <card.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{card.value ?? t("noData")}</p>
                <p className="text-sm text-muted-foreground">{t(card.key)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
