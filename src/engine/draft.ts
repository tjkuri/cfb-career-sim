import type { DraftResult, GameState, Tier } from "./types";
import { rngInt, type Rng } from "./rng";

// What each honour is worth to a scout. A Heisman moves a draft board; a bowl
// win mostly moves the film.
const HONOR_VALUE: Record<string, number> = {
  heisman: 9,
  allAmerican: 5,
  allConference: 2.5,
  cfpTitle: 5,
  confTitle: 2.5,
  bowlWin: 1,
};

function productionScore(state: GameState): number {
  const totalSnaps = state.seasons.reduce((a, s) => a + s.snaps, 0);
  return Math.min(12, totalSnaps / 160);
}

// Scouts weigh tape against the competition it came against.
function competitionScore(state: GameState): number {
  const played = state.seasons.filter((s) => !s.redshirt && s.snaps > 0);
  if (played.length === 0) return 0;
  const best = Math.max(...played.map((s) => s.tierPlayed ?? state.school.tier));
  return (best - 1) * 3;
}

/** What a scout's grade is made of, in stock points. */
export interface StockParts {
  overall: number;
  production: number;
  rep: number;
  honors: number;
  competition: number;
}

export function stockParts(state: GameState): StockParts {
  const honors = state.seasons.flatMap((s) => s.honors ?? []);
  return {
    overall: (state.overall - 40) * 1.3, // 60 -> 26, 80 -> 52, 95 -> 71.5
    production: productionScore(state),
    rep: (state.character - 50) * 0.12,
    honors: honors.reduce((a, id) => a + (HONOR_VALUE[id] ?? 0), 0),
    competition: competitionScore(state),
  };
}

export function deriveDraftStock(state: GameState): number {
  const p = stockParts(state);
  const raw = p.overall + p.production + p.rep + p.honors + p.competition;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** The stock that reaches the next round up, or null in round 1. */
export function nextRoundAt(round: number): number | null {
  if (round === 1) return null;
  if (round === 0) return UNDRAFTED_FLOOR;
  return Math.ceil(UNDRAFTED_FLOOR + (8 - round) * ROUND_BAND);
}

export function eligibleTiers(state: GameState): Tier[] {
  const stock = deriveDraftStock(state);
  const tiers: Tier[] = [1];
  if (stock >= 25) tiers.push(2);
  if (stock >= 45) tiers.push(3);
  if (stock >= 65) tiers.push(4);
  return tiers;
}

// Below this, nobody calls your name.
export const UNDRAFTED_FLOOR = 57;
// One round of stock. Round 1 needs 57 + 6 * 6.2 = 94.2.
export const ROUND_BAND = 6.2;

export function projectedRound(stock: number): number {
  if (stock < UNDRAFTED_FLOOR) return 0;
  return Math.max(1, Math.min(7, 8 - Math.ceil((stock - UNDRAFTED_FLOOR + 0.0001) / ROUND_BAND)));
}

export function computeDraftResult(state: GameState, rng: Rng): DraftResult {
  const stock = deriveDraftStock(state);
  const round = projectedRound(stock);
  if (round === 0) return { undrafted: true, round: 0, pick: 0, overallPick: 0, draftStock: stock };
  // Within the round, stock decides where you go: the top of the band picks
  // first, with a few spots of draft-night noise either way.
  const roundLow = UNDRAFTED_FLOOR + (7 - round) * ROUND_BAND;
  const roundHigh = round === 1 ? 100 : roundLow + ROUND_BAND;
  const intoRound = Math.max(0, Math.min(1, (stock - roundLow) / (roundHigh - roundLow)));
  const base = Math.round(32 - intoRound * 31);
  const pick = Math.max(1, Math.min(32, base + rngInt(rng, -3, 3)));
  const overallPick = (round - 1) * 32 + pick;
  return { undrafted: false, round, pick, overallPick, draftStock: stock };
}
