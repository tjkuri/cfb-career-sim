# 012 — Invert the type register, and clamp what can overflow

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** replace the ad-hoc type sizing across all six stylesheets with one six-step scale in the
register DECISION 008 committed to — smaller, much heavier, tighter leading — and add the clamps
that zero of 475 original CSS lines ever had.

**Why:** this is the single largest remaining gap between our build and the reference game, and it
is measured, not felt. The reference runs 125 of 156 size declarations at ≤12px and 112 of 142
weights at ≥700, with `leading-none` 43 times against `leading-tight` 8. It reads like a broadcast
score graphic. We run large, light and airy — the opposite register. Structure is now finished on
every major screen, so this pass lands on stable surfaces once instead of being re-tuned.

**This task runs alone in the CSS.** It is the only task this wave permitted to touch
`src/ui/styles/**`, which is why it can safely touch all of it.

## Standing rules (these killed two earlier agents — read them)

- **The dev server is already running** on `localhost:5173`. Do not start one.
- **Never run a foreground command that does not terminate.** No `npm run dev`, no `--watch`. Use
  `npm test -- --run`.
- **If a tool call fails 3 times, stop** and write up what you have.
- **Do not commit. Never `git checkout` / `restore` / `stash`.** The PM commits.
- **Work in priority order and report partial work honestly.** A verified item 1 beats three
  unverified ones.

## Files you own

**All of `src/ui/styles/`:** `tokens.css`, `base.css`, `career.css`, `summary.css`, `creation.css`,
`log.css`, `app.css`.

**Out of bounds — and this one is unusual, so read it carefully: every `.tsx` file in the repo.**
Another agent is editing `CareerScreen.tsx` and `view-model.ts` right now. Work in CSS against the
class names that already exist. If a rule you need has no class to hang on, **do not add one** —
list it in your report and the PM will place it. `src/engine/**` and `src/content/**` are frozen.

## Read first

- `docs/superpowers/polish/DECISIONS.md` — **008** is the spec for this task. Also **003** (why the
  OVR integer is on screen at all — it is a numeral and this scale decides how it is set) and
  **012** (weight and scale may track magnitude; hue may never track valence — the delta treatment
  shipped in wave 3 depends on sizes you are about to change).
- `docs/superpowers/polish/reports/002-reference-teardown.md` — the measured pixel values and the
  live `:root` tokens, not just bundle greps.
- `docs/superpowers/polish/reports/004-current-ui-audit.md` — **gap G4** (type scale) and **gap G3**
  (clamps), and **Bug 3**, which is item 3 below.

## The work, in priority order

### 1. The scale

Six steps, defined as tokens in `tokens.css`, consumed everywhere else. No raw `font-size` outside
the token block when you are done, and say so in the report with the grep that proves it.

DECISION 008's adopted terms, which are not yours to renegotiate:
- Adopt the reference's **ratio, weight and leading**, not its absolute values.
- **Raise the floor.** No 8px or 9px body text. Their 4/6/7px tier is rejected outright as a
  rendering artefact, not a design decision.
- **Prose stays at 500 weight. 900 is reserved for numerals.** The Archivo axis reaches a real 900
  master since wave 2, so this is loadable now.
- `leading-none` on numbers; tabular figures (`font-variant-numeric: tabular-nums`) everywhere a
  number can change in place — the OVR, the deltas, the stat line, the ledger, the season records.
  A digit that shifts width as it counts is the thing tabular-nums exists to stop.

### 2. Clamps

Zero clamps exist; the audit found 9 overflow-capable nodes. Longest real strings, measured off the
loaded `CONTENT` bundle: **outcome 241 chars**, description 194, engine-built option label **76
today, 107** if the `factory`/`developmental` traits are ever assigned. Clamp against those, not
against what happens to be on screen when you look.

This is a hard prerequisite for any height-locked shell later: by CSS arithmetic a `90svh` lock
fails below a ~720px viewport today.

### 3. Decide audit Bug 3 rather than inherit it

`base.css:11` sets `body { font-size: 17px }` while `html` sets no `font-size`, so **rem-based
declarations do not scale from it** — they scale from the browser's 16px root. Every `rem` in the
codebase is therefore off by a factor the author probably did not intend. Decide it deliberately:
set the root, or drop the body declaration, or keep both and document why. Say which you chose and
what moved. Do not leave it as an accident.

## Hard constraints (design intent, not preferences)

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. Write a proposal in your report; do not edit.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **Hue may never track valence** (DECISIONS 006, 012, 021). There is deliberately no `--good`/
  `--bad` pair in `tokens.css` and you must not add one. You are changing *weight and scale*, which
  is the axis that is allowed to carry magnitude.
- 488 tests stay green; both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

- `npm test -- --run` — **488 green** is the baseline.
- `npm run typecheck` — **two passes, both must exit 0.** `npm run build` — clean.
- **Screens before and after, at 1456px and at 360px:** creation, Signing Day, a decision card, a
  resolved card with a visible OVR delta, a one-option beat card, and a summary. A type pass is
  exactly the kind of change that looks right on the screen you are testing and breaks the other
  five.
- **Check a long string, not a typical one.** Reach or inject a 241-char outcome and confirm the
  clamp holds at 360px.
- The grep proving no raw `font-size` survives outside the token block.

Use the `frontend-design` skill. This is the most visual task in the phase.

**REPORT:** write findings to `docs/superpowers/polish/reports/012-type-scale-and-clamps.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. Never the full findings.
