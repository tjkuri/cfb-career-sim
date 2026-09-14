# 010 — The career ledger: the redshirt inference, measured and rejected; the logic, shipped

**Type:** measurement + implementation · **Status:** done · **2026-09-13**
**New files only:** `src/ui/session/ledger.ts`, `src/ui/session/ledger.test.ts`. No existing source
file was edited. Measurement: **1,536 careers / 5,390 season rows** plus a **6,418-snapshot**
invariant run over 240 live careers.

---

## Verdict on DECISION 015: **option 2 — rows are labelled by sequence, `Year 1`–`Year 5`**

Option 1 (infer the redshirt row, label it `RS`) is rejected on two numbers, either of which is
fatal on its own:

| | |
|---|---|
| **Duplicate-`classYear` signal present in redshirt careers** | **40.6%** (427 of 1,051) — the brief's gate was 100% |
| Duplicate-`classYear` signal absent in non-redshirt careers | 100.0% (485 of 485) — this half passes |
| **Where the duplicate IS present, it points at the wrong row** | **426 of 427 careers (99.8%)** |
| Redshirt season index | **1** in 955 of 1,051 careers; 2 in 94; 3 in 2; **never 0** |

The second row of that table is the one that settles it, and it is a structural fact rather than a
sampling artefact. `enterOffseason` advances `classYear` on the redshirt boundary like any other
(`advance.ts:228-229`) and `CLASS_ORDER` runs out at `SR`, so the duplicate **always lands at the end
of the career** while the redshirt itself sits at season index 1 in 91% of cases. DECISION 015's
option 1 as literally worded — "`snaps` ≈ 0 on a row whose `classYear` duplicates its successor's" —
therefore selects a season that was *played*, at full snaps, 426 times out of 427.

And the deeper point: **even a perfect redshirt inference does not fix what DECISION 015 is about.**
Labelling season 2 `RS` turns `FR, SO, JR, SR, SR` into `FR, RS, JR, SR, SR`. The two identically
labelled `SR` rows — the actual ambiguity — are still there. That is option 3 unadorned, which the
brief forbids. The redshirt row and the ambiguous row are *different rows*, so no amount of accuracy
on the first one resolves the second. Sequence labels dissolve the problem at source: five slots,
five distinct labels, no inference anywhere in the shipped file.

### The snaps signal, measured honestly: clean, and beside the point

DECISION 015 said *"if the snaps inference measures clean across a few hundred redshirt careers,
option 1 is both free and correct."* The snaps signal **is** clean. It is recorded here in full so
nobody has to re-measure it, and so the reason it still loses is on the record.

| Snaps distribution | n | min | p10 | median | p90 | max |
|---|---|---|---|---|---|---|
| **Redshirt rows** | 1,050 | −9 | **9** | **26** | 33 | **51** |
| **Non-redshirt rows** | 4,340 | −20 | **180** | **461** | 610 | 863 |

DECISION 017's finding reproduces exactly: `sitSnapModifier` is 0.05, so a redshirt season credits a
median of **26** snaps, not zero. The two distributions nonetheless barely touch — only **31 of
4,340** non-redshirt rows (0.71%) fall at or below the redshirt maximum of 51.

Threshold sweep, row-level, all 5,390 rows (`snaps ≤ T ⇒ redshirt`):

| T | TP | FP | FN | precision | recall | FP rate |
|---|---|---|---|---|---|---|
| 0 (*"snaps ≈ 0"* read literally) | 1 | 6 | 1,049 | 0.143 | **0.001** | 0.0014 |
| 26 | 596 | 30 | 454 | 0.952 | 0.568 | 0.0069 |
| 40 | 1,006 | 30 | 44 | 0.971 | 0.958 | 0.0069 |
| **52 (best F1 = 0.985)** | **1,050** | **31** | **0** | **0.971** | **1.000** | **0.0071** |
| 80 | 1,050 | 53 | 0 | 0.952 | 1.000 | 0.0122 |

In the clean five-season redshirt cohort alone (384 careers), the best row-level threshold is T=51 at
**99.42%** accuracy (11 FP, 0 FN), and the redshirt row is the career's minimum-snaps row in
**376/384 (97.9%)** careers. If a duplicate exists, labelling the career's lowest-snaps row is right
**425 of 427** times (99.5%).

So the snaps half is shippable and the duplicate half is not — and since the duplicate half is what
gates the label the ambiguity actually needs, the compound inference dies. Note also that
**"snaps ≈ 0" is the single worst reading of the rule**: rows with exactly 0 snaps number 5 across
the whole cohort and **none of them is a redshirt season**. A `snaps === 0` test would have shipped a
label that is wrong every time it fires.

### Why the duplicate is missing from 59% of redshirt careers

624 of 1,051 redshirt careers never reach a fifth season and so never store a second `SR`:

| False negatives by | |
|---|---|
| Season count | 2 seasons: 475 · 3 seasons: 103 · 4 seasons: 45 · 1 season: 1 |
| Career status | drafted 602 · busted 22 |
| Cohort | `rsEarly` (redshirt then declare when eligible) 384 · `random` 229 · `rs5` 11 |

A redshirt followed by an early declaration is an ordinary, successful career — it is most of the
`random` cohort — and it leaves no trace of the redshirt in `classYear` at all. Any scheme keyed on
the duplicate would have been silently inert for the majority of the players who took the decision.

### Method

Drove the engine's own loop (`createCareer` → `getDecision` → `advance`, the reference loop in
`src/sim/play-headless.ts`), recording each season line plus **ground truth** for the redshirt year —
`state.redshirtSeasonActive` observed at the season it was true for, not inferred. Four cohorts,
6 positions × 64 seeds each, seeds `m010-*`:

| Cohort | policy | n | redshirt taken | median seasons |
|---|---|---|---|---|
| `random` | the balance harness's `random` policy | 384 | 73.7% | 3 |
| `full4` | decline redshirt, decline declare, stay | 384 | 0% | 4 |
| `rs5` | take redshirt, decline declare, stay | 384 | 100% | 5 |
| `rsEarly` | take redshirt, declare when eligible | 384 | 100% | 2 |

1,536 careers, 5,390 season rows, 1,050 of them redshirt seasons. No career recorded two redshirt
seasons; no career recorded `redshirtUsed` without a corresponding season row; no career exceeded 5
rows. Aggregation happened inside the throwaway script (scratchpad, not in `src/`); no raw career
JSON entered this report.

---

## What shipped

`src/ui/session/ledger.ts` — one pure, synchronous function over plain data. It imports one
**type** (`ClassYear`) and nothing else; it never sees a `GameState`, so DECISION 004's boundary
stands and `view-model.ts` remains the single caller.

```ts
export const LEDGER_SLOTS = 5;

export interface LedgerSeason {
  seasonIndex: number;
  schoolName: string;
  classYear: ClassYear | null;
  record: string | null;      // null until the postseason resolver ran (DECISION 014)
  snaps: number;
  overall: number | null;     // null on a pre-DECISION-009 save
}

export interface LedgerInput {
  seasons: readonly LedgerSeason[];
  currentSeasonIndex: number; // GameState.seasonIndex, 0-based
  redshirtUsed: boolean;      // eligibility.redshirtUsed — a stored fact, never inferred
  active: boolean;            // false once the career is terminal
}

export type LedgerRowState = "played" | "current" | "future";

export interface LedgerRow {
  slot: number;                  // 1..5; slot N is always season index N-1
  label: string;                 // "Year 1".."Year 5" — DECISION 015, option 2
  state: LedgerRowState;
  classYear: ClassYear | null;   // the secondary read
  schoolName: string | null;
  record: string | null;
  snaps: number | null;
  overall: number | null;
  redshirtSlot: boolean;         // true for slot 5 only (DECISION 010)
  tentative: boolean;            // slot 5, while redshirtUsed is false
}

export function buildLedger(input: LedgerInput): LedgerRow[]; // always length 5
```

Properties it holds, each covered by a test:

- **Always exactly five rows** (DECISION 010) — empty career, four-year career, five-year career, and
  a history that somehow holds six lines (the sixth is dropped; the table still stands five).
- **A row is placed by the season it was**, not by its position in the array: slot N is season index
  N−1. A gap leaves a hole rather than shifting later years up, so "Year 4" can never name a season
  that was actually the player's fifth.
- **`record` passes through untouched and `0-0` is never substituted** (DECISION 014). Across 6,418
  live snapshots the ledger emitted the string `"0-0"` exactly **0** times.
- **At most one `current` row**, and none at all once the career is terminal — a career that ended
  mid-season shows that row as `played`, which is what it is.
- **Slot 5 carries `redshirtSlot: true` and `tentative: true` until `redshirtUsed` flips**, at which
  point it is an ordinary future row and then an ordinary played row. The renderer needs no
  re-derivation: both booleans are on the row.
- **Old saves do not crash.** Every field is read defensively (`Number.isFinite`, `?? null`). A
  fixture with no `overall` and no `classYear` renders `overall: null`, `classYear: null`, label
  intact; a line missing *everything* optional does not throw. Across the live run: **0** `NaN`
  values emitted.
- **Pure:** does not mutate the history it is handed; equal input gives equal output.

Test fixtures, as the brief specified: a four-year career, a redshirted five-year career (`FR, SO,
JR, SR, SR` with 26 snaps at index 1 — the real measured shape), a career that transferred, a career
that ended mid-season, and a pre-DECISION-009 save. Plus a compile-time guard that `SeasonView`
stays assignable to `LedgerSeason`, so the wiring below cannot rot silently.

---

## The wiring, specified but NOT applied

Two files, both owned by other tasks this wave. This assumes brief 011 has landed `overall` and
`classYear` on `seasonViews` — verified present in the working tree at the time of writing.

**1. `src/ui/session/types.ts`** — add the import at the top:

```diff
 import type { ClassYear, DraftResult, PendingDecision, Position, Setup, Status } from "../../engine/index";
+import type { LedgerRow } from "./ledger";
```

and one field on `CareerView`, immediately after `season`:

```diff
   season: SeasonLineView | null;
+  /** The career ledger: always exactly five rows, whatever has happened
+      (DECISIONS 007/010). Slot 5 is the redshirt slot and carries its own
+      `redshirtSlot` / `tentative` flags, so a renderer never re-derives it.
+      Rows are labelled by sequence, not class year — DECISION 015 chose
+      option 2 after the redshirt inference measured unusable (report 010). */
+  ledger: LedgerRow[];
```

**2. `src/ui/session/view-model.ts`** — add the import:

```diff
 import { standingPhrase, trustPhrase } from "./bands";
+import { buildLedger } from "./ledger";
 import { awardLabel, iconGlyph, phaseLabel, statLabel, trophyLabel } from "./labels";
```

and one entry in the object `buildView` returns, immediately after `season:` (`terminal` is the
`const` already declared at the top of that function):

```diff
     season: currentSeasonLine(state),
+    ledger: buildLedger({
+      seasons: seasonViews(state),
+      currentSeasonIndex: state.seasonIndex,
+      redshirtUsed: state.eligibility.redshirtUsed,
+      active: !terminal,
+    }),
```

No other change is needed. `seasonViews(state)` already returns every field `LedgerSeason` wants
(its extra `stats` is ignored), `recordOf` has already nulled the in-season record, and
`storedOverall` / `storedClassYear` have already nulled the pre-009 fields — so the ledger inherits
the view-model's honesty rules rather than reimplementing them.

**Checked, so the next wave does not have to:** `view-model.test.ts`'s forbidden-key walker recurses
through arrays and objects collecting key names. `LedgerRow`'s keys are `slot`, `label`, `state`,
`classYear`, `schoolName`, `record`, `snaps`, `overall`, `redshirtSlot`, `tentative` — none is in
`FORBIDDEN_KEYS`, and no value carries a tier, a draft stock, a probability, a weight or a trait
name. Adding the field does not break that test. `types.ts → ledger.ts → engine` introduces no import
cycle.

---

## Verification

| | |
|---|---|
| `npm test -- --run` | **488 passed / 488**, 35 files — baseline was 444; **25 of the new tests are mine** (`ledger.test.ts`), the remaining 19 arrived from concurrent agents in the same tree |
| `npm run typecheck` | **both passes exit 0** |
| Live invariant run | 6,418 ledger snapshots over 240 careers, all 6 positions: 0 violations, 0 `NaN`, 0 `"0-0"`, max 1 `current` row, slot 5 never tentative after `redshirtUsed` |
| Files changed | 2 new files under `src/ui/session/`. No existing file touched. Nothing committed. |

No test failure was observed in any file I do not own. The measurement harness lived in the session
scratchpad and is not in the repo.

---

## Two notes for the PM

1. **DECISION 015 can be closed, and its "would change our mind" clause should be closed with it.**
   That clause invites reopening if the snaps inference measures clean. It does measure clean — and
   it is still the wrong tool, because the row it identifies is not the row that is ambiguous. If
   the clause stays open as written, a future agent will re-run this measurement, get a 99.4%
   accuracy number, and re-propose the label that does not fix anything. Suggested replacement: *"We
   would revisit only if the engine ever recorded the redshirt year directly — and DECISION 015
   already declined that field."*

2. **No engine change is proposed.** The brief asked me to flag one if needed; none is needed.
   `eligibility.redshirtUsed` is sufficient for everything DECISION 010 requires of the fifth row,
   and it is a stored fact rather than an inference. The third engine field DECISION 015 rejected
   would buy one row label under a scheme we are no longer shipping.
