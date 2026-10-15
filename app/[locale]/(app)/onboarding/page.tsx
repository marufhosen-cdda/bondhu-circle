import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/session";
import { getUserSetup } from "@/lib/queries/users";
import { getAreas, getInterests } from "@/lib/queries/reference";
import { PageHeader } from "@/components/features/shared/page-header";
import { OnboardingFlow } from "@/components/features/onboarding/onboarding-flow";
import { PhoneVerifyCard } from "@/components/features/profile/phone-verify-card";

export async function generateMetadata() {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

/**
 * Onboarding.
 *
 * `?step=phone` is where the phone-verification guard sends people, so this
 * route stays reachable after onboarding is complete — as long as the reason
 * is a missing phone verification.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const user = await requireUser("/onboarding");
  const params = await searchParams;
  const phoneOnly = params.step === "phone";

  if (phoneOnly) {
    if (user.phoneNumberVerified || user.onboardedAt) redirect("/home");
    const t = await getTranslations("onboarding");
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader title={t("phone.title")} subtitle={t("phone.subtitle")} />
        <PhoneVerifyCard
          verified={user.phoneNumberVerified}
          defaultPhone={user.phoneNumber}
          skipHref="/home"
        />
      </div>
    );
  }

  if (user.onboardedAt) redirect("/home");

  const [t, setup, areas, interests] = await Promise.all([
    getTranslations("onboarding"),
    getUserSetup(user.id),
    getAreas(),
    getInterests(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <OnboardingFlow
        interests={interests.map((i) => ({
          id: i.id,
          nameEn: i.nameEn,
          nameBn: i.nameBn,
          icon: i.icon,
        }))}
        areas={areas.map((a) => ({
          id: a.id,
          nameEn: a.nameEn,
          nameBn: a.nameBn,
          zone: a.zone,
          zoneLabelEn: a.zoneLabelEn,
          zoneLabelBn: a.zoneLabelBn,
        }))}
        selectedInterestIds={setup.interests.map((i) => i.id)}
        areaId={user.areaId}
        availability={setup.availability.map((a) => ({ weekday: a.weekday, slot: a.slot }))}
        preferences={
          setup.preferences
            ? {
                groupSize: setup.preferences.groupSize,
                womenOnly: setup.preferences.womenOnly,
                mode: setup.preferences.mode,
                language: setup.preferences.language,
              }
            : null
        }
        bio={user.bio}
        avatarUrl={user.avatarUrl}
        phoneVerified={user.phoneNumberVerified}
        phone={user.phoneNumber}
      />
    </div>
  );
}
