import { describe, expect, it } from "vitest";

import {
  hasSeatAvailable,
  pickPromotion,
  resolveRsvpStatus,
  toRsvpStatus,
} from "@/lib/rsvp/waitlist";

describe("resolveRsvpStatus", () => {
  it("gives a free seat to someone joining a half-empty activity", () => {
    expect(
      resolveRsvpStatus({ action: "join", going: 3, capacity: 8, current: null }),
    ).toBe("going");
  });

  it("waitlists someone joining a full activity", () => {
    expect(
      resolveRsvpStatus({ action: "join", going: 8, capacity: 8, current: null }),
    ).toBe("waitlist");
  });

  it("honours an explicit waitlist request even with free seats", () => {
    expect(
      resolveRsvpStatus({ action: "waitlist", going: 1, capacity: 8, current: null }),
    ).toBe("waitlist");
  });

  it("never demotes an existing guest when a full activity is tapped again", () => {
    // The going count includes this member, so 8/8 must still read as "going".
    expect(
      resolveRsvpStatus({ action: "join", going: 8, capacity: 8, current: "going" }),
    ).toBe("going");
  });

  it("lets a waitlisted member take an open seat when they join again", () => {
    expect(
      resolveRsvpStatus({ action: "join", going: 2, capacity: 8, current: "waitlist" }),
    ).toBe("going");
  });

  it("treats a cancelled RSVP like no RSVP at all", () => {
    expect(
      resolveRsvpStatus({ action: "join", going: 8, capacity: 8, current: "cancelled" }),
    ).toBe("waitlist");
  });
});

describe("toRsvpStatus", () => {
  it("narrows the stored text column to a known state", () => {
    expect(toRsvpStatus("going")).toBe("going");
    expect(toRsvpStatus("waitlist")).toBe("waitlist");
    expect(toRsvpStatus("cancelled")).toBe("cancelled");
    expect(toRsvpStatus(null)).toBeNull();
    expect(toRsvpStatus(undefined)).toBeNull();
    expect(toRsvpStatus("something-else")).toBeNull();
  });
});

describe("hasSeatAvailable", () => {
  it("is strict about capacity", () => {
    expect(hasSeatAvailable(7, 8)).toBe(true);
    expect(hasSeatAvailable(8, 8)).toBe(false);
    expect(hasSeatAvailable(9, 8)).toBe(false);
  });
});

describe("pickPromotion", () => {
  const waiting = [
    { userId: "recent", createdAt: new Date("2026-03-02T10:00:00Z") },
    { userId: "longest", createdAt: new Date("2026-03-01T09:00:00Z") },
    { userId: "middle", createdAt: new Date("2026-03-02T08:00:00Z") },
  ];

  it("promotes whoever has been waiting longest", () => {
    expect(pickPromotion(waiting)?.userId).toBe("longest");
  });

  it("does not depend on the order the rows arrive in", () => {
    expect(pickPromotion([...waiting].reverse())?.userId).toBe("longest");
  });

  it("returns null when nobody is waiting", () => {
    expect(pickPromotion([])).toBeNull();
  });
});
