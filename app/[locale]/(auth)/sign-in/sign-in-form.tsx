"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Sign-in entry: send an email OTP or an SMS OTP, then hand off to /verify.
 * The codes themselves are entered on the verify screen.
 */
export function SignInForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  function sendEmailOtp() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setErrors({ email: t("errorInvalidEmail") });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim(),
        type: "sign-in",
      });
      if (error) {
        toast.error(error.message ?? t("errorInvalidEmail"));
        return;
      }
      const qs = new URLSearchParams();
      if (next) qs.set("next", next);
      qs.set("method", "email");
      qs.set("email", email.trim());
      router.push(`/verify?${qs.toString()}`);
    });
  }

  function sendPhoneOtp() {
    const valid = /^(\+?880|0)1[3-9]\d{8}$/.test(phone.trim());
    if (!valid) {
      setErrors({ phone: t("errorInvalidPhone") });
      return;
    }
    setErrors({});
    startTransition(async () => {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone.trim() });
      if (error) {
        toast.error(error.message ?? t("errorInvalidPhone"));
        return;
      }
      const qs = new URLSearchParams();
      if (next) qs.set("next", next);
      qs.set("method", "phone");
      qs.set("phone", phone.trim());
      router.push(`/verify?${qs.toString()}`);
    });
  }

  return (
    <Tabs defaultValue="email">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="email">
          <Mail className="size-4" aria-hidden /> {t("emailTab")}
        </TabsTrigger>
        <TabsTrigger value="phone">
          <Phone className="size-4" aria-hidden /> {t("phoneTab")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="email" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            onKeyDown={(e) => e.key === "Enter" && sendEmailOtp()}
          />
          {errors.email ? (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          ) : null}
        </div>
        <Button className="w-full" onClick={sendEmailOtp} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {pending ? t("sending") : t("sendCode")}
        </Button>
      </TabsContent>

      <TabsContent value="phone" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("phoneLabel")}</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            onKeyDown={(e) => e.key === "Enter" && sendPhoneOtp()}
          />
          {errors.phone ? (
            <p id="phone-error" className="text-xs text-destructive">
              {errors.phone}
            </p>
          ) : null}
        </div>
        <Button className="w-full" onClick={sendPhoneOtp} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
          {pending ? t("sending") : t("sendCode")}
        </Button>
      </TabsContent>

      <p className="mt-5 text-center text-xs text-muted-foreground">{t("devHint")}</p>
    </Tabs>
  );
}
