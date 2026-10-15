import { getRequestConfig } from "next-intl/server";

import { isLocale, routing, type Locale } from "@/i18n/routing";

/**
 * Message catalogs are imported statically (not via a template-literal
 * `import()`): bundlers cannot resolve a computed path, and the whole point of
 * a two-locale app is that both catalogs travel with the build.
 */
const catalogs: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("../messages/en.json"),
  bn: () => import("../messages/bn.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;

  const messages = (await catalogs[locale]()).default;

  return { locale, messages };
});
