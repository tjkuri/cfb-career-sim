import type { GameState, SchoolOffer, Tier } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { eligibleTiers } from "./draft";
import { sampleSchoolInTier } from "./schools";

function withHint(name: string, trait: string | undefined, content: ContentBundle): string {
  const hint = trait ? content.traitHints[trait as keyof typeof content.traitHints] : undefined;
  return hint ? `${name} — ${hint}` : name;
}

export function generateTransferOffers(state: GameState, content: ContentBundle, rng: Rng): SchoolOffer[] {
  const cfg = content.transfer;
  const homeState = state.setup.homeState;
  const currentTier = state.school.tier;
  const currentSchool = content.schools.find((s) => s.id === state.school.schoolId);

  const offers: SchoolOffer[] = [{
    id: "stay",
    label: currentSchool ? `Stay at ${currentSchool.name}` : "Stay",
    schoolId: state.school.schoolId,
    tier: currentTier,
    snapModifier: 1,
  }];

  const lateral = sampleSchoolInTier(content, currentTier, homeState, rng, new Set([state.school.schoolId]));
  if (lateral) offers.push({ id: `transfer-${lateral.id}`, label: `Transfer to ${withHint(lateral.name, lateral.trait, content)} (bigger role)`, schoolId: lateral.id, tier: lateral.tier, snapModifier: cfg.lateralSnapModifier });

  const tiers = eligibleTiers(state);
  const maxTier = Math.max(...tiers) as Tier;
  if (maxTier > currentTier) {
    const upTier = (currentTier + 1) as Tier;
    const up = sampleSchoolInTier(content, upTier, homeState, rng);
    if (up) offers.push({ id: `transfer-${up.id}`, label: `Transfer up to ${withHint(up.name, up.trait, content)} (tougher competition)`, schoolId: up.id, tier: up.tier, snapModifier: cfg.moveUpSnapModifier });
  }

  const lastSeason = state.seasons[state.seasons.length - 1];
  const buried = currentTier > 1 && !!lastSeason && lastSeason.snaps < cfg.buriedSnapThreshold;
  if (buried) {
    const downTier = (currentTier - 1) as Tier;
    const down = sampleSchoolInTier(content, downTier, homeState, rng);
    if (down) offers.push({ id: `transfer-${down.id}`, label: `Transfer down to ${withHint(down.name, down.trait, content)} (guaranteed reps)`, schoolId: down.id, tier: down.tier, snapModifier: cfg.moveDownSnapModifier });
  }

  return offers;
}
