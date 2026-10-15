import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signInTitle") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const [t, tn, params] = await Promise.all([
    getTranslations("auth"),
    getTranslations("nav"),
    searchParams,
  ]);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("signInTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("signInSubtitle")}</p>

      {params.error === "suspended" ? (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("errorSuspended")}
        </p>
      ) : null}

      <div className="mt-6">
        <SignInForm next={params.next} />
      </div>

      <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
        {t("terms")}{" "}
        <Link href="/guidelines" className="underline underline-offset-2 hover:text-foreground">
          {tn("guidelines")}
        </Link>
      </p>
    </div>
  );
}
