"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { phoneSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RESEND_SECONDS = 45;

/**
 * Phone verification (required before joining a circle or an activity).
 *
 * Uses Better Auth's phone-number plugin: `sendOtp` then `verify`. In
 * development the SMS provider is the console one, so the code is printed by
 * the dev server.
 */
export function PhoneVerifyCard({
  defaultPhone,
  verified,
  skipHref,
  compact,
}: {
  defaultPhone?: string | null;
  verified: boolean;
  /** When set, renders a "skip for now" link (used inside onboarding). */
  skipHref?: string;
  /** Drops the card chrome — for embedding inside another card. */
  compact?: boolean;
}) {
  const t = useTranslations("onboarding.phone");
  const ta = useTranslations("auth");
  const router = useRouter();

  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  function sendCode() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(ta("errorInvalidPhone"));
      return;
    }
    startTransition(async () => {
      const result = await authClient.phoneNumber.sendOtp({ phoneNumber: parsed.data });
      if (result.error) {
        toast.error(ta("errorTooMany"));
        return;
      }
      setSent(true);
      setCooldown(RESEND_SECONDS);
      toast.success(ta("sendCode"));
    });
  }

  function verify() {
    if (!/^\d{6}$/.test(code)) {
      toast.error(ta("errorInvalidCode"));
      return;
    }
    startTransition(async () => {
      const result = await authClient.phoneNumber.verify({ phoneNumber: phone, code });
      if (result.error) {
        toast.error(ta("errorInvalidCode"));
        return;
      }
      toast.success(ta("phoneVerified"));
      router.refresh();
    });
  }

  const body = verified ? (
    <p className="flex items-center gap-2 text-sm text-success">
      <BadgeCheck className="size-4" aria-hidden />
      {t("verified")}
    </p>
  ) : (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verify-phone">{t("label")}</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="verify-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="017XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={sent}
          />
          {sent ? (
            <Input
              aria-label={t("codeLabel")}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="sm:w-40"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              autoFocus
            />
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={sent ? verify : sendCode} disabled={pending} className="gap-2">
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <ShieldCheck aria-hidden />
          )}
          {sent ? t("verify") : t("sendCode")}
        </Button>

        {sent ? (
          <Button
            type="button"
            variant="ghost"
            onClick={sendCode}
            disabled={cooldown > 0 || pending}
          >
            {cooldown > 0 ? ta("resendIn", { seconds: cooldown }) : ta("resend")}
          </Button>
        ) : null}

        {skipHref ? (
          <Link
            href={skipHref}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("skipForNow")}
          </Link>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">{t("requiredNote")}</p>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-3">
        <h3 className="font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        {body}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
