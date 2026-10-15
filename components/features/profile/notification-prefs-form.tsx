"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { updateNotificationPrefs } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface NotificationPrefs {
  emailCircleInvites: boolean;
  emailActivityReminders: boolean;
  emailFeedbackRequests: boolean;
  emailGeneral: boolean;
  inAppNotifications: boolean;
}

const FIELDS: (keyof NotificationPrefs)[] = [
  "emailCircleInvites",
  "emailActivityReminders",
  "emailFeedbackRequests",
  "emailGeneral",
  "inAppNotifications",
];

/**
 * Preferences are submitted as explicit "true"/"false" strings — a bare
 * boolean coercion would turn "false" into `true`.
 */
export function NotificationPrefsForm({ initial }: { initial: NotificationPrefs }) {
  const t = useTranslations("settings");
  const te = useTranslations("errors");
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const payload = Object.fromEntries(
        FIELDS.map((key) => [key, prefs[key] ? "true" : "false"]),
      ) as Record<keyof NotificationPrefs, string>;

      const result = await updateNotificationPrefs(undefined, payload);
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {FIELDS.map((key) => (
        <div
          key={key}
          className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4"
        >
          <Label htmlFor={`pref-${key}`} className="cursor-pointer">
            {t(key)}
          </Label>
          <Switch
            id={`pref-${key}`}
            checked={prefs[key]}
            onCheckedChange={(checked) =>
              setPrefs((current) => ({ ...current, [key]: Boolean(checked) }))
            }
          />
        </div>
      ))}

      <Button onClick={save} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        {t("saved")}
      </Button>
    </div>
  );
}
