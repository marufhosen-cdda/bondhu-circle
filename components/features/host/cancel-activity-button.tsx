"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { cancelActivity } from "@/lib/actions/host";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Cancelling notifies everyone who signed up. */
export function CancelActivityButton({ activityId }: { activityId: number }) {
  const t = useTranslations("host.dashboard");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function cancel() {
    startTransition(async () => {
      const result = await cancelActivity(undefined, { id: activityId });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("cancelled"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <XCircle aria-hidden />
          {t("cancelActivity")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancelTitle")}</DialogTitle>
          <DialogDescription>{t("cancelText")}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={cancel} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <XCircle aria-hidden />}
            {t("cancelConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
