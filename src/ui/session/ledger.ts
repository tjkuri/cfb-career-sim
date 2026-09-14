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

/** DECISION 010: the table is always this tall. It never grows a row
    mid-career, because a table that grows moves the "how much is left" signal
    underneath the player -- the one job the ledger exists to do. */
export const LEDGER_SLOTS = 5;

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
  /** The OVR the season ended at. Null, never NaN, on a pre-009 save. */
  overall: number | null;
  /** True for slot 5 only: the redshirt slot (DECISION 010). */
  redshirtSlot: boolean;
  /** True while slot 5 is a possibility rather than an earned year -- the
      renderer draws it more faintly than an ordinary future row. Goes false
      the moment `redshirtUsed` is true, before the season is ever played, so
      the distinction never has to be re-derived downstream. */
  tentative: boolean;
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
function emptyRow(slot: number, redshirtUsed: boolean): LedgerRow {
  const redshirtSlot = slot === LEDGER_SLOTS;
  return {
    slot,
    label: `Year ${slot}`,
    state: "future",
    classYear: null,
    schoolName: null,
    record: null,
    snaps: null,
    overall: null,
    redshirtSlot,
    tentative: redshirtSlot && !redshirtUsed,
  };
}

export function buildLedger(input: LedgerInput): LedgerRow[] {
  const { currentSeasonIndex, redshirtUsed, active } = input;
  const rows: LedgerRow[] = [];
  for (let slot = 1; slot <= LEDGER_SLOTS; slot++) rows.push(emptyRow(slot, redshirtUsed));

  // A history longer than the eligibility cap cannot happen (the engine caps at
  // four years plus one redshirt) but is survived rather than trusted: a line
  // outside the five slots is dropped, and the table still stands five rows.
  for (const line of input.seasons ?? []) {
    const index = finiteOrNull(line?.seasonIndex);
    if (index === null) continue;
    const slot = index + 1;
    if (slot < 1 || slot > LEDGER_SLOTS) continue;
    const row = rows[slot - 1]!;
    row.state = "played";
    row.classYear = line.classYear ?? null;
    row.schoolName = textOrNull(line.schoolName);
    row.record = textOrNull(line.record);
    row.snaps = finiteOrNull(line.snaps);
    row.overall = finiteOrNull(line.overall);
    // A row that has been played is no longer a possibility to be hedged.
    row.tentative = false;
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
  const liveIndex = finiteOrNull(currentSeasonIndex);
  if (active && liveIndex !== null) {
    // Slot N is season index N-1, so the index is the array position directly.
    // Out of range (a terminal career parked at index 5, a wrecked save) reads
    // as `undefined` and marks nothing, which is the correct outcome.
    const row = rows[liveIndex];
    if (row) {
      row.state = "current";
      // Arriving in slot 5 settles the question the dashed rule was asking, so
      // the row stops hedging whether or not `redshirtUsed` was ever set.
      row.tentative = false;
    }
  }

  return rows;
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
