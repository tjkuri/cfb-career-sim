import type { Tier, Effect, Position } from "./types";
import type { Rng } from "./rng";
import type { PostseasonConfig, AwardBand } from "../content/schema";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function simulateTeamRecord(
  overall: number,
  tier: Tier,
  cfg: PostseasonConfig,
  rng: Rng,
): { wins: number; losses: number } {
  const base = cfg.tierBaseWinPct[tier];
  const winPct = clamp(base + (overall - 70) * cfg.overallWinShiftPerPoint, cfg.winPctClamp[0], cfg.winPctClamp[1]);
  let wins = 0;
  for (let g = 0; g < cfg.gamesPerSeason; g++) if (rng.next() < winPct) wins++;
  return { wins, losses: cfg.gamesPerSeason - wins };
}

export function resolveTrophies(wins: number, tier: Tier, cfg: PostseasonConfig, rng: Rng): Effect[] {
  const effects: Effect[] = [];
  if (wins >= cfg.bowl.minWins && rng.next() < cfg.bowl.prob)
    effects.push({ kind: "trophy", id: cfg.bowl.id });
  if (wins >= cfg.conf.minWins && rng.next() < cfg.conf.probByTier[tier])
    effects.push({ kind: "trophy", id: cfg.conf.id });
  if (wins >= cfg.cfp.minWins && rng.next() < cfg.cfp.probByTier[tier])
    effects.push({ kind: "trophy", id: cfg.cfp.id });
  return effects;
}

export function bandProb(overall: number, bands: AwardBand[]): number {
  for (const b of bands) if (overall >= b.min) return b.prob;
  return 0;
}

export function resolveAwards(
  position: Position,
  overall: number,
  stats: Record<string, number>,
  wonAnyTrophy: boolean,
  cfg: PostseasonConfig,
  rng: Rng,
): Effect[] {
  const effects: Effect[] = [];
  const mult = cfg.positionMultiplier[position];
  for (const award of cfg.prestige) {
    const boost = wonAnyTrophy ? 1 + award.teamSuccessBoost : 1;
    const p = Math.min(1, bandProb(overall, award.bands) * mult * boost);
    if (rng.next() < p) effects.push({ kind: "award", id: award.id }); // always consumes a draw
  }
  for (const award of cfg.production) {
    if (award.position !== position) continue;
    if ((stats[award.stat] ?? 0) < award.threshold) continue; // no draw when gate unmet
    if (rng.next() < award.prob) effects.push({ kind: "award", id: award.id });
  }
  return effects;
}
