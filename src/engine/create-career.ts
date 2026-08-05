import type { GameState, Setup } from "./types";

export const STARTING_OVERALL = 60;
export const STARTING_CHARACTER = 70;
export const RECRUITING_EVENT_ID = "recruiting";

export function createCareer(setup: Setup, seed: string): GameState {
  return {
    seed,
    rngCursor: 0,
    setup,
    overall: STARTING_OVERALL,
    character: STARTING_CHARACTER,
    snapModifier: 1,
    eligibility: { classYear: "FR", yearsUsed: 0, redshirtUsed: false, draftEligible: false },
    school: { schoolId: "", tier: 1 },
    seasonIndex: 0,
    phase: "offseason",
    phaseAbs: 0,
    phaseSimulated: false,
    currentEventId: RECRUITING_EVENT_ID,
    seasons: [],
    trophies: {},
    awards: [],
    moments: [],
    pendingEffects: [],
    injuries: [],
    status: "active",
  };
}
