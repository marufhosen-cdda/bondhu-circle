"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { reportAction } from "@/lib/actions/safety";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type TargetType = "user" | "activity" | "message";

const REASONS = ["spam", "harassment", "inappropriate", "safety", "other"] as const;

/** Report button + dialog. Reports are private and never shown to the target. */
export function ReportButton({
  targetType,
  targetId,
  label,
  variant = "ghost",
  size = "sm",
}: {
  targetType: TargetType;
  targetId: string | number;
  label?: string;
  variant?: "ghost" | "outline" | "destructive";
  size?: "sm" | "default";
}) {
  const t = useTranslations("safety.report");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [, formAction, pending] = useActionState(async (_prev: unknown, formData: FormData) => {
    const result = await reportAction(undefined, formData);
    if (result.ok) {
      toast.success(t("submitted"));
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    return result;
  }, { ok: false as const, error: "" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} aria-label={label ?? t("title", { target: targetType })}>
          <Flag aria-hidden /> {label ?? t("submit")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { target: t(`target${targetType === "user" ? "User" : targetType === "activity" ? "Activity" : "Message"}` as const) })}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={String(targetId)} />

          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("reason")}</Label>
            <NativeSelect id="report-reason" name="reason" defaultValue="spam">
              {REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {t(`reason${reason.charAt(0).toUpperCase()}${reason.slice(1)}` as "reasonSpam")}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">{t("details")}</Label>
            <Textarea id="report-details" name="details" maxLength={1000} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Flag aria-hidden />}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
