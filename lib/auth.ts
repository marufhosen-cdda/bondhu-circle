import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, phoneNumber } from "better-auth/plugins";

import * as schema from "@/lib/db/schema";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendOtpEmail } from "@/lib/email";
import { isValidBdPhone, normalizeBdPhone, sendSms } from "@/lib/sms";

/**
 * Better Auth instance.
 *
 * Deliberately free of `next/headers` imports so `proxy.ts` can reuse it for
 * both request handling and session lookups.
 *
 * There are no API routes in this project: `proxy.ts` forwards `/api/auth/*`
 * straight to `auth.handler(request)`.
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      rateLimit: schema.rateLimitBuckets,
    },
  }),

  // Postgres-backed rate limiting (counts live in the `rate_limits` table).
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 40,
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 5 },
      "/sign-in/email-otp": { window: 60, max: 10 },
      "/phone-number/send-otp": { window: 60, max: 5 },
      "/sign-in/phone-number": { window: 60, max: 10 },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh the cookie once a day
    freshAge: 60 * 60 * 24,
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      allowedAttempts: 3,
      sendVerificationOTP: async ({ email, otp, type }) => {
        console.log(`\n========================================\n[DEV AUTH OTP] ${email} -> ${otp}\n========================================\n`);
        if (type === "sign-in" || type === "email-verification" || type === "forget-password") {
          try {
            await sendOtpEmail({ to: email, code: otp, locale: "en" });
          } catch (err) {
            console.warn(`[email:otp:warn] Failed to send email:`, err instanceof Error ? err.message : err);
          }
        }
      },
    }),

    phoneNumber({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3,
      phoneNumberValidator: isValidBdPhone,
      sendOTP: async ({ phoneNumber, code }) => {
        console.log(`\n========================================\n[DEV AUTH OTP] ${phoneNumber} -> ${code}\n========================================\n`);
        try {
          await sendSms(
            normalizeBdPhone(phoneNumber),
            `Your Bondhu Circle code is ${code}. It expires in 5 minutes. Never share it.`,
          );
        } catch (err) {
          console.warn(`[sms:otp:warn] Failed to send SMS:`, err instanceof Error ? err.message : err);
        }
      },
      // Lets someone sign up and in with a phone number alone.
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${normalizeBdPhone(phoneNumber).slice(1)}@bondhu.app`,
        getTempName: () => "Bondhu member",
      },
    }),

    // Must stay last: reads the session cookie on the way out.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
