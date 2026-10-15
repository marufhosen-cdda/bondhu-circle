/**
 * Pure RSVP + waitlist rules.
 *
 * Kept free of database and framework imports so the capacity rules — the part
 * that decides whether someone gets a seat or a place in the queue — can be
 * unit-tested directly. `lib/actions/rsvp.ts` runs these inside one
 * transaction with `SELECT … FOR UPDATE`.
 */

export type RsvpStatus = "going" | "waitlist";

export interface RsvpDecisionInput {
  /** What the member asked for. */
  action: "join" | "waitlist";
  /** Seats already taken (only `going` rows count). */
  going: number;
  capacity: number;
  /** This member's current RSVP, if any. */
  current: RsvpStatus | "cancelled" | null;
}

/**
 * Decide the status for a join/waitlist request.
 *
 * Note the `current === "going"` check: the `going` count includes the member
 * themselves, so a full activity would otherwise demote an existing guest to
 * the waitlist when they simply tapped the button again.
 */
export function resolveRsvpStatus(input: RsvpDecisionInput): RsvpStatus {
  if (input.current === "going") return "going";
  if (input.action === "waitlist") return "waitlist";
  return input.going < input.capacity ? "going" : "waitlist";
}

/** Narrows the stored (text) status column to a known RSVP state. */
export function toRsvpStatus(
  value: string | null | undefined,
): RsvpStatus | "cancelled" | null {
  return value === "going" || value === "waitlist" || value === "cancelled" ? value : null;
}

/** True when the request changes what the DB should store. */
export function hasSeatAvailable(going: number, capacity: number): boolean {
  return going < capacity;
}

/**
 * The member who gets promoted when a seat frees up: the one who has been
 * waiting longest. Ties fall back to the earliest row in the list.
 */
export function pickPromotion<T extends { createdAt: Date }>(waiting: T[]): T | null {
  if (waiting.length === 0) return null;
  return waiting.reduce((oldest, row) => (row.createdAt < oldest.createdAt ? row : oldest));
}
