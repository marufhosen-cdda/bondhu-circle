import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { listReports } from "@/lib/queries/admin";
import { ReportActions } from "@/components/features/admin/report-actions";
import { EmptyState } from "@/components/features/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUSES = ["open", "actioned", "dismissed"] as const;

export async function generateMetadata() {
  const t = await getTranslations("admin.reports");
  return { title: t("title") };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = STATUSES.find((s) => s === status) ?? "open";

  const [t, rows] = await Promise.all([getTranslations("admin.reports"), listReports(active)]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      <nav aria-label={t("statusFilter")} className="flex flex-wrap gap-2">
        {STATUSES.map((option) => (
          <Link
            key={option}
            href={`/admin/reports?status=${option}`}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm transition-colors",
              option === active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {t(option)}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="space-y-3">
          {rows.map(({ report, reporterName }) => (
            <Card key={report.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={report.status === "open" ? "warning" : "outline"}>
                    {t(report.status)}
                  </Badge>
                  <Badge variant="outline">
                    {t("target")}: {report.targetType} #{report.targetId}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t("reporter")}: {reporterName ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {report.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                </div>

                <p className="text-sm">
                  <span className="font-medium">{report.reason}</span>
                  {report.details ? ` — ${report.details}` : ""}
                </p>

                {report.status === "open" ? <ReportActions reportId={report.id} /> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
