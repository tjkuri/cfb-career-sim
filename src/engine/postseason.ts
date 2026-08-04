import type { Tier, Effect } from "./types";
import type { Rng } from "./rng";
import type { PostseasonConfig } from "../content/schema";

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
