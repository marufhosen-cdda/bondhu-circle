"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsInteger, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";

/** Simple URL pagination (page lives in the query string). */
export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const t = useTranslations("common");
  const [, setParams] = useQueryStates({ page: parseAsInteger.withDefault(1) });

  if (pageCount <= 1) return null;

  const go = (next: number) => {
    setParams({ page: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        aria-label={t("back")}
      >
        <ChevronLeft aria-hidden /> {t("back")}
      </Button>

      <span className="text-sm text-muted-foreground" aria-live="polite">
        {page} / {pageCount}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
        aria-label={t("next")}
      >
        {t("next")} <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
