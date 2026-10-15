"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { createPoll } from "@/lib/actions/circles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Propose another meetup-time poll (2–6 options). */
export function CreatePollForm({ circleId }: { circleId: number }) {
  const t = useTranslations("circles");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pending, startTransition] = useTransition();

  function setOption(index: number, value: string) {
    setOptions((current) => current.map((o, i) => (i === index ? value : o)));
  }

  function submit() {
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (title.trim().length < 4 || cleaned.length < 2) {
      toast.error(te("validation"));
      return;
    }

    startTransition(async () => {
      const result = await createPoll(undefined, {
        circleId,
        title,
        options: cleaned.map((label) => ({ label })),
      });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(tc("saved"));
      setOpen(false);
      setTitle("");
      setOptions(["", ""]);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock aria-hidden />
          {t("createPoll")}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createPoll")}</DialogTitle>
          <DialogDescription>{t("timePollHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poll-title">Title</Label>
            <Input
              id="poll-title"
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Saturday evening at Café Congo"
            />
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {options.map((option, index) => (
              <Input
                key={index}
                value={option}
                maxLength={80}
                onChange={(e) => setOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
            ))}
            {options.length < 6 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOptions((current) => [...current, ""])}
              >
                <Plus aria-hidden />
                {tc("new")}
              </Button>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
