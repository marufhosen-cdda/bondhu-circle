"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { reviewHostApplication } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

/** Approving promotes the member to `host` and notifies them. */
export function HostApplicationActions({ applicationId }: { applicationId: number }) {
  const t = useTranslations("admin.hosts");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function review(status: "approved" | "rejected") {
    startTransition(async () => {
      const result = await reviewHostApplication(undefined, { applicationId, status });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => review("approved")}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
        {t("approve")}
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => review("rejected")}>
        <X aria-hidden />
        {t("reject")}
      </Button>
    </div>
  );
}
