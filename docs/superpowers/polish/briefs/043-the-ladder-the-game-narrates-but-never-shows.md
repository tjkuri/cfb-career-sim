# 043 — The ladder the game narrates six times and shows once

**Type:** developer (UI) · **Wave:** 22 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** make the locker-room standing visible where it already exists in the data — on the ending
screen, where it is currently absent entirely, and at the moment it actually changes.

**Why.** The locker-room ladder is the one mechanism in this game that has ever made a playtester
want to change how they were playing. Two playtests in a row have now named it as the only thing that
worked. And it is the least visible thing on the screen:

- A playtester who played four seasons putting themselves first off the field was told **"Cost you in
  the locker room."** six times. The standing phrase moved **once** — on the final click of the
  career, with no highlight and nothing marking it. Their verdict: *"Yes in sentences, no in state."*
- **It is completely absent from every ending screen.** The PM verified this in the code: the view
  model computes `trust` for the live career view and `SummaryScreen.tsx` never renders it. A player
  finishes a career and the one track the game narrated most is not on the final page at all.
- Asked what would make them start a fourth career — the thing this entire phase is trying to earn —
  the same playtester said: *"If the ending screen had a locker-room line on it I would start a
  fourth right now to try to move it."*

**This is a display problem, not a balance problem, and that is measured, not assumed.** The PM ran
400 careers per policy: a selfishly-played career (`humanLazyAmbitious`) ends at average character
**6.8**, p25 **0**, with **99.3%** finishing below 55 — it crosses every band in the table. A
well-played one ends at **62.3**. The mechanism has the full range; the player just cannot see it
moving. Do not change any number to fix this.

## What to build

### 1. The ending screen carries the locker-room standing — this is the important one

`SummaryScreen.tsx` renders the end of a career and has no locker-room line. Give it one, using the
same band phrase vocabulary the career header uses (`trustPhrase` in `src/ui/session/bands.ts`), so
the last thing a player reads about their career includes how the building saw them.

It has to earn its place on that screen rather than be appended to it. The summary's seasons block is
**the best screen in the game** and prior waves are on record that it must not be rewritten — study
how it presents things and match that register. Read `SummaryScreen.tsx` before you design anything.

### 2. Mark the moment the band changes

Today the phrase can change under the player with nothing marking it — one playtester only noticed
because it happened on the very last click of a career. When the standing moves from one rung to
another, that is a moment in the career and should read as one.

The previous band is derivable from data the UI already has: a resolved card carries its character
delta, so the band before the card is the band for `character − delta`. You are not adding engine
state to do this.

**Both directions matter.** A playtester watched theirs *"go down three and back up one"* — climbing
back is as much of a beat as falling, and arguably the better one.

### 3. Deliberately out of scope — a per-season trajectory

Do not attempt a per-season standing column in the summary. The PM checked: `SeasonLine` in
`src/engine/types.ts` records `overall` and **not** `character`, so the history does not exist in the
data. Adding it is an engine change and the engine is frozen. If, while working, you conclude it would
be worth it, **write that as a proposal in your report** — do not build it.

## The constraint that governs this whole task — read twice

**`character` is NEVER shown as a number, and this task must not smuggle one in.** No integer, no bar,
no meter, no percentage, no dot-out-of-five, no gradation of size or weight that encodes magnitude.
Character swings draft stock by about **±7.5** against overall's **~82**; any resolution finer than
the band phrase misrepresents its influence by roughly an order of magnitude. DECISION 002 established
this and DECISION 046 already rejected magnitude-as-typography on the per-card line by name — *"a size
would be the resolution DECISION 002 says character does not have, dressed as typography."*

What you may use: the **band phrase itself**, its **position in the ladder**, the **fact and direction
of a change**, and ordinary visual emphasis that says *this changed* without saying *by how much*.

The five rungs are in `TRUST_BANDS` in `src/ui/session/bands.ts`. Read them before you start — the
writing in them is the asset you are making visible.

## Files you will likely touch

`src/ui/screens/SummaryScreen.tsx`, `src/ui/screens/CareerScreen.tsx`, `src/ui/session/view-model.ts`,
`src/ui/session/bands.ts`, `src/ui/styles/**`, and their tests.

## Out of bounds

- `src/engine/**` and `src/content/**` — **frozen.** Propose, never edit.
- `src/sim/**` — another agent owns it this wave.
- Do not commit. Do not `git checkout`, `git restore`, or `git stash` — the tree holds another
  agent's uncommitted work. **The PM commits.**

## Constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. If you believe a change there is needed, you
  write a proposal; you do not edit. The PM decides, and brings it to the user if it touches balance.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. That boundary is what
  makes the hidden-mechanics rule testable. Do not bypass it.
- 684 tests stay green. Both `npm run typecheck` passes exit 0.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace, minimal
  chrome, the decision and its options are the clear focal point.
- **Do not reopen type, colour or contrast.** Six playtests, zero visual defects. This is not a
  restyling task.

## Operating rules — agents have died here

- **The dev server is ALREADY RUNNING at `http://localhost:5173`. Do NOT run `npm run dev`.** It never
  exits and is the single most likely thing to hang you.
- Never run a foreground command that does not terminate on its own.
- If any single tool call fails 3 times, stop that line of attack, write up what you have, and report
  `blocked`.
- Write your report incrementally. Three agents on this project have been killed mid-flight, two
  holding unwritten work.

## Verify before reporting

`npm test` (684 green), `npm run typecheck` (**both** passes exit 0), and **click through the change
at `localhost:5173` yourself** — including playing a career far enough to finish it and see the ending
screen. A change to the ending screen that nobody has looked at is not done.

Use the `frontend-design` skill for the visual work.

**REPORT:** write to `docs/superpowers/polish/reports/043-the-ladder-the-game-narrates-but-never-shows.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. **Never the full findings.**
