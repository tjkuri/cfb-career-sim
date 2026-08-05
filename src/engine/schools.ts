import type { Tier } from "./types";
import type { ContentBundle } from "../content/schema";
import { rngWeightedPick, type Rng } from "./rng";

type SchoolRow = ContentBundle["schools"][number];

function sameRegion(a: string, b: string, regions: ContentBundle["regions"]): boolean {
  if (a === b) return true;
  for (const states of Object.values(regions)) {
    if (states.includes(a) && states.includes(b)) return true;
  }
  return false;
}

export function schoolWeight(school: SchoolRow, homeState: string, content: ContentBundle): number {
  const cfg = content.schoolSampler;
  let w = cfg.base;
  if (school.state === homeState) w += cfg.homeStateBonus;
  else if (sameRegion(school.state, homeState, content.regions)) w += cfg.regionBonus;
  return w;
}

export function bestSchoolInTier(
  content: ContentBundle,
  tier: Tier,
  homeState: string,
  excludeId?: string,
): SchoolRow | undefined {
  let best: SchoolRow | undefined;
  let bestW = -Infinity;
  for (const s of content.schools) {
    if (s.tier !== tier || s.id === excludeId) continue;
    const w = schoolWeight(s, homeState, content);
    if (w > bestW) { best = s; bestW = w; } // strict > keeps first-in-array on ties
  }
  return best;
}

export function sampleSchoolInTier(
  content: ContentBundle,
  tier: Tier,
  homeState: string,
  rng: Rng,
  excludeId?: string,
): SchoolRow | undefined {
  const pool = content.schools.filter((s) => s.tier === tier && s.id !== excludeId);
  if (pool.length === 0) return undefined;
  return rngWeightedPick(rng, pool, (s) => schoolWeight(s, homeState, content));
}
