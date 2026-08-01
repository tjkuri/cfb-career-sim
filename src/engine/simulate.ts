import type { GameState, Position, SeasonLine, Tier } from "./types";
import { rngInt, type Rng } from "./rng";
import { isSidelined } from "./effects";
import { eligibleTiers } from "./draft";
import type { ContentBundle } from "../content/schema";

export function recruitingOptions(
  state: GameState,
  content: ContentBundle,
): { id: string; label: string; schoolId: string; tier: Tier }[] {
  const tiers = eligibleTiers(state);
  const opts: { id: string; label: string; schoolId: string; tier: Tier }[] = [];
  for (const tier of tiers) {
    // Prefer a school in the player's home state, else the first of that tier.
    const inTier = content.schools.filter((s) => s.tier === tier);
    if (inTier.length === 0) continue;
    const home = inTier.find((s) => s.state === state.setup.homeState);
    const school = home ?? inTier[0]!;
    opts.push({ id: `commit-${school.id}`, label: `Commit to ${school.name}`, schoolId: school.id, tier });
  }
  return opts;
}

function newSeasonLine(state: GameState): SeasonLine {
  return { seasonIndex: state.seasonIndex, schoolId: state.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 };
}

export function applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void {
  const school = content.schools.find((s) => s.id === schoolId);
  if (!school) throw new Error(`Unknown school: ${schoolId}`);
  state.school = { schoolId: school.id, tier: school.tier };
  if (state.seasons.length === 0) state.seasons.push(newSeasonLine(state));
}

const ON_FIELD = new Set(["nonconf", "conference", "postseason"]);

// Per-position stat yields per 100 snaps at overall 70, scaled by overall.
const STAT_MODEL: Record<Position, { snapsMin: number; snapsMax: number; per100: Record<string, number> }> = {
  QB: { snapsMin: 120, snapsMax: 200, per100: { passYards: 260, passTds: 2, ints: 1 } },
  OSKILL: { snapsMin: 120, snapsMax: 200, per100: { scrimmageYards: 180, totalTds: 2, receptions: 8 } },
  OL: { snapsMin: 150, snapsMax: 220, per100: { pancakes: 6, sacksAllowed: 2 } },
  DL: { snapsMin: 130, snapsMax: 200, per100: { sacks: 1.5, tfls: 3, tackles: 10 } },
  DSKILL: { snapsMin: 130, snapsMax: 200, per100: { tackles: 12, ints: 1, passBreakups: 3 } },
  K: { snapsMin: 40, snapsMax: 70, per100: { fgPct: 0, longFg: 0, gameWinners: 0 } },
};

export function simulatePhaseProduction(state: GameState, rng: Rng): void {
  if (!ON_FIELD.has(state.phase)) return;
  if (isSidelined(state)) return;
  const season = state.seasons[state.seasons.length - 1];
  if (!season) return;
  const model = STAT_MODEL[state.setup.position];
  const snaps = rngInt(rng, model.snapsMin, model.snapsMax);
  season.snaps += snaps;
  const skill = state.overall / 70;
  for (const [stat, per100] of Object.entries(model.per100)) {
    const jitter = 0.85 + rng.next() * 0.3; // 0.85–1.15
    const yield_ = (per100 * snaps) / 100 * skill * jitter;
    season.stats[stat] = (season.stats[stat] ?? 0) + Math.round(yield_);
  }
}
