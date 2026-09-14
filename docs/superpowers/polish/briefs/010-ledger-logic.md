# 010 — The career ledger: measure the redshirt inference, then ship the logic

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** produce a tested, pure function that turns a career's season history into the five-row
ledger DECISIONS 007/010/013/015 commit us to — and settle, with a measurement, the one open
question about how its rows are labelled.

**Why:** the ledger answers "where am I and how much is left" with zero copy, and it is the
reference game's single most-praised read. It is blocked on one unresolved question (DECISION 015)
that must be answered with data, not taste. Doing that measurement and the logic now means the
component that draws it is a pure rendering job in the next wave.

**This task writes no CSS and no components, and edits no existing file.** That is deliberate:
another agent owns the career screen this wave. You ship new files plus a report.

## Standing rules (these killed two earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run`.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The tree holds uncommitted work
  from other agents right now; one revert destroys it. The PM commits.

## Files you own

**New files only:** `src/ui/session/ledger.ts`, `src/ui/session/ledger.test.ts`, and your report.
Plus a throwaway measurement harness — put it in the scratchpad or delete it before reporting; do
not leave it in `src/`.

**Out of bounds — every one of these is owned by another in-flight task or frozen:**
`src/engine/**`, `src/content/**`, `src/ui/session/types.ts`, `src/ui/session/view-model.ts`,
`src/ui/session/reducer.ts`, `src/ui/screens/**`, `src/ui/styles/**`, `src/ui/App.tsx`.

Define your own types inside `ledger.ts`. Wiring it into `CareerView` is the next wave's job, and
your report specifies that wiring as an exact diff rather than applying it.

## Read first

- `docs/superpowers/polish/DECISIONS.md` — **007** (a ledger, not a counter), **010** (always five
  rows; the fifth is the redshirt slot), **013** (the current season's row is the priority; the
  table must not turn the decision screen into furniture), and **015 — read this one twice, it is
  the whole open question**.
- `src/ui/session/view-model.ts` — `seasonViews`, `recordOf`, `statViews`, `currentSeasonLine`.
  Note `seasonViews` currently hardcodes `classYear: null` even though the engine now stores it.
- `src/ui/session/types.ts` — `SeasonView`, `SeasonLineView` (read only; do not edit).
- `src/engine/types.ts` — `SeasonLine` now carries `overall` and `classYear` (DECISION 009).

## The work

### 1. Measure the redshirt inference — this comes first and gates the rest

DECISION 015: a redshirted career stores class years `FR, SO, JR, SR, SR`, with **the duplicate at
the end, never at the redshirt year**. So the stored `classYear` is ambiguous exactly where the
label matters, and `RS` is not directly derivable.

Option 1 in that decision is to infer the redshirt row from `snaps` ≈ 0 on a row whose `classYear`
duplicates its successor's — **and DECISION 015 requires that inference be measured before it can
be shipped.** Note that DECISION 017 already found `sitSnapModifier` is 0.05, so redshirt seasons
credit a **median of 26 snaps, not zero** — which may well sink the inference outright. Find out.

Use `npm run play -- <seed> random` as the harness (brief 008 and
`reports/008-measure-repetition.md` show the pattern that worked — several hundred careers across
positions, driven from a script). Report, at minimum:

- how many careers took a redshirt, and at which season index;
- the snaps distribution on redshirt seasons vs. non-redshirt seasons (p10 / median / p90), and
  **whether the two distributions separate cleanly enough to classify a row**;
- the false-positive and false-negative rate of the `snaps`-threshold inference, at whatever
  threshold you find best;
- whether the duplicate-`classYear` signal is present in 100% of redshirt careers and **absent in
  100% of non-redshirt careers** — if it is not, the inference is dead regardless of snaps.

Then **choose**, and justify with your numbers: option 1 (infer and label `RS`) or option 2 (label
rows by sequence — Year 1–5 — with the class year as a secondary read). DECISION 015 names option 2
as the safe default if the measurement is not clean. **Option 3 unadorned is forbidden**: do not
ship two identically-labelled `SR` rows with no distinguishing mark.

### 2. Ship the logic

A pure function in `ledger.ts` — input is the season history plus the current position in it,
output is exactly five rows. It must satisfy:

- **Always five rows** (DECISION 010), whatever has happened. The table must not grow a row
  mid-career; that would move the "how much is left" signal underneath the player, which is the one
  job the ledger exists to do.
- Each row is one of: **played** (filled — school, label, record, snaps, the OVR it ended at),
  **current** (the row being written now; its record is `null` until the postseason resolver has
  run — DECISION 014, and do not substitute `0-0`), or **future** (empty chrome).
- The **fifth row is the redshirt slot** (DECISION 010): drawn as visibly more tentative than an
  ordinary future row until `eligibility.redshirtUsed` is true, then an ordinary row. Your output
  must carry enough state for a renderer to make that distinction without re-deriving it.
- **Old saves must not crash.** `localStorage` holds serialized `GameState` from before DECISION
  009 landed, whose `SeasonLine`s have no `overall` and no `classYear`. Those rows render with a
  null OVR — never `NaN`, never `undefined`, never a thrown error. Test this explicitly with a
  fixture that omits the fields.
- Pure, synchronous, no `GameState` import leakage beyond what the view-model boundary allows —
  see the constraint below.

Test it with `superpowers:test-driven-development`: a four-year career, a redshirted five-year
career, a career that transferred, a career that ended mid-season, and a pre-DECISION-009 save.

### 3. Specify the wiring, do not apply it

End your report with the exact diff the next wave applies: the new field on `CareerView` and the
`view-model.ts` call site. Enough that a cold agent applies it without re-deriving anything.

**Do not spec changes to `seasonViews` itself** — brief 011 is concurrently adding `overall` and
`classYear` to it for the summary screen's career-arc column, and owns that function this wave.
Write your wiring against the assumption that both fields are populated there by the time anyone
applies your diff.

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. If you believe a change there is needed,
  write a proposal in your report; do not edit. DECISION 015 already rejected a third engine field
  for this exact feature — do not re-propose it without new evidence.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Your function
  therefore takes **plain data** — season lines and current position — not a `GameState`, so that
  the boundary stays intact and `view-model.ts` remains the single caller.
- Tests stay green and both typecheck passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test -- --run` — **444 green** is the current baseline; you are adding tests, so state the
  new count. Other agents are working in the same tree: if you see a failure in a file you do not
  own, say so in the report rather than fixing it.
- `npm run typecheck` — **two passes, both must exit 0.**
- Your measurement numbers, pasted into the report, with the career count they came from.

**REPORT:** write findings to `docs/superpowers/polish/reports/010-ledger-logic.md`.
Return to the PM **only**: status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings — this is the single biggest lever on PM context size. Lead your
bullets with the DECISION 015 verdict and the number that decided it.
