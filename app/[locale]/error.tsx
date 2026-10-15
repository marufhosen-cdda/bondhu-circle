"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Friendly route-level error boundary — never shows a stack trace to users. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 grid size-20 place-items-center rounded-3xl border border-destructive/30 bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("errorTitle")}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("errorText")}</p>
      <Button onClick={reset} className="mt-6">
        <RotateCcw aria-hidden /> {t("generic")}
      </Button>
    </div>
  );
}
