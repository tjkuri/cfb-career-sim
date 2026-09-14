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
    row.state = active && index === currentSeasonIndex ? "current" : "played";
    row.classYear = line.classYear ?? null;
    row.schoolName = textOrNull(line.schoolName);
    row.record = textOrNull(line.record);
    row.snaps = finiteOrNull(line.snaps);
    row.overall = finiteOrNull(line.overall);
    // A row that has been played is no longer a possibility to be hedged.
    row.tentative = false;
  }

  return rows;
}
