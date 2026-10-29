import type { BigGameResult, DraftResult, PendingDecision, GameState, Position, Role, Setup, Status } from "../../engine/index";

export type Screen = "creation" | "career" | "summary" | "log";
export type SeasonPhase = "offseason" | "nonconf" | "conference" | "postseason";

export type Tone = "good" | "bad" | "neutral";

/** One consequence, said in a few characters: "+3 OVR", "Torn ACL", "−4 Rep". */
export interface Chip {
  text: string;
  tone: Tone;
}

/** One branch of an option: its chance and what it does. */
export interface Branch {
  chance: number; // 0-100
  chips: Chip[];
}

export interface OptionView {
  id: string;
  label: string;
  /** One branch for a sure thing, two for a gamble. Empty for a play call. */
  branches: Branch[];
  school?: { name: string; tierName: string; conference: string; role: Role; trait?: string; current: boolean };
  detail?: string;
}

export interface DecisionView {
  kind: "event" | "school" | "redshirt" | "bigGame";
  title: string;
  description: string;
  options: OptionView[];
  bigGame?: PendingDecision["bigGame"];
}

export interface HonorView {
  id: string;
  label: string;
  short: string;
  icon: string;
  rarity: 1 | 2 | 3;
}

export interface LedgerRow {
  seasonNumber: number;
  classLabel: string;
  state: "done" | "current" | "future";
  schoolName?: string;
  tierName?: string;
  role?: Role;
  redshirt?: boolean;
  record?: string;
  statLine?: string;
  overall?: number;
  honors: HonorView[];
  bigGame?: { name: string; won: boolean; played: boolean };
}

export interface GameView {
  name: string;
  number: number;
  position: Position;
  positionLabel: string;
  schoolName: string | null;
  tierName: string | null;
  conference: string | null;
  classLabel: string;
  overall: number;
  role: Role | null;
  rep: number;
  stock: number;
  round: number; // 0 = not on draft boards
  rank: number; // projected pick on the big board
  injury: string | null;
  trophyCase: { id: string; label: string; icon: string; count: number }[];
  ledger: LedgerRow[];
  decision: DecisionView | null;
  status: Status;
  draftResult: DraftResult | null;
  endingReason: string | null;
  moments: { seasonNumber: number; item: string; icon: string }[];
  seed: string;
}

export interface SeasonRecap {
  seasonNumber: number;
  classLabel: string;
  schoolName: string;
  role: Role | null;
  redshirt: boolean;
  record: string;
  stats: { label: string; value: string }[];
  honors: HonorView[];
  bigGame: BigGameResult | null;
  ovrEnd: number;
  ovrNext: number; // after the offseason's development
  stockBefore: number;
  stockAfter: number;
  rankBefore: number;
  rankAfter: number;
  roundBefore: number;
  roundAfter: number;
  final: boolean;
}

/** The card on screen after a choice, before Continue. */
export interface Resolved {
  kind: DecisionView["kind"];
  title: string;
  choiceLabel: string;
  outcome: string;
  /** True: the gamble paid. False: it backfired. Null: there was no gamble. */
  paid: boolean | null;
  chips: Chip[];
  ovrBefore: number;
  ovrAfter: number;
  bigGame: BigGameResult | null;
  /** The season record going into a big game. */
  record: string | null;
  roleChange: { from: Role; to: Role } | null;
}

export interface LogEntry {
  id: string;
  finishedAt: number;
  seed: string;
  lastName: string;
  jerseyNumber: number;
  position: Position;
  positionLabel: string;
  schoolPath: string[];
  status: Status;
  headline: string;
  finalOverall: number;
  trophyCount: number;
  awards: string[];
}

export interface UiState {
  screen: Screen;
  setup: Setup | null;
  seed: string;
  state: GameState | null;
  resolved: Resolved | null;
  recap: SeasonRecap | null;
  log: LogEntry[];
  unplayableSave: boolean;
}

export type Action =
  | { type: "start"; setup: Setup; seed: string }
  | { type: "choose"; optionId: string }
  | { type: "continue" }
  | { type: "goto"; screen: Screen }
  | { type: "restore"; state: UiState }
  | { type: "dismissUnplayable" };

export type { DraftResult };
