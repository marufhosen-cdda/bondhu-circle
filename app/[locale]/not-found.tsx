import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden
        className="mb-6 grid size-20 place-items-center rounded-3xl border border-border bg-card text-3xl"
      >
        🌱
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("notFoundText")}</p>
      <Button asChild className="mt-6">
        <Link href="/home">{t("backHome")}</Link>
      </Button>
    </div>
  );
}
