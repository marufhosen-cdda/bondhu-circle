"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { submitFeedback } from "@/lib/actions/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  activityId: number;
  title: string;
  /** True when a previous submission already exists. */
  alreadySubmitted: boolean;
}

const SCALE = [1, 2, 3, 4, 5] as const;

/**
 * Private post-meetup feedback: comfort (1–5), would meet again, made a
 * connection, plus an optional note. Never rendered publicly.
 */
export function FeedbackForm({ activityId, title, alreadySubmitted }: Props) {
  const t = useTranslations("feedback");
  const [comfortable, setComfortable] = useState<number | null>(alreadySubmitted ? null : null);
  const [wantAgain, setWantAgain] = useState<string | null>(null);
  const [madeConnection, setMadeConnection] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(async () => {
    if (comfortable === null || wantAgain === null || madeConnection === null) {
      toast.error(t("subtitle"));
      return { ok: false as const, error: "validation" };
    }
    const result = await submitFeedback(undefined, {
      activityId,
      comfortable,
      wantToMeetAgain: wantAgain,
      madeConnection,
      note: (document.getElementById("feedback-note") as HTMLTextAreaElement | null)?.value ?? "",
    });
    if (result.ok) toast.success(t("submitted"));
    else toast.error(t("subtitle"));
    return result;
  }, { ok: false as const, error: "" });

  if (alreadySubmitted) {
    return (
      <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {t("already")}
      </p>
    );
  }

  const complete = comfortable !== null && wantAgain !== null && madeConnection !== null;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label>{t("q1")}</Label>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t("q1")}>
          {SCALE.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={comfortable === value}
              onClick={() => setComfortable(value)}
              className={cn(
                "flex min-w-11 flex-col items-center gap-1 rounded-xl border px-3 py-2 text-sm transition-colors",
                comfortable === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className="font-semibold">{value}</span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {comfortable ? t(`q1scale.${comfortable}` as const) : " "}
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">{t("q2")}</legend>
        <div className="mt-2 flex gap-2">
          {(["true", "false"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setWantAgain(value)}
              aria-pressed={wantAgain === value}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm transition-colors",
                wantAgain === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {value === "true" ? "Yes / হ্যাঁ" : "No / না"}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium">{t("q3")}</legend>
        <div className="mt-2 flex gap-2">
          {(["true", "false"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMadeConnection(value)}
              aria-pressed={madeConnection === value}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm transition-colors",
                madeConnection === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {value === "true" ? "Yes / হ্যাঁ" : "No / না"}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="feedback-note">{t("note")}</Label>
        <Textarea id="feedback-note" name="note" placeholder={t("notePlaceholder")} maxLength={1000} />
      </div>

      <Button type="submit" disabled={pending || !complete} className="w-full">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {t("submit")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">{t("subtitle")} — {title}</p>
      <span className="sr-only" aria-live="polite">
        {state.ok ? "ok" : ""}
      </span>
    </form>
  );
}
