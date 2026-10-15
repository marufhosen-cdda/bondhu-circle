"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CircleSlash, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { unblockAction } from "@/lib/actions/safety";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface BlockedUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export function BlockedList({ users }: { users: BlockedUser[] }) {
  const t = useTranslations("settings");
  const ts = useTranslations("safety.block");
  const te = useTranslations("errors");
  const router = useRouter();
  const [rows, setRows] = useState(users);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function unblock(user: BlockedUser) {
    setPendingId(user.id);
    startTransition(async () => {
      const result = await unblockAction(undefined, { userId: user.id });
      setPendingId(null);
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      setRows((current) => current.filter((r) => r.id !== user.id));
      toast.success(t("unblocked"));
      router.refresh();
    });
  }

  if (!rows.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleSlash className="size-4" aria-hidden />
        {t("blockedEmpty")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {rows.map((user) => (
        <li key={user.id} className="flex items-center gap-3 p-3">
          <Avatar className="size-9">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pendingId === user.id}
            onClick={() => unblock(user)}
          >
            {pendingId === user.id ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Undo2 aria-hidden />
            )}
            {ts("unblock")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
