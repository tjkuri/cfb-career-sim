# 013 — The rail describes one moment, not two

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** freeze the season line into `SeasonStamp` so a resolved card's context rail describes the
moment the choice was made, in both halves rather than one.

**Why:** wave 3 fixed the rail's layout and half its data. It still reports two different moments at
once. Found by hand at `localhost:5173`: on a resolved card that crossed a phase boundary the rail
reads **`Offseason · 153 snaps · 292 Pass Yds`** — an offseason that has somehow played a season.
One tick earlier, on the decision card, it correctly read `0 snaps`. The identity half is frozen to
the stamp; the season-line half is live; at a boundary they disagree, and the player watches the
numbers jump on the card that is supposed to be explaining what just happened.

This is the 71% phase bug in its second form, and it is small.

**This task touches no CSS.** Another agent owns all of `src/ui/styles/**` this wave.

## Standing rules (these killed two earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run`.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The PM commits.

## Files you own

`src/ui/session/types.ts`, `src/ui/session/view-model.ts`, `src/ui/session/reducer.ts`,
`src/ui/screens/CareerScreen.tsx`, and their test files.

**Out of bounds:** all of `src/ui/styles/**` (another agent owns every stylesheet this wave —
if you need a new class or rule, report it and leave the markup alone), `src/engine/**` and
`src/content/**` (frozen), `src/ui/screens/SummaryScreen.tsx`, `src/ui/session/ledger.ts`.

## Read first

- `docs/superpowers/polish/DECISIONS.md` — **019** (the rail's contract, which this refines),
  **014** (a null record is the absence of one, never `0-0`), **012** (why `SeasonStamp` excludes
  progression values).
- `src/ui/session/types.ts` — `SeasonStamp` and its comment. **The comment is the trap in this
  task.** It says progression values are deliberately excluded so the OVR delta stays visible. That
  reasoning is correct and stays. It does **not** apply to snaps and stats: the OVR delta lives in
  the `.standing` block, not in the rail, so freezing the rail's numbers costs the delta nothing.
  Update the comment to say which of the two rules you are applying and why they differ.
- `docs/superpowers/polish/reports/009-orientation-and-consequence.md` — how the rail is built now.

## The work

Add the season line to `SeasonStamp`, captured in `play()` in the reducer at the same point the rest
of the stamp is taken — before `advance()`. `CareerScreen` then reads the whole rail from the stamp
when `resolved` is non-null, and from the live view otherwise.

Requirements:

- **`stamp` is nullable and must stay nullable.** Saves written before it existed restore with
  `null`, and `normalize()` in the reducer already handles that class of problem. A missing stamp
  falls back to the live view — never to `undefined`, never to a zero.
- **The record still renders only when it is real** (DECISION 014). Its slot is held regardless.
  Do not let a frozen stamp reintroduce a `0-0`.
- **The rail must not reflow.** Wave 3 measured one rail height and one card-top across every card
  walked, and got there by pinning `line-height` in `rem`. You are changing what the cells contain;
  keep that property true, and re-measure rather than assuming.
- A test that fails on today's behaviour before it passes on yours — walk a career to a boundary
  card and assert the rail's two halves name the same moment. Use
  `superpowers:test-driven-development`.

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. Write a proposal in your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. This task adds to
  that module; keep the boundary intact and keep `view-model.test.ts`'s assertion passing.
- 488 tests stay green; both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test -- --run` (488 baseline — state your new count), `npm run typecheck` (both passes),
  `npm run build`.
- `npm run play -- <seed> random` on two seeds, byte-identical before and after. You are changing
  what the UI records, not what the engine does.
- **At `localhost:5173`, reproduce the bug first, then confirm it is gone.** Start a career, answer
  the first card of an offseason, and read the rail on the resolved card. If snaps jump from 0 to a
  season's worth while the phase still says Offseason, that is the bug.

**REPORT:** write findings to `docs/superpowers/polish/reports/013-rail-one-moment.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. Never the full findings.
