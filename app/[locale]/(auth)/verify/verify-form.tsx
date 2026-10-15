"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  method: "email" | "phone";
  identifier: string;
  next?: string;
  email?: string;
  phone?: string;
}

const RESEND_SECONDS = 45;

/** Six-digit OTP entry for both email and phone sign-in. */
export function VerifyForm({ method, identifier, next, phone }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  function verify() {
    if (!/^\d{6}$/.test(code)) {
      setError(t("errorInvalidCode"));
      return;
    }
    setError(null);
    startTransition(async () => {        const result =
          method === "email"
            ? await authClient.signIn.emailOtp({ email: identifier, otp: code })
            : await authClient.phoneNumber.verify({ phoneNumber: identifier, code });

      if (result.error) {
        const message = result.error.message ?? "";
        setError(
          message.includes("TOO_MANY") ? t("errorTooMany") : t("errorInvalidCode"),
        );
        return;
      }

      toast.success(method === "phone" ? t("phoneVerified") : t("newHere"));
      const target =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
      window.location.href = target;
    });
  }

  function resend() {
    if (cooldown > 0) return;
    startTransition(async () => {
      const result =
        method === "email"
          ? await authClient.emailOtp.sendVerificationOtp({ email: identifier, type: "sign-in" })
          : await authClient.phoneNumber.sendOtp({ phoneNumber: phone ?? identifier });
      if (result.error) {
        setError(result.error.message ?? t("errorTooMany"));
        return;
      }
      setCooldown(RESEND_SECONDS);
      setError(null);
      toast.success(t("resend"));
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="otp">{t("codeLabel")}</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          className="h-14 text-center text-2xl tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && verify()}
          aria-describedby={error ? "otp-error" : undefined}
          aria-invalid={Boolean(error)}
          autoFocus
        />
        {error ? (
          <p id="otp-error" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <Button className="w-full" size="lg" onClick={verify} disabled={pending || code.length !== 6}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <ShieldCheck aria-hidden />}
        {pending ? t("verifying") : t("verify")}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || pending}
          className="text-primary underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/sign-in")}
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("backToSignIn")}
        </button>
      </div>
    </div>
  );
}
