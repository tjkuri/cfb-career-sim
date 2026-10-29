import type { GameState, SchoolOffer, SeasonLine, Tier } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { sampleSchoolInTier } from "./schools";

// Signing Day offers. Round-robins across the tiers the player is eligible for,
// highest first, sampling one distinct school per pass until offerCount is met.
// The tier iteration order is fixed, so the only nondeterminism is the seeded
// sampler — identical (seed, cursor) yields an identical offer set.
// Signing Day is the career's first real trade: a big program where you will
// sit, a mid-major where you will rotate, and a small school that will start
// you on day one. The big offer is a Power Four school, and sometimes a
// blueblood takes a flyer.
export function generateRecruitingOffers(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
): SchoolOffer[] {
  const reach: Tier = rng.next() < 0.35 ? 4 : 3;
  const tiers: Tier[] = [reach, 2, 1];
  const offers: SchoolOffer[] = [];
  const taken = new Set<string>();
  for (const tier of tiers.slice(0, content.schoolSampler.offerCount)) {
    const school = sampleSchoolInTier(content, tier, state.setup.homeState, rng, taken);
    if (!school) continue;
    taken.add(school.id);
    offers.push({
      id: `commit-${school.id}`,
      label: `Commit to ${school.name}`,
      schoolId: school.id,
      tier: school.tier,
      snapModifier: 1,
    });
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
    overall: state.overall,
    classYear: state.eligibility.classYear,
    // The FR line is created here, at Signing Day, and autoProgress's kickoff
    // push is skipped for season 0 because this line already exists. So the
    // flag has to be written here too, or every career's first row would read
    // as `undefined` -- "this save does not know" -- when the engine plainly
    // does. Signing Day is the first decision of a career, before any offseason
    // hub, so `redshirtSeasonActive` is false; it is read rather than hardcoded
    // for the same reason `overall` and `classYear` above are.
    redshirt: state.redshirtSeasonActive,
    tierPlayed: state.school.tier,
  };
}

export function applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void {
  const school = content.schools.find((s) => s.id === schoolId);
  if (!school) throw new Error(`Unknown school: ${schoolId}`);
  state.school = { schoolId: school.id, tier: school.tier };
  if (state.seasons.length === 0) state.seasons.push(newSeasonLine(state));
}
