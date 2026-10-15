"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { postCircleMessage } from "@/lib/actions/circles";
import { ReportButton } from "@/components/features/shared/report-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";

export interface ThreadMessage {
  id: number;
  body: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  hidden: boolean;
}

/**
 * Circle comments. Deliberately not real-time: posting revalidates the page,
 * which keeps people out of an endless chat loop and back into real meetups.
 */
export function MessageThread({
  circleId,
  currentUserId,
  messages,
}: {
  circleId: number;
  currentUserId: string;
  messages: ThreadMessage[];
}) {
  const t = useTranslations("circles");
  const te = useTranslations("errors");
  const ts = useTranslations("safety");
  const locale = useLocale();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function send() {
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await postCircleMessage(undefined, { circleId, body: trimmed });
      if (!result.ok) {
        toast.error(result.error.startsWith("errors.") ? te("generic") : result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("messages")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("messagesHint")}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noMessages")}
          </p>
        ) : (
          <ul className="space-y-4">
            {messages.map((message) => (
              <li key={message.id} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  {message.authorAvatar ? (
                    <AvatarImage src={message.authorAvatar} alt="" />
                  ) : null}
                  <AvatarFallback>{message.authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      href={`/profile/${message.authorId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {message.authorName}
                      {message.authorId === currentUserId ? " (you)" : ""}
                    </Link>
                    <span>{formatDateTime(message.createdAt, locale)}</span>

                    {!message.hidden && message.authorId !== currentUserId ? (
                      <span className="ml-auto">
                        <ReportButton
                          targetType="message"
                          targetId={message.id}
                          label={ts("reportButton")}
                        />
                      </span>
                    ) : null}
                  </div>

                  {message.hidden ? (
                    <p className="mt-1 text-sm italic text-muted-foreground">{t("hiddenMessage")}</p>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.body}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <Textarea
            value={body}
            maxLength={800}
            rows={2}
            placeholder={t("messagePlaceholder")}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            aria-label={t("messagePlaceholder")}
          />
          <div className="flex justify-end">
            <Button onClick={send} disabled={pending || !body.trim()} size="sm">
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              {t("send")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
