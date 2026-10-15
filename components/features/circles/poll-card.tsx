"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Vote } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { votePoll } from "@/lib/actions/circles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Option {
  id: number;
  label: string;
  voteCount: number;
  votedByMe: boolean;
}

interface Props {
  poll: { id: number; title: string; status: string };
  options: Option[];
  totalVotes: number;
  myVoteCount: number;
}

/**
 * Time poll: pick every option that works, submit once. The winning option is
 * simply the one with the most votes — members decide by voting, not by chat.
 */
export function PollCard({ poll, options, totalVotes, myVoteCount }: Props) {
  const t = useTranslations("circles");
  const te = useTranslations("errors");
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>(
    options.filter((o) => o.votedByMe).map((o) => o.id),
  );
  const [pending, startTransition] = useTransition();

  const open = poll.status === "open";
  const maxVotes = Math.max(1, ...options.map((o) => o.voteCount));

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    );
  }

  function submit() {
    if (!selected.length) return;
    startTransition(async () => {
      const result = await votePoll(undefined, { pollId: poll.id, optionIds: selected });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      toast.success(t("voted"));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{poll.title || t("timePoll")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("timePollHint")}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {options.map((option) => {
            const active = selected.includes(option.id);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => (open ? toggle(option.id) : undefined)}
                  aria-pressed={active}
                  disabled={!open}
                  className={cn(
                    "relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40",
                    !open && "cursor-default opacity-90",
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-primary/10"
                    style={{ width: `${(option.voteCount / maxVotes) * 100}%` }}
                  />
                  <span className="relative flex items-center gap-2 font-medium">
                    {active ? <Check className="size-4 text-primary" aria-hidden /> : null}
                    {option.label}
                  </span>
                  <span className="relative text-xs text-muted-foreground">
                    {t("votes", { count: option.voteCount })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {open ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t("votes", { count: totalVotes })}
              {myVoteCount > 0 ? ` · ${t("voted")}` : ""}
            </p>
            <Button onClick={submit} disabled={pending || !selected.length} size="sm">
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Vote aria-hidden />}
              {t("vote")}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
