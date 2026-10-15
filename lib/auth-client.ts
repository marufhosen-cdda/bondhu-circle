"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, phoneNumberClient } from "better-auth/client/plugins";

/**
 * Browser-side auth client. Talks to `/api/auth/*`, which `proxy.ts` forwards
 * to the Better Auth handler — the project ships no API routes.
 */
export const authClient = createAuthClient({
  plugins: [emailOTPClient(), phoneNumberClient()],
});
