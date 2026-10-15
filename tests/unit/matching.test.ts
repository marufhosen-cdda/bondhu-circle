import { describe, expect, it } from "vitest";

import {
  ageWithinFive,
  availabilityOverlap,
  formGroups,
  isEligiblePair,
  jaccard,
  languageCompatible,
  matchAll,
  pairKey,
  pairScore,
  partitionByZone,
  type MatchCandidate,
  type MatchContext,
} from "@/lib/matching/core";

function candidate(overrides: Partial<MatchCandidate> & { userId: string }): MatchCandidate {
  return {
    zone: "dhanmondi",
    womenOnly: false,
    interests: [],
    availability: [],
    birthYear: 1998,
    language: "both",
    groupSize: "small",
    ...overrides,
  };
}

const EMPTY_CONTEXT: MatchContext = {
  blockedPairs: new Set(),
  leftTogether: new Set(),
};

describe("jaccard", () => {
  it("is 0 when either side has no interests", () => {
    expect(jaccard([], [1, 2])).toBe(0);
    expect(jaccard([1], [])).toBe(0);
    expect(jaccard([], [])).toBe(0);
  });

  it("is 1 for identical sets and 1/3 for one shared item out of three", () => {
    expect(jaccard([1, 2, 3], [1, 2, 3])).toBe(1);
    expect(jaccard([1, 2], [2, 3])).toBeCloseTo(1 / 3, 5);
  });
});

describe("availabilityOverlap", () => {
  it("normalises by the union of slots", () => {
    expect(availabilityOverlap(["6:evening"], ["6:evening"])).toBe(1);
    expect(availabilityOverlap(["6:evening"], ["6:morning"])).toBe(0);
    expect(availabilityOverlap(["6:evening", "0:morning"], ["6:evening"])).toBe(0.5);
  });
});

describe("pairScore", () => {
  it("awards the full 100 for identical profiles", () => {
    const a = candidate({
      userId: "a",
      interests: [1, 2, 3],
      availability: ["6:evening"],
      language: "bn",
    });
    const b = candidate({
      userId: "b",
      interests: [1, 2, 3],
      availability: ["6:evening"],
      language: "bn",
    });
    // 50 interests + 30 availability + 10 age + 10 language
    expect(pairScore(a, b)).toBe(100);
  });

  it("scores an age gap wider than five years without the age bonus", () => {
    const a = candidate({ userId: "a", interests: [1], availability: ["6:evening"], birthYear: 1990 });
    const b = candidate({ userId: "b", interests: [1], availability: ["6:evening"], birthYear: 2000 });

    expect(ageWithinFive(a, b)).toBe(false);
    expect(pairScore(a, b)).toBe(90);
  });

  it("treats `both` as compatible with either language", () => {
    expect(languageCompatible("both", "bn")).toBe(true);
    expect(languageCompatible("en", "bn")).toBe(false);

    const a = candidate({ userId: "a", interests: [1], availability: ["6:evening"], language: "en" });
    const b = candidate({ userId: "b", interests: [1], availability: ["6:evening"], language: "bn" });
    expect(pairScore(a, b)).toBe(90);
  });
});

describe("isEligiblePair", () => {
  it("requires the same zone and the same women-only preference", () => {
    const a = candidate({ userId: "a" });
    expect(isEligiblePair(a, candidate({ userId: "b", zone: "uttara" }), EMPTY_CONTEXT)).toBe(false);
    expect(isEligiblePair(a, candidate({ userId: "b", womenOnly: true }), EMPTY_CONTEXT)).toBe(false);
    expect(isEligiblePair(a, candidate({ userId: "b" }), EMPTY_CONTEXT)).toBe(true);
  });

  it("excludes blocked pairs and people who already left a circle together", () => {
    const a = candidate({ userId: "a" });
    const b = candidate({ userId: "b" });
    const key = pairKey("a", "b");

    expect(isEligiblePair(a, b, { blockedPairs: new Set([key]), leftTogether: new Set() })).toBe(false);
    expect(isEligiblePair(a, b, { blockedPairs: new Set(), leftTogether: new Set([key]) })).toBe(false);
    expect(isEligiblePair(b, a, { blockedPairs: new Set([key]), leftTogether: new Set() })).toBe(false);
  });
});

describe("partitionByZone", () => {
  it("splits by zone and women-only preference", () => {
    const buckets = partitionByZone([
      candidate({ userId: "a" }),
      candidate({ userId: "b" }),
      candidate({ userId: "c", zone: "uttara" }),
      candidate({ userId: "d", womenOnly: true }),
    ]);

    expect(buckets.get("dhanmondi:any")).toHaveLength(2);
    expect(buckets.get("uttara:any")).toHaveLength(1);
    expect(buckets.get("dhanmondi:women")).toHaveLength(1);
  });
});

describe("formGroups", () => {
  function pool(count: number, zone = "dhanmondi"): MatchCandidate[] {
    return Array.from({ length: count }, (_, index) =>
      candidate({
        userId: `u${index}`,
        zone,
        interests: [1, 2, 3],
        availability: ["6:evening"],
      }),
    );
  }

  it("forms a group of five by default and never exceeds the maximum", () => {
    const groups = formGroups(pool(5), EMPTY_CONTEXT);
    expect(groups).toHaveLength(1);
    expect(groups[0].memberIds).toHaveLength(5);
  });

  it("splits a large pool into groups within 4–6", () => {
    const groups = formGroups(pool(11), EMPTY_CONTEXT);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    for (const group of groups) {
      expect(group.memberIds.length).toBeGreaterThanOrEqual(4);
      expect(group.memberIds.length).toBeLessThanOrEqual(6);
    }
  });

  it("leaves too-small pools for the next run", () => {
    expect(formGroups(pool(3), EMPTY_CONTEXT)).toHaveLength(0);
  });

  it("never puts a blocked pair together, even in a tight pool", () => {
    const candidates = pool(6);
    const blocked = pairKey("u0", "u1");
    const groups = formGroups(candidates, {
      blockedPairs: new Set([blocked]),
      leftTogether: new Set(),
    });

    for (const group of groups) {
      const hasPair = group.memberIds.includes("u0") && group.memberIds.includes("u1");
      expect(hasPair).toBe(false);
    }
  });

  it("keeps every member in at most one group", () => {
    const groups = formGroups(pool(20), EMPTY_CONTEXT);
    const seen = groups.flatMap((group) => group.memberIds);
    expect(new Set(seen).size).toBe(seen.length);
  });
});

describe("matchAll", () => {
  it("matches within zones and respects the women-only split", () => {
    const groups = matchAll(
      [
        ...Array.from({ length: 4 }, (_, i) => candidate({ userId: `d${i}` })),
        ...Array.from({ length: 4 }, (_, i) =>
          candidate({ userId: `w${i}`, womenOnly: true }),
        ),
        ...Array.from({ length: 4 }, (_, i) => candidate({ userId: `u${i}`, zone: "uttara" })),
      ],
      EMPTY_CONTEXT,
    );

    expect(groups).toHaveLength(3);
    for (const group of groups) {
      expect(group.memberIds).toHaveLength(4);
    }

    const zones = groups.map((group) => `${group.zone}:${group.womenOnly}`);
    expect(new Set(zones).size).toBe(3);
  });
});
