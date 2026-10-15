"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { applyToHost } from "@/lib/actions/host";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Applications are reviewed by a human admin. */
export function HostApplicationForm() {
  const t = useTranslations("host.apply");
  const tc = useTranslations("common");
  const te = useTranslations("errors");

  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await applyToHost(undefined, formData);
      if (result.ok) toast.success(t("pending"));
      else toast.error(result.error.startsWith("host.") ? t("alreadyApproved") : te("generic"));
      return result;
    },
    { ok: false as const, error: "" },
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="motivation">{t("motivation")}</Label>
        <Textarea
          id="motivation"
          name="motivation"
          rows={5}
          maxLength={2000}
          placeholder={t("motivationPlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">
          {t("experience")}{" "}
          <span className="text-xs text-muted-foreground">({tc("optional")})</span>
        </Label>
        <Textarea
          id="experience"
          name="experience"
          rows={4}
          maxLength={2000}
          placeholder={t("experiencePlaceholder")}
        />
      </div>

      <Button type="submit" disabled={pending} size="lg">
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {t("submit")}
      </Button>

      <span className="sr-only" aria-live="polite">
        {state.ok ? "submitted" : ""}
      </span>
    </form>
  );
}
