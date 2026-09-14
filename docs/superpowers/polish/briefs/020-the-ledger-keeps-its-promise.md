# 020 — The ledger keeps its promise, and the header stops disagreeing with it

**Type:** developer · **Wave:** 8 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Fix the four places where the decision screen states something that is not true, including the only
place in three careers a playtester was genuinely lost.

## Why

The career ledger shipped last wave and it is the best thing in it — a playtester used it to make
three real decisions and said the three careers' columns *"are three different stories you can see
in one glance."* Do not redesign it. **Everything in this brief is a correctness fix to something
next to it.**

Full playtest: `reports/017-post-wave6-playtest.md` (claims 1, 2, 9, 10). The call this brief
implements is `docs/superpowers/polish/DECISIONS.md` entry **033**; read **020** and **023** too,
and do **not** re-derive the redshirt inference — 020 withdrew its own "would change our mind"
clause specifically to stop an agent re-measuring this.

## The five tasks

### 1. The dashed fifth row stops promising what the UI cannot check

The fifth ledger row is dashed and captioned *redshirt year*. The playtester read the dashed rule
correctly with no help — *"a fifth season, but conditional; I only get it if I redshirt"* — then
**took the redshirt, gained +10 OVR, and the row did not change.** It changed only on *arriving* in
season 5.

This is not a small bug. Report 010 measured that "which season was the redshirt" is **not reliably
derivable** from stored data (the duplicate-`classYear` signal exists in 40.6% of redshirt careers
and points at the wrong row 426 times out of 427). So the caption asserts a fact the UI has no way
to confirm.

**Per DECISION 033: the dashed rule stays, the caption that asserts *why* goes.** The structural
signal was doing the work on its own. Then, separately:

**Write the engine proposal.** `SeasonLine` gains an explicit redshirt flag set at the boundary
where the fact is actually known. Additive, and the same shape as the already-approved DECISION 009
(`overall` and `classYear` joined `SeasonLine` exactly this way). **Write it in your report as a
proposal with the exact diff — do not implement it.** `src/engine/**` is frozen and the narrow lift
in DECISION 029 does not cover this.

### 2. The season-5 desync — the one place the player was lost

> *"During the whole of season 5's offseason, the header read `SEASON 5` while the YEAR 5 row was
> still dashed, still said 'redshirt year', and was not highlighted as the current year. For three
> decisions the rail and the header disagreed about what year it was."*

The current-row logic is wrong for the fifth season. Fix it, and add a test that pins the header and
the highlighted row to the same season across all five slots and every phase. No engine change.

### 3. Two rows labelled `SR`

Career 2 ran five seasons with the class label stuck on `SR` for **both** year 4 and year 5, in the
header and the ledger — *"which made the last season feel like a glitch rather than a fifth-year
victory lap."* The engine advances `classYear` on the redshirt boundary, so the duplicate is real in
the stored data. Handle it in the display layer. **Two rows carrying the same label is the option
DECISION 015 explicitly forbade**, and it is on screen today.

### 4. Strip rows 2 and 3 still merge — apply 023's pre-specified fix

DECISION 023 named this in advance and named the remedy. The playtester:

> *"These two rows read to me as one flat block of grey... I never read the stat line on purpose in
> three careers."*

The fix 023 pre-committed to is **demoting row 2 — not introducing a fourth grey.** `tokens.css` is
out of bounds; work within the existing roles.

### 5. `1 Game-Winners`

Plural on a count of one, in the header stat line. Fix the pluralisation generally, not just this
string.

**Not yours, listed so you do not chase it:** `FG -1` (negative field goals in a redshirt season) is
an engine stat-generation bug. If you can cheaply identify the cause while you are in the data, add
it to your report **as a proposal**. Do not fix it and do not spend long on it.

## Files

**You own, exclusively:** `src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`,
`src/ui/session/ledger.ts`, `src/ui/session/labels.ts`, and their tests.

**Out of bounds — another agent owns these in this same wave:** `src/ui/session/types.ts`,
`src/ui/session/view-model.ts`, `src/ui/session/bands.ts`, `src/ui/screens/SummaryScreen.tsx`,
`src/ui/styles/summary.css`, `src/content/**`, `src/sim/**`.

This split is by **file, not by interface.** Splitting by interface collided at `types.ts` in two
consecutive waves. If you genuinely cannot finish a task without touching `types.ts` or
`view-model.ts`, **write the exact diff in your report and leave it unapplied** — that pattern
worked in report 010 and the PM will land it.

**Also out of bounds:** `src/engine/**` (frozen), and `src/ui/styles/tokens.css` — the type scale
and palette are settled. Make the case in your report if you disagree.

## Constraints (hard — design intent, not preferences)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying.
- `src/engine/**` and `src/content/**` are **frozen.** Write a proposal; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it —
  and in this wave you may not edit it at all.
- **501 tests stay green. Both typecheck passes exit 0.**
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.
- Magnitude may drive scale, weight, opacity and motion. **Valence may never drive hue** (DECISION
  012).

## Verify before reporting

`npm test` (501 green) and `npm run typecheck` (**two** passes, both exit 0). Then look at it at
`localhost:5173` — **start the dev server in the background, never in the foreground**; `npm run
dev` does not exit and has hung two agents here.

Tasks 1–3 need a **five-season career with a redshirt**, which you will not get by clicking. Seed
`localStorage` (`cfb-career-sim:v1:current`) from a headless run — `npm run play -- <seed> random`
prints the JSON, and `src/sim/policies.ts` has a redshirt strategy. Confirm with your own eyes that
the header and the highlighted row agree in season 5's offseason.

Use the `frontend-design` skill for the visual work in task 4.

## Report

Write to `docs/superpowers/polish/reports/020-the-ledger-keeps-its-promise.md`, ending with the
`SeasonLine` redshirt-flag proposal from task 1 (and the `FG -1` cause if you found it cheaply).
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and
that path. Never the full findings.
