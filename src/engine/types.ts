export type Position = "QB" | "OSKILL" | "OL" | "DL" | "DSKILL" | "K";
export type Tier = 1 | 2 | 3 | 4;

// A school's mechanical identity. Closed vocabulary: 57 schools x combinations
// is a surface no test can cover, so a school carries at most one, and most
// carry none. "Untraited" is a legitimate identity — the ordinary program.
export type SchoolTrait = "wideOpen" | "factory" | "developmental";
export type ClassYear = "FR" | "SO" | "JR" | "SR";
export type Phase = "offseason" | "nonconf" | "conference" | "postseason";
export type Status = "active" | "declared" | "drafted" | "busted";

export const PHASE_ORDER: Phase[] = ["offseason", "nonconf", "conference", "postseason"];
export const CLASS_ORDER: ClassYear[] = ["FR", "SO", "JR", "SR"];
export const ALL_POSITIONS: Position[] = ["QB", "OSKILL", "OL", "DL", "DSKILL", "K"];
export const ALL_SCHOOL_TRAITS: SchoolTrait[] = ["wideOpen", "factory", "developmental"];

export interface Setup {
  lastName: string;
  jerseyNumber: number;
  homeState: string;
  position: Position;
}

export interface SeasonLine {
  seasonIndex: number;
  schoolId: string;
  snaps: number;
  stats: Record<string, number>;
  teamWins: number;
  teamLosses: number;
  // Recorded, never recomputed. `overall` is the OVR the line is finalized at:
  // written at kickoff so a truncated career still has a number, then rewritten
  // once at the season boundary with the end-of-season value, before offseason
  // development (which belongs to the next line). `classYear` is the year the
  // season was PLAYED AS -- written once at creation, never on the boundary
  // where enterOffseason advances eligibility into the next year.
  overall: number;
  classYear: ClassYear;
  // True when this season was sat out on a redshirt. Recorded, never derived:
  // `eligibility.redshirtUsed` says a redshirt was taken but not WHEN, and both
  // derivations from stored data were measured and rejected (report 010;
  // DECISIONS 015, 020, 033).
  //
  // Optional, because `localStorage` holds GameStates serialized before this
  // field existed. `undefined` means "this save does not know", which is not
  // the same as `false`, and a consumer must render the absence rather than
  // assert the season was played.
  redshirt?: boolean;
}

export type EffectTiming = "immediate" | "deferred";

export type Effect =
  | { kind: "overall"; timing: EffectTiming; amount: number; delayPhases?: number }
  | { kind: "character"; amount: number }
  | { kind: "stat"; stat: string; amount: number }
  | { kind: "snaps"; amount: number }
  | { kind: "injury"; injuryType: string }
  | { kind: "suspension"; phases: number }
  | { kind: "trophy"; id: string }
  | { kind: "award"; id: string }
  | { kind: "moment"; item: string; icon: string }
  | { kind: "ending"; reason: string };

export interface Outcome {
  description: string;
  effects: Effect[];
}

export interface EventOption {
  id: string;
  label: string;
  probability: number; // 1 = deterministic (always positiveOutcome)
  positiveOutcome: Outcome;
  negativeOutcome?: Outcome;
}

export interface EventConditions {
  position?: Position[];
  minClass?: ClassYear;
  // Exact season membership, 0-4 -- NOT a >= like minClass. DECISION 042: it
  // exists so a beat can have per-season variants that partition cleanly, which
  // `minClass` cannot do (it is inclusive-upward, and advance.ts caps classYear
  // at SR, so a five-season redshirt career is FR SO JR SR SR).
  seasonIndex?: number[];
  tier?: Tier[];
  requiresInjury?: boolean;
  requiresActiveInjury?: boolean;
  requiresFinalSeason?: boolean;
  requiresPlaying?: boolean;
  maxCharacter?: number;
  maxOverall?: number;
  // DECISION 049: the exact mirror of maxOverall. It is the only condition that
  // lets a card say "this beat is for good players" -- the draft-prospect family
  // (bowl-opt-out and its three siblings) told a 60-overall sophomore his name
  // was climbing draft boards, and minClass alone does not close that.
  minOverall?: number;
  schoolTrait?: SchoolTrait[];
}

export interface GameEvent {
  id: string;
  kind: "fixed" | "random";
  phase: Phase;
  weight: number;
  conditions?: EventConditions;
  title: string;
  description: string;
  options: EventOption[];
}

export interface ActiveInjury {
  kind: "injury" | "suspension";
  injuryType: string;
  remainingPhases: number;
  restoreAmount: number; // overall points restored when the injury heals
}

// The only kind ever enqueued (effects.ts's sole writer to pendingEffects only
// pushes here from the "overall" + "deferred" branch). Narrowed rather than
// left as the full Effect union so a future enqueue site can't silently hand
// flushPendingEffects the power to, say, set status = "busted" on an
// already-declared career, or push an injury the career can never heal from,
// straight into computeDraftResult.
export interface DeferredEffect {
  effect: Extract<Effect, { kind: "overall" }>;
  firePhaseAbs: number;
}

export interface SchoolOffer {
  id: string;
  label: string;
  schoolId: string;
  tier: Tier;
  snapModifier: number;
}

export interface DraftResult {
  undrafted: boolean;
  round: number; // 1-7, or 0 if undrafted
  pick: number; // pick within round, or 0
  overallPick: number; // 1-based overall, or 0
  draftStock: number;
}

export interface GameState {
  seed: string;
  rngCursor: number;
  setup: Setup;

  overall: number;
  character: number;
  snapModifier: number;
  redshirtSeasonActive: boolean;
  phaseFiredEventIds: string[];
  phaseRandomDrawn: boolean;

  eligibility: {
    classYear: ClassYear;
    yearsUsed: number;
    redshirtUsed: boolean;
    draftEligible: boolean;
  };
  school: { schoolId: string; tier: Tier };

  seasonIndex: number;
  phase: Phase;
  phaseAbs: number; // absolute count of phases elapsed (drives deferred timing)
  phaseSimulated: boolean; // has the current phase already been ticked+produced this cycle?

  currentEventId: string | null; // event awaiting a decision; null between decisions
  pendingOptions?: SchoolOffer[];

  seasons: SeasonLine[];
  trophies: Record<string, number>;
  awards: string[];
  moments: { seasonIndex: number; item: string; icon: string }[];

  pendingEffects: DeferredEffect[];
  injuries: ActiveInjury[];
  careerInjuries: number; // career-long tally; state.injuries is emptied on heal

  // The authored prose for the outcome the last choice resolved to. Set by
  // applyChoice, cleared at the top of every advance, and deliberately carrying
  // no positive/negative flag -- a UI that colours an outcome by branch is
  // leaking the option's probability. Undefined after hub choices (recruiting,
  // transfer, declare), whose result is the next screen rather than prose.
  lastOutcome?: { description: string };

  status: Status;
  endingReason?: string;
  draftResult?: DraftResult;
}
