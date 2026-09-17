# 049 — B62 / route R2: the Season Opener stops being a tax and becomes a decision

**Type:** content authoring + measurement · **Wave:** 26 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**The content freeze is lifted for this task, narrowly.** You may add a second option to each of the
**five `milestone-opener-*` events in `src/content/events/milestones.ts` and nothing else.** The user
authorised route R2 specifically, on a measurement. Every other event, and every existing option on
these five, stays exactly as it is. `src/engine/**` remains frozen with no exceptions.

## The problem, measured

Every career, every season, draws a guaranteed one-button Season Opener card. All five can **cost**
the player standing (`+0/−2` at `p=0.75`) and **none can earn it**. Of 18 single-option cards in the
game, 7 move character and all 7 move it only down.

A playtester ran a maximum-virtue career and finished one standing rung **below** where they started,
with zero *"Earned you credit in the locker room"* and five *"Cost you."* Their words:

> *"Being punished for something you were not asked about is the only thing in this game that felt
> unfair rather than hard."*

The virtue economy itself is **fine** — 42 virtuous options pay +2.35 expected at p=0.81, and a
genuinely virtuous career already nets +0.58 Earned-minus-Cost. **Do not widen any existing payout.**
The defect is that the guaranteed traffic is a one-way tax with no choice attached.

## What to build

**One new option on each of the five `milestone-opener-*` cards**, so the standing hit becomes
something the player was asked about. Read `reports/047-does-virtue-actually-pay.md` — the whole
report, but especially the **Recommendation**, the **Acceptance criterion**, and **Appendix A**. A
working R2 prototype is described there; you are re-authoring it properly, not copying it blind.

Scope, from the measurement:

- **Five cards, one new option each, ~15 prose strings, ~180 words total.** The existing option is
  **untouched**, so no existing prose is rewritten and no existing test assertion about it changes.
- The new option is a real fork, not a dodge. These cards are about season-opener nerves; the existing
  branch is the one that can cost you. The second branch should be a genuinely different approach with
  its own risk, not a strictly-better "do it right" button.
- **Write it as college football, in the register the rest of the bundle already uses.** Read the
  neighbouring events in `milestones.ts` first and match them. Five near-identical options across five
  cards would be a regression — B11 established that near-literal season-to-season repetition is this
  game's strongest measured weakness, and these five cards are the exact spine that fires every season.

## The acceptance criterion — pre-stated, failable, and not to be loosened

`reports/047-*.md` §"Acceptance criterion" states it in full, as numbers, in advance. **Reproduce it
exactly.** Measure at **10,000 careers per cell** (047 used 3,000; the extra sample is specifically
required, see below), positions **QB + OL + DL**, seed prefix `b62p2`, homeState TX, against the
`virtue` event strategy in 047 Appendix A.

**You may add that `virtue` strategy to `src/sim/policies.ts` permanently** — 047 recommends it and it
is measurement infrastructure, not game content. `src/sim/**` is not frozen.

**A miss is reported as a miss. The route is not re-tuned until it passes.** That rule is the whole
point of a pre-stated criterion and this project has enforced it before.

**One cell is already known to be at risk.** 047's own prototype lands `baselineRandom/QB` bustedRate
at **4.83%** against a **≥5.00%** floor — a 0.17pp miss, inside two standard errors at 3,000 careers
but a miss on the stated number. That is why you run 10,000. **Report the result either way.** If it
still misses, 047 names the correct repair: the new option's *failure* branch needs a character cost
of its own, which it currently lacks. **Do not repair it by loosening the floor** — the game staying
losable is DECISION 062's economy and it is not reopened.

Criterion **B4** deserves saying twice: **no virtuous payout is widened.** The 39 options with
E[character] > 0 must have byte-identical `effects` before and after. R2 adds options; it edits none.

## Verify before reporting — all of it, no exceptions

- `npm test` — **708 tests green**, plus any you add. `src/content/events/milestones.test.ts` is the
  matching test file and new options need assertions.
- `npm run typecheck` — **both passes** exit 0. `npm run build` — clean.
- The full acceptance table, at 10,000 careers, every cell, **reported as measured**.
- `git status --short` shows **no change under `src/engine/**`**, and under `src/content/**` shows
  `milestones.ts` and `milestones.test.ts` only.
- **Click through it at `localhost:5173`.** The dev server is **already running** — do NOT run
  `npm run dev`, it never exits and it is the most likely thing to hang you. Play to at least two
  Season Openers and confirm the new option reads as a real choice on the card, not as an obvious
  right answer.
- **This change is supposed to move the numbers, so `npm run play` byte-identity would be the vacuous
  kind of pass.** Report which seeds moved and confirm the movement is the intended one. A change that
  is supposed to move output and does not is a change that is not doing what it says — that exact
  check reverted an approved engine fix on this board yesterday (DECISION 073).
- **Never run a foreground command that does not terminate on its own.**
- **If a single tool call fails 3 times**, stop that line of attack, write up what you have, report
  `blocked`. **Write your authored prose and every measured table to the report as you go**, not at the
  end — two agents on this board have been killed mid-task and the one that wrote as it went lost
  nothing.
- **Do not commit, and never run `git checkout` / `restore` / `stash`.** The PM commits.

## Hard constraints — design intent, not preferences

- `overall` **is** shown to the player as a number. `character` is **never** shown as a number, only as
  a band phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it
  tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/engine/**` is frozen. `src/content/**` is frozen **except** the five `milestone-opener-*` events.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- Aesthetic direction is fixed and not in scope: **do not touch CSS, type, colour or layout.** Seven
  playtests have found zero visual defects.

**REPORT:** write to
`docs/superpowers/polish/reports/049-the-season-opener-becomes-a-decision.md`. Return to the PM
**only**: status (done / blocked / needs-decision), at most five bullets, and that path. **Never the
full findings.** Lead your bullets with **pass/fail on each acceptance criterion cell**, and the new
test count.
