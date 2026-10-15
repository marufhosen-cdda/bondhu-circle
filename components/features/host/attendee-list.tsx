"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { toggleCheckin } from "@/lib/actions/host";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AttendeeRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  status: string;
  checkedIn: boolean;
}

/** Host-side attendee list: check people in as they arrive. */
export function AttendeeList({
  activityId,
  attendees,
}: {
  activityId: number;
  attendees: AttendeeRow[];
}) {
  const t = useTranslations("activities.checkin");
  const te = useTranslations("errors");
  const [rows, setRows] = useState(attendees);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const checkedInCount = rows.filter((r) => r.checkedIn).length;

  function toggle(row: AttendeeRow) {
    const next = !row.checkedIn;
    setPendingId(row.userId);
    // Optimistic: the toast decides whether we keep it.
    setRows((current) =>
      current.map((r) => (r.userId === row.userId ? { ...r, checkedIn: next } : r)),
    );

    startTransition(async () => {
      const result = await toggleCheckin(undefined, {
        activityId,
        userId: row.userId,
        checkedIn: next ? "true" : "false",
      });
      setPendingId(null);
      if (!result.ok) {
        setRows((current) =>
          current.map((r) => (r.userId === row.userId ? { ...r, checkedIn: !next } : r)),
        );
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("marked"));
    });
  }

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("count", { count: checkedInCount })}</p>

      <ul className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => (
          <li key={row.userId} className="flex items-center gap-3 p-3">
            <Avatar className="size-9">
              {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt="" /> : null}
              <AvatarFallback>{row.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${row.userId}`}
                className="truncate text-sm font-medium hover:underline"
              >
                {row.name}
              </Link>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant={row.status === "going" ? "success" : "warning"}>{row.status}</Badge>
                {row.checkedIn ? (
                  <Badge variant="outline" className="gap-1">
                    <Check className="size-3" aria-hidden />
                    {t("marked")}
                  </Badge>
                ) : null}
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant={row.checkedIn ? "outline" : "default"}
              disabled={pendingId === row.userId}
              onClick={() => toggle(row)}
              className={cn(row.checkedIn && "text-success")}
            >
              {pendingId === row.userId ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <CheckCheck aria-hidden />
              )}
              {row.checkedIn ? t("marked") : t("mark")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
