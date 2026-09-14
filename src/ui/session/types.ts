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
// Two rules meet on this type and they point in opposite directions. Which one
// applies depends on which part of the screen reads the value.
//
// FROZEN: everything the context rail draws -- the season's identity and the
// season line it was writing. `advance()` can simulate an entire phase before
// it returns, so a rail with a frozen phase beside a live snap count reports
// two moments at once: `Offseason - 175 snaps - 362 Pass Yds`, an offseason
// that has somehow played a season, one tick after the same rail correctly
// read `0 snaps`. No cell of the rail may describe a different moment than the
// cell next to it, so the line is stamped with the identity.
//
// NOT FROZEN: the progression values -- `overall`, the band phrase, the trust
// phrase. DECISION 012 wants the magnitude of a change visible on the resolved
// card, and freezing those would hide the very delta the card exists to
// report. They are deliberately absent from this type.
//
// The two rules do not conflict because they govern different blocks: the
// delta is read in `.standing`, which is never stamped, and no rail cell
// carries a progression number. Freezing the rail therefore costs the delta
// nothing.
export interface SeasonStamp {
  seasonNumber: number; // 1-based, for display
  classYear: ClassYear;
  phaseLabel: string;
  schoolName: string | null;
  /** The line the player was writing when the choice was made -- snaps, stat
      line and record, all three as they stood before `advance()`. Null before
      the first on-field phase of the career, and for a save written before
      this field existed; a null here means the rail's third line renders
      empty, never that it should reach for the live one. */
  season: SeasonLineView | null;
}

// What the card is currently showing. `resolved` is non-null for exactly the
// window between answering a decision and pressing Continue.
export interface Resolved {
  title: string;
  /** The card's own prompt. Rendered only on a narrated beat, where the setup
      and its consequence are read as one card (DECISION 018); a multi-option
      card's description was already on screen when the choice was made. */
  description: string;
  choiceLabel: string;
  outcome: string;
  /** True when the card offered exactly one option. It was never a choice, so
      the label is rendered as a quiet line and never as "You chose:". */
  narrated: boolean;
  /** Null for a save written before the stamp existed, and for a career
      restored mid-card from one. Consumers must treat it as optional. */
  stamp: SeasonStamp | null;
  /** `overall` as it stood immediately before `advance()` ran -- taken at the
      same point as the stamp, but kept OFF it on purpose: the stamp freezes
      the season's identity, this freezes the progression baseline the card
      exists to measure against. DECISION 012 wants the magnitude of the change
      visible, and post-minus-pre is that magnitude. Null for a save written
      before this field existed; such a card shows no delta rather than a
      fabricated zero. */
  overallBefore: number | null;
}

export interface StatView {
  label: string;
  value: number;
}

export interface SeasonView {
  seasonIndex: number;
  schoolName: string;
  /** The year the season was PLAYED AS, read off the stored `SeasonLine`
      rather than derived backwards by index -- which is ambiguous exactly
      where a redshirt has been taken (DECISION 009). Null for a save written
      before that field existed; such a row renders without a year label. */
  classYear: ClassYear | null;
  /** "9-3", or null when the season never reached its postseason resolver --
      a career that ended mid-season has no record, and `0-0` was a lie.
      See DECISION 014. */
  record: string | null;
  snaps: number;
  /** The OVR this season was finalized at -- the career arc, the one read the
      summary could not previously reproduce because nothing recorded it
      (DECISION 009). Null for a pre-009 save: the absence of a number, never
      `NaN` and never a substituted one (DECISION 014's rule, applied here). */
  overall: number | null;
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

// The context rail, resolved: one row of cells that all describe the same
// moment. Built by `railView` from the live view and the card on screen, so
// the screen itself never has to decide which half comes from where.
export interface RailView {
  school: string;
  classYear: ClassYear;
  seasonNumber: number;
  phaseLabel: string;
  /** The season line the rail's third row draws, and the source of its record
      cell. Null renders as empty cells that keep their space (DECISION 019). */
  season: SeasonLineView | null;
}

export interface MomentView {
  seasonIndex: number;
  item: string;
  glyph: string;
  /** How many times this exact moment was recorded *within this one season*.
      Measured across 700 careers it is always 1 -- a repeated moment is the
      same event earning itself again in a later season, which is a real
      career fact and is grouped, not collapsed. The field exists so the one
      shape that would be a bug (the same moment pushed twice for a single
      event) renders as `x2` rather than as two identical rows. */
  count: number;
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
