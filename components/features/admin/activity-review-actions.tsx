"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { reviewActivity } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

type Action = "approve" | "reject" | "cancel" | "complete";

/** Approval is what makes an activity visible on the public board. */
export function ActivityReviewActions({
  activityId,
  status,
}: {
  activityId: number;
  status: string;
}) {
  const t = useTranslations("admin.activities");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function review(action: Action) {
    startTransition(async () => {
      const result = await reviewActivity(undefined, { activityId, action });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  }

  const button = (action: Action, label: string, variant?: "outline" | "default") => (
    <Button key={action} size="sm" variant={variant} disabled={pending} onClick={() => review(action)}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {label}
    </Button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {status === "pending" ? (
        <>
          {button("approve", t("approve"))}
          {button("reject", t("reject"), "outline")}
        </>
      ) : null}
      {status === "approved" ? (
        <>
          {button("complete", t("complete"), "outline")}
          {button("cancel", t("cancel"), "outline")}
        </>
      ) : null}
      {status === "cancelled" || status === "completed"
        ? button("approve", t("approve"), "outline")
        : null}
    </div>
  );
}
