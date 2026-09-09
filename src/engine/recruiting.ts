import type { GameState, SchoolOffer, SeasonLine } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { eligibleTiers } from "./draft";
import { sampleSchoolInTier } from "./schools";

// Signing Day offers. Round-robins across the tiers the player is eligible for,
// highest first, sampling one distinct school per pass until offerCount is met.
// The tier iteration order is fixed, so the only nondeterminism is the seeded
// sampler — identical (seed, cursor) yields an identical offer set.
export function generateRecruitingOffers(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
): SchoolOffer[] {
  const tiers = eligibleTiers(state).slice().sort((a, b) => b - a); // high -> low
  const target = content.schoolSampler.offerCount;
  const offers: SchoolOffer[] = [];
  const taken = new Set<string>();
  while (offers.length < target) {
    let added = false;
    for (const tier of tiers) {
      if (offers.length >= target) break;
      const school = sampleSchoolInTier(content, tier, state.setup.homeState, rng, taken);
      if (!school) continue;
      taken.add(school.id);
      offers.push({
        id: `commit-${school.id}`,
        label: school.trait ? `Commit to ${school.name} — ${content.traitHints[school.trait]}` : `Commit to ${school.name}`,
        schoolId: school.id,
        tier: school.tier,
        // Fixed at 1 by design: recruiting offers carry no snap penalty/bonus today.
        // applyRecruitingChoice deliberately does not read this field (unlike the
        // transfer path, which does) — if a future stage gives recruiting offers a
        // real snapModifier, applyRecruitingChoice will need to consume it too.
        snapModifier: 1,
      });
      added = true;
    }
    if (!added) break; // pool exhausted — a short offer set is legal
  }
  return offers;
}

function newSeasonLine(state: GameState): SeasonLine {
  return {
    seasonIndex: state.seasonIndex,
    schoolId: state.school.schoolId,
    snaps: 0,
    stats: {},
    teamWins: 0,
    teamLosses: 0,
  };
}

export function applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void {
  const school = content.schools.find((s) => s.id === schoolId);
  if (!school) throw new Error(`Unknown school: ${schoolId}`);
  state.school = { schoolId: school.id, tier: school.tier };
  if (state.seasons.length === 0) state.seasons.push(newSeasonLine(state));
}
