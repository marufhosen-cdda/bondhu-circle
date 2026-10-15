"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { createActivity, updateActivity } from "@/lib/actions/host";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Interest = { id: number; nameEn: string; nameBn: string };
type Venue = { id: number; name: string; address: string; type: string };

export interface ActivityFormValues {
  id?: number;
  title: string;
  description: string;
  categoryInterestId: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: string;
  costBdt: string;
  womenOnly: boolean;
  imageUrl: string;
}

export function ActivityForm({
  interests,
  venues,
  initial,
}: {
  interests: Interest[];
  venues: Venue[];
  initial?: ActivityFormValues;
}) {
  const t = useTranslations("host.form");
  const th = useTranslations("host");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const editing = Boolean(initial?.id);

  const [values, setValues] = useState<ActivityFormValues>(
    initial ?? {
      title: "",
      description: "",
      categoryInterestId: "",
      venueId: "",
      date: "",
      startTime: "17:00",
      endTime: "19:00",
      capacity: "8",
      costBdt: "0",
      womenOnly: false,
      imageUrl: "",
    },
  );
  const [pending, startTransition] = useTransition();

  function set<K extends keyof ActivityFormValues>(key: K, value: ActivityFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const payload = {
        ...(editing ? { id: initial?.id } : {}),
        title: values.title,
        description: values.description,
        categoryInterestId: values.categoryInterestId,
        venueId: values.venueId,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        capacity: values.capacity,
        costBdt: values.costBdt || "0",
        womenOnly: values.womenOnly ? "true" : "",
        imageUrl: values.imageUrl,
      };

      const result = editing
        ? await updateActivity(undefined, payload)
        : await createActivity(undefined, payload);

      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("validation") : result.error);
        return;
      }

      toast.success(editing ? t("updated") : t("created"));
      router.push("/host");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <div className="space-y-2">
          <Label htmlFor="title">{t("name")}</Label>
          <Input
            id="title"
            value={values.title}
            maxLength={120}
            placeholder={t("namePlaceholder")}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea
            id="description"
            rows={5}
            maxLength={3000}
            placeholder={t("descriptionPlaceholder")}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">{t("category")}</Label>
            <NativeSelect
              id="category"
              value={values.categoryInterestId}
              onChange={(e) => set("categoryInterestId", e.target.value)}
            >
              <option value="">{t("category")}</option>
              {interests.map((interest) => (
                <option key={interest.id} value={interest.id}>
                  {locale === "bn" ? interest.nameBn : interest.nameEn}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">{t("venue")}</Label>
            <NativeSelect
              id="venue"
              value={values.venueId}
              onChange={(e) => set("venueId", e.target.value)}
            >
              <option value="">{t("venuePlaceholder")}</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">{t("venueHint")}</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="date">{t("date")}</Label>
            <Input
              id="date"
              type="date"
              value={values.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start">{t("startTime")}</Label>
            <Input
              id="start"
              type="time"
              value={values.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">{t("endTime")}</Label>
            <Input
              id="end"
              type="time"
              value={values.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">{t("capacity")}</Label>
            <Input
              id="capacity"
              type="number"
              min={2}
              max={60}
              value={values.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">{t("cost")}</Label>
            <Input
              id="cost"
              type="number"
              min={0}
              max={100000}
              value={values.costBdt}
              onChange={(e) => set("costBdt", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("costHint")}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">{t("image")}</Label>
          <Input
            id="image"
            type="url"
            value={values.imageUrl}
            placeholder="https://…"
            onChange={(e) => set("imageUrl", e.target.value)}
          />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="women-only">{t("womenOnly")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{th("apply.subtitle")}</p>
          </div>
          <Switch
            id="women-only"
            checked={values.womenOnly}
            onCheckedChange={(checked) => set("womenOnly", Boolean(checked))}
          />
        </div>

        <p className="text-xs text-muted-foreground">{t("publishNote")}</p>

        <Button type="button" onClick={submit} disabled={pending} size="lg">
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : editing ? (
            <Save aria-hidden />
          ) : (
            <Send aria-hidden />
          )}
          {editing ? t("submitUpdate") : t("submit")}
        </Button>
      </CardContent>
    </Card>
  );
}
