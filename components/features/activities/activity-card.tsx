import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Clock, MapPin, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { activityCover } from "@/lib/images";
import { formatDateTime } from "@/lib/dates";
import { BLUR_DATA_URL, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LayoutCard } from "@/components/motion";

export interface ActivityCardData {
  id: number;
  title: string;
  startsAt: Date;
  costBdt: number;
  capacity: number;
  womenOnly: boolean;
  status: string;
  imageUrl?: string | null;
  areaName?: string | null;
  venueName?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  goingCount?: number;
}

/** Grid card for the activities board and home suggestions. */
export async function ActivityCard({
  activity,
  locale,
  layoutId,
  className,
}: {
  activity: ActivityCardData;
  locale: string;
  layoutId?: string;
  className?: string;
}) {
  const t = await getTranslations("activities");
  const cover = activityCover(activity.categorySlug ?? undefined);
  const spotsLeft = Math.max(0, activity.capacity - (activity.goingCount ?? 0));

  return (
    <LayoutCard
      id={layoutId ?? `activity-${activity.id}`}
      className={cn("h-full", className)}
    >
      <Link
        href={`/activities/${activity.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
      >
        <div className="relative aspect-16/10 overflow-hidden bg-muted">
          <Image
            src={activity.imageUrl ?? cover.src}
            alt={cover.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {activity.status === "pending" ? (
              <Badge variant="warning">{t("detail.pending")}</Badge>
            ) : null}
            {activity.womenOnly ? (
              <Badge variant="secondary">{t("filters.womenOnly")}</Badge>
            ) : null}
            <Badge variant={activity.costBdt === 0 ? "success" : "default"}>
              {activity.costBdt === 0 ? t("filters.free") : `${activity.costBdt} ৳`}
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          {activity.categoryName ? (
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              {activity.categoryName}
            </p>
          ) : null}

          <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
            {activity.title}
          </h3>

          <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {formatDateTime(activity.startsAt, locale)}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {activity.areaName ?? activity.venueName ?? "—"}
            </p>
            <p className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" aria-hidden />
              {spotsLeft > 0
                ? t("detail.spotsLeft", { count: spotsLeft })
                : t("detail.full")}
            </p>
          </div>
        </div>
      </Link>
    </LayoutCard>
  );
}
