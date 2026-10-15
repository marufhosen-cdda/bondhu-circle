"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { rerunMatching } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

/** Runs the same matching engine the weekly script uses — safe to run twice. */
export function RerunMatchingButton() {
  const t = useTranslations("admin.circles");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await rerunMatching(undefined, {});
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      const { created, pool } = result.data;
      toast.success(pool === 0 ? t("noPool") : t("done", { created, pool }));
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start sm:items-end sm:text-right space-y-1.5">
      <Button onClick={run} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
        {pending ? t("running") : t("rerun")}
      </Button>
      <p className="max-w-xl text-xs text-muted-foreground">{t("rerunNote")}</p>
    </div>
  );
}
