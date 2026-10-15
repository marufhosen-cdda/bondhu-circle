import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireOnboarded } from "@/lib/session";
import { getHostActivity } from "@/lib/queries/host";
import { getBookableVenues } from "@/lib/queries/activities";
import { getInterests } from "@/lib/queries/reference";
import { PageHeader } from "@/components/features/shared/page-header";
import { ActivityForm } from "@/components/features/host/activity-form";
import { toDhakaInputValues } from "@/lib/dates";

export async function generateMetadata() {
  const t = await getTranslations("host.form");
  return { title: t("editTitle") };
}

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOnboarded();
  const { id } = await params;
  const activityId = Number(id);
  if (!Number.isInteger(activityId) || activityId <= 0) notFound();

  const row = await getHostActivity(activityId);
  if (!row) notFound();
  if (row.activity.hostId !== user.id && user.role !== "admin") notFound();

  const [t, interests, venues] = await Promise.all([
    getTranslations("host.form"),
    getInterests(),
    getBookableVenues(),
  ]);

  const { activity } = row;
  const start = toDhakaInputValues(activity.startsAt);
  const end = toDhakaInputValues(activity.endsAt);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("editTitle")} subtitle={t("publishNote")} />
      <ActivityForm
        interests={interests.map((i) => ({ id: i.id, nameEn: i.nameEn, nameBn: i.nameBn }))}
        venues={venues.map((v) => ({ id: v.id, name: v.name, address: v.address, type: v.type }))}
        initial={{
          id: activity.id,
          title: activity.title,
          description: activity.description,
          categoryInterestId: String(activity.categoryInterestId),
          venueId: activity.venueId ? String(activity.venueId) : "",
          date: start.date,
          startTime: start.time,
          endTime: end.time,
          capacity: String(activity.capacity),
          costBdt: String(activity.costBdt),
          womenOnly: activity.womenOnly,
          imageUrl: activity.imageUrl ?? "",
        }}
      />
    </div>
  );
}
