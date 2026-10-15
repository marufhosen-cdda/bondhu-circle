import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label={t("appName")}
        >
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            ব
          </span>
          <span className="hidden sm:inline">Bondhu Circle</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </header>

      <main id="main" className="flex flex-1 items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
