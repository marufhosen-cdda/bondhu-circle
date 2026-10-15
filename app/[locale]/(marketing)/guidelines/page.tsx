import { getTranslations } from "next-intl/server";
import { Check, HeartHandshake, ShieldCheck } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("guidelines") };
}

const RULES = ["rule1", "rule2", "rule3", "rule4", "rule5"] as const;
const SAFETY_POINTS = ["point1", "point2", "point3", "point4"] as const;

/**
 * Public community guidelines — the same rules people accept at the end of
 * onboarding, readable without an account so nobody has to sign up blind.
 */
export default async function GuidelinesPage() {
  const [t, tn, ts] = await Promise.all([
    getTranslations("onboarding.guidelines"),
    getTranslations("nav"),
    getTranslations("landing.safety"),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-14 sm:px-6">
      <FadeUp className="space-y-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden />
          {ts("title")}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{tn("guidelines")}</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </FadeUp>

      <FadeUp>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-3 text-sm leading-relaxed">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {t(rule)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </FadeUp>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <HeartHandshake className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">{ts("title")}</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{ts("text")}</p>

        <Stagger className="grid gap-4 sm:grid-cols-2">
          {SAFETY_POINTS.map((point) => (
            <StaggerItem key={point}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm">{ts(`${point}Title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {ts(`${point}Text`)}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <FadeUp className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/sign-in">{tn("getStarted")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">{tn("home")}</Link>
        </Button>
      </FadeUp>
    </div>
  );
}
