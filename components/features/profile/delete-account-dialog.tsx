"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { deleteAccount } from "@/lib/actions/profile";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Deletion removes personal data and signs the member out for good. */
export function DeleteAccountDialog() {
  const t = useTranslations("settings");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    if (confirm !== "DELETE") {
      toast.error(t("deleteError"));
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount(undefined, { confirm: "DELETE" });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      await authClient.signOut().catch(() => undefined);
      toast.success(t("deleted"));
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 aria-hidden />
          {t("deleteButton")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteTitle")}</DialogTitle>
          <DialogDescription>{t("deleteText")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="delete-confirm">{t("deleteConfirmLabel")}</Label>
          <Input
            id="delete-confirm"
            value={confirm}
            autoComplete="off"
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={remove}
            disabled={pending || confirm !== "DELETE"}
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
            {t("deleteButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
