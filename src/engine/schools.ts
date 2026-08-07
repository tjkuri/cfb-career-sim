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
  if (school.state === homeState) w += cfg.homeStateBonus[school.tier];
  else if (sameRegion(school.state, homeState, content.regions)) w += cfg.regionBonus[school.tier];
  return w;
}

export function sampleSchoolInTier(
  content: ContentBundle,
  tier: Tier,
  homeState: string,
  rng: Rng,
  excludeIds?: ReadonlySet<string>,
): SchoolRow | undefined {
  const pool = content.schools.filter((s) => s.tier === tier && !excludeIds?.has(s.id));
  if (pool.length === 0) return undefined;
  return rngWeightedPick(rng, pool, (s) => schoolWeight(s, homeState, content));
}
