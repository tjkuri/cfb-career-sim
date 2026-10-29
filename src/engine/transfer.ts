import type { GameState, SchoolOffer, Tier } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { eligibleTiers } from "./draft";
import { sampleSchoolInTier } from "./schools";
import { roleFor } from "./role";

// Every offseason the portal opens: stay, a step up, a sideways move, and a
// step down when you are stuck on the bench.
export function generateTransferOffers(state: GameState, content: ContentBundle, rng: Rng): SchoolOffer[] {
  const homeState = state.setup.homeState;
  const currentTier = state.school.tier;
  const currentSchool = content.schools.find((s) => s.id === state.school.schoolId);
  const taken = new Set([state.school.schoolId]);

  const offers: SchoolOffer[] = [{
    id: "stay",
    label: currentSchool ? `Stay at ${currentSchool.name}` : "Stay",
    schoolId: state.school.schoolId,
    tier: currentTier,
    snapModifier: 1,
  }];

  const add = (tier: Tier, verb: string) => {
    const school = sampleSchoolInTier(content, tier, homeState, rng, taken);
    if (!school) return;
    taken.add(school.id);
    offers.push({ id: `transfer-${school.id}`, label: `${verb} ${school.name}`, schoolId: school.id, tier: school.tier, snapModifier: 1 });
  };

  // A step up is always on the table -- whether you would start there is the
  // gamble. A jump of two tiers takes draft stock that has the big programs calling.
  const maxTier = Math.max(...eligibleTiers(state)) as Tier;
  if (currentTier < 4) add((currentTier + 1) as Tier, "Transfer up to");
  if (currentTier < 3 && maxTier >= currentTier + 2) add((currentTier + 2) as Tier, "Jump to");
  add(currentTier, "Transfer to");
  if (currentTier > 1 && roleFor(state.overall, currentTier) === "backup") add((currentTier - 1) as Tier, "Drop down to");

  return offers.slice(0, 4);
}
