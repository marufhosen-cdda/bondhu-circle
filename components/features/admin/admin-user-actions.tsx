"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MoreHorizontal, ShieldCheck, UserCog, UserX } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { adminUserUpdate } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminAction = "suspend" | "restore" | "member" | "host" | "admin";

/** Role + suspension controls. Self-suspension is refused server-side. */
export function AdminUserActions({
  userId,
  role,
  status,
  isSelf,
}: {
  userId: string;
  role: string;
  status: string;
  isSelf: boolean;
}) {
  const t = useTranslations("admin.users");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: AdminAction) {
    startTransition(async () => {
      const result = await adminUserUpdate(undefined, { userId, action });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("unauthorized") : result.error);
        return;
      }
      toast.success(t("updated"));
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="iconSm" disabled={pending} aria-label={t("role")}>
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <MoreHorizontal aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("role")}</DropdownMenuLabel>
        <DropdownMenuItem disabled={role === "member"} onSelect={() => run("member")}>
          <UserCog aria-hidden />
          {t("makeMember")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={role === "host"} onSelect={() => run("host")}>
          <ShieldCheck aria-hidden />
          {t("makeHost")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={role === "admin"} onSelect={() => run("admin")}>
          <ShieldCheck aria-hidden />
          {t("makeAdmin")}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {status === "suspended" ? (
          <DropdownMenuItem onSelect={() => run("restore")}>
            <ShieldCheck aria-hidden />
            {t("unsuspend")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={isSelf} onSelect={() => run("suspend")}>
            <UserX aria-hidden />
            {t("suspend")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
