import type { DraftResult, GameState, Tier } from "./types";
import { rngInt, type Rng } from "./rng";

function productionScore(state: GameState): number {
  // Normalize total snaps across seasons into a 0-15 contribution.
  const totalSnaps = state.seasons.reduce((a, s) => a + s.snaps, 0);
  return Math.min(15, totalSnaps / 200);
}

export function deriveDraftStock(state: GameState): number {
  const overallPart = (state.overall - 40) * 1.4; // 40 -> 0, 99 -> ~82
  const production = productionScore(state);
  const characterPart = (state.character - 50) * 0.15; // +/- ~7.5
  const trophyPart = Object.values(state.trophies).reduce((a, n) => a + n, 0) * 2.5;
  const awardPart = state.awards.length * 3;
  const classPart = state.eligibility.classYear === "SR" ? 2 : 0;
  const raw = overallPart + production + characterPart + trophyPart + awardPart + classPart;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function eligibleTiers(state: GameState): Tier[] {
  const stock = deriveDraftStock(state);
  const tiers: Tier[] = [1];
  if (stock >= 25) tiers.push(2);
  if (stock >= 45) tiers.push(3);
  if (stock >= 70) tiers.push(4);
  return tiers;
}

// The bar the draft applies (DECISION 058, measured in report 034 §3-§4).
//
// It was 35. A *lazy* career finishes at stock ~60 and a good one at ~89, so
// the line sat far below even a deliberately-bad career: nothing was failing
// because the bar was on the floor, not because the engine could not tell
// careers apart. At 50 a good career is untouched -- byte-for-byte the same
// careers, the same round-1 rate -- while a lazy one fails 15% of the time.
// Measured over 9,000 careers per profile. Do not re-derive it by eye.
const UNDRAFTED_FLOOR = 50;

// The width of one draft round in stock, and NOT optional alongside the floor.
// It was 9.3, chosen when the floor was 35 so that 35 -> round 7 and 100 ->
// round 1. With the floor at 50 the same divisor needs a raw stock of 99 to
// reach round 1, which puts round 1 out of reach outright; 6.8 restores the
// band so that the top of the scale is still round 1 and the floor is still
// round 7.
const ROUND_BAND_DIVISOR = 6.8;

// EARLY_DECLARE_PENALTY (DECISION 038) was DELETED here, with the declare
// decision it priced (DECISION 057). It charged a non-senior 8 points of stock
// at the draft, and it is now unreachable: `computeDraftResult` runs only for a
// career whose status is `declared`, and the one remaining path to that status
// is `enterOffseason`'s out-of-eligibility branch, which is reached only after
// CLASS_ORDER has run out -- i.e. always as a SR. Verified against the
// class-year split `failure-probe` reports: every profile, every position,
// 100% SR. If a future change lets a career declare as an underclassman again,
// this is the cost that has to come back with it.

export function computeDraftResult(state: GameState, rng: Rng): DraftResult {
  const stock = deriveDraftStock(state);
  if (stock < UNDRAFTED_FLOOR) {
    return { undrafted: true, round: 0, pick: 0, overallPick: 0, draftStock: stock };
  }
  // Higher stock -> earlier round. Bands chosen so 100 -> round 1, 50 -> round 7.
  const round = Math.max(1, Math.min(7, 8 - Math.ceil((stock - UNDRAFTED_FLOOR) / ROUND_BAND_DIVISOR)));
  const pick = rngInt(rng, 1, 32);
  const overallPick = (round - 1) * 32 + pick;
  return { undrafted: false, round, pick, overallPick, draftStock: stock };
}
