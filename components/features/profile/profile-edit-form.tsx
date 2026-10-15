"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { updateProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type Area = { id: number; nameEn: string; nameBn: string; zoneLabelEn: string; zoneLabelBn: string };

export interface ProfileFormValues {
  name: string;
  gender: string;
  birthYear: string;
  areaId: string;
  bio: string;
  avatarUrl: string;
}

/** Name, gender, birth year, area, bio and avatar — never contact details. */
export function ProfileEditForm({
  areas,
  initial,
}: {
  areas: Area[];
  initial: ProfileFormValues;
}) {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const tn = useTranslations("onboarding.area");
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await updateProfile(undefined, values);
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("validation") : result.error);
        return;
      }
      toast.success(t("saved"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          value={values.name}
          maxLength={80}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="gender">{t("gender")}</Label>
          <NativeSelect
            id="gender"
            value={values.gender}
            onChange={(e) => set("gender", e.target.value)}
          >
            <option value="">—</option>
            <option value="male">{t("genderMale")}</option>
            <option value="female">{t("genderFemale")}</option>
            <option value="other">{t("genderOther")}</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthYear">{t("birthYear")}</Label>
          <Input
            id="birthYear"
            type="number"
            min={1950}
            max={2010}
            value={values.birthYear}
            onChange={(e) => set("birthYear", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">{t("areaLabel")}</Label>
        <NativeSelect
          id="area"
          value={values.areaId}
          onChange={(e) => set("areaId", e.target.value)}
        >
          <option value="">{tn("choose")}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {locale === "bn" ? area.nameBn : area.nameEn} ·{" "}
              {locale === "bn" ? area.zoneLabelBn : area.zoneLabelEn}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t("bioLabel")}</Label>
        <Textarea
          id="bio"
          rows={4}
          maxLength={400}
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar">{t("avatarUrl")}</Label>
        <Input
          id="avatar"
          type="url"
          value={values.avatarUrl}
          placeholder="https://…"
          onChange={(e) => set("avatarUrl", e.target.value)}
        />
      </div>

      <Button onClick={save} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
        {t("edit")}
      </Button>
    </div>
  );
}
