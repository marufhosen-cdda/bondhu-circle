import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { listAllVenues } from "@/lib/queries/admin";
import { getAreas } from "@/lib/queries/reference";
import { VenueForm } from "@/components/features/admin/venue-form";
import { EmptyState } from "@/components/features/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata() {
  const t = await getTranslations("admin.venues");
  return { title: t("title") };
}

export default async function AdminVenuesPage() {
  await requireAdmin();
  const [t, areas, rows] = await Promise.all([
    getTranslations("admin.venues"),
    getAreas(),
    listAllVenues(),
  ]);

  const areaOptions = areas.map((a) => ({ id: a.id, nameEn: a.nameEn, nameBn: a.nameBn }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <VenueForm areas={areaOptions} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ venue, areaName }) => (
            <Card key={venue.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-medium">{venue.name}</p>
                  <Badge variant="outline">{t(`types.${venue.type}`)}</Badge>
                  {venue.approved ? (
                    <Badge variant="success">{t("approve")}</Badge>
                  ) : (
                    <Badge variant="warning">{t("unapprove")}</Badge>
                  )}
                  {!venue.isPublic ? <Badge variant="secondary">private</Badge> : null}
                </div>

                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {venue.address}
                  {areaName ? ` · ${areaName}` : ""}
                </p>

                <VenueForm
                  areas={areaOptions}
                  mode="edit"
                  label={t("edit")}
                  initial={{
                    id: venue.id,
                    name: venue.name,
                    areaId: String(venue.areaId),
                    address: venue.address,
                    mapUrl: venue.mapUrl ?? "",
                    type: venue.type,
                    isPublic: venue.isPublic,
                    approved: venue.approved,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
