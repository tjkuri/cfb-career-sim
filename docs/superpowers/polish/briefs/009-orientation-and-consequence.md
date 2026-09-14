# 009 — Orientation and consequence on the decision card

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** make the decision screen tell the player where they are and what just happened to them.

**Why:** three of the four strongest findings in the phase all land on this one screen. The header
reports the wrong season on 71% of resolved cards; it changes shape between cards; a −8 overall
injury renders identically to a joke about a speeding ticket; and 40% of a career resolves into
total silence because one line of the reducer throws the authored prose away. Everything here is
already-computed data that nothing renders.

## Standing rules (these killed two earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run` if your runner would otherwise watch.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The tree routinely holds verified
  uncommitted work from other agents; one revert destroys it. The PM commits.
- **Work in priority order and report partial work honestly.** The four items below are ordered. If
  you are running short, stop after an item, verify it, and say in the report exactly which items
  are done and which are not. A verified item 1–2 is worth far more than four unverified ones.

## Files you own

`src/ui/screens/CareerScreen.tsx`, `src/ui/styles/career.css`, `src/ui/session/reducer.ts`,
`src/ui/session/reducer.test.ts`, `src/ui/session/types.ts`, `src/ui/App.tsx`.

**Out of bounds:** `src/engine/**`, `src/content/**` (both frozen), and
`src/ui/session/view-model.ts`, `src/ui/screens/SummaryScreen.tsx`, `src/ui/styles/summary.css`,
`src/ui/styles/tokens.css` — other in-flight tasks own those. If you need a new value from
`GameState`, it must come through `view-model.ts`, which you may not edit: report it instead.

## Read first

- `docs/superpowers/polish/reports/007-honest-season-state.md` — finding 2 gives the exact
  two-line `CareerScreen.tsx` fix for the phase bug, and flags the rail reflow.
- `docs/superpowers/polish/DECISIONS.md` — **012** (dynamic range), **014** (the record does not
  exist mid-season), **018** (one-option cards), **019** (the fixed rail). 018 and 019 are the spec
  for items 1–3; do not redesign them, implement them.
- `src/ui/session/types.ts` — `SeasonStamp`, `Resolved`, `SeasonLineView`, `CareerView` are all
  already shaped for this work and documented inline.

## The work, in priority order

### 1. Draw the season state, and fix the 71% phase bug

`CareerView` already carries `season` (a `SeasonLineView`: record, snaps, live stat line,
`inProgress`), `phaseLabel` and `seasonNumber`. **Nothing renders any of them.** `Resolved.stamp`
already captures season identity before `advance()` runs, and nothing reads it.

Per DECISION 019: the rail becomes a **fixed-height slot with fixed cells** — a cell with nothing
to say renders empty and holds its space, so the strip never reflows between a decision card and
its outcome. When `resolved` is non-null, the rail reads `resolved.stamp` (season number, class
year, phase label, school) rather than the live view, so the header describes the card being read.
`stamp` is nullable (old saves) — fall back to the live view, never to `undefined`.

The record renders only when `season.record` is non-null (DECISION 014); its slot is held anyway.
The live stat line and snaps are real all season and are what DECISION 013's playtester actually
asked for at the redshirt / transfer / declare cards.

### 2. One-option cards keep their prose (DECISION 018)

`reducer.ts:88` — `const skipOutcome = outcome === null || decision.options.length === 1;` — throws
away the authored outcome on every single-option card. Read DECISION 018 in full; it states the
invariants. In short: a one-option decision **resolves on arrival, inside the reducer** (never in a
`useEffect` — StrictMode would double-`advance` and silently eat a decision), and renders as one
narrated beat: title, description, the option label as a quiet line (it was not a choice, so do not
label it "You chose:"), the outcome prose, the delta from item 3, one Continue.

Must hold, and must be covered by tests in `reducer.test.ts`:
- exactly one `advance` per card;
- resolution goes **at most one level** — two consecutive one-option cards produce two cards;
- it terminates (a one-option card whose outcome prose is null must not recurse);
- multi-option decisions and hub cards (Signing Day, transfer, declare — these author no prose)
  behave exactly as they do today.

Use `superpowers:test-driven-development` here. This is reducer logic with a real chance of eating
a decision if it is wrong.

### 3. Give consequence a voice (DECISION 012 / B14)

The resolved card is the one screen whose entire job is "here is what happened", and it does not
say what happened. Show the **overall delta**. `SeasonStamp` deliberately excludes progression
values (its comment explains why), so capture the pre-`advance` `overall` as a new field on
`Resolved` in `types.ts` — it is `ui.state.overall` at the same point the stamp is taken.

DECISION 012 is the whole spec and the line is exact:
- **Permitted:** scale, weight and motion tracking the *magnitude* of a change in values the player
  can already see. `overall` is on screen at all times, so a −8 is already visible as a number;
  rendering it quietly is the bug.
- **Forbidden:** hue tracking valence. No red/green pair, no `--good`/`--bad`. A −8 and a +8 may
  both be loud; they may not be different colours.

`--emphasis`, `--dur-state` and `--dur-enter` in `tokens.css` are the documented attachment points.
You may not edit `tokens.css` — consume the tokens, and if you need a new one, report it.

### 4. Option rendering (B4)

Gold (`--action`) currently sits on **Continue**, which is a no-op transition, while the real
choices are grey outlines that read as form fields. The accent belongs on the thing that commits
the career. `--select` / `--select-dim` exist for exactly this and are separate tokens from
`--action` precisely so this can change independently.

Constraint: an option may be made prominent, but **no option may be made more prominent than
another** — any pre-choice emphasis that distinguishes one option from its siblings leaks the
branch (DECISION 006, DECISION 012).

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. If you believe a change there is needed,
  write a proposal in your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is
  what makes the hidden-mechanics rule testable. Do not bypass it.
- Tests stay green and both typecheck passes exit 0. Verify before reporting done.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test -- --run` — **444 green** is the current baseline; you will be adding tests, so state
  the new count.
- `npm run typecheck` — **two passes, both must exit 0.**
- `npm run build` — clean.
- `npm run play -- <seed> random` on two seeds before and after: **output must be byte-identical.**
  You changed when the UI calls `advance`, not what the engine does, and this is the proof.
- Click through at `localhost:5173`: start a career, reach a one-option milestone (Season Opener,
  Fall Camp Battle and Senior Day are the three), and confirm the rail does not reflow between a
  decision and its outcome.

Use the `frontend-design` skill for the visual work.

**REPORT:** write findings to `docs/superpowers/polish/reports/009-orientation-and-consequence.md`.
Return to the PM **only**: status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings — this is the single biggest lever on PM context size.
