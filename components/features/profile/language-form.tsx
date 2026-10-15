"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Languages } from "lucide-react";
import { toast } from "sonner";

import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { updateLanguage } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { en: "English", bn: "বাংলা" };

/**
 * Saves the preference on the user record *and* swaps the URL prefix, so the
 * choice sticks for the next visit and the page re-renders in the new language.
 */
export function LanguageForm() {
  const t = useTranslations("settings");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Locale>(locale);
  const [pending, startTransition] = useTransition();

  function apply(next: Locale) {
    setSelected(next);
    startTransition(async () => {
      const result = await updateLanguage(undefined, { locale: next });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("saved"));
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("languageHint")}</p>

      <div className="flex flex-wrap gap-2">
        {locales.map((option) => (
          <Button
            key={option}
            type="button"
            variant={selected === option ? "default" : "outline"}
            disabled={pending}
            onClick={() => apply(option)}
            className={cn("gap-2")}
          >
            {pending && selected === option ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Languages aria-hidden />
            )}
            {LABELS[option]}
          </Button>
        ))}
      </div>
    </div>
  );
}
