"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { requestCircle } from "@/lib/actions/circles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Ask for a different circle. The reason is private — only admins can read it. */
export function CircleRequestForm() {
  const t = useTranslations("circles.request");
  const te = useTranslations("errors");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await requestCircle(undefined, { reason });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      setReason("");
      toast.success(t("submitted"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("text")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request-reason">{t("reason")}</Label>
        <Textarea
          id="request-reason"
          value={reason}
          maxLength={500}
          rows={2}
          placeholder={t("placeholder")}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Button onClick={submit} disabled={pending} variant="outline" size="sm">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
        {t("submit")}
      </Button>
    </div>
  );
}
