import { getTranslations } from "next-intl/server";
import { Bell, Languages, TriangleAlert, UserCog } from "lucide-react";

import { requireOnboarded } from "@/lib/session";
import { getAreas } from "@/lib/queries/reference";
import { getBlockedUsers, getNotificationPrefs } from "@/lib/queries/users";
import { PageHeader } from "@/components/features/shared/page-header";
import { ProfileEditForm } from "@/components/features/profile/profile-edit-form";
import { NotificationPrefsForm } from "@/components/features/profile/notification-prefs-form";
import { LanguageForm } from "@/components/features/profile/language-form";
import { BlockedList } from "@/components/features/profile/blocked-list";
import { PhoneVerifyCard } from "@/components/features/profile/phone-verify-card";
import { DeleteAccountDialog } from "@/components/features/profile/delete-account-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeUp } from "@/components/motion";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const user = await requireOnboarded();

  const [t, tp, areas, prefs, blocked] = await Promise.all([
    getTranslations("settings"),
    getTranslations("profile"),
    getAreas(),
    getNotificationPrefs(user.id),
    getBlockedUsers(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={t("title")} subtitle={t("notificationsHint")} />

      <FadeUp>
        <div id="phone">
          <PhoneVerifyCard
            verified={user.phoneNumberVerified}
            defaultPhone={user.phoneNumber}
          />
        </div>
      </FadeUp>

      <FadeUp>
        <Card id="profile">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCog className="size-4 text-primary" aria-hidden />
              {tp("editTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileEditForm
              areas={areas.map((a) => ({
                id: a.id,
                nameEn: a.nameEn,
                nameBn: a.nameBn,
                zoneLabelEn: a.zoneLabelEn,
                zoneLabelBn: a.zoneLabelBn,
              }))}
              initial={{
                name: user.name,
                gender: user.gender ?? "",
                birthYear: user.birthYear ? String(user.birthYear) : "",
                areaId: user.areaId ? String(user.areaId) : "",
                bio: user.bio ?? "",
                avatarUrl: user.avatarUrl ?? "",
              }}
            />
          </CardContent>
        </Card>
      </FadeUp>

      <FadeUp>
        <Card id="language">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="size-4 text-primary" aria-hidden />
              {t("language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageForm />
          </CardContent>
        </Card>
      </FadeUp>

      <FadeUp>
        <Card id="notifications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" aria-hidden />
              {t("notifications")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPrefsForm
              initial={{
                emailCircleInvites: prefs.emailCircleInvites,
                emailActivityReminders: prefs.emailActivityReminders,
                emailFeedbackRequests: prefs.emailFeedbackRequests,
                emailGeneral: prefs.emailGeneral,
                inAppNotifications: prefs.inAppNotifications,
              }}
            />
          </CardContent>
        </Card>
      </FadeUp>

      <FadeUp>
        <Card id="blocked">
          <CardHeader>
            <CardTitle className="text-base">{t("blockedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BlockedList
              users={blocked.map((b) => ({ id: b.id, name: b.name, avatarUrl: b.avatarUrl }))}
            />
          </CardContent>
        </Card>
      </FadeUp>

      <FadeUp>
        <Card id="danger" className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <TriangleAlert className="size-4" aria-hidden />
              {t("deleteTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("deleteText")}</p>
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </FadeUp>
    </div>
  );
}
