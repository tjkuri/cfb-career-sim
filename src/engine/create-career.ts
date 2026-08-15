import type { GameState, Setup } from "./types";
import type { ContentBundle } from "../content/schema";
import { CONTENT } from "../content/index";
import { createRng } from "./rng";
import { generateRecruitingOffers } from "./recruiting";

export const STARTING_OVERALL = 60;
export const STARTING_CHARACTER = 70;
export const RECRUITING_EVENT_ID = "recruiting";

export function createCareer(setup: Setup, seed: string, content: ContentBundle = CONTENT): GameState {
  const state: GameState = {
    seed,
    rngCursor: 0,
    setup,
    overall: STARTING_OVERALL,
    character: STARTING_CHARACTER,
    snapModifier: 1,
    redshirtSeasonActive: false,
    phaseFiredEventIds: [],
    phaseRandomDrawn: false,
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
    careerInjuries: 0,
    status: "active",
  };

  // Signing Day offers are sampled, so they must be generated exactly once and
  // stored — getDecision stays pure and never regenerates them.
  const rng = createRng(seed, 0);
  state.pendingOptions = generateRecruitingOffers(state, content, rng);
  state.rngCursor = rng.cursor;
  return state;
}
