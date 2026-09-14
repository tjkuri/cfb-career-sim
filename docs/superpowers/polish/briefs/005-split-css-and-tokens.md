# 005 — Split `app.css`, then complete the token set

**Type:** developer · **Wave:** 2 (task zero — runs first and alone) · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

**Step 1 is already done and verified — see below. Your job is step 2 only.**

1. ~~Mechanically split `src/ui/styles/app.css` into per-area files with zero rendered change.~~ DONE.
2. **Complete the token set** — split the overloaded `--bulb` accent, and add the missing surface,
   radius, gap and duration tokens — replacing hard-coded values with the new tokens, again with
   **no intentional visual change** beyond what splitting `--bulb` necessarily implies.

## Why

`app.css` is the single bottleneck on this entire phase: **10 of 13 identified gaps touch it**, and
two agents cannot work in one flat file concurrently. Splitting it turns one serial lane into three
(DECISION 011). Everything else in `src/ui/**` is blocked behind this task, so it runs first and it
runs alone.

The token work rides along because it is the other universal prerequisite: `--bulb` currently does
**eight distinct jobs** (focus rings, buttons, the draft verdict, log headlines, the OVR, emphasis,
option hover, selection), so no later task can change one of them without changing all eight.

## Read first

- `docs/superpowers/polish/reports/004-current-ui-audit.md` — **§3 is your spec.** It lists the full
  current token set (`app.css:8-24`), enumerates all eight `--bulb` jobs with line numbers, and names
  the 6 hard-coded hexes and 7 literal radii sitting outside `:root`. Do not re-derive this.
- `docs/superpowers/polish/reports/002-reference-teardown.md` §4 — the colour-role architecture we
  are adopting: one neutral hue, ~7 lightness steps, zero chromatic accent in the base token set.
- `docs/superpowers/polish/DECISIONS.md` — 006, 008, 011 bind this task.

## Step 1 — the split: **ALREADY DONE. DO NOT REDO IT.**

A previous agent completed the mechanical split before being killed by a rate limit. The PM has
verified it independently and it is correct:

- `src/ui/styles/` now holds `tokens.css`, `base.css`, `career.css`, `creation.css`, `summary.css`,
  `log.css`; `app.css` is a 12-line index that `@import`s them in that order and keeps the font
  `@import` and the header comment. `main.tsx:4` is unchanged.
- **Proof of cascade safety:** concatenating the six files in import order and normalizing whitespace
  and comments yields **379 lines identical to the original**, with **75 selectors in identical
  order**. Verified by diff, not by eye.
- `npm test` 430 green · `npm run typecheck` both passes exit 0 · `npm run build` clean (CSS 7.42 kB).

The work is **uncommitted in the working tree**. Do not revert it, do not re-split, do not "improve"
the split. Your task is step 2 only.

## Step 2 — the tokens

- **Split `--bulb` by job.** At minimum: focus/selection keeps `--bulb`; the OVR gets its own ramp
  token(s); the draft verdict and log headlines get their own. Name tokens by **role**, not by colour
  — `--focus`, not `--amber`. Audit §3 has the eight-job list; every one of them ends up pointing at
  a named token, even where two roles resolve to the same value today.
- **Add the missing steps** audit §3 names: a `--card-raised` between `--card` and `--card-edge` (the
  ledger's current-row and hover state need it), and an `--input` step above `--line`.
- **Add radius, gap and duration tokens** and replace the 7 literal radii and the hard-coded
  durations. Keep the existing green hue — it is our identity and it plays the role hue 240 plays in
  the reference.
- **Fix the font axis** (`app.css:6`): the `@import` currently stops at `wght 800`, which makes
  DECISION 008's "900 for numerals" unloadable. Extend the axis. **Do not restyle anything with it
  in this task** — later tasks own the type scale; you are only making 900 available.
- Values may shift only where splitting a role demands it. If you find yourself making an aesthetic
  choice, stop: that belongs to a later brief. This task ends with the screens looking the same.

Bug 3 in audit §"Found, not fixed" (`body { font-size: 17px }` at `app.css:36` not scaling rem-based
declarations, because `html` sets no `font-size`) is **in scope to note, out of scope to fix** — the
type-scale task owns it. Leave it, and say so in your report.

## Out of bounds

- `src/engine/**` and `src/content/**` — frozen. A concurrent task owns an approved, additive engine
  change (`SeasonLine` gains two fields); **do not touch any engine file.**
- Any `src/ui/screens/*.tsx` and `src/ui/session/*` — later tasks own those. This is CSS plus the one
  import line if the split requires it.
- No new dependency. No Tailwind, no CSS-in-JS, no preprocessor.

## Hard constraints

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase — it swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- **No colour may encode tier, probability, or an outcome's positive/negative branch** (DECISION 006).
  When you build the token set, do not create a `--good` / `--bad` pair — `src/engine/types.ts` says
  in so many words that a UI colouring an outcome by branch leaks the option's probability.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Not your concern
  here, but do not create anything that invites a bypass.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test` — **430 green.**
- `npm run typecheck` — **both passes exit 0.**
- `npm run build` — clean.
- **Click through all four screens at localhost:5173** (creation → decisions → resolve-in-place →
  summary → career log) at desktop width **and at 400px**, and confirm no visual change from step 1
  and no unintended change from step 2. Say in your report what you actually looked at.
- A dev server may already be running on 5173 — check before starting one, and **never run
  `npm run dev` in the foreground; it does not exit.** If a tool call fails 3 times, stop that line
  of attack and report.

Use the `frontend-design` skill for the token work.

## Do not commit

Leave your work in the working tree. The user has not asked for commits and the PM is not making them
on their behalf. Do not run `git commit`, `git checkout`, `git restore` or `git stash` — the tree
already holds verified uncommitted work from step 1 and from two concurrent agents.

## Report

Write to `docs/superpowers/polish/reports/005-split-css-and-tokens.md`: the eight `--bulb` jobs and
which token each now points at, the new token set with the reasoning behind each role name, and
anything you found and left alone.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and the
report path. Nothing else — the PM is deliberately keeping its context small.
