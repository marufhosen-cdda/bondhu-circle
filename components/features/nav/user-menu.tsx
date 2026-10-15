"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, LogOut, Settings, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
}

/** Avatar menu: profile, settings, admin (role-gated) and sign out. */
export function UserMenu({ user }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      toast.success(t("common.signOut"));
      router.push("/sign-in");
      router.refresh();
    });
  }

  const initials = user.name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={t("nav.userMenu")}
          className="flex items-center gap-1 rounded-full outline-none ring-ring transition-shadow focus-visible:ring-2"
        >
          <Avatar className="size-9 border border-border">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(`/profile/${user.id}`)}>
          <UserIcon className="size-4" aria-hidden /> {t("nav.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings className="size-4" aria-hidden /> {t("nav.settings")}
        </DropdownMenuItem>
        {user.role === "admin" ? (
          <DropdownMenuItem onSelect={() => router.push("/admin")}>
            <Shield className="size-4" aria-hidden /> {t("nav.admin")}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} disabled={pending}>
          <LogOut className="size-4" aria-hidden /> {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
