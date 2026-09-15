# 037 — Does the game count what you do? Measure the human bad player

**Type:** research / measurement · **Wave:** 18 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Measure what a **human** playing badly actually experiences, as opposed to what the simulated
`lazy` policy experiences — and measure whether honours and overall separate a good career from a
bad one at all.

## Why — read this, it is the whole brief

A playtester just played a career in which they *"ducked, cheated and quit for five straight
seasons"* and finished **drafted in Round 4 with an All-American**, five overall points behind a
career played straight. They wrote: *"I stopped believing the game is counting what I do."*

The PM found a probable mechanical cause, and it needs measuring rather than assuming:

- `src/content/events/offfield.ts` contains **14 effect blocks that pair a character LOSS with an
  overall GAIN** — e.g. `offfield-group-chat` / `let-it-fly` awards `character -6` **and**
  `overall +1` on its *negative* outcome. The clean option awards nothing at all.
- Draft stock weights overall at **1.4 per point** and character at **0.15 per point**
  (`src/sim/policies.ts`, `STOCK_WEIGHTS`). So `-6 character, +1 overall` is **net positive draft
  stock**. Misbehaving off the field appears to be *strictly profitable*.
- **The existing `lazy` policy cannot see this.** It picks the worst-scoring option by draft stock,
  so it *declines* these cards (0 scores worse than +0.5). Every previous measurement in this phase
  — including DECISION 058's calibration — therefore measured a bad player who **avoids** the very
  cards a human bad player is drawn to. If that is right, the failure rates the last two waves were
  built on do not describe human bad play.

## What to measure

Use the existing sim harness (`src/sim/**`, `npm run play`, and whatever batch runner the previous
measurement reports used — see `reports/034-a-career-can-go-wrong.md` for the established method and
copy it). Thousands of careers, all six positions, per-position breakdowns **always** — DECISION 059
exists because an aggregate hid a per-position failure.

1. **Add a `humanLazy` policy** (in `src/sim/**`, which is NOT frozen — see constraints): a player
   who picks the **self-serving / low-effort option by authored intent**, not by draft-stock score.
   Define it explicitly and state your definition in the report — e.g. prefer the option whose
   effects include a character loss; fall back to the lowest-effort option. **Your definition is a
   finding**; justify it and show it behaves like the playtester's career.
2. For `good`, `lazy` (existing), `humanLazy`, and `random`, per position, report:
   - undrafted %, round-1 %, median round and pick
   - final overall: median and spread
   - **awards and honours: what % earn All-American, All-Conference, a trophy** — this is the
     playtester's sharpest finding and the least understood number on the board
   - final character / locker-room band distribution
3. **The headline comparison:** `good` vs `humanLazy`. How many overall points, draft rounds, and
   honours actually separate them? The playtester measured **5 overall points and one round, with
   the honour going to the bad career.**
4. **Where do awards come from?** Read the mechanism (`src/engine/postseason.ts`, `draft.ts`) and
   state plainly in the report: are All-American / All-Conference driven by sim-rolled stats that a
   player's choices barely touch? Do not change anything — describe the mechanism.
5. **The Kicker question.** DECISION 059's stated falsifier has fired: a playtester played a
   well-played kicker, finished **Round 3 Pick 8**, and called it *"too easy — not a thing for a
   kicker."* Report K's full draft distribution against the field positions, for `good` and
   `humanLazy`. K's round-1 rate measured 26.9% and is pre-existing; we need the whole picture, not
   that one number.

## What NOT to do

- **Do not fix anything. Do not tune anything.** This brief produces numbers and a mechanism
  description. Every change it implies is a user decision that has not been made yet.
- Do not edit `src/engine/**` or `src/content/**` — see constraints. `src/sim/**` you may add to.
- Do not use the browser. A playtester may be running; you have no reason to touch the UI.

## Constraints — HARD, do not violate

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` and `src/content/**` are **frozen**. An agent that believes a change there is
  needed writes a proposal; it does not edit. The PM decides, and brings it to the user if it touches
  game balance. **This brief will almost certainly make you want to edit content. Write the proposal
  instead.**
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- 650 tests stay green. Both typecheck passes exit 0. Verify before reporting.
- Never run a foreground command that does not terminate (`npm run dev` will hang you). If a tool
  call fails 3 times, stop that line of attack and write up what you have.

## Verify before reporting

`npm test` (650 green), `npm run typecheck` (both passes exit 0). If you added a policy, the existing
seed baselines must be unaffected — a new policy is additive and must not change `npm run play`
output for existing seeds. Prove it on two seeds.

**REPORT:** write findings to `docs/superpowers/polish/reports/037-does-the-game-count-what-you-do.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. **Never the full findings.**
Lead your bullets with the `good` vs `humanLazy` headline — undrafted %, round-1 %, overall gap, and
All-American % for each — and your one-line answer to "does the game count what the player does?"
