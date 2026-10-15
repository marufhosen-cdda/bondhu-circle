"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const labels: Record<Locale, string> = { en: "EN", bn: "বাংলা" };

/** Switches the URL prefix between /en and /bn, keeping the current page. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const other = locales.find((l) => l !== locale) ?? "en";

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      aria-label={t("common.language")}
      className={className}
      onClick={() => startTransition(() => router.replace(pathname, { locale: other }))}
    >
      {labels[other as Locale]}
    </Button>
  );
}
