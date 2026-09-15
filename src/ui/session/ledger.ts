import type { ClassYear } from "../../engine/index";

// The career ledger: the fixed-length table DECISIONS 007/010/013 commit us to.
// It answers "where am I" and "how much is left" with zero copy, and it is a
// pure function of plain data -- season lines and the current position in them.
// It never reads `GameState`; view-model.ts stays the only module that does
// (DECISION 004), and is the only intended caller.
//
// ---------------------------------------------------------------------------
// DECISION 015, settled by measurement (report 010, 1,536 careers / 5,390
// season rows): rows are labelled BY SEQUENCE -- "Year 1".."Year 5" -- with the
// stored class year as a secondary read. That is option 2. Option 1 (infer the
// redshirt row and label it `RS`) was measured and rejected on two numbers:
//
//   * The duplicate-classYear signal the inference is gated on is present in
//     only 40.6% of redshirt careers (427 of 1,051). A career stores its
//     duplicate SR only if it survives to a fifth season; 624 redshirt careers
//     declared or washed out first and carry no duplicate at all.
//   * Where the duplicate IS present it points at the wrong row 426 times out
//     of 427. The engine advances `classYear` on the redshirt boundary too, so
//     the duplicate always lands at the END of the career while the redshirt
//     itself sits at season index 1 in 955 of 1,051 cases. Labelling the
//     duplicated row `RS` would rename a season that was actually played.
//
// The snaps signal on its own does separate cleanly (redshirt rows median 26
// snaps vs 461; at a 52-snap threshold, 0 false negatives and 31 false
// positives across 5,390 rows) -- but it identifies a row that is NOT the
// ambiguous one. Marking season 2 as `RS` still leaves two rows labelled `SR`,
// which is the forbidden option 3. Sequence labels remove the ambiguity at
// source: five slots, five distinct labels, no inference anywhere in this file.
// ---------------------------------------------------------------------------

/** The tallest a career can be: four years of eligibility plus the one a
    redshirt buys. A ledger never has more rows than this. */
export const LEDGER_SLOTS = 5;

/** The rows every career actually gets, and therefore the height the table
    stands at by default.

    DECISION 010 drew five rows always, on the reasoning that a table which
    grows moves the "how much is left" signal underneath the player. The 036
    playtest measured the cost of the other side of that trade: the fifth row
    was drawn for the whole of a four-season career that was never going to
    have one, and the career ended straight off Year 4 into the ending screen
    with the empty slot still on screen. *"Nothing ever told me why year 5
    existed, or why I didn't get one."* A promise the game keeps 40% of the
    time is not a signal, it is a lie four careers in ten.

    So the table states what the career HAS. Four rows for a career with no
    redshirt -- which is the shape of the title screen's own promise, *four
    years to get drafted* -- and five from the moment `redshirtUsed` is true.
    The row therefore appears in the same click as the card that says the
    redshirt was taken, which is the only moment in a career where a fifth year
    is a fact rather than a hypothesis, and it is announced by prose the player
    is already reading. Nothing here states an eligibility rule the game has
    not told the player; the table reports a stored fact and says nothing about
    what caused it. */
export const BASE_SLOTS = 4;

/** One stored season, already through the view-model's own honesty rules:
    `record` is null until the postseason resolver has run (DECISION 014), and
    `overall` / `classYear` are null on a save written before DECISION 009. */
export interface LedgerSeason {
  seasonIndex: number;
  schoolName: string;
  classYear: ClassYear | null;
  record: string | null;
  snaps: number;
  overall: number | null;
}

export interface LedgerInput {
  /** Season lines in play order. */
  seasons: readonly LedgerSeason[];
  /** `GameState.seasonIndex`, 0-based. The season currently being written. */
  currentSeasonIndex: number;
  /** `eligibility.redshirtUsed`. A stored fact, never inferred -- see the note
      on DECISION 015 above. */
  redshirtUsed: boolean;
  /** False once the career is terminal (declared, drafted, busted). A career
      that ended mid-season leaves a row that is finished, not in progress. */
  active: boolean;
}

/** `played` is filled, `current` is the row being written now, `future` is
    empty chrome. Nothing else: a row is one of these three. */
export type LedgerRowState = "played" | "current" | "future";

export interface LedgerRow {
  /** 1-based slot, 1..5. Stable: slot N is always season index N-1. */
  slot: number;
  /** The primary label. Sequence, not class year (DECISION 015, option 2). */
  label: string;
  state: LedgerRowState;
  /** The secondary read: the year this season was PLAYED AS, as stored. Null
      on a future row and on a pre-DECISION-009 save. */
  classYear: ClassYear | null;
  schoolName: string | null;
  /** "9-3", or null when no record exists yet. Never "0-0" (DECISION 014). */
  record: string | null;
  snaps: number | null;
  /** The OVR the season ended at, as the engine finalized it: the figure
      BEFORE the offseason's development is added, because those points come
      from this season's snaps but are earned for the next one
      (`enterOffseason`, advance.ts:230, pinned by an engine test). It is
      therefore a different quantity from the live OVR in the header, which is
      what the label above this column has to say. Null, never NaN, on a
      pre-009 save. */
  overall: number | null;
  /** True once the season is over and its stored figures are final.

      False in two cases, and both of them are a number that would otherwise be
      printed as a season's end. The season being played now: its line was
      stamped with the OVR it KICKED OFF at (advance.ts:319) and is not
      overwritten until `enterOffseason`, so the stored figure is a season old.
      And the season a career ended in the middle of: it never reached
      `enterOffseason` at all, so it carries the same kickoff stamp for good.

      The renderer reads its figures off this rather than off `state`, which is
      what lets a row be finished AND current at once -- exactly what a season
      boundary is, where the header still names the season the player has just
      finished. */
  finished: boolean;
  /** True for the fifth slot only: the year the redshirt bought. */
  redshirtSlot: boolean;
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

// Old saves are the constraint everywhere in this file: `localStorage` holds
// GameStates serialized before DECISION 009, whose lines carry no `overall` and
// no `classYear`. Every field is therefore read defensively -- a missing or
// non-finite value becomes null and the row renders without a number. Null is
// the absence of a value, never a placeholder for one.
function emptyRow(slot: number): LedgerRow {
  return {
    slot,
    label: `Year ${slot}`,
    state: "future",
    classYear: null,
    schoolName: null,
    record: null,
    snaps: null,
    overall: null,
    finished: false,
    redshirtSlot: slot === LEDGER_SLOTS,
  };
}

/**
 * How tall this career's table stands: `BASE_SLOTS`, or `LEDGER_SLOTS` once a
 * redshirt has been used.
 *
 * The two `Math.max` clauses are defensive, not a second rule. The engine caps
 * eligibility at four years plus one redshirt, so neither can fire on a state
 * it produced -- but a save that somehow carries a fifth season, or parks an
 * ACTIVE career on season index 4 without the redshirt flag, must still be
 * drawn with the row the player is standing in. The table may only ever refuse
 * to promise a row; it may never hide one that exists.
 *
 * `active` gates the live index for the same reason: a finished career parked
 * one index past its last season would otherwise grow the empty fifth row at
 * the very end of a four-year career, which is the defect this is here to
 * remove.
 */
function slotCount(input: LedgerInput): number {
  if (input.redshirtUsed) return LEDGER_SLOTS;
  let needed = BASE_SLOTS;
  const live = finiteOrNull(input.currentSeasonIndex);
  if (input.active && live !== null) needed = Math.max(needed, live + 1);
  for (const line of input.seasons ?? []) {
    const index = finiteOrNull(line?.seasonIndex);
    if (index !== null) needed = Math.max(needed, index + 1);
  }
  return Math.min(LEDGER_SLOTS, needed);
}

export function buildLedger(input: LedgerInput): LedgerRow[] {
  const { currentSeasonIndex, active } = input;
  const rows: LedgerRow[] = [];
  for (let slot = 1; slot <= slotCount(input); slot++) rows.push(emptyRow(slot));

  const liveIndex = finiteOrNull(currentSeasonIndex);

  // A history longer than the table cannot happen -- `slotCount` has already
  // grown the table to hold whatever the history carries -- but a line outside
  // the slots is dropped rather than trusted, and the table still stands its
  // full height.
  for (const line of input.seasons ?? []) {
    const index = finiteOrNull(line?.seasonIndex);
    if (index === null) continue;
    const slot = index + 1;
    if (slot < 1 || slot > rows.length) continue;
    const row = rows[slot - 1]!;
    row.state = "played";
    row.classYear = line.classYear ?? null;
    row.schoolName = textOrNull(line.schoolName);
    row.record = textOrNull(line.record);
    row.snaps = finiteOrNull(line.snaps);
    row.overall = finiteOrNull(line.overall);
    // The one question the stored figures depend on: is this season over? The
    // line for the LIVE index is the season being played, whose `overall` is
    // still the kickoff stamp and whose record does not exist yet. Every other
    // line has been through `enterOffseason` and is final.
    row.finished = liveIndex !== null && index !== liveIndex;
  }

  // The current row is the one the HEADER is naming, and it is keyed to
  // `currentSeasonIndex` alone -- never to whether a season line exists yet.
  //
  // It used to be keyed to both, and that is the desync the 017 playtester got
  // lost in (DECISION 033). `advance.ts:273-277` pushes a season line only on
  // entering an ON-FIELD phase, while `advancePhase` increments `seasonIndex`
  // on leaving the postseason -- so through the whole of every offseason the
  // header reads `Season N` and no line for index N-1 exists. Requiring a line
  // meant no row was marked current for an entire phase, in every season of
  // every career. It went unreported for four seasons because slot N was blank
  // chrome either way; in season 5 the unhighlighted row was also dashed and
  // captioned, so the rail actively asserted a different year to the header.
  //
  // Keying off the index alone makes the two agree by construction: the header
  // prints `currentSeasonIndex + 1` and this marks slot `currentSeasonIndex + 1`,
  // from the same number, with nothing in between that can disagree.
  //
  // `active` still gates it. A career that ended mid-season leaves a row that
  // is finished, not in progress, and a terminal career has no current year at
  // all -- which is why a played row is written first and promoted here rather
  // than the other way round.
  if (active && liveIndex !== null) {
    // Slot N is season index N-1, so the index is the array position directly.
    // Out of range (a terminal career parked at index 5, a wrecked save) reads
    // as `undefined` and marks nothing, which is the correct outcome.
    const row = rows[liveIndex];
    if (row) row.state = "current";
  }

  return rows;
}

/**
 * The same table, with the highlight moved to the season the HEADER is naming.
 *
 * `buildLedger` keys the current row to the live `seasonIndex`, which is right
 * whenever the screen is live. It is wrong for exactly one screen: a resolved
 * card, which is read under a frozen stamp (DECISION 019) because `advance()`
 * has already rolled the phase, the season index and the class year before it
 * returned. On the last card of every season the header therefore read
 * `Season N - Postseason` while the table highlighted YEAR N+1 -- the rail
 * running ahead of the player, into a season the card being read had not
 * reached. The 036 playtester reported it at every season boundary of the
 * career.
 *
 * Passing the header's own season number through here makes the two agree by
 * construction, the same way DECISION 033 made them agree for the live case:
 * one number, printed in the header and used to pick the row, with nothing in
 * between that can disagree.
 *
 * It only ever MOVES a highlight, never adds one -- a terminal career has no
 * current row and must not acquire one here -- and the row it moves off goes
 * back to what it was: `played` if a season line ever filled it, empty chrome
 * if not. Marking the boundary row `current` does not cost it its figures;
 * `finished` is what the renderer draws those from.
 */
export function followHeader(rows: readonly LedgerRow[], seasonNumber: number): LedgerRow[] {
  const from = rows.findIndex((r) => r.state === "current");
  if (from < 0) return rows.map((r) => r);
  const to = rows.findIndex((r) => r.slot === seasonNumber);
  if (to < 0 || to === from) return rows.map((r) => r);
  return rows.map((row, index) => {
    if (index === to) return { ...row, state: "current" as const };
    if (index === from) return { ...row, state: hasLine(row) ? ("played" as const) : ("future" as const) };
    return row;
  });
}

// Did a season line ever fill this row? Asked of the row rather than of the
// history, because `followHeader` is handed the table and nothing else. A row
// the ledger promoted to `current` without a line carries nothing but its own
// slot and label, so any filled cell is proof of a line.
function hasLine(row: LedgerRow): boolean {
  return (
    row.classYear !== null ||
    row.schoolName !== null ||
    row.record !== null ||
    row.snaps !== null ||
    row.overall !== null
  );
}

// ---------------------------------------------------------------------------
// The secondary read, and DECISION 015's forbidden case showing up in the data
//
// `enterOffseason` advances `classYear` through CLASS_ORDER and stops at SR
// (advance.ts:228-229), so a career that plays a fifth season stores SR twice:
// once for year 4 and once for year 5. The 017 playtester saw both rows, and
// the header, reading `SR`, and reported the fifth season as "a glitch rather
// than a fifth-year victory lap". Two rows carrying the same label is the
// option DECISION 015 explicitly forbade.
//
// This is NOT the redshirt inference DECISION 020 withdrew, and it does not
// re-derive it. It asks a different and much smaller question -- "has this
// class year already been used by an earlier year of this career?" -- which is
// answered by reading two stored values and comparing them. It never claims to
// know WHICH season was sat out, which is the fact report 010 measured as
// underivable. A second year as a senior is a fact the data states outright.
// ---------------------------------------------------------------------------

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th"] as const;

/**
 * The class year as it should be *displayed* for the career's `slot`-th year,
 * given the whole table. Returns "" when nothing is stored (a pre-DECISION-009
 * save, or a row that has not been played), so a caller can render it directly.
 *
 * Repeats are qualified by the year of the career they fall in, not by a guess
 * at what caused the repeat: `5th-Yr SR`. The qualifier comes from the slot,
 * which is the same number the primary label is built from, so the two can
 * never disagree.
 */
export function classYearLabel(
  rows: readonly LedgerRow[],
  slot: number,
  classYear: ClassYear | null,
): string {
  if (!classYear) return "";
  const repeated = rows.some((r) => r.slot < slot && r.classYear === classYear);
  if (!repeated) return classYear;
  const ordinal = ORDINALS[slot] ?? `${slot}th`;
  return `${ordinal}-Yr ${classYear}`;
}
