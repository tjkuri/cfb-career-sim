import type { Tier, Effect, Position, GameState, Role } from "./types";
import type { Rng } from "./rng";
import type { PostseasonConfig, AwardBand, ContentBundle } from "../content/schema";
import { applyEffect, type InjuryLookup } from "./effects";
import { roleOf } from "./role";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// How much the player's own overall moves the team, by how much they play.
const ROLE_IMPACT: Record<Role, number> = { starter: 1, rotation: 0.4, backup: 0 };

export function simulateTeamRecord(
  overall: number,
  tier: Tier,
  role: Role,
  cfg: PostseasonConfig,
  rng: Rng,
): { wins: number; losses: number } {
  const base = cfg.tierBaseWinPct[tier];
  const shift = (overall - 70) * cfg.overallWinShiftPerPoint * ROLE_IMPACT[role];
  const winPct = clamp(base + shift, cfg.winPctClamp[0], cfg.winPctClamp[1]);
  let wins = 0;
  for (let g = 0; g < cfg.gamesPerSeason; g++) if (rng.next() < winPct) wins++;
  return { wins, losses: cfg.gamesPerSeason - wins };
}

export function bandProb(overall: number, bands: AwardBand[]): number {
  for (const b of bands) if (overall >= b.min) return b.prob;
  return 0;
}

export function resolveAwards(
  position: Position,
  overall: number,
  tier: Tier,
  role: Role,
  stats: Record<string, number>,
  wonBigGame: boolean,
  cfg: PostseasonConfig,
  rng: Rng,
): Effect[] {
  const effects: Effect[] = [];
  const mult = cfg.positionMultiplier[position];
  // National awards go to starters, and the voters watch the big programs.
  const exposure = role === "starter" ? cfg.tierExposure[tier] : 0;
  for (const award of cfg.prestige) {
    const boost = wonBigGame ? 1 + award.teamSuccessBoost : 1;
    const p = Math.min(1, bandProb(overall, award.bands) * mult * boost * exposure);
    if (rng.next() < p) effects.push({ kind: "award", id: award.id }); // always consumes a draw
  }
  for (const award of cfg.production) {
    if (award.position !== position) continue;
    if ((stats[award.stat] ?? 0) < award.threshold) continue; // no draw when gate unmet
    if (rng.next() < award.prob) effects.push({ kind: "award", id: award.id });
  }
  return effects;
}

// The season's individual honours, decided once its big game is in the books.
export function runAwards(state: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  const season = state.seasons[state.seasons.length - 1];
  if (!season || season.seasonIndex !== state.seasonIndex || state.redshirtSeasonActive) return;
  const role = season.role ?? roleOf(state, state.school.tier);
  const effects = resolveAwards(
    state.setup.position,
    state.overall,
    state.school.tier,
    role,
    season.stats,
    !!season.bigGame?.won,
    content.postseason,
    rng,
  );
  for (const eff of effects) {
    applyEffect(state, eff, injuryOf);
    if (eff.kind === "award") (season.honors ??= []).push(eff.id);
  }
}
