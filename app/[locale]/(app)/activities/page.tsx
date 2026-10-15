import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireOnboarded } from "@/lib/session";
import { getAreas, getInterests } from "@/lib/queries/reference";
import { listActivities } from "@/lib/queries/activities";
import { PageHeader } from "@/components/features/shared/page-header";
import { EmptyState } from "@/components/features/shared/empty-state";
import { ActivityCard } from "@/components/features/activities/activity-card";
import { ActivityFilters } from "@/components/features/activities/activity-filters";
import { Pagination } from "@/components/features/shared/pagination";
import { Stagger, StaggerItem } from "@/components/motion";

export const metadata: Metadata = { title: "Activities" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    category?: string;
    area?: string;
    date?: string;
    price?: string;
    womenOnly?: string;
    page?: string;
  }>;
}

export default async function ActivitiesPage({ searchParams }: Props) {
  const user = await requireOnboarded();
  const [t, params, interests, areas] = await Promise.all([
    getTranslations("activities"),
    searchParams,
    getInterests(),
    getAreas(),
  ]);

  const filters = {
    category: params.category || undefined,
    area: params.area || undefined,
    date: (params.date as "any" | "week" | "month") || "any",
    price: (params.price as "any" | "free" | "paid") || "any",
    womenOnly: params.womenOnly === "true",
    page: Number(params.page) || 1,
  };

  const result = await listActivities(filters);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <ActivityFilters interests={interests} areas={areas} />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("filters.results", { count: result.total })}
      </p>

      {result.items.length === 0 ? (
        <EmptyState
          title={t("filters.noResults")}
          text={t("filters.noResultsText")}
          actionLabel={t("filters.clearFilters")}
          actionHref="/activities"
        />
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((activity) => (
            <StaggerItem key={activity.id}>
              <ActivityCard activity={activity} locale={user.locale} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} />
    </div>
  );
}
