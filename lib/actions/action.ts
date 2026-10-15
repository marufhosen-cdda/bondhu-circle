import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/session";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { User } from "@/lib/db/schema";

/**
 * The one wrapper every Server Action in this project goes through:
 *
 *   require session → Zod parse → authorization check → DB write →
 *   revalidate → `{ ok: true, data } | { ok: false, error }`
 *
 * Raw errors never reach the client; they are logged server-side and mapped
 * to a translation key that the UI renders in the user's language.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export interface ActionContext {
  user: User;
}

export type AuthorizationLevel = "user" | "verified-phone" | "admin" | "public";

/**
 * Throw from a handler to return a specific translation key to the client.
 * Anything else is logged and mapped to `errors.generic`.
 */
export class ActionError extends Error {
  readonly fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ActionError";
    this.fieldErrors = fieldErrors;
  }
}

export interface ActionConfig<TSchema extends z.ZodType, TResult> {
  /** Zod schema for the input. FormData and plain objects both work. */
  schema?: TSchema;
  /** Session requirement. Defaults to "user" (signed in, not suspended). */
  authorize?: AuthorizationLevel;
  /** Named Postgres rate limit, e.g. RATE_LIMITS.rsvp. */
  rateLimit?: { key: keyof typeof RATE_LIMITS } | { max: number; windowSec: number; key?: string };
  /**
   * Paths (or computed paths) to revalidate after a successful write.
   *
   * Deliberately gets `input` and `user` but *not* the handler's return value:
   * `TResult` in an unannotated callback parameter makes TypeScript treat the
   * whole config object as context-sensitive and collapse `TResult` to
   * `unknown` for every caller. Actions that need to invalidate a route keyed
   * by a freshly created row should revalidate the collection path or use
   * `tags`.
   */
  revalidate?: string[] | ((input: z.infer<TSchema>, user: User) => string[]);
  /** Tags to invalidate, e.g. ["activities"]. */
  tags?: string[];
  /**
   * The write itself. Note the explicit `ActionContext` annotation on the
   * second parameter: TypeScript cannot infer `TResult` from a handler whose
   * parameters are all contextually typed (it collapses to `unknown`), so
   * annotating the context keeps `{ ok: true, data }` strongly typed for
   * every caller. Write it as `(input, { user }: ActionContext) => …`.
   */
  handler: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<TResult>;
}

type RawInput = FormData | Record<string, unknown> | unknown;

function toPlainObject(raw: RawInput): unknown {
  if (raw instanceof FormData) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of raw.entries()) {
      if (typeof value === "string") {
        if (key in out) {
          const existing = out[key];
          out[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        } else {
          out[key] = value;
        }
      }
      // File entries are ignored here; handlers that need files read them.
    }
    return out;
  }
  return raw;
}

function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function isRateLimitOption(
  v: ActionConfig<z.ZodType, unknown>["rateLimit"],
): v is { max: number; windowSec: number; key?: string } {
  return Boolean(v && "max" in v && "windowSec" in v);
}

export function createAction<TSchema extends z.ZodType, TResult>(
  config: ActionConfig<TSchema, TResult>,
): (prev: ActionResult<TResult> | undefined, raw: RawInput) => Promise<ActionResult<TResult>> {
  const authorize = config.authorize ?? "user";

  return async function run(_prev, raw) {
    try {
      // 1. Session ----------------------------------------------------------
      const user = authorize === "public" ? null : await getCurrentUser();
      if (authorize !== "public") {
        if (!user) return { ok: false, error: "errors.sessionExpired" };
        if (user.status === "suspended") return { ok: false, error: "auth.errorSuspended" };
        if (authorize === "admin" && user.role !== "admin") {
          return { ok: false, error: "errors.unauthorized" };
        }
        if (authorize === "verified-phone" && !user.phoneNumberVerified) {
          return { ok: false, error: "activities.detail.verifyPhoneToJoin" };
        }
      }
      if (!user && authorize === "public") {
        // public actions still need a placeholder ctx; handlers must not use it
        return { ok: false, error: "errors.unauthorized" };
      }

      // 2. Rate limit -------------------------------------------------------
      if (config.rateLimit) {
        const rl = isRateLimitOption(config.rateLimit)
          ? { max: config.rateLimit.max, windowSec: config.rateLimit.windowSec, key: config.rateLimit.key }
          : { ...RATE_LIMITS[config.rateLimit.key], key: config.rateLimit.key };
        const bucket = `app:${rl.key}:${user!.id}`;
        const allowed = await consumeRateLimit(bucket, { max: rl.max, windowSec: rl.windowSec });
        if (!allowed.ok) return { ok: false, error: "errors.rateLimited" };
      }

      // 3. Zod parse --------------------------------------------------------
      let input: z.infer<TSchema>;
      if (config.schema) {
        const parsed = config.schema.safeParse(toPlainObject(raw));
        if (!parsed.success) {
          return {
            ok: false,
            error: "errors.validation",
            fieldErrors: zodFieldErrors(parsed.error),
          };
        }
        input = parsed.data;
      } else {
        input = toPlainObject(raw) as z.infer<TSchema>;
      }

      // 4. Authorization + write -------------------------------------------
      const data = await config.handler(input, { user: user! });

      // 5. Revalidation -----------------------------------------------------
      const paths =
        typeof config.revalidate === "function"
          ? config.revalidate(input, user!)
          : config.revalidate;
      for (const path of paths ?? []) revalidatePath(path);
      for (const tag of config.tags ?? []) revalidateTag(tag, "max");

      return { ok: true, data };
    } catch (err) {
      if (err instanceof ActionError) {
        return { ok: false, error: err.message, fieldErrors: err.fieldErrors };
      }
      console.error("[action] unhandled error", err);
      return { ok: false, error: "errors.generic" };
    }
  };
}
