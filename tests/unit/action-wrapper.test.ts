import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { User } from "@/lib/db/schema";

/**
 * The wrapper is the single funnel every mutation goes through, so its
 * contract is tested directly: session → rate limit → validation →
 * authorization → write → revalidate → `{ ok, data } | { ok, error }`.
 */
const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  consumeRateLimit: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  RATE_LIMITS: {
    rsvp: { max: 10, windowSec: 60 },
    report: { max: 5, windowSec: 60 },
  },
}));

const { ActionError, createAction } = await import("@/lib/actions/action");

function user(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    name: "Rumana",
    email: "rumana@example.com",
    emailVerified: true,
    phoneNumber: "+8801711111111",
    phoneNumberVerified: true,
    role: "member",
    status: "active",
    gender: "female",
    birthYear: 1996,
    areaId: 1,
    bio: null,
    avatarUrl: null,
    locale: "en",
    onboardedAt: new Date(),
    guidelinesAcceptedAt: new Date(),
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue(user());
  mocks.consumeRateLimit.mockResolvedValue({ ok: true, remaining: 1 });
});

const schema = z.object({ title: z.string().min(3) });

describe("createAction", () => {
  it("returns a session error instead of throwing when nobody is signed in", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const action = createAction({
      schema,
      handler: async () => ({ done: true }),
    });

    await expect(action(undefined, { title: "hello" })).resolves.toEqual({
      ok: false,
      error: "errors.sessionExpired",
    });
  });

  it("blocks suspended accounts", async () => {
    mocks.getCurrentUser.mockResolvedValue(user({ status: "suspended" }));

    const action = createAction({ schema, handler: async () => ({ done: true }) });
    const result = await action(undefined, { title: "hello" });

    expect(result).toEqual({ ok: false, error: "auth.errorSuspended" });
  });

  it("enforces the admin authorization level", async () => {
    const action = createAction({
      schema,
      authorize: "admin",
      handler: async () => ({ done: true }),
    });

    expect(await action(undefined, { title: "hello" })).toEqual({
      ok: false,
      error: "errors.unauthorized",
    });

    mocks.getCurrentUser.mockResolvedValue(user({ role: "admin" }));
    expect(await action(undefined, { title: "hello" })).toEqual({ ok: true, data: { done: true } });
  });

  it("requires a verified phone when the action asks for one", async () => {
    mocks.getCurrentUser.mockResolvedValue(user({ phoneNumberVerified: false }));

    const action = createAction({
      schema,
      authorize: "verified-phone",
      handler: async () => ({ done: true }),
    });

    expect(await action(undefined, { title: "hello" })).toEqual({
      ok: false,
      error: "activities.detail.verifyPhoneToJoin",
    });
  });

  it("returns field errors when validation fails and never runs the handler", async () => {
    const handler = vi.fn(async () => ({ done: true }));
    const action = createAction({ schema, handler });

    const result = await action(undefined, { title: "hi" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("errors.validation");
      expect(result.fieldErrors).toHaveProperty("title");
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it("accepts FormData as well as plain objects", async () => {
    const action = createAction({
      schema,
      handler: async (input) => ({ title: input.title }),
    });

    const form = new FormData();
    form.set("title", "Sunday walk");

    expect(await action(undefined, form)).toEqual({ ok: true, data: { title: "Sunday walk" } });
  });

  it("rejects the request when the rate limit is exhausted", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ ok: false, remaining: 0 });

    const action = createAction({
      schema,
      rateLimit: { key: "rsvp" },
      handler: async () => ({ done: true }),
    });

    expect(await action(undefined, { title: "hello" })).toEqual({
      ok: false,
      error: "errors.rateLimited",
    });
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith("app:rsvp:user-1", {
      max: 10,
      windowSec: 60,
    });
  });

  it("revalidates the declared paths and tags after a successful write", async () => {
    const action = createAction({
      schema,
      tags: ["activities"],
      revalidate: (input, currentUser) => ["/activities", `/profile/${currentUser.id}`, input.title],
      handler: async () => ({ done: true }),
    });

    await action(undefined, { title: "/home" });

    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/activities",
      "/profile/user-1",
      "/home",
    ]);
    expect(mocks.revalidateTag).toHaveBeenCalledWith("activities", "max");
  });

  it("maps ActionError to its translation key and field errors", async () => {
    const action = createAction({
      schema,
      handler: async () => {
        throw new ActionError("host.form.venueHint", { venueId: ["host.form.venueHint"] });
      },
    });

    expect(await action(undefined, { title: "hello" })).toEqual({
      ok: false,
      error: "host.form.venueHint",
      fieldErrors: { venueId: ["host.form.venueHint"] },
    });
  });

  it("never leaks an unexpected error to the client", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const action = createAction({
      schema,
      handler: async () => {
        throw new Error("connection reset by peer");
      },
    });

    const result = await action(undefined, { title: "hello" });

    expect(result).toEqual({ ok: false, error: "errors.generic" });
    expect(JSON.stringify(result)).not.toContain("connection reset");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("passes the signed-in user to the handler", async () => {
    const handler = vi.fn(async (_input, ctx: { user: User }) => ({ id: ctx.user.id }));
    const action = createAction({ schema, handler });

    expect(await action(undefined, { title: "hello" })).toEqual({
      ok: true,
      data: { id: "user-1" },
    });
  });
});
