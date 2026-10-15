import { getTranslations } from "next-intl/server";

import { VerifyForm } from "./verify-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("verify") };
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; email?: string; phone?: string; next?: string }>;
}) {
  const [t, params] = await Promise.all([getTranslations("auth"), searchParams]);
  const method = params.method === "phone" ? "phone" : "email";
  const identifier = method === "phone" ? (params.phone ?? "") : (params.email ?? "");

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("verify")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {method === "phone"
          ? t("checkPhone", { phone: identifier })
          : t("checkEmail", { email: identifier })}
      </p>

      <div className="mt-6">
        <VerifyForm
          method={method}
          identifier={identifier}
          next={params.next}
          email={params.email}
          phone={params.phone}
        />
      </div>
    </div>
  );
}
