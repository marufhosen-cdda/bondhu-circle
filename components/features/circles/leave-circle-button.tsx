"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { leaveCircle } from "@/lib/actions/circles";
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

/** Leaving is always allowed — nobody is stuck in a circle they dislike. */
export function LeaveCircleButton({ circleId }: { circleId: number }) {
  const t = useTranslations("circles");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function leave() {
    startTransition(async () => {
      const result = await leaveCircle(undefined, { circleId });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("left"));
      setOpen(false);
      router.replace("/circles");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LogOut aria-hidden />
          {t("leave")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("leaveTitle")}</DialogTitle>
          <DialogDescription>{t("leaveText")}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={leave} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <LogOut aria-hidden />}
            {t("leaveConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
