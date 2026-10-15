"use client";

import { useTranslations } from "next-intl";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { SlidersHorizontal, X } from "lucide-react";

import { getInterests, getAreas } from "@/lib/queries/reference";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

/**
 * Board filters — all state lives in the URL (nuqs), so results are
 * shareable and the server page re-queries on every change.
 */
export function ActivityFilters({
  interests,
  areas,
}: {
  interests: Awaited<ReturnType<typeof getInterests>>;
  areas: Awaited<ReturnType<typeof getAreas>>;
}) {
  const t = useTranslations("activities.filters");
  const tc = useTranslations("common");
  const [filters, setFilters] = useQueryStates({
    category: parseAsString.withDefault(""),
    area: parseAsString.withDefault(""),
    date: parseAsString.withDefault("any"),
    price: parseAsString.withDefault("any"),
    womenOnly: parseAsBoolean.withDefault(false),
    page: parseAsInteger.withDefault(1),
  });

  const isFiltered =
    filters.category !== "" ||
    filters.area !== "" ||
    filters.date !== "any" ||
    filters.price !== "any" ||
    filters.womenOnly;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 text-primary" aria-hidden />
          {tc("filters")}
        </p>
        {isFiltered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({ category: "", area: "", date: "any", price: "any", womenOnly: false, page: 1 })
            }
          >
            <X aria-hidden /> {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("category")}</span>
          <NativeSelect
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value, page: 1 })}
          >
            <option value="">{tc("all")}</option>
            {interests.map((interest) => (
              <option key={interest.id} value={interest.slug}>
                {interest.nameEn}
              </option>
            ))}
          </NativeSelect>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("area")}</span>
          <NativeSelect
            value={filters.area}
            onChange={(e) => setFilters({ area: e.target.value, page: 1 })}
          >
            <option value="">{tc("all")}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.slug}>
                {area.nameEn}
              </option>
            ))}
          </NativeSelect>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("date")}</span>
          <NativeSelect
            value={filters.date}
            onChange={(e) => setFilters({ date: e.target.value as "any" | "week" | "month", page: 1 })}
          >
            <option value="any">{t("anyDate")}</option>
            <option value="week">{t("thisWeek")}</option>
            <option value="month">{t("thisMonth")}</option>
          </NativeSelect>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("price")}</span>
          <NativeSelect
            value={filters.price}
            onChange={(e) => setFilters({ price: e.target.value as "any" | "free" | "paid", page: 1 })}
          >
            <option value="any">{t("anyPrice")}</option>
            <option value="free">{t("free")}</option>
            <option value="paid">{t("paid")}</option>
          </NativeSelect>
        </label>
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.womenOnly}
          onChange={(e) => setFilters({ womenOnly: e.target.checked, page: 1 })}
          className="size-4 rounded border-input accent-[var(--primary)]"
        />
        {t("womenOnly")}
      </label>
    </div>
  );
}
