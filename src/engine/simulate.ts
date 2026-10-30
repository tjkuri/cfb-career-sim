import type { GameState, Position } from "./types";
import type { ContentBundle } from "../content/schema";
import { rngInt, type Rng } from "./rng";
import { isSidelined } from "./effects";
import { schoolSnapModifier } from "./school-effects";
import { ROLE_SNAPS, roleOf } from "./role";

const ON_FIELD = new Set(["nonconf", "conference", "postseason"]);

// Per-position stat yields per 100 snaps at overall 70, scaled by overall.
export const STAT_MODEL: Record<Position, { snapsMin: number; snapsMax: number; per100: Record<string, number> }> = {
  QB: { snapsMin: 120, snapsMax: 200, per100: { passYards: 260, passTds: 2, ints: 1 } },
  OSKILL: { snapsMin: 120, snapsMax: 200, per100: { scrimmageYards: 180, totalTds: 2, receptions: 8 } },
  OL: { snapsMin: 150, snapsMax: 220, per100: { pancakes: 6, sacksAllowed: 2 } },
  DL: { snapsMin: 130, snapsMax: 200, per100: { sacks: 1.5, tfls: 3, tackles: 10 } },
  DSKILL: { snapsMin: 130, snapsMax: 200, per100: { tackles: 12, ints: 1, passBreakups: 3 } },
  K: { snapsMin: 40, snapsMax: 70, per100: { fieldGoals: 9, points: 42, gameWinners: 0.8 } },
};

export function simulatePhaseProduction(state: GameState, content: ContentBundle, rng: Rng): void {
  if (!ON_FIELD.has(state.phase)) return;
  if (isSidelined(state)) return;
  const season = state.seasons[state.seasons.length - 1];
  if (!season) return;
  const model = STAT_MODEL[state.setup.position];
  const rolled = rngInt(rng, model.snapsMin, model.snapsMax);
  const role = season.role ?? roleOf(state, state.school.tier);
  const snaps = Math.max(
    0,
    Math.round(rolled * ROLE_SNAPS[role] * state.snapModifier * schoolSnapModifier(state, content)),
  );
  season.snaps += snaps;
  const skill = state.overall / 70;
  for (const [stat, per100] of Object.entries(model.per100)) {
    const jitter = 0.85 + rng.next() * 0.3; // 0.85–1.15
    const yield_ = (per100 * snaps) / 100 * skill * jitter;
    season.stats[stat] = (season.stats[stat] ?? 0) + Math.round(yield_);
  }
}
