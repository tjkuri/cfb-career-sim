export type Position = "QB" | "OSKILL" | "OL" | "DL" | "DSKILL" | "K";
export type Tier = 1 | 2 | 3 | 4;
export type ClassYear = "FR" | "SO" | "JR" | "SR";
export type Phase = "offseason" | "nonconf" | "conference" | "postseason";
export type Status = "active" | "declared" | "drafted" | "busted";

export const PHASE_ORDER: Phase[] = ["offseason", "nonconf", "conference", "postseason"];
export const CLASS_ORDER: ClassYear[] = ["FR", "SO", "JR", "SR"];
export const ALL_POSITIONS: Position[] = ["QB", "OSKILL", "OL", "DL", "DSKILL", "K"];

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
  tier?: Tier[];
  requiresInjury?: boolean;
  requiresActiveInjury?: boolean;
  requiresFinalSeason?: boolean;
  requiresPlaying?: boolean;
  maxCharacter?: number;
  maxOverall?: number;
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

export interface DeferredEffect {
  effect: Effect;
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

  status: Status;
  endingReason?: string;
  draftResult?: DraftResult;
}
