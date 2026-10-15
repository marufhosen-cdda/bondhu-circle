/**
 * Pure matching core — no I/O, no framework imports, fully unit-testable.
 *
 * Scoring: interest Jaccard × 50 + availability overlap × 30 +
 * age within ±5 years (+10) + language match (+10)  →  max 100.
 */

export interface MatchCandidate {
  userId: string;
  zone: string;
  womenOnly: boolean;
  /** Interest ids the person picked during onboarding. */
  interests: number[];
  /** `weekday:slot` strings, e.g. "6:evening". */
  availability: string[];
  birthYear: number | null;
  language: "bn" | "en" | "both";
  groupSize: "small" | "medium";
}

export interface MatchContext {
  /** Pair keys (`a|b`, order-independent) that must never share a circle. */
  blockedPairs: Set<string>;
  /** Pair keys of people who already left a circle together. */
  leftTogether: Set<string>;
}

export interface MatchGroup {
  memberIds: string[];
  averageScore: number;
  zone: string;
  womenOnly: boolean;
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Intersection over union — 0 when either side has no interests. */
export function jaccard(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let intersection = 0;
  for (const item of a) if (setB.has(item)) intersection++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Fraction of shared availability slots (union normalised). */
export function availabilityOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let intersection = 0;
  for (const slot of a) if (setB.has(slot)) intersection++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function languageCompatible(a: MatchCandidate["language"], b: MatchCandidate["language"]): boolean {
  return a === b || a === "both" || b === "both";
}

export function ageWithinFive(a: MatchCandidate, b: MatchCandidate): boolean {
  if (a.birthYear === null || b.birthYear === null) return false;
  return Math.abs(a.birthYear - b.birthYear) <= 5;
}

/** 0–100 compatibility score. */
export function pairScore(a: MatchCandidate, b: MatchCandidate): number {
  const interest = jaccard(a.interests, b.interests) * 50;
  const time = availabilityOverlap(a.availability, b.availability) * 30;
  const age = ageWithinFive(a, b) ? 10 : 0;
  const language = languageCompatible(a.language, b.language) ? 10 : 0;
  return Math.round((interest + time + age + language) * 10) / 10;
}

/** Hard exclusion rules: never put these two people in the same circle. */
export function isEligiblePair(a: MatchCandidate, b: MatchCandidate, ctx: MatchContext): boolean {
  if (a.userId === b.userId) return false;
  if (a.zone !== b.zone) return false;
  if (a.womenOnly !== b.womenOnly) return false;
  const key = pairKey(a.userId, b.userId);
  if (ctx.blockedPairs.has(key)) return false;
  if (ctx.leftTogether.has(key)) return false;
  return true;
}

export interface FormGroupsOptions {
  minSize?: number;
  maxSize?: number;
}

/**
 * Greedily form groups of 4–6.
 *
 * Seeding order matters for fairness: candidates that are harder to match
 * (fewer eligible partners) get first pick, so they are not left behind at the
 * end with whoever is left over.
 */
export function formGroups(
  candidates: MatchCandidate[],
  ctx: MatchContext,
  options: FormGroupsOptions = {},
): MatchGroup[] {
  const minSize = options.minSize ?? 4;
  const maxSize = options.maxSize ?? 6;

  const eligiblePartners = (candidate: MatchCandidate, pool: MatchCandidate[]) =>
    pool.filter((other) => isEligiblePair(candidate, other, ctx)).length;

  const remaining = [...candidates];
  const sorted = [...candidates].sort(
    (a, b) => eligiblePartners(a, remaining) - eligiblePartners(b, remaining),
  );

  const used = new Set<string>();
  const groups: MatchGroup[] = [];

  for (const seed of sorted) {
    if (used.has(seed.userId)) continue;

    const targetSize = Math.min(maxSize, seed.groupSize === "medium" ? 6 : 5);
    const members: MatchCandidate[] = [seed];
    used.add(seed.userId);

    // Repeatedly add whoever lifts the group average the most.
    while (members.length < targetSize) {
      const eligible = sorted.filter(
        (c) =>
          !used.has(c.userId) &&
          members.every((m) => isEligiblePair(m, c, ctx)),
      );
      if (eligible.length === 0) break;

      let best: MatchCandidate | null = null;
      let bestScore = -Infinity;
      for (const candidate of eligible) {
        const score =
          members.reduce((sum, m) => sum + pairScore(m, candidate), 0) / members.length;
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (!best) break;
      members.push(best);
      used.add(best.userId);
    }

    if (members.length >= minSize) {
      const scores: number[] = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          scores.push(pairScore(members[i], members[j]));
        }
      }
      const averageScore =
        scores.length === 0 ? 0 : Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;

      groups.push({
        memberIds: members.map((m) => m.userId),
        averageScore,
        zone: seed.zone,
        womenOnly: seed.womenOnly,
      });
    } else {
      // Not enough people for a circle — leave them in the pool for next week.
      for (const member of members) used.delete(member.userId);
    }
  }

  return groups;
}

/** Splits a pool into zone × womenOnly buckets. */
export function partitionByZone(candidates: MatchCandidate[]): Map<string, MatchCandidate[]> {
  const buckets = new Map<string, MatchCandidate[]>();
  for (const candidate of candidates) {
    const key = `${candidate.zone}:${candidate.womenOnly ? "women" : "any"}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(candidate);
    else buckets.set(key, [candidate]);
  }
  return buckets;
}

/** One pass of the weekly matching run over the whole pool. */
export function matchAll(candidates: MatchCandidate[], ctx: MatchContext): MatchGroup[] {
  const groups: MatchGroup[] = [];
  for (const bucket of partitionByZone(candidates).values()) {
    groups.push(...formGroups(bucket, ctx));
  }
  return groups;
}
