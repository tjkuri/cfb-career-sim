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
