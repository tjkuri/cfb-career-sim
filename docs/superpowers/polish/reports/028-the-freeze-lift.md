# 028 — The freeze lift: a player who sits does not make plays

**Brief:** `briefs/028-the-freeze-lift.md` · **Wave 13** · **Status:** done. All four approved changes
are in. **The DECISION 048 stop condition was evaluated and did not fire** — the redshirt cohort's
draft rate moved **0.9567 → 0.9592**, i.e. it did not move at all, let alone collapse. The cost
landed where 048 predicted it would: in round quality, not in getting drafted.

**Verification:** `npm test` **644 passed, 0 failed** (636 baseline + 8 added). `npm run typecheck`
both passes exit 0. `npm run build` clean. `npm run play` bit-identity **moved, as approved** — new
hashes in §6. **Change 3 alone was verified bit-identical before the other three landed** (§6).
`git status` shows nothing modified under the out-of-bounds list by me (§7).

---

## 1. Change 1 — DECISION 048: `requiresPlaying: true` on all 52

### How the id list was regenerated

Not trusted from a paste. A throwaway script over `CONTENT.events` (scratchpad, not committed)
applying the decision's own definition:

```ts
const ON_FIELD = new Set(["nonconf", "conference", "postseason"]);
const awardsProduction = (ev) =>
  ev.options.some((o) =>
    [o.positiveOutcome, o.negativeOutcome].filter(Boolean)
      .some((oc) => oc.effects.some((e) => e.kind === "stat" || e.kind === "snaps")));

const onField    = CONTENT.events.filter((e) => ON_FIELD.has(e.phase));
const production = onField.filter(awardsProduction);
const missing    = production.filter((e) => !e.conditions?.requiresPlaying);
```

It reproduces 027 §6's census exactly, which is the baseline check the brief asked for:

| | 027 §6 | regenerated |
|---|---|---|
| events in the bundle | — | 106 |
| on-field events | 81 | **81** |
| …already carrying `requiresPlaying` | 17 | **17** |
| on-field events awarding `stat` or `snaps` | 59 | **59** |
| …**without** `requiresPlaying` | **52** | **52** |

After the edit the same script reports `missing: 0` and `onFieldWithRequiresPlaying: 69` (17 + 52).

### The 52, as generated

Ordered as they appear in `CONTENT.events`. Phase in brackets; all 52 are `kind: "random"`.

`offfield-training-table` [nonconf] · `offfield-coordinator-blowup` [nonconf] ·
`offfield-curfew-check` [conference] · `film-study` [nonconf] · `signature-win` [postseason] ·
`audible-authority` [nonconf] · `sideline-camera` [nonconf] · `third-and-long` [conference] ·
`silent-count` [conference] · `two-minute-drill` [conference] · `all-star-invite` [postseason] ·
`return-duty` [nonconf] · `the-drop` [nonconf] · `bubble-screen-diet` [nonconf] ·
`feature-back-workload` [conference] · `the-toe-tap` [conference] · `asked-to-block` [conference] ·
`bowl-opt-out` [postseason] · `the-long-one` [postseason] · `the-blindside` [nonconf] ·
`cadence-trouble` [nonconf] · `pancake-highlight` [nonconf] · `facing-the-freak` [conference] ·
`the-holding-call` [conference] · `playing-through-the-hand` [conference] · `senior-bowl-invite`
[postseason] · `guard-or-tackle` [postseason] · `stat-padding-saturday` [nonconf] · `gap-discipline`
[nonconf] · `the-roughing-call` [nonconf] · `double-teamed-all-day` [conference] · `the-strip-sack`
[conference] · `trash-talk` [conference] · `bowl-practice-reps` [postseason] · `combine-buzz`
[postseason] · `gambling-on-the-jump` [nonconf] · `the-missed-tackle-reel` [nonconf] ·
`special-teams-gunner` [nonconf] · `travel-with-the-no-1` [conference] · `the-pick-six`
[conference] · `targeting-review` [conference] · `the-bowl-interception` [postseason] ·
`all-star-practice-week` [postseason] · `kickoff-duties-too` [nonconf] · `the-chip-shot` [nonconf] ·
`the-fake` [nonconf] · `iced` [conference] · `the-wind-at-home` [conference] · `onside-kick`
[conference] · `bowl-game-winner` [postseason] · `the-long-attempt` [postseason] · `bust-doghouse`
[nonconf]

All ten of K's on-field cards are in it, as 027 §6 said (`kickoff-duties-too`, `the-chip-shot`,
`the-fake`, `iced`, `the-wind-at-home`, `onside-kick`, `bowl-game-winner`, `the-long-attempt` — eight
K-position cards, plus `special-teams-gunner` and `return-duty` which are not K-gated). The four §3
draft-prospect cards are in it too, so change 2's `requiresPlaying` came free with this change.

**Mechanically:** 51 of the 52 already had a `conditions` object and gained one key appended.
**One — `offfield-training-table` ("Cutting the Line") — had no `conditions` at all** and gained the
whole line `conditions: { requiresPlaying: true },`. Worth a glance from the PM: that card is about
cutting the training-table line in front of walk-ons and reads as an off-field beat, but it awards
`snaps`, so the rule catches it and the gate is correct.

### The `validateContent` rule

`src/content/schema.ts`. Two new module-level pieces plus one check inside the event loop:

```ts
const ON_FIELD_PHASES = new Set<Phase>(["nonconf", "conference", "postseason"]);

export function awardsProduction(ev: GameEvent): boolean { /* stat or snaps, either branch */ }

// inside the per-event loop:
if (ON_FIELD_PHASES.has(ev.phase) && awardsProduction(ev) && !ev.conditions?.requiresPlaying)
  errors.push(
    `Event ${ev.id}: on-field event awards stat/snaps production and must set conditions.requiresPlaying (DECISION 048)`,
  );
```

`awardsProduction` is exported so the probe, the test and the validator all use one definition rather
than three copies of a predicate that could drift. Negative amounts count: a card that *debits* a
stat is still claiming the player took the field.

### Tests added (8 new, all in §5's tally)

`src/content/schema.test.ts`:
1. **rejects an on-field event that awards production without `requiresPlaying`** — loops all three
   on-field phases, so the rule cannot be half-wired.
2. **accepts it once it sets `requiresPlaying`, and ignores snaps-free on-field cards** — the rule
   does not over-fire on cards that award only character/overall.
3. **flags an on-field event whose only production is on the negative branch** — pins the
   either-branch reading.
4. **every on-field event in the shipped bundle that awards production sets `requiresPlaying`** —
   asserts the offender list is empty *and* that the population is still 59, so a future author who
   deletes a card rather than gating it does not make the test pass by shrinking the denominator.
5. **the four draft-prospect cards gate on class, overall and playing status** (change 2).
6. **rejects out-of-range `minOverall`, and a `minOverall` above its own `maxOverall`** (change 2).

`src/engine/select-event.test.ts`:
7. **`minOverall` gates on high overall** (change 2).
8. **`minOverall` and `maxOverall` together bound a window** (change 2).

**One pre-existing test was adapted, not deleted.** `schema.test.ts` › *"allows stat and snaps
effects on an on-field event"* moved its fixture event to `nonconf` and awarded production without a
gate — which the new rule correctly rejects. The fixture now sets `conditions: { requiresPlaying:
true }` and the property under test is unchanged (stat and snaps effects are legal in an on-field
phase). Flagging it here because it is the one place a reviewer will see a green test that used to
assert something slightly broader.

---

## 2. Change 2 — DECISION 049a: `minOverall`, and the threshold

### The field and the check

`src/engine/types.ts` — one optional field on `EventConditions`, sited next to `maxOverall`, with the
reason in a comment. `src/engine/select-event.ts` — one line, the exact mirror, sited directly after
the `maxOverall` test:

```ts
if (c.minOverall !== undefined && state.overall < c.minOverall) return false;
```

`src/content/schema.ts` — range check (0–99, mirroring `maxOverall`) plus one clause `maxOverall` did
not need: **`minOverall > maxOverall` is an event that can never fire**, which is a silent
content bug rather than a type error, so the validator names it.

Additive. No `rng` call added or removed, so no draw-order movement from this field itself; it does
change which events are *eligible* once content opts in, which is change 1's divergence anyway.

### The threshold is 70, and here is why that number

The claim these four cards make is *this player is an NFL prospect*. 027 §3's falsifier was that the
claim is "still occasionally said to a player who will go undrafted" even after `minClass: "JR"`. So
the honest threshold is **the overall at which going undrafted stops happening**, and that is a
measurable quantity, not a taste call.

Measured over 2,400 careers (`randomPolicy` across all six positions, random declare/transfer/
redshirt), final overall against draft outcome:

| final overall | n | draft rate | top-3-round rate |
|---|---|---|---|
| 55–59 | 61 | 0.066 | 0.000 |
| 60–64 | 265 | 0.298 | 0.000 |
| 65–69 | 466 | **0.779** | 0.000 |
| **70–74** | **653** | **1.000** | 0.000 |
| 75–79 | 444 | 1.000 | 0.023 |
| 80–84 | 244 | 1.000 | 0.467 |
| 85+ | 222 | 1.000 | 0.968 |

**70 is the lowest five-point band in which every measured career was drafted (653/653).** One band
lower, at 65–69, **more than one in five goes undrafted** — which is exactly the sentence 027 §3
refused to let the card say. 66, the median 027 measured after the class gate, sits inside that
band, so gating at the median would have left the defect in place for a fifth of firings.

Two caveats stated rather than buried: the table is keyed on *final* overall while the card fires in
the postseason of a JR or SR season, so a player at 70 at fire time is near, but not at, his final
number; and 70 is a floor on *being drafted*, not on being a good prospect — the top-3 line only
opens up around 80. A floor at 80 would have been defensible for the "somebody's first-round pick"
language specifically, but it would have cut firings by roughly three quarters, and DECISION 049's
own falsifier is about gating these cards into silence.

### Applied, with `minClass: "JR"`, to the four

```
bowl-opt-out            conditions: { position: ["OSKILL"], tier: [1, 2], requiresPlaying: true, minClass: "JR", minOverall: 70 }
all-star-invite         conditions: { position: ["QB"],                   requiresPlaying: true, minClass: "JR", minOverall: 70 }
all-star-practice-week  conditions: { position: ["DSKILL"],               requiresPlaying: true, minClass: "JR", minOverall: 70 }
senior-bowl-invite      conditions: { position: ["OL"],    tier: [1, 2],  requiresPlaying: true, minClass: "JR", minOverall: 70 }
```

### Re-measured: do they still fire? Yes. Fallback wording not needed

A/B on **identical seeds**: the "before" arm reconstructs the pre-048 bundle in memory (strip
`requiresPlaying` from the 52, strip `minClass`/`minOverall` from the four) so both arms run the
same careers. 1,200 careers per cohort.

| card | cohort | fires before | fires after | FR/SO before → after | median OVR at fire, before → after |
|---|---|---|---|---|---|
| `bowl-opt-out` | full-career | 127 | **52** | 49 → **0** | 72 → **78** |
| `all-star-invite` | full-career | 151 | **50** | 77 → **0** | 70 → **78** |
| `all-star-practice-week` | full-career | 140 | **45** | 67 → **0** | 71 → **78** |
| `senior-bowl-invite` | full-career | 139 | **62** | 63 → **0** | 71 → **78** |
| `bowl-opt-out` | house baseline | 84 | **18** | 49 → **0** | 68 → **74** |
| `all-star-invite` | house baseline | 111 | **14** | 79 → **0** | 68 → **78** |
| `all-star-practice-week` | house baseline | 105 | **16** | 71 → **0** | 67 → **76** |
| `senior-bowl-invite` | house baseline | 82 | **14** | 48 → **0** | 66 → **82** |

**None of the four effectively stops firing**, so 027 §3's fallback wording is not needed and was not
used. They retain 36–45% of firings in a full-career cohort and 14–18 firings per 1,200 careers in
the house baseline. The freshman-and-sophomore firings — 68.6–70.9% of all firings in 027's table —
are now **exactly zero**, and the median overall at fire time has moved from the mid-60s to the
high-70s, which is a player the prose is telling the truth about.

**A judgment call the PM may want to revisit:** these are now genuinely rare cards. In the house
baseline they reach roughly 1.2–1.5% of careers each, down from ~7–9%. That is the intended shape of
a beat reserved for real prospects, but it does mean four written cards are now seen by few players.
If that reads as waste rather than as scarcity, the lever is the threshold, not the wording — 65
would roughly double the firings and reintroduce the undrafted case in about a fifth of them. Not
changed on my own authority.

---

## 3. Change 3 — DECISION 049b: the redshirt card's own two strings

`src/engine/advance.ts:74` and `:76`. **Every changed word, in full:**

**Before**

> description: `"Sit this season to preserve a year of eligibility and gamble on coming back stronger — it might backfire."`
> label: `"Take the redshirt (sit the season)"`

**After**

> description: `"Four games at most, and the season doesn't count against your eligibility. A year of scout team and the weight room, and a gamble on coming back stronger — it might backfire."`
> label: `"Take the redshirt (play four games at most)"`

**Why these and not 027 §5's exact proposal.** 027 proposed opening with the bare word *"Redshirt:"*
as a definitional prefix, which no other card in the game does — every card speaks to the player, and
a glossary entry breaks that. The rule is the same rule, stated in the voice: second person, present
tense, no label-then-definition. *"A year of scout team and the weight room"* is concrete about what
the season actually is, and it deliberately echoes `redshirt.ts`'s own `bumpDescription` ("a year in
the weight room and the scout-team huddle"), so the setup and the payoff sound like the same season.
The em-dash clause is kept verbatim from the original, because the gamble framing was never the part
that was lying. No number is leaked: "four games" is a rule of the game, identical for every player,
which is the DECISION 038 test the declare card's note already passes.

**The claim the card now makes is true.** 027 §5 measured 2,315 redshirt season rows, 100% of which
credit snaps, median 26 — `sitSnapModifier: 0.05` modelling the four-game rule. The engine was right;
only the telling was wrong, and it no longer is.

**Behaviour:** none. Verified independently, before the other three changes were applied — see §6.

---

## 4. Change 4 — DECISION 050: two content fixes

### 4a. `Playoff or Bust` — `src/content/events/universal.ts:125`

**Before**

> `"Ten wins is a disappointing season here. The message boards have been counting since September, and the staff can hear them through the walls."`

**After**

> `"The standard here is the playoff, and everything short of it is a bad year. The message boards have been counting since September, and the staff can hear them through the walls."`

027 §4's proposed wording, used verbatim. The number that invited the comparison is gone, the second
sentence is untouched, and the sentence is now true beside a 5-7 ledger and beside an 11-1 one. 027
measured the card sitting beside a sub-ten-win record in **82 of 85 firings (96.5%)**; there is no
longer a number on the card for that record to contradict. The card keeps `requiresPlaying: true`,
which it already had.

### 4b. `k.ts` — three field goals are nine points

Twelve `{ kind: "stat", stat: "fieldGoals" }` effects; line 141 already paired a `points` sibling.
**Eleven siblings added at `3 * N`, including both negatives.** Applied by script and verified by
grep: all twelve `fieldGoals` lines now sit directly above a `points` line.

| event | option / branch | fieldGoals | points added |
|---|---|---|---|
| `kickoff-duties-too` | own-both-jobs, positive | +2 | **+6** |
| `kickoff-duties-too` | own-both-jobs, negative | −1 | **−3** |
| `the-chip-shot` | trust-your-leg, positive | +1 | +3 *(already present — the template)* |
| `the-fake` | run-the-fake, positive | +1 | **+3** |
| `iced` | stay-locked-in, positive | +1 | **+3** |
| `iced` | stay-locked-in, negative | −1 | **−3** |
| `the-wind-at-home` | trust-your-read-of-the-swirl, positive | +2 | **+6** |
| `onside-kick` | pooch-it-perfect, positive | +2 | **+6** |
| `onside-kick` | kick-it-conventional, positive | +1 | **+3** |
| `bowl-game-winner` | trot-out-for-the-walk-off, positive | +3 | **+9** |
| `the-long-attempt` | tell-him-youve-got-it, positive | +3 | **+9** |
| `the-long-attempt` | tell-him-to-punt-it-instead, positive | +1 | **+3** |

`points` was **not** made derived in the engine — 027 §1's reasoning (one fewer `rng.next()` per
phase per kicker, diverging every K seed, for a counter that feeds nothing downstream) is accepted
and recorded as declined.

**Verified, 1,500 K careers, 4,569 K season rows** (3,385 of them with at least one field goal):

| | 027 §1, before | now |
|---|---|---|
| K season rows where `points < 3 × fieldGoals` | 91 / 1,538 = **5.9%** | **0 / 4,569 = 0.0%** |
| …among redshirt K rows | 82 / 386 = **21.2%** | **0 / 1,159 = 0.0%** |

Both halves of defect 1 are closed, and by two independent mechanisms: the `points` siblings fix the
arithmetic, and change 1's gate means a sitting kicker is no longer handed a field goal at all.

---

## 5. The balance measurement, and the stop condition

**Method.** A/B on identical seeds, both arms in one process: the "after" arm is the tree as edited;
the "before" arm reconstructs the pre-048 bundle in memory by stripping `requiresPlaying` from the 52
and `minClass`/`minOverall` from the four. Same seeds, same policies, same careers, so the difference
between the rows is the change and nothing else. `repetition-probe.ts` is the model for the sweep and
was **not modified**. **3,600 careers per arm, 7,200 total** — well past the brief's ≥1,000.

Three cohorts, differing only in the redshirt hub answer:

- **redshirt** — takes the redshirt every time. `{ events: random, recruiting: random, declare: never, transfer: stay, redshirt: take }`. **This is the redshirt cohort the stop condition is about.**
- **noRedshirt** — identical except it declines. The control that isolates the redshirt.
- **baseline** — the house profile, everything random.

### The redshirt cohort (n = 1,200)

| | before | after | delta |
|---|---|---|---|
| **draft rate** | **0.9567** | **0.9592** | **+0.0025** |
| top-3-round rate | 0.6333 | 0.5917 | −0.0416 |
| round 1 | 224 | 156 | −68 |
| round 2 | 243 | 255 | +12 |
| round 3 | 293 | 299 | +6 |
| round 4 | 233 | 254 | +21 |
| round 5 | 113 | 128 | +15 |
| round 6 | 36 | 47 | +11 |
| round 7 | 6 | 12 | +6 |
| final OVR median | 84 | 83 | −1 |
| final OVR mean | 83.74 | 82.95 | −0.79 |
| final OVR p10 / p90 | 72 / 94 | 72 / 93 | 0 / −1 |
| career snaps median | 1,899 | 1,884 | −15 |
| draft-stock median | 77 | 76 | −1 |
| production cards fired while sitting | **1,655** | **0** | −1,655 |
| careers with ≥1 such firing | **1,031 / 1,200 (85.9%)** | **0** | — |

### The control and the house baseline

| | noRedshirt before → after | baseline before → after |
|---|---|---|
| draft rate | 0.9875 → 0.9867 | 0.8467 → 0.8308 |
| top-3 rate | 0.4842 → 0.4792 | 0.1683 → 0.1375 |
| final OVR median | 81 → 81 | 73 → 72 |
| final OVR mean | 80.56 → 80.43 | 73.68 → 73.07 |
| snaps median | 1,861 → 1,857 | 920 → 901 |
| stock median | 72 → 72 | 53 → 52 |
| sitting firings | 0 → 0 | 1,332 → **0** |

The `noRedshirt` control barely moves (draft rate −0.08pp, OVR mean −0.13) — which is the check that
the change is doing what it claims and not something else. A player who never sits is almost
untouched; the residual movement is the four prospect cards' gate and second-order pool effects.

### The stop condition, evaluated explicitly

> DECISION 048: *"What would change our mind. The before/after measurement showing redshirting
> becomes strictly dominated — a draft-rate collapse in the redshirt cohort rather than a modest,
> intended cost."*
>
> Brief 028: *"If the redshirt cohort's draft rate collapses rather than shifting modestly, stop and
> report."*

**It did not fire.** Three ways of asking:

1. **Did the draft rate collapse?** No. **0.9567 → 0.9592.** It moved by a quarter of a percentage
   point, *upward*, which at n = 1,200 is noise. Nobody stopped getting drafted.
2. **Did redshirting become strictly dominated?** No — and this is the sharper test, because it is
   the one 048 actually wrote. After the change the redshirt cohort still beats the identical
   never-redshirt cohort where it matters: **top-3 rate 0.5917 vs 0.4792**, **draft-stock median 76
   vs 72**, **final OVR mean 82.95 vs 80.43**. The redshirt is still the better line. It is simply
   no longer free.
3. **Is the cost the intended one?** Yes, and it is legible. The change moved **68 careers out of
   round 1** and spread them across rounds 2–7. Redshirting used to buy first-round stock partly by
   generating production in a season the player did not play; now it buys development only. That is
   precisely what 048 approved: *"Closing it makes the redshirt a real sacrifice."*

**Magnitude, for the record:** final-OVR mean −0.79 in the redshirt cohort, −0.13 in the control,
−0.61 in the house baseline. The house draft rate falls 1.6pp (0.8467 → 0.8308). Nothing here is
close to a collapse, and I did not tune anything.

---

## 6. `npm run play` bit-identity — the new baseline

`npm run play` always plays a QB, so its seeds do not exercise the `k.ts` change; both policies are
recorded because the `first` policy walks a different path through the pool than `random`.

**Hash = first 16 hex of `sha256` over the command's stdout.**

| seed | policy | before (current baseline) | **after (new baseline)** | moved? |
|---|---|---|---|---|
| 24 | `random` | `dc7d0c1ab1c22fa3` | **`8f3fa2784466ffad`** | yes |
| 24 | `first` | `154a34b0fefa54b2` | **`4f6e581a92980a62`** | yes |
| 77 | `random` | `abadaaa2206729e9` | **`abadaaa2206729e9`** | **no** |
| 77 | `first` | `60092e7e5f501a74` | **`2791d5f79b30fd7c`** | yes |
| 101 | `random` | `50224b8fc855c327` | **`a85a0328f44ba6c5`** | yes |
| 101 | `first` | `39b7ed9bf6374f12` | **`306e47e1f7590d7a`** | yes |

Seed 77 under `random` is unchanged — that career never sits a redshirt season and never draws one of
the gated cards, so nothing in the change reaches it. Recorded because a PM re-baselining from a
single seed/policy pair could mistake that for "the change did nothing".

Reproduce with:

```
npm run play --silent -- <seed> <random|first> | shasum -a 256 | cut -c1-16
```

### Change 3 in isolation was bit-identical

Verified as the brief required, before any other change was applied: with only
`advance.ts:74`/`:76` edited, all six hashes above matched the before column exactly
(`dc7d0c1ab1c22fa3`, `154a34b0fefa54b2`, `abadaaa2206729e9`, `60092e7e5f501a74`,
`50224b8fc855c327`, `39b7ed9bf6374f12`). The two strings are prose only.

---

## 7. Verification, and the out-of-bounds check

| | |
|---|---|
| `npm test` | **644 passed, 0 failed, 38 files** (baseline 636 + 8 added) |
| `npx tsc -p tsconfig.engine.json` | exit **0** |
| `npx tsc -p tsconfig.json` | exit **0** |
| `npm run build` | clean, built in 535ms |
| `npm run play` bit-identity | moved, as approved (§6); change 3 alone did not move it |
| balance measurement | 7,200 careers, stop condition evaluated and not fired (§5) |

**Files I changed (13):**

```
src/content/events/bust.ts        src/content/events/qb.ts
src/content/events/dl.ts          src/content/events/universal.ts
src/content/events/dskill.ts      src/content/schema.ts
src/content/events/k.ts           src/content/schema.test.ts
src/content/events/offfield.ts    src/engine/types.ts
src/content/events/ol.ts          src/engine/select-event.ts
src/content/events/oskill.ts      src/engine/advance.ts
                                  src/engine/select-event.test.ts
```

All of `src/content/**`, plus exactly the three engine sites DECISIONS 048/049 lifted the freeze for
(`types.ts` `EventConditions`, `select-event.ts` `eventMatches`, `advance.ts:74`/`:76`) and their two
test files. **No other line of `src/engine/**` was touched.**

**Out of bounds — nothing of mine is there.** `git status` also lists `src/ui/screens/
SummaryScreen.tsx` and `src/ui/styles/summary.css` as modified. **Those are the concurrent lane's
uncommitted work, not mine** — I opened neither file, and no change in this report has a reason to.
`src/ui/screens/CareerScreen.tsx` and `src/ui/styles/career.css` are unmodified. Nothing under
`src/ui/session/` was touched. **I committed nothing and ran no `git checkout` / `restore` /
`stash` / `reset`.**

---

## 8. Proposals — things I did not take

Three, all recorded rather than acted on.

**1. `offfield-training-table` may be miscategorised, not just ungated.** "Cutting the Line" is the
one event of the 52 that had no `conditions` object at all, and it is written as an off-field beat —
a training-table queue, walk-ons, ten seconds of impatience — but it sits in `phase: "nonconf"` and
awards `snaps`. The gate is now correct either way. The open question is whether the card wants to be
`offseason` (it has nothing to do with a game) or whether the `snaps` effect is the part that does
not belong. One line either way, but it is a content-authoring judgment and not in my brief.

**2. The four prospect cards are now rare.** §2 has the numbers and the tradeoff. Flagged because
"correctly gated" and "still worth having written" are different questions, and the second one is the
PM's.

**3. 027 §6's `allowedDuringRedshirt` caveat is now load-bearing in one specific place.** DECISION
048 declined the opt-in condition, and defaulting to gated was right. But the redshirt card's new
prose (§3) now says *"four games at most"* out loud to the player, while the content bundle says a
redshirting player experiences **zero** on-field beats. The engine still credits the snaps, so the
ledger is consistent — but a player who reads "four games" and then meets no football for a season
may notice the gap the other way round from the one we just closed. This is not a defect today and I
am not proposing the condition. It is the kind of thing a playtest question would settle: *did the
redshirt season feel like four games, or like none?*

**4. `SeasonLine.redshirt` is still written by the engine and read by nothing.** 027 §5 recorded
this and DECISION 039 reserves it for its own brief. Unchanged; re-flagged only because change 1
makes the sat-out row visibly emptier than it used to be, which strengthens the case for marking it.
