"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { resolveReport } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Resolve a report as actioned or dismissed, with an internal note. */
export function ReportActions({ reportId }: { reportId: number }) {
  const t = useTranslations("admin.reports");
  const te = useTranslations("errors");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function resolve(status: "actioned" | "dismissed") {
    startTransition(async () => {
      const result = await resolveReport(undefined, { reportId, status, note });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("resolved"));
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={note}
        maxLength={500}
        placeholder={t("note")}
        aria-label={t("note")}
        className="h-8 max-w-56 text-xs"
        onChange={(e) => setNote(e.target.value)}
      />
      <Button size="sm" disabled={pending} onClick={() => resolve("actioned")}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
        {t("action")}
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => resolve("dismissed")}>
        <X aria-hidden />
        {t("dismiss")}
      </Button>
    </div>
  );
}
