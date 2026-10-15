"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Ban, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { blockAction, unblockAction } from "@/lib/actions/safety";
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

/**
 * Blocking is mutual invisibility: no shared circles, no visible messages.
 * Unblocking is available straight away, from here or from settings.
 */
export function BlockButton({
  userId,
  name,
  isBlocked,
}: {
  userId: string;
  name: string;
  isBlocked: boolean;
}) {
  const t = useTranslations("safety.block");
  const ts = useTranslations("safety");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = isBlocked
        ? await unblockAction(undefined, { userId })
        : await blockAction(undefined, { userId });

      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }

      setOpen(false);
      toast.success(isBlocked ? t("title", { name }) : t("done", { name }));
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {isBlocked ? <Undo2 aria-hidden /> : <Ban aria-hidden />}
          {isBlocked ? t("unblock") : ts("blockButton")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { name })}</DialogTitle>
          <DialogDescription>{t("text")}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={run} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Ban aria-hidden />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
