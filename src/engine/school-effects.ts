import type { GameState, SchoolTrait } from "./types";
import type { ContentBundle } from "../content/schema";

// The trait of the school the player is CURRENTLY at, or undefined.
//
// Must tolerate an empty schoolId: eligibleTiers -> deriveDraftStock runs at
// Signing Day from createCareer, before the player has a school at all.
export function schoolTraitOf(state: GameState, content: ContentBundle): SchoolTrait | undefined {
  if (!state.school.schoolId) return undefined;
  return content.schools.find((s) => s.id === state.school.schoolId)?.trait;
}

// The school's multiplier on a phase's snap roll.
//
// Deliberately NOT written into state.snapModifier: transfer and redshirt
// already own that field and enterOffseason resets it to 1 every year, so a
// third writer would contend for one mutable and the reset would silently eat
// a multi-season effect. This is a separate, derived multiplier.
//
// wideOpen is not tenure-keyed (its cost is ongoing too). factory and
// developmental land in waves 2 and 3 and ARE tenure-keyed.
export function schoolSnapModifier(state: GameState, content: ContentBundle): number {
  const trait = schoolTraitOf(state, content);
  if (trait === "wideOpen") return content.schoolTraits.wideOpen.snapModifier;
  return 1;
}
