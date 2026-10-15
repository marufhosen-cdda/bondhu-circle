import { defineRouting } from "next-intl/routing";

export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  // Every URL carries an explicit /en or /bn prefix so links are shareable.
  localePrefix: "always",
});

export const localeNames: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
