import type { ClassYear, DraftResult, PendingDecision, Position, Setup, Status } from "../../engine/index";

export type Screen = "creation" | "career" | "summary" | "log";

// What the card is currently showing. `resolved` is non-null for exactly the
// window between answering a decision and pressing Continue.
export interface Resolved {
  title: string;
  choiceLabel: string;
  outcome: string;
}

export interface SeasonView {
  seasonIndex: number;
  schoolName: string;
  classYear: ClassYear | null;
  record: string; // "9-3"
  snaps: number;
  stats: { label: string; value: number }[];
}

export interface MomentView {
  seasonIndex: number;
  item: string;
  glyph: string;
}

export interface CareerSummaryView {
  headline: string; // "Round 3, Pick 19" | "Undrafted" | the ending reason
  subhead: string | null; // "#83 overall" etc.
  finalOverall: number; // the one place a raw integer is shown
  seed: string;
  schoolPath: string[];
  seasons: SeasonView[];
  trophies: { label: string; count: number }[];
  awards: string[];
  moments: MomentView[];
  wasDrafted: boolean;
}

// The one shape screens are allowed to render. Everything the hidden-mechanics
// rule forbids -- tier, draftStock, probability, weight, snapModifier, trait
// names -- is absent by construction because view-model.ts never copies it in.
export interface CareerView {
  playerName: string;
  positionLabel: string;
  schoolName: string | null;
  classYear: ClassYear;
  seasonRecord: string | null;
  standing: string;
  trust: string;
  status: Status;
  decision: PendingDecision | null;
  summary: CareerSummaryView | null;
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
  state: import("../../engine/index").GameState | null;
  resolved: Resolved | null;
  log: LogEntry[];
  /** Set when a restored save can no longer be played against current content. */
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
