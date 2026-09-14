# 004 — Audit our current UI against the teardown (research only, no code changes)

**Type:** research · **Wave:** 1 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Produce the **gap table** between what our UI does today and what `reports/002-reference-teardown.md`
recommends, so wave-2 developer briefs can name exact selectors, tokens and line numbers instead of
saying "tighten the type."

**You change no files except your report.** No edits to `src/**`. No dependencies. No design work,
no refactors, not even a "while I was in there" fix. If you find a bug, write it down; do not fix it.

## Why

Wave 1 produced a detailed teardown of the reference game with concrete recommendations. What it does
**not** have is a precise picture of our own starting point. Without that, every wave-2 brief either
re-derives it (expensive, three times over) or guesses (wrong).

## Read first

- `docs/superpowers/polish/reports/002-reference-teardown.md` — the recommendations you are auditing
  against. Read it fully; it is the spec for this task.
- `docs/superpowers/polish/DECISIONS.md` — decisions 006, 007 and 008 are the calls already made.
  **Do not re-litigate them, and do not recommend anything that contradicts them.**
- Our UI source: `src/ui/**` — in particular `styles/app.css`, `session/view-model.ts`,
  `session/types.ts`, `session/labels.ts`, and `screens/`.

## Deliverable — a gap table per area

For each area below: **what we do now** (cite `file:line` and the actual token/selector/value),
**what 002 recommends**, **the delta**, and **an effort estimate** (S / M / L) with the files a change
would touch. Flag any two areas whose fixes would touch the same file — the PM needs that to dispatch
non-overlapping parallel work.

1. **Layout shell.** Our top-anchored scrolling document vs. the height-locked two-column shell. What
   currently controls page height, max width and scroll? What breaks if the shell is height-locked —
   which text nodes can overflow and have no clamp? (002 §7k: every overflow-capable node needs a
   clamp or a locked shell breaks on the longest real content string.) **Name the longest realistic
   strings** — check actual content in `src/content/events/**` for the longest event title, option
   label and outcome paragraph, and give character counts.
2. **Type scale.** Our current sizes/weights/leading/tracking per role, as a table, against 002's
   six-step scale. Which of our declarations are already right, which invert the recommendation.
3. **Colour roles.** Our full token set from `app.css`, each token's current jobs (grep every usage),
   and specifically: **how many distinct jobs is `--bulb` doing?** 002 and B8 both claim one accent is
   overloaded. Confirm or refute with the usage list.
4. **The time-orientation gap (DECISION 007).** What exactly would a ledger need from the view-model?
   Enumerate the fields available on `GameState` (`seasonIndex`, `phase`, `phaseAbs`, `eligibility`,
   `seasons`) and state precisely what `CareerView` would gain and what `view-model.ts` would compute.
   **Do not implement it.** Note whether `SeasonView` can be reused as-is or needs a sibling type, and
   what the existing view-model tests would need.
5. **Option rendering.** How our option buttons are built today (component, CSS, states) against 002's
   equal-height card with a media slot. Is there a media slot at all? What would adding one cost?
6. **Where our code already agrees with 002.** A short list — things we should *not* touch. This
   section matters as much as the gaps; it stops wave 2 rewriting things that are already right.

## Hard constraints (these bind every recommendation you make)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase — it swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. If you believe a change there is needed, write
  a proposal in your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is what
  makes the hidden-mechanics rule testable. Any new screen data goes through it — never around it.
- 430 tests stay green; both typecheck passes exit 0. Plain CSS with custom properties — **no
  Tailwind, no CSS-in-JS.**
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Operational notes

- A dev server is already running on port 5173 — **do not start another, and do not run `npm run
  dev`.** You may run `npm test` and `npm run typecheck` (both terminate); you should not need to.
- Another agent is concurrently playtesting in the browser and owns
  `reports/003-baseline-playtest.md` and `PLAYTEST-LOG.md`. Do not touch those files, do not clear
  `localStorage`, and **stay out of the browser entirely** — this is a source-reading task.
- If a tool call fails 3 times, stop that line of attack, note it, and continue with the rest.

## Report

Write the full audit to `docs/superpowers/polish/reports/004-current-ui-audit.md`.
Lead with a table of the gaps ranked by (player impact ÷ effort), and a "files most contended" list
showing which gaps collide on the same file.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and the
report path. Nothing else — the PM is deliberately keeping its context small.
