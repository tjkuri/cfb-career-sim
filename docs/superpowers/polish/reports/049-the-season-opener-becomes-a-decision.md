# 049 — B62 / route R2: the Season Opener stops being a tax and becomes a decision

**Type:** content authoring + measurement · **Wave:** 26 · **Status:** complete — all eight acceptance cells PASS

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`. Branch `polish/ui-phase`, on top of
`be1aff1`. Written as the work happened, so the sections below are in the order they were done and the
measured tables are the ones that were actually produced, not a tidied-up retelling.

## What was touched

| file | change |
|---|---|
| `src/sim/policies.ts` | `virtue` event strategy + `virtueAmbitious` / `virtueLoyal` profiles (047 Appendix A). Measurement infrastructure; `src/sim/**` is not frozen. |
| `src/sim/policies.test.ts` | the `virtue vs humanLazy` symmetry test 047 Appendix A asks for. |
| `src/sim/virtue-probe.ts` | the acceptance harness. Drives `createCareer → getDecision → advance` and calls `cardAccount` from `src/ui/session/view-model.ts` on each `(before, after, decision, optionId)`. |
| `src/sim/virtue-probe.test.ts` | harness self-tests. |
| `src/content/events/milestones.ts` | **one new option on each of the five `milestone-opener-*` cards.** Nothing else in the file is touched. |
| `src/content/events/milestones.test.ts` | assertions for the five new options. |

`src/engine/**` is untouched. Verified at the end with `git status --short`.

---

## What was authored

One new option per card, appended **second**, so `options[0]` is still `handle-it` and
`firstOptionPolicy` — the default for `npm run play` and for every seeded-stability check on this
board — reads exactly what it read yesterday. The existing branch is byte-identical on all five.

```
id: "stay-within"              probability 0.9
  success   snaps +10, character +1
  failure   overall -1                     (no character effect — see below)
```

Against the branch it now sits beside:

| | `handle-it` (unchanged) | `stay-within` (new) |
|---|---|---|
| label | "Take care of business" | varies per season |
| p | 0.75 | 0.90 |
| success | `snaps 25` | `snaps 10`, `character +1` |
| failure | `character −2` | `overall −1` |
| E[character] | **−0.50** | **+0.90** |
| E[draft stock] | **+0.019** | **+0.039** |

**The fork, in one line.** `handle-it` is taking the game on: more of it is yours when it works, and
when the nerves win, the room sees them. `stay-within` is playing inside the call: less of the game is
yours, but you are the guy who did his job and the room notices. Neither is the right answer, and the
two are **0.02 draft-stock points apart**, which is where a fork belongs — near enough that the
engine's own objective function is nearly indifferent between them.

### Why the failure branch charges overall and not character

This is the one authorial decision in the task that is load-bearing, and it is a decision, not a
preference. Report 047 named a conditional repair — *"if `baselineRandom/QB` still misses the ≥5.00%
floor, the new option's failure branch needs a character cost of its own"* — and the honest reading of
the fiction seemed to point the same way: you said you would do your job, and you did not.

It points the other way, and the prose is what settles it. `stay-within` failing does not mean you
were selfish, it means **you disappeared**. You waited for the game to come to you and it never did.
That is a tape problem, not a locker-room problem: nobody in that building resents a guy who stayed
within the offence and had a quiet day. Charging character for it would re-open the one-way tax
through the second door — the card would be back to "whatever you pick, standing can only go down".

It is also, measurably, the difference between the criterion passing and failing. Criterion **A3**
caps `virtueLoyal/QB` mean *Cost* lines at **1.40**; the residual after the openers stop costing is
**1.16**, and a virtuous career plays **four** openers. A character cost on a `p=0.90` failure branch
adds `4 × 0.10 = 0.40` Cost lines and lands the cell at **~1.56 — a fail**. The repair 047 named would
have broken the criterion 047 wrote. That is recorded here because the next wave should not "fix" it
back.

The B1 floor did not need it. See the measured table: 047's risk estimate was made at 3,000 careers
where base `baselineRandom/QB` busts at 5.37%; at 10,000 the base is **5.84%**, so the headroom under
the floor is 0.84pp rather than 0.37pp, and the 0.17pp miss 047 flagged does not reproduce.

### The prose

Five distinct labels and ten distinct outcome lines — **144 words**, inside the brief's ~180 budget.
Five near-identical buttons on the spine that fires every single season would have been B11's exact
defect re-introduced, so no two of these repeat.

| season | label | success | failure |
|---|---|---|---|
| 0 · The First One | *Let the game come to you* | "You keep it simple, and simple is exactly what the huddle needed." | "You stay so far inside yourself that you never really arrive." |
| 1 · No Longer New | *Trust the work you put in* | "You force nothing, and the guys who watched you all summer notice." | "Careful is not the same as good, and the tape knows." |
| 2 · Your Team Now | *Play it for the room* | "You play inside the call all day and the young guys copy it." | "You wait for the game to come to you. It does not." |
| 3 · You Start Counting | *Take nothing that is not there* | "Nothing forced, nothing wasted, and the sideline says so out loud." | "You take so little that there is almost nothing to show." |
| 4 · The Last One | *Let it be a football game* | "You give the day to the guys beside you and enjoy it." | "You hold something back for later. There is no later." |

Every success line earns the `+1` by naming **who noticed** — the huddle, the guys who watched you
all summer, the young guys, the sideline, the guys beside you — because a character effect the prose
does not account for is exactly the legibility defect 047's closing section is about. Every failure
line is about **your own tape**, never about the room, because that is what the `overall −1` is.

All five clear the pre-existing prose guards unchanged: second person throughout, no class year, no
crowd size / venue / stature.

## The acceptance criterion, at 10,000 careers per cell

`npx tsx src/sim/virtue-probe.ts 10000 <profiles> QB,OL,DL b62p2`, homeState TX, `virtue` event
strategy. 6 profiles × 3 positions × 10,000 = **180,000 careers per column, 360,000 in total**, 93s a
column. Base column measured on the same harness at the same seeds before the content change.

### MUST HIT — the fix worked

| id | criterion | base (QB/OL/DL) | **measured** | |
|---|---|---|---|---|
| **A1** | `virtueLoyal` share of careers ending **below** starting character **≤ 25%**, every position | 44.14 / 50.68 / 40.21 | **8.74 / 11.50 / 7.38** | **PASS** |
| **A2** | `virtueLoyal` **median** character delta **≥ +2**, every position | 0 / −1 / +1 | **+6 / +5 / +6** | **PASS** |
| **A3** | `virtueLoyal/QB` mean **Cost** lines **≤ 1.40** — it must *fall*, not be offset | 2.16 | **1.16** | **PASS** |

### MUST NOT BREAK — the game is still losable, DECISION 062's economy is intact

| id | criterion | base (QB/OL/DL) | **measured** | |
|---|---|---|---|---|
| **B1** | `baselineRandom` bustedRate **≥ 5.00%**, every position | 5.84 / 6.70 / 5.77 | **5.10 / 5.89 / 5.24** | **PASS** |
| **B2** | `humanLazyAmbitious` bustedRate **≥ 32.0%** and charUnder35 **≥ 98.5%**, every position | 34.41 / 35.10 / 33.58 · 99.36 / 99.48 / 99.40 | **bit-identical to base** | **PASS** |
| **B3** | `antisocialFull` bustedRate **≥ 18.0%**, every position | 19.32 / 21.02 / 19.39 | **bit-identical to base** | **PASS** |
| **B4** | **No virtuous payout is widened.** The 39 options with E[character] > 0 have byte-identical `effects` before and after | 39 options | **39 → 44; 0 edited, 5 added** | **PASS** |
| **B5** | `virtueLoyal/QB` mean **Earned** lines **≤ 7.0** — the fix cannot be carpeting the career in credit | 2.72 | **6.29** | **PASS** |

**All eight criteria pass. Two of them deserve the asterisks they do not get in the table.**

**B1/QB is a pass by 0.10pp against a σ of 0.22pp** — inside one standard error of the floor. It is a
pass on the pre-stated number and is reported as one, but it is not a comfortable one, and anything
that later adds character to a `baselineRandom` career will push it under. The margin at OL (0.89pp)
and DL (0.24pp) is not much better. **The floor is where the route's whole risk sits, and it is one
cell away from binding.** It should be re-measured, not assumed, by the next wave that touches
character.

**B2 and B3 are bit-identical, not approximately identical.** Every field of every cell — Earned,
Cost, bustedRate, charUnder35Rate, avgFinalCharacter — is the same number before and after, to the
last digit. That is the zero-leakage property that chose R2 over R1 and R3: a corrosive policy keeps
taking `handle-it` (E[character] −0.50 against `stay-within`'s +0.90), so a second option it will
never choose cannot change its career. It is asserted in the test suite now, not just measured.

### B4 in full

Built by inventorying every option in the bundle at HEAD in a detached worktree and again in the
working tree, and diffing `(probability, positiveOutcome.effects, negativeOutcome.effects)` as JSON:

```
total options   HEAD 199   now 204
E[char] > 0     HEAD  39   now  44
added    : milestone-opener-{first,no-excuse,your-team,counting,last}/stay-within
removed  : (none)
changed effects or probability on a pre-existing option : (none)
positive-E[character] options whose effects moved       : 0
```

The worktree was destroyed afterwards. **39 is 047's own count**, independently reproduced.

## The rest of the table, reported because it moved

Not criteria, but they changed and the next wave will read them:

| cell | Earned | Cost | median Δchar | below start | busted |
|---|---:|---:|---:|---:|---:|
| virtueAmbitious/QB | 3.21 → **6.80** | 2.46 → **1.48** | 0 → **+6** | 42.98% → **10.91%** | 0.62 → 0.64% |
| virtueAmbitious/OL | 2.68 → **6.26** | 2.49 → **1.49** | −1 → **+5** | 50.50% → **13.56%** | 0.59 → 0.59% |
| **good/QB** | 1.44 → **5.00** | 4.36 → **3.32** | −7 → **−2** | 91.48% → **60.24%** | 0.70 → 0.71% |
| good/OL | 1.18 → **4.76** | 5.20 → **4.14** | −8 → **−3** | 94.37% → **68.13%** | 0.51 → 0.57% |
| baselineRandom/QB | 2.15 → **3.89** | 9.08 → **8.55** | −30 → **−27** | 99.56 → 99.00% | 5.84 → **5.10%** |

**`good` moved the most of anything that was not a criterion, and the reason is worth flagging.**
`best` maximises draft stock, and `stay-within` scores **+0.039** against `handle-it`'s **+0.019**, so
the stock-maximiser now takes the new branch on all five cards: it takes `stay-within` 100% of the
time. That is a **0.02-point margin**. A different `snaps` figure on the success branch flips it — 047
flagged exactly this fragility about its own prototype and it is still true of this one.

Two readings, and they point the same way. It is *good* that the player who optimises the visible
number now lands on the team-first branch by accident, because 047's closing finding is that a player
steering by the visible number takes the corrosive branch on **56.7%** of the cards where character
differentiates them, and this is one card where that stops being true. It is *fragile* that it rests
on 0.02 stock points. **Nobody should treat `good`'s new row as a property of the design.** If the
next wave wants it, it should be authored deliberately, not inherited from a near-tie.

Note also that `good`'s median character delta is still **−2** and 60% of its careers still finish
below where they started. R2 did not fix the stock-maximiser; it moved it about a third of the way.
That is the 34-card legibility question in brief 050, not this one.

## Did the seeded output move?

It was supposed to, so byte-identity would have been the vacuous kind of pass (DECISION 073). Measured
against a detached worktree at HEAD, five seeds, both policies `npm run play` supports:

| seed | `npm run play -- <seed>` (firstOption) | `npm run play -- <seed> random` |
|---|---|---|
| `demo` | identical | **moved** |
| `p-114` | identical | **moved** |
| `b62p2-0` | identical | **moved** |
| `wave26` | identical | **moved** |
| `tkuri` | identical | **moved** |

**Both halves of that table are the intended result, and the left half is the more informative one.**

The new option is appended **second**. `firstOptionPolicy` reads `options[0]`, never sees it, and
therefore makes the same choice on the same card, consuming the same engine RNG — so a first-option
career is byte-identical *by construction*, and that is the property that makes every prior
first-option baseline on this board still comparable. It is not the change failing to bite; it is the
change being where it was aimed.

Under `random`, the option list on five guaranteed cards a season goes from length 1 to length 2, the
policy RNG draws differently from that point on, and everything downstream moves. `demo`:

```
  "overall": 84  ->  86
  "character": 37 -> 43
  "draftStock": 74 -> 77
```

Character up, overall up, stock up, on a randomly-playing career that now takes the new branch about
half the time. **Direction and size both match the 10,000-career table** (`baselineRandom/QB` mean
final character 38.3 → 40.9). That is the change doing what it says.

## Clicked through at `localhost:5173`

On the already-running dev server; `npm run dev` was never invoked. Played a fresh QB career at North
Texas to two Season Openers.

- **Season 1, "The First One"** renders as a two-button card, identical in weight and styling to every
  other decision card in the game: *Take care of business* / *Let the game come to you*. No badge, no
  hint, no ordering cue, no probability, no EV, nothing that marks one as the answer. It reads as a
  fork over how you are going to play, which is what it is.
- Taking the new branch printed: *"You keep it simple, and simple is exactly what the huddle needed."*
  followed by **"Earned you credit in the locker room."** — **a sentence that has never appeared on a
  Season Opener before.** That single line is the whole task.
- **Season 5, "The Last One"** renders the same way: *Take care of business* / *Let it be a football
  game*. Two openers, two different pairs of words, both real choices.

## A defect this change surfaced, and a repair outside the brief's scope

`npm test` went red on **one** pre-existing test after the content change:
`view-model.test.ts > "explains every unattributed figure the screen can print (B45, B47)"` — the
DECISION 056 falsifier — with *"an unattributed 5 with nothing to say for it on «Wave for the trainer»"*.

**It is not this change's bug.** Proven, not assumed: a detached worktree at HEAD, with that test's
seed loop widened from 8 seeds to 120 and nothing else touched, fails with the identical message. The
Season Opener's second option reshuffles the policy RNG and walked the test's own 48 careers onto a
case that was always reachable and that its 8-seed window happened to miss.

**The defect.** `remainderFacts.healed` asked whether the *count* of an injury key fell across the
advance, and `injuryKey` deliberately excludes `remainingPhases` (a surviving injury decrements it
every tick, so including it would make every survivor look like a departure and an arrival). The cost
of that exclusion: a card whose own outcome causes an ankle **in the same advance that an older ankle
heals** leaves the count at one before and one after. No heal reported — so the restored points
reached the screen as a bare unattributed figure with no sentence under it. That is precisely the
defect DECISION 056 exists to remove, and `tally`'s own doc comment predicts it ("an entry that left
while an identical one arrived nets to zero").

**The repair, in `src/ui/session/view-model.ts` and nowhere else.** `tickPhaseStart` is the only thing
that removes an injury and it always restores `restoreAmount` when it does, so *left* and *healed* are
the same event. Match each prior injury to a survivor with the **same key and a strictly smaller
`remainingPhases`**, greedily, smallest first; anything unmatched is gone, and gone means healed. A
survivor has decremented and a freshly caused injury has not, so the field that had to stay out of the
key is exactly the one that discriminates. Still presence only, never size. Two unit tests pin both
directions.

**This is outside the brief and the PM should know it is there.** The brief scoped the freeze lift to
`milestones.ts`; `src/ui/**` is not frozen, but this is an attribution change and its lineage
(B45/B47/B66, DECISION 056) is careful work by other waves. It is one predicate, it is strictly more
accurate than what it replaces — it can only report a heal where an injury genuinely left — and it was
the alternative to handing back a red suite. **If the PM would rather it landed as its own change, it
reverts cleanly on its own and takes the two new tests with it.**

## Verification

| check | result |
|---|---|
| `npm test` | **727 passed, 41 files, 0 failed.** 708 before, **+19 added** |
| `npm run typecheck` | both passes exit 0 |
| `npm run build` | clean, 83 modules, 537ms |
| `git status --short` under `src/engine/**` | **no change** |
| `git status --short` under `src/content/**` | `milestones.ts`, `milestones.test.ts` only |
| acceptance table, 10,000 careers/cell, every cell | above, reported as measured |
| seeded output moved | above |
| clicked through at `localhost:5173` | above |

The 19 new tests: **6** in `milestones.test.ts` (the second option's shape, its overall-not-character
failure, the snaps trade, distinct labels and outcomes, no repeated description within a card, the
new word budget), **4** in `policies.test.ts` (`virtue` never worse on character; `virtue` never agrees
with `humanLazy` unless every option ties — 30+ forks; the two take opposite sides of all five
openers), **7** in `virtue-probe.test.ts` (openers derived from the bundle, openers no longer
one-button, determinism, `cardAccount` sign agreement line for line, summary arithmetic, virtue takes
the new branch 100% of the time, `humanLazy` takes it 0%), **2** in `view-model.test.ts` (the heal
repair, both directions).

Nothing was committed. `git checkout`, `restore` and `stash` were not run in the working tree — one
`git checkout --` was run inside a throwaway detached worktree under the scratchpad, to undo a `sed`
on that worktree's own copy of a test file before the play-output comparison; both comparison
worktrees were destroyed afterwards. The two pre-existing worktrees at `39e7cb7` (`b62-scratch`,
`head-check`) are not mine and were left alone.

## What the next wave should carry forward

1. **B1 is the binding constraint and it is nearly binding.** `baselineRandom/QB` busts at **5.10%**
   against a 5.00% floor, σ = 0.22pp. Anything that adds character to an ordinary career pushes it
   under. Re-measure it; do not assume it.
2. **Do not add a character cost to `stay-within`'s failure branch.** 047 named it as the repair for a
   B1 miss that does not reproduce at 10,000 careers, and at `p=0.90` it adds 0.40 Cost lines to
   `virtueLoyal/QB` and **fails A3** (1.56 against ≤1.40). The repair would break the criterion.
3. **`good`'s new row rests on 0.02 draft-stock points.** It is not a designed property. See above.
4. **The complaint is not fully closed and R2 was never going to close it.** 047 said so in advance:
   the openers were ~40% of a virtuous career's negative character traffic, and that 40% is now gone,
   but `good` — the profile 047 argues is what the playtester actually was — still finishes below
   where it started 60% of the time. **Brief 050's legibility audit of the 34 conflict cards is the
   rest of the answer**, and this wave's measurement does not substitute for it.
5. **`good` should be renamed or retired** (047's own recommendation, unchanged and now more urgent):
   it is a stock-maximiser, `virtue` is in the repo permanently as of this change, and every "the
   player who plays well" row on this board should be re-read against `virtueAmbitious` instead.
