import type { GameState, SchoolOffer, Tier } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { deriveDraftStock } from "./draft";
import { sampleSchoolInTier } from "./schools";
import { roleFor } from "./role";

// The draft stock it takes for a program of each tier to call you. Starting
// the season before counts for a lot: a starter gets the call with
// STARTER_DISCOUNT less stock, so the way up runs through playing time.
export const TIER_CALL: Record<Tier, number> = { 1: 0, 2: 28, 3: 48, 4: 76 };
export const STARTER_DISCOUNT = 15;

/** Would a program of this tier pick up the phone? */
export function programCalls(state: GameState, tier: Tier): boolean {
  const last = state.seasons.filter((l) => !l.redshirt).at(-1);
  const started = last?.role === "starter";
  const stock = deriveDraftStock(state);
  return stock >= TIER_CALL[tier] - (started ? STARTER_DISCOUNT : 0);
}

// Every offseason the portal opens: stay, a sideways move, a step up when you
// have earned the calls, and a step down when you are stuck on the bench.
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

  // Moving up is earned: a program calls when your stock, or your starting
  // job, has its attention. A jump of two tiers takes the stock on its own.
  if (currentTier < 4 && programCalls(state, (currentTier + 1) as Tier)) add((currentTier + 1) as Tier, "Transfer up to");
  if (currentTier < 3 && deriveDraftStock(state) >= TIER_CALL[(currentTier + 2) as Tier]) add((currentTier + 2) as Tier, "Jump to");
  add(currentTier, "Transfer to");
  if (currentTier > 1 && roleFor(state.overall, currentTier) === "backup") add((currentTier - 1) as Tier, "Drop down to");

  return offers.slice(0, 4);
}
