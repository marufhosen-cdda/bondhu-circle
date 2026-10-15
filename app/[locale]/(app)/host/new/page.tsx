import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireOnboarded } from "@/lib/session";
import { getBookableVenues } from "@/lib/queries/activities";
import { getInterests } from "@/lib/queries/reference";
import { PageHeader } from "@/components/features/shared/page-header";
import { ActivityForm } from "@/components/features/host/activity-form";

export async function generateMetadata() {
  const t = await getTranslations("host.form");
  return { title: t("title") };
}

export default async function NewActivityPage() {
  const user = await requireOnboarded();
  if (user.role !== "host" && user.role !== "admin") redirect("/host");

  const [t, interests, venues] = await Promise.all([
    getTranslations("host.form"),
    getInterests(),
    getBookableVenues(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("publishNote")} />
      <ActivityForm
        interests={interests.map((i) => ({ id: i.id, nameEn: i.nameEn, nameBn: i.nameBn }))}
        venues={venues.map((v) => ({
          id: v.id,
          name: v.name,
          address: v.address,
          type: v.type,
        }))}
      />
    </div>
  );
}
