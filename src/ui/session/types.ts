import type { ClassYear, DraftResult, PendingDecision, Position, Setup, Status } from "../../engine/index";

export type Screen = "creation" | "career" | "summary" | "log";

// A structural mirror of the engine's `Phase`, kept here so the label layer and
// the view shape do not have to import an engine type. view-model.ts assigns
// `GameState["phase"]` into it, so if the engine ever adds a phase this union
// stops being assignable and the typecheck fails rather than a raw id reaching
// a screen.
export type SeasonPhase = "offseason" | "nonconf" | "conference" | "postseason";

// Where the career stood at the moment a choice was made. Frozen onto the
// resolved card so the outcome text of, say, a postseason decision is not read
// under a header that has already rolled over into the next season -- the
// engine advances the phase, the season index and the class year inside the
// same `advance()` that produced this prose.
//
// Deliberately carries no progression values. `overall`, the band phrase and
// the trust phrase are *supposed* to move on the resolved card: DECISION 012
// wants the magnitude of a change visible, and freezing them would hide the
// very delta the card exists to report. Only the season's identity is frozen.
export interface SeasonStamp {
  seasonNumber: number; // 1-based, for display
  classYear: ClassYear;
  phaseLabel: string;
  schoolName: string | null;
}

// What the card is currently showing. `resolved` is non-null for exactly the
// window between answering a decision and pressing Continue.
export interface Resolved {
  title: string;
  choiceLabel: string;
  outcome: string;
  /** Null for a save written before the stamp existed, and for a career
      restored mid-card from one. Consumers must treat it as optional. */
  stamp: SeasonStamp | null;
}

export interface StatView {
  label: string;
  value: number;
}

export interface SeasonView {
  seasonIndex: number;
  schoolName: string;
  classYear: ClassYear | null;
  /** "9-3", or null when the season never reached its postseason resolver --
      a career that ended mid-season has no record, and `0-0` was a lie.
      See DECISION 014. */
  record: string | null;
  snaps: number;
  stats: StatView[];
}

// The season line the player is currently writing. Snaps and stats accumulate
// live (effects.ts, simulate.ts), so they are real all season; the record is
// assigned once, by the postseason resolver, and is null until then.
export interface SeasonLineView {
  seasonNumber: number; // 1-based, for display
  schoolName: string;
  record: string | null;
  snaps: number;
  stats: StatView[];
  /** True while this is the season being played; false once it has closed out
      and the career has moved into the following offseason. */
  inProgress: boolean;
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
  /** The record of the season matching the current `seasonIndex`, or null when
      it does not exist yet -- which, given the engine assigns W-L once at the
      end of the postseason phase and rolls the season index in the same tick,
      is every point at which a player can see this. It is not a placeholder
      and not an estimate: null means "no record has been played yet". */
  seasonRecord: string | null;
  /** Display-ready `GameState.phase`. Named to stay clear of `phaseAbs`, which
      is a forbidden key -- the deferred-effect clock is not player-facing. */
  phaseLabel: string;
  /** 1-based. `seasonIndex` is 0-based and is never shown raw. */
  seasonNumber: number;
  /** The most recent season line: the one in progress during nonconf,
      conference and postseason, and the one just completed during an offseason
      -- which is exactly where the redshirt, transfer and declare cards ask for
      it (DECISION 013). Null until the first on-field phase of the career. */
  season: SeasonLineView | null;
  /** The live OVR. Shown as an integer: see the spec's §6 note on why the
      qualitative-only treatment was reversed. */
  overall: number;
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
