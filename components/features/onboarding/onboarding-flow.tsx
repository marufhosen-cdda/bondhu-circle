"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Baby,
  Bike,
  BookOpen,
  Camera,
  Check,
  ChefHat,
  Coffee,
  Dices,
  Dumbbell,
  Film,
  Footprints,
  HeartPulse,
  Languages,
  Laptop,
  Loader2,
  Music,
  Palette,
  Plane,
  Sparkles,
  Trophy,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import {
  completeOnboarding,
  saveArea,
  saveAvailability,
  saveInterests,
} from "@/lib/actions/onboarding";
import { PhoneVerifyCard } from "@/components/features/profile/phone-verify-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SLOTS, type Slot } from "@/lib/validations";

type InterestRow = { id: number; nameEn: string; nameBn: string; icon: string };
type AreaRow = {
  id: number;
  nameEn: string;
  nameBn: string;
  zone: string;
  zoneLabelEn: string;
  zoneLabelBn: string;
};

type Step = "interests" | "area" | "availability" | "preferences";

const STEPS: Step[] = ["interests", "area", "availability", "preferences"];

/** Interest icons are stored as slugs in the database. */
const INTEREST_ICONS: Record<string, LucideIcon> = {
  coffee: Coffee,
  "book-open": BookOpen,
  footprints: Footprints,
  activity: Activity,
  trophy: Trophy,
  utensils: Utensils,
  music: Music,
  film: Film,
  camera: Camera,
  palette: Palette,
  "heart-pulse": HeartPulse,
  dumbbell: Dumbbell,
  bike: Bike,
  "hand-heart": HeartPulse,
  laptop: Laptop,
  languages: Languages,
  "chef-hat": ChefHat,
  baby: Baby,
  "dice-5": Dices,
  plane: Plane,
};

const WEEKDAY_ORDER = [0, 1, 2, 3, 4, 5, 6] as const;

function useErrorText() {
  const tOnboarding = useTranslations("onboarding");
  const tErrors = useTranslations("errors");
  return (key?: string) => {
    if (!key) return tErrors("generic");
    if (key.startsWith("onboarding.")) return tOnboarding(key.slice("onboarding.".length));
    if (key.startsWith("errors.")) return tErrors(key.slice("errors.".length));
    return tErrors("generic");
  };
}

export interface OnboardingFlowProps {
  interests: InterestRow[];
  areas: AreaRow[];
  selectedInterestIds: number[];
  areaId: number | null;
  availability: { weekday: number; slot: string }[];
  preferences: {
    groupSize: string;
    womenOnly: boolean;
    mode: string;
    language: string;
  } | null;
  bio: string | null;
  avatarUrl: string | null;
  phoneVerified: boolean;
  phone: string | null;
}

/**
 * Four-step onboarding. Each step is saved by its own Server Action, so a
 * half-finished profile is never lost — refresh and you are where you stopped.
 */
export function OnboardingFlow({
  interests,
  areas,
  selectedInterestIds,
  areaId,
  availability,
  preferences,
  bio: initialBio,
  avatarUrl: initialAvatar,
  phoneVerified,
  phone,
}: OnboardingFlowProps) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const locale = useLocale();
  const errorText = useErrorText();
  const reduce = useReducedMotion();

  const [stepIndex, setStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();

  const [interestIds, setInterestIds] = useState<number[]>(selectedInterestIds);
  const [selectedArea, setSelectedArea] = useState<number | null>(areaId);
  const [slots, setSlots] = useState<Set<string>>(
    new Set(availability.map((a) => `${a.weekday}:${a.slot}`)),
  );
  const [groupSize, setGroupSize] = useState(preferences?.groupSize ?? "small");
  const [womenOnly, setWomenOnly] = useState(preferences?.womenOnly ?? false);
  const [mode, setMode] = useState(preferences?.mode ?? "both");
  const [language, setLanguage] = useState(preferences?.language ?? "both");
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? "");
  const [accepted, setAccepted] = useState(false);

  const step = STEPS[stepIndex];
  const name = (row: { nameEn: string; nameBn: string }) =>
    locale === "bn" ? row.nameBn : row.nameEn;

  function toggleInterest(id: number) {
    setInterestIds((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    );
  }

  function toggleSlot(weekday: number, slot: Slot) {
    const key = `${weekday}:${slot}`;
    setSlots((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function saveStep(): Promise<boolean> {
    switch (step) {
      case "interests":
        return saveInterests(undefined, { interestIds }).then((result) => {
          if (!result.ok) {
            toast.error(errorText(result.error));
            return false;
          }
          return true;
        });

      case "area":
        if (!selectedArea) {
          toast.error(t("area.choose"));
          return Promise.resolve(false);
        }
        return saveArea(undefined, { areaId: selectedArea }).then((result) => {
          if (!result.ok) {
            toast.error(errorText(result.error));
            return false;
          }
          return true;
        });

      case "availability": {
        const picked = [...slots].map((key) => {
          const [weekday, slot] = key.split(":");
          return { weekday: Number(weekday), slot: slot as Slot };
        });
        return saveAvailability(undefined, { slots: picked }).then((result) => {
          if (!result.ok) {
            toast.error(errorText(result.error));
            return false;
          }
          return true;
        });
      }

      case "preferences":
        return completeOnboarding(undefined, {
          groupSize,
          womenOnly,
          mode,
          language,
          bio,
          avatarUrl,
          accepted: accepted ? "true" : "",
        }).then((result) => {
          if (!result.ok) {
            toast.error(errorText(result.error));
            return false;
          }
          return true;
        });
    }
  }

  function onNext() {
    startTransition(async () => {
      const ok = await saveStep();
      if (!ok) return;
      if (stepIndex === STEPS.length - 1) {
        toast.success(t("done"));
        setFinished(true);
        return;
      }
      setStepIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  if (finished) {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="size-5 text-primary" aria-hidden />
            {t("done")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <PhoneVerifyCard verified={phoneVerified} defaultPhone={phone} compact />
          <Button asChild className="w-full sm:w-auto">
            <Link href="/home">
              {tn("home")}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const zones = [...new Map(areas.map((a) => [a.zone, a])).values()];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("stepLabel", { current: stepIndex + 1, total: STEPS.length })}</span>
          <span>{t(`steps.${step}`)}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <motion.div
        key={step}
        initial={reduce ? false : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t(`${step}.title`)}</CardTitle>
            <p className="text-sm text-muted-foreground">{t(`${step}.subtitle`)}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "interests" ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => {
                    const Icon = INTEREST_ICONS[interest.icon] ?? Sparkles;
                    const active = interestIds.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} aria-hidden />
                        {name(interest)}
                        {active ? <Check className="size-3.5 text-primary" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("interests.selected", { count: interestIds.length })}
                </p>
              </>
            ) : null}

            {step === "area" ? (
              <div className="space-y-5">
                {zones.map((zone) => (
                  <div key={zone.zone} className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {locale === "bn" ? zone.zoneLabelBn : zone.zoneLabelEn}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {areas
                        .filter((a) => a.zone === zone.zone)
                        .map((area) => (
                          <button
                            key={area.id}
                            type="button"
                            onClick={() => setSelectedArea(area.id)}
                            aria-pressed={selectedArea === area.id}
                            className={cn(
                              "rounded-xl border px-3.5 py-2 text-sm transition-colors",
                              selectedArea === area.id
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:border-primary/40",
                            )}
                          >
                            {name(area)}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {step === "availability" ? (
              <div className="space-y-4">
                {SLOTS.map((slot) => {
                  const labels = t.raw("availability.weekdays") as string[];
                  return (
                    <div key={slot} className="space-y-2">
                      <p className="text-sm font-medium">{t(`availability.slots.${slot}`)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {WEEKDAY_ORDER.map((weekday) => {
                          const active = slots.has(`${weekday}:${slot}`);
                          return (
                            <button
                              key={weekday}
                              type="button"
                              onClick={() => toggleSlot(weekday, slot)}
                              aria-pressed={active}
                              className={cn(
                                "min-w-11 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card hover:border-primary/40",
                              )}
                            >
                              {labels[weekday] ?? String(weekday)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {step === "preferences" ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>{t("preferences.groupSize")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["small", t("preferences.groupSmall")],
                        ["medium", t("preferences.groupMedium")],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGroupSize(value)}
                        aria-pressed={groupSize === value}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-sm transition-colors",
                          groupSize === value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("preferences.mode")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["offline", t("preferences.modeOffline")],
                        ["online", t("preferences.modeOnline")],
                        ["both", t("preferences.modeBoth")],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        aria-pressed={mode === value}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-sm transition-colors",
                          mode === value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("preferences.language")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["bn", t("preferences.languageBn")],
                        ["en", t("preferences.languageEn")],
                        ["both", t("preferences.languageBoth")],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLanguage(value)}
                        aria-pressed={language === value}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-sm transition-colors",
                          language === value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                  <div>
                    <Label htmlFor="women-only">{t("preferences.womenOnly")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("preferences.womenOnlyHint")}
                    </p>
                  </div>
                  <Switch
                    id="women-only"
                    checked={womenOnly}
                    onCheckedChange={(checked) => setWomenOnly(Boolean(checked))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t("preferences.bio")}</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    maxLength={400}
                    placeholder={t("preferences.bioPlaceholder")}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">{t("preferences.avatar")}</Label>
                  <Input
                    id="avatar"
                    type="url"
                    value={avatarUrl}
                    placeholder="https://…"
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{t("guidelines.title")}</h3>
                    <Link
                      href="/guidelines"
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {t("guidelines.title")}
                    </Link>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {(["rule1", "rule2", "rule3", "rule4", "rule5"] as const).map((rule) => (
                      <li key={rule} className="flex gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                        {t(`guidelines.${rule}`)}
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={accepted}
                      onCheckedChange={(checked) => setAccepted(Boolean(checked))}
                      className="mt-0.5"
                    />
                    {t("guidelines.accept")}
                  </label>
                </div>

                <PhoneVerifyCard verified={phoneVerified} defaultPhone={phone} compact />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0 || pending}
        >
          <ArrowLeft aria-hidden />
          {tc("back")}
        </Button>

        <Button type="button" onClick={onNext} disabled={pending} size="lg">
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {stepIndex === STEPS.length - 1 ? t("finish") : tc("next")}
          {pending ? null : <ArrowRight aria-hidden />}
        </Button>
      </div>
    </div>
  );
}
