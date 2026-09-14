# 030 — Undrafted is not a trophy

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** the ending screen tells a bad career from a good one at a glance, in the one case where it
still does not.

**Why.** DECISION 032 already settled this argument once: a congratulatory bad ending is fixed with
**hierarchy, not hue** — the fix may not be "make it red". That call was applied to *drafted* endings,
and it worked. The undrafted case kept the trophy treatment. The 025 playtester:

> **`Undrafted` is set in the same gold display type, size and position as `Round 5, Pick 14`.**

A career that ended with nobody calling gets the same visual ceremony as a career that ended with a
draft pick. That is the single loudest thing on the last screen the player sees, and for a fifth of
careers it is celebrating a loss.

## Read before you start

- `docs/superpowers/polish/DECISIONS.md` **032** (hierarchy, not hue — and *why* hue was refused),
  **021** and **026** (the verdict scale: one hue at five intensities), **033**, and **034**.
- The seasons block on this screen is, per an earlier playtest, **the best screen in the game**. It is
  the model, not the target. **Do not rewrite it.**

## Scope, and its edges

**In scope:** the undrafted ending's treatment on `SummaryScreen.tsx` and `summary.css`. Make the
hierarchy carry the verdict. Consider what the display slot should hold when there is no round and no
pick to print — an absence set in the same 48px gold as a triumph is the defect, and "make the word
smaller" is not automatically the answer either. The ending should read as an ending, honestly, without
being punitive: the writing elsewhere in this game is never cruel to the player and this should not be
either.

**Explicitly NOT in scope, and both are somebody else's wave:**
- **B32, the declare card reading as a trap.** It touches the declare hub and the view model, which
  another agent holds this wave.
- **B34, the Moments reel printing the same milestone four times.** The cause is content — the event
  fires every season — and an agent holds an approved content lift right now. If you can see it while
  you work, note it in your report; do not fix it.

If you find the undrafted fix is one line and you have time left, **stop and say so**. A small,
correct change reported as small is worth more than a padded one.

## Files

You own `src/ui/screens/SummaryScreen.tsx` and `src/ui/styles/summary.css`.

**Out of bounds:** `src/engine/**` and `src/content/**` (frozen), `src/ui/session/**` (read freely; a
needed view-model change is an exact diff in your report, not an edit), and
`src/ui/screens/CareerScreen.tsx` / `src/ui/styles/career.css`, which another agent owns.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number (spec §15). `character` is **never** shown as a number, only as a
  band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not read
  `GameState` from a component.
- Tests stay green (**baseline is 636**). Both typecheck passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome.
- **Hierarchy, not hue** — DECISION 032. Do not solve this with a red.

## Shell rules — three agents have died on these

- **The dev server is already running on `localhost:5173`. Do not start one.**
- **Never run a foreground command that does not terminate.**
- **Do not commit.** Do not `git checkout` / `restore` / `stash` / `reset`. Two other agents have
  uncommitted work in this tree. The PM commits.
- If a tool call fails three times, stop and write up what you have.

## Verify before reporting

- `npm test` (636+), `npm run typecheck` (two passes), `npm run build` — all clean.
- **Do not use `npm run play` byte-identity as your check this wave** — another agent holds an
  approved content change that moves it deliberately. Your check is `git status`: nothing modified
  under `src/engine/`, `src/content/`, or the out-of-bounds list.
- **See both endings on screen, side by side.** `npm run play -- <seed> random` prints a full career as
  JSON and will help you find a seed that goes undrafted and one that gets drafted; then play those
  seeds in the browser and compare the two screens. Put both in your report.

Use the `frontend-design` skill.

## REPORT

Write findings to `docs/superpowers/polish/reports/030-undrafted-is-not-a-trophy.md`.

Cover: what the undrafted slot holds now and why; how hierarchy carries the verdict without hue; the
two endings compared; and — if it turned out to be small — say plainly that it was small.

**Return to the PM only:** status (done / blocked / needs-decision), at most five bullets, and that
path. Never the full findings.
