"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock3, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

import { rsvpAction, type RsvpResult } from "@/lib/actions/rsvp";
import { Button } from "@/components/ui/button";

interface Props {
  activityId: number;
  /** null = no RSVP yet, otherwise the stored status. */
  status: "going" | "waitlist" | "cancelled" | null;
  full: boolean;
  disabled?: boolean;
  /** Why the button is disabled (sign in / verify phone / …). */
  disabledReason?: string;
  disabledLabel?: string;
}

/**
 * RSVP / cancel / waitlist control. Submits through the single Server Action
 * wrapper and revalidates the page, so spots-left and the address appear
 * without any client-side refetching.
 */
export function RsvpButton({
  activityId,
  status,
  full,
  disabled,
  disabledReason,
  disabledLabel,
}: Props) {
  const t = useTranslations("activities");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<RsvpResult | null, FormData>(
    async (_prev, formData): Promise<RsvpResult | null> => {
      const result = await rsvpAction(undefined, formData);
      if (result.ok) return result.data;
      toast.error(result.error);
      return null;
    },
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.status === "going") toast.success(t("rsvp.success"));
    if (state.status === "waitlist") toast.success(t("rsvp.waitlist"));
    if (state.status === "cancelled") toast.success(t("rsvp.cancelled"));
  }, [state, t]);

  if (disabled) {
    return (
      <div className="space-y-2">
        <Button className="w-full" size="lg" disabled>
          {disabledLabel ?? t("detail.signInToJoin")}
        </Button>
        {disabledReason ? (
          <p className="text-center text-xs text-muted-foreground">{disabledReason}</p>
        ) : null}
      </div>
    );
  }

  const icon = pending ? (
    <Loader2 className="animate-spin" aria-hidden />
  ) : status === "going" ? (
    <CheckCircle2 aria-hidden />
  ) : status === "waitlist" ? (
    <Clock3 aria-hidden />
  ) : full ? (
    <Ticket aria-hidden />
  ) : (
    <CheckCircle2 aria-hidden />
  );

  const label = pending
    ? tc("loading")
    : status === "going"
      ? t("detail.cancelRsvp")
      : status === "waitlist"
        ? t("detail.leaveWaitlist")
        : full
          ? t("detail.joinWaitlist")
          : tc("join");

  const action =
    status === "going" ? "cancel" : status === "waitlist" ? "leave-waitlist" : full ? "waitlist" : "join";

  return (
    <form action={formAction} className="w-full space-y-2">
      <input type="hidden" name="activityId" value={activityId} />
      <input type="hidden" name="action" value={action} />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        variant={status ? "outline" : "default"}
        disabled={pending}
        aria-label={label}
      >
        {icon}
        {label}
      </Button>
      {!status && full ? (
        <p className="text-center text-xs text-muted-foreground">{t("detail.full")}</p>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {state ? JSON.stringify(state) : ""}
      </span>
    </form>
  );
}
