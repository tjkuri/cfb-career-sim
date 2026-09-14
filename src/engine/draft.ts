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

const UNDRAFTED_FLOOR = 35;

// The cost of declaring with eligibility left, charged at the draft and nowhere
// else (DECISION 038).
//
// 8 is the measured gap: the deliberately-bad two-season career scores 42.93
// mean draft stock (`lazyEarly`, QB, n=3000) against an undrafted floor of 35,
// so a penalty of 8 removes exactly the cushion it enjoys. It is also
// 8 / 9.3 = 0.86 of one draft round, encoding "leaving a year of eligibility on
// the table costs you most of a round."
//
// IT MUST NOT MOVE INTO `deriveDraftStock`. That function also feeds
// `eligibleTiers`, which generates Signing Day and transfer offers; the tier
// thresholds are 25/45/70 and an 8-point shift there would silently move
// players across them and rewrite the offer ladder for every junior in the
// game. Applied at the draft alone it has zero effect on the offer generator,
// and every full-eligibility profile -- which declares as a SR -- is unchanged
// to four decimal places. That is the acceptance test, not a nicety.
export const EARLY_DECLARE_PENALTY = 8;

export function computeDraftResult(state: GameState, rng: Rng): DraftResult {
  const stock = Math.max(
    0,
    deriveDraftStock(state) -
      (state.eligibility.classYear === "SR" ? 0 : EARLY_DECLARE_PENALTY),
  );
  if (stock < UNDRAFTED_FLOOR) {
    return { undrafted: true, round: 0, pick: 0, overallPick: 0, draftStock: stock };
  }
  // Higher stock -> earlier round. Bands chosen so 100 -> round 1, 35 -> round 7.
  const round = Math.max(1, Math.min(7, 8 - Math.ceil((stock - UNDRAFTED_FLOOR) / 9.3)));
  const pick = rngInt(rng, 1, 32);
  const overallPick = (round - 1) * 32 + pick;
  return { undrafted: false, round, pick, overallPick, draftStock: stock };
}
