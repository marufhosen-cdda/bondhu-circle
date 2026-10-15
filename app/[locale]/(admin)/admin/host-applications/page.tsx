import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { listHostApplications } from "@/lib/queries/admin";
import { HostApplicationActions } from "@/components/features/admin/host-application-actions";
import { EmptyState } from "@/components/features/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUSES = ["pending", "approved", "rejected"] as const;

export async function generateMetadata() {
  const t = await getTranslations("admin.hosts");
  return { title: t("title") };
}

export default async function AdminHostApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = STATUSES.find((s) => s === status) ?? "pending";

  const [t, th, rows] = await Promise.all([
    getTranslations("admin.hosts"),
    getTranslations("host.status"),
    listHostApplications(active),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <nav className="flex flex-wrap gap-2">
        {STATUSES.map((option) => (
          <Link
            key={option}
            href={`/admin/host-applications?status=${option}`}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm transition-colors",
              option === active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {th(option)}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.application.id}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <Avatar className="size-10">
                  {row.userAvatarUrl ? <AvatarImage src={row.userAvatarUrl} alt="" /> : null}
                  <AvatarFallback>{row.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    <Link href={`/profile/${row.userId}`} className="hover:underline">
                      {row.userName}
                    </Link>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {row.application.createdAt.toISOString().slice(0, 10)}
                  </p>
                </div>
                <Badge variant={row.application.status === "pending" ? "warning" : "outline"}>
                  {th(row.application.status)}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("motivation")}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{row.application.motivation}</p>
                </div>

                {row.application.experience ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("experience")}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {row.application.experience}
                    </p>
                  </div>
                ) : null}

                {row.application.status === "pending" ? (
                  <HostApplicationActions applicationId={row.application.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
