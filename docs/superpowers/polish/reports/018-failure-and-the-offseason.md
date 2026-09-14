# 018 — Can you lose, and is the offseason a decision? Measured

**Brief:** `briefs/018-failure-and-the-offseason-measured.md` · **Authorised by:** DECISION 029, stage 1
**Stage:** measurement and proposal only. `src/engine/**` and `src/content/**` were not edited.
**Verified:** `npm test` — **545 passed** (the 501 pre-existing tests all green, plus 44 new tests for
the sim code added under this brief). `npm run typecheck` — both passes exit 0.

---

## The answer in one paragraph

**You can lose, but only by playing badly for four seasons.** Under the most self-destructive play
the engine allows, a career that runs its full eligibility ends in disaster **12.7%** of the time
(QB, n=3000). The same player who declares after two seasons — exactly what the 014 playtester did —
ends in a career-ending disaster **0.4%** of the time and is drafted **89.2%** of the time, landing
in rounds 6–7 in **85.9%** of all careers, at a final OVR of 64.7. The playtester's "I could not lose" is correct as stated and the cause is
specific: **declaring early is not a risk, it is a hiding place.** Every failure mechanism in the
game needs three or four seasons to reach you, and the draft's undrafted floor sits below what a
two-season career banks by doing nothing at all.

**And the offseason claim is wrong.** Transferring up every year is not free: measured against
identical seeds with only the transfer choice varying, it costs **0.43–0.91 overall and 0.85–2.23
draft stock per move**, and it roughly **halves** the round-1 rate (0.0347 → 0.0190). The playtester
inferred a pattern from three careers that the distribution does not support. **No engine change is
proposed for B19.**

---

## 1. What "bad" means — stated explicitly, because every number depends on it

The engine exposes no reward signal, so a "deliberately bad" policy has to be defined against
something. Three were implemented and all three were run, plus a control. They are genuinely
different players and they produce answers an order of magnitude apart, which is the finding that
matters most in this section.

Both score every authored option's effects in **draft-stock points**, using `deriveDraftStock`'s own
coefficients (`src/engine/draft.ts`): overall ×1.4, character ×0.15, snaps ×0.005, trophy +2.5,
award +3. An option's score is its authored probability applied across its two outcomes. Full weight
table and derivation: `src/sim/policies.ts`, `STOCK_WEIGHTS`.

| definition | rule | who it models |
|---|---|---|
| **lazy** | minimise expected draft stock; an `ending` effect scores **0** | the careless player who takes the low-effort option and does not weigh consequences — skipped the install, ghosted the media, played hurt |
| **saboteur** | minimise expected draft stock; an `ending` effect scores **−1000** | someone actively trying to end the career. The ceiling on reachable failure, not a plausible human |
| **antisocial** | minimise expected **character** delta, draft stock breaking ties | the player who tanks relationships specifically. This is the axis the six authored bust events are gated on |
| **best** (control) | maximise the same scorer | a player who plays well. A change that "a good player should not notice" is one that barely moves this row |

**The third definition exists because the first two turned out to be the wrong shape, and finding
that out was the most important measurement in this report.** `deriveDraftStock` prices a character point at 0.15
against an overall point's 1.4 — a factor of nine. A player minimising draft stock therefore dumps
**overall**, not character, and sails straight past every character gate the bust events sit behind.
Measured: `lazyFull` ends under character 35 in **1.3%** of careers. `antisocialFull` ends there in
**90.2%**. If this report had used only the natural stock-minimising definition it would have
concluded that failure is unreachable, and it would have been measuring the wrong player.

A corollary worth recording separately: because character is so cheap in draft stock, the
**optimising** policy also dumps it. `goodStay` ends under character 35 in **23.0%** of careers — more
than seventeen times the lazy player's rate. The character spiral currently bites the good player
harder than the careless one.

---

## 2. Q1 — Is failure reachable, and what does it take?

### 2.1 The distribution, QB, n=3000 per row

Seed prefix `b018`, home state TX. `npx tsx src/sim/failure-probe.ts 3000 all QB`.

| profile | busted | undrafted | **picked** | round 1 | rounds 6–7 | avg stock | stock P05 | seasons | final OVR |
|---|---|---|---|---|---|---|---|---|---|
| `good` (best play, full career, transfers up) | 0.0217 | 0.0000 | 0.9783 | 0.5270 | 0.0057 | 88.85 | 66 | 4.95 | 90.55 |
| `goodStay` (best play, full career, stays) | 0.0330 | 0.0000 | 0.9670 | 0.5720 | 0.0043 | 90.21 | 67 | 4.93 | 91.23 |
| `randomFull` (ordinary play, full career) | 0.0267 | 0.0003 | 0.9730 | 0.1527 | 0.0393 | 76.42 | 55 | 4.73 | 82.15 |
| `baselineRandom` (the house baseline) | 0.0143 | 0.0407 | 0.9450 | 0.0317 | 0.3827 | 57.62 | 35 | 3.09 | 73.28 |
| **`lazyFull`** (bad play, full career) | 0.0127 | 0.0033 | **0.9840** | 0.0000 | 0.2123 | 60.22 | 45 | 3.98 | 71.45 |
| **`saboteurFull`** (trying to lose, full career) | 0.0130 | 0.0033 | **0.9837** | 0.0000 | 0.2120 | 60.23 | 45 | 3.98 | 71.45 |
| **`antisocialFull`** (tanking character, full career) | **0.1273** | 0.0003 | 0.8723 | 0.0517 | 0.0167 | 74.22 | 57 | 3.92 | 82.83 |
| **`lazyEarly`** (bad play, declares at 2 seasons) | 0.0040 | 0.1040 | **0.8920** | 0.0000 | **0.8587** | 42.93 | 31 | 2.00 | **64.66** |
| `antisocialEarly` | 0.0060 | 0.0337 | 0.9603 | 0.0000 | 0.6867 | 48.90 | 36 | 1.99 | 70.15 |
| `randomEarly` (ordinary play, declares early) | 0.0083 | 0.0773 | 0.9143 | 0.0000 | 0.6200 | 48.44 | 32 | 2.25 | 69.21 |
| `goodEarly` (best play, declares at 2 seasons) | 0.0137 | 0.0343 | 0.9520 | 0.0000 | 0.6627 | 48.83 | 35 | 2.00 | 71.00 |

`lazyEarly` reproduces the 014 playtester almost exactly: **two seasons, final OVR 64.7** (reported:
65), **45.8% round 7 / 40.1% round 6** (reported: round 7 pick 2). The harness is measuring the
career they actually played.

Every conclusion below holds at all six positions (`npx tsx src/sim/failure-probe.ts 1000 all all`).
Ranges across positions: `lazyEarly` undrafted 0.071 (OL) – 0.239 (K); `antisocialFull` busted
0.109 – 0.149.

### 2.2 Three findings from that table

**(a) Playing badly for a full career is SAFER than playing randomly.** `lazyFull` is picked 98.4%
of the time against `baselineRandom`'s 94.5%. Bad play does not shorten a career, so the bad player
banks four seasons of automatic development while the random player declares early a third of the
time. Length beats quality. That is the same mechanism as (b) seen from the other side.

**(b) Trying to lose changes nothing.** `saboteurFull` and `lazyFull` are identical to three decimal
places on every metric. Every `ending` effect in the entire content bundle lives in the six events of
`src/content/events/bust.ts`, all of them `random` and all gated. A player who wants to end the
career gets offered the chance in **2.0%** of careers. **There is no way to quit on purpose.**

**(c) The two-season declare dodges everything.** Same policy, same seeds, only the declare choice
differs:

| | busted | undrafted | picked |
|---|---|---|---|
| `lazyFull` (plays it out) | 0.0127 | 0.0033 | 0.9840 |
| `lazyEarly` (declares at 2) | 0.0040 | 0.1040 | 0.8920 |
| `antisocialFull` (plays it out) | **0.1273** | 0.0003 | 0.8723 |
| `antisocialEarly` (declares at 2) | **0.0060** | 0.0337 | 0.9603 |

Tanking character over a full career busts you 12.7% of the time. **Tanking character and leaving
after two seasons busts you 0.6% of the time — a 21× reduction — and raises the picked rate.** This
reframes the brief's item: failure is not missing from the game. Failure is real, it is character-
shaped, and **short careers are the loophole**.

### 2.3 Every mechanism that can end a career badly, and how often it fires

There are exactly four. `grep -rn 'kind: "ending"' src/content/` returns twelve hits, all in
`bust.ts`; the other two paths are engine-side in `enterOffseason`.

| # | mechanism | where | fires under bad play | verdict |
|---|---|---|---|---|
| 1 | soft washout, collapsed overall (`overall < washoutOverallFloor: 45`) | `advance.ts` + `postseason.ts` | **0.0000 – 0.0007** across all 20 profiles | **effectively dead** |
| 2 | soft washout, buried (2 straight seasons under `washoutSnapFloor: 60`) | `advance.ts` | 0.0000 (`lazyFull`) – 0.0237 (`goodStay`) | alive, but it fires on GOOD players |
| 3 | the six authored bust events | `content/events/bust.ts` | 0.0040 (`lazyEarly`) – 0.1270 (`antisocialFull`) | the only real failure path |
| 4 | undrafted at the draft | `draft.ts`, `UNDRAFTED_FLOOR: 35` | 0.0033 (`lazyFull`) – 0.1040 (`lazyEarly`) | alive, and the lever this report recommends |

**Mechanism 1 exists in code and never fires.** The brief asked for this to be called out if true.
The minimum `overall` observed at *any* offseason decision across 3000 QB careers is **45–49**
depending on profile, and the 1st percentile is **53–58**. The floor sits at or below the absolute
minimum of its own distribution. It would need to sit near **55** to catch even 1% of offseasons —
and `STARTING_OVERALL` is 60, so a floor near 55 would start eliminating freshmen who had one bad
year. This lever is structurally unusable and should be documented as such rather than tuned.

**Mechanism 2 fires backwards.** `goodStay` 0.0237, `good` 0.0143, `baselineRandom` 0.0080,
`lazyFull` 0.0000. Burial needs a season under 60 snaps, which in practice means injuries wiping out
whole seasons — and the good player takes more of them (2.16 career injuries vs the lazy player's
0.69, because they transfer up into `wideOpen` schools and play more phases).

**Mechanism 3 is gated twice, and the second gate is the quiet one.** A bust event needs (i) its
vulnerability gate satisfied and (ii) to win the phase's single random-event draw. Measured
end-to-end for `antisocialFull`:

| stage | rate |
|---|---|
| ever crosses the academics gate (character ≤ 35, class ≥ SO) | 0.8713 |
| ever crosses the drug-test gate (character ≤ 30) | 0.7657 |
| ever crosses the doghouse gate (character ≤ 25) | 0.6173 |
| ever crosses the arrest gate (character ≤ 20) | 0.4577 |
| **a bust event actually surfaces as a decision** | **0.1923** |
| **the career actually ends through one** | **0.1270** |

The gap is pool competition. `npx tsx src/sim/failure-probe.ts pools` measures the draw share
analytically — with the gate satisfied, a bust event owns only this much of its phase's weighted
random pool:

| event | phase | weight | eligible pool weight | draw share |
|---|---|---|---|---|
| `bust-mri` | offseason | 3 | 25 | 0.120 |
| `bust-academics` | offseason | 3 | 33 | 0.091 |
| `bust-lost-love` | offseason | 2 | 24 | 0.083 |
| `bust-drug-test` | conference | 2 | 27 | 0.074 |
| `bust-arrest` | conference | 2 | 29 | 0.069 |
| `bust-doghouse` | nonconf | 2 | 29 | 0.069 |

This is working as designed — the events are meant to be rare and telegraphed — and it is the reason
a two-season career, which offers only ~6 draws, almost never meets one. **It is a length filter, and
that is the whole problem.**

### 2.4 Why a two-season career cannot go undrafted — the arithmetic

`deriveDraftStock` for `lazyEarly`'s mean career: `(64.66 − 40)×1.4 = 34.5`, plus production
`978/200 = 4.89`, plus character `(60.94 − 50)×0.15 = 1.64`, plus trophies `0.19×2.5 = 0.48`, plus
awards `0.44×3 = 1.32` → **42.8** (measured: 42.93). `UNDRAFTED_FLOOR` is **35**.

A career that gains and loses *literally nothing* scores `(60−40)×1.4 + 960/200 + (70−50)×0.15 =
35.8` — already over the floor. Development then adds more for free: `floor(seasonSnaps / 180)`
capped at 3, and a bad player still takes a full snap count, so they bank **+2 overall per season**
without making a single good decision. **The undrafted floor sits below the draft stock of a career
that makes no decisions at all.** That is the bug, stated as precisely as this report can state it.

### 2.5 The structural fact that constrains every possible fix

After two seasons the engine **cannot tell a good player from a bad one**:

| two-season profile | avg draft stock | avg final OVR |
|---|---|---|
| `lazyEarly` (worst play available) | 42.93 | 64.66 |
| `randomEarly` | 48.44 | 69.21 |
| `antisocialEarly` | 48.90 | 70.15 |
| `goodEarly` (best play available) | **48.83** | 71.00 |

The entire achievable range is **≈6 draft-stock points**, two-thirds of one round. `STARTING_OVERALL`
is 60 and `devCap` is 3 per season, so the best possible two-season OVR is ~71 against a floor of
~64. Any lever that makes the bad two-season career fail will also, to a large extent, make the good
two-season career fail. **The honest design statement available here is "declaring after two seasons
is a gamble", not "declaring after two seasons when you played badly is a gamble."** Separating them
would require widening the two-season stock range — a much larger change than this brief authorises.

---

## 3. Q2 — Is the offseason a decision? The claim is refuted

Five transfer strategies, **identical seeds**, everything else held at the house baseline
(`randomPolicy` events, random declare, random redshirt). Transfer choice is the only variable.
QB, n=3000.

| strategy | avg stock | final OVR | round 1 | picked | all-conf | career snaps | trophies | up-moves |
|---|---|---|---|---|---|---|---|---|
| `offseasonLateral` | **58.16** | **73.39** | 0.0353 | 0.9357 | 0.5723 | 1143.9 | 0.560 | 0 |
| `offseasonStay` | 57.30 | 73.09 | 0.0347 | 0.9383 | 0.5130 | 1088.7 | 0.578 | 0 |
| `offseasonRandom` | 57.62 | 73.28 | 0.0317 | 0.9450 | 0.5127 | 1081.9 | 0.599 | 0.266 |
| `offseasonUpOrLateral` | 56.35 | 72.71 | 0.0227 | 0.9377 | 0.4263 | 992.5 | 0.703 | 0.685 |
| **`offseasonUp`** | **55.78** | **72.47** | **0.0190** | 0.9390 | 0.3873 | 963.4 | 0.721 | 0.683 |

**"Transfer up every year" is the worst of the five lines on draft stock, final overall and round-1
rate.** It is the best line on trophies, which is the mechanism: a higher tier wins more games, and
`moveUpSnapModifier: 0.6` costs you a season of playing time to get there.

### 3.1 The price of one transfer up, measured three ways

| A/B (same seeds, transfer the only variable) | up-moves/career | stock | final OVR | snaps | trophies | awards | round 1 | picked |
|---|---|---|---|---|---|---|---|---|
| `offseasonStay` → `offseasonUp` (3.08 seasons) | 0.683 | **−2.23** | **−0.91** | −183.5 | +0.210 | −0.201 | −0.023 | +0.001 |
| `longStay` → `longUp` (4.73 seasons) | 1.510 | **−1.81** | **−0.87** | −181.3 | +0.285 | −0.151 | −0.043 | +0.002 |
| `goodStay` → `goodUp` (4.93 seasons, best play) | 1.596 | **−0.85** | **−0.43** | −167.7 | +0.348 | −0.094 | −0.028 | +0.007 |

All per-move. The mechanism is exactly the one the constants describe: `moveUpSnapModifier: 0.6`
removes ~183 snaps from the season after the move (predicted −192 from a ~480-snap season; measured
−183), which costs one development point permanently and ~0.9 of a production point, against a gain
of ~0.2–0.35 trophies. The costs are permanent; the tier gain is real but smaller.

### 3.2 The honest statement of the refutation

- **"Free overall" is false.** It costs **0.43–0.91 overall per move**, permanently, at every career
  length and skill level measured, at all six positions.
- **"The offseason stopped being a decision" is false.** There is a measurable gradient: 2.4 draft
  stock and a near-doubling of the round-1 rate separate the best line from the worst.
- **But the playtester's error is completely understandable and is not their fault.** The cost is
  −0.9 overall on a number that swings ±10 from events, and `pickedRate` is flat to within 0.007
  across all five lines. The *median* outcome barely moves; the cost lands almost entirely in the
  **upside** (round-1 rate 0.0347 → 0.0190, all-conference 0.513 → 0.387). Three careers cannot see
  that, and nothing in the interface tells them.

**This is a legibility problem, not a balance problem, and it belongs to a UI brief, not to the
engine freeze.**

### 3.3 One genuine (small) free lunch, reported for completeness

`lateralSnapModifier: 1.1` is the only repeatable offseason option with a benefit and no paired cost.
`generateTransferOffers` emits a lateral offer every offseason unconditionally, and taking it every
year measures at **+0.65 draft stock, +0.23 overall and +42 snaps per move** against staying — the
best of the five lines. This violates the shared-temporal-scope rule that `content/school-traits.ts`
states for traits. **Recommendation: leave it.** 0.65 stock is 7% of one round, it is far below the
threshold where an engine change is worth the risk, and "you get more reps as the new guy who was
recruited over" is defensible fiction.

---

## 4. Proposal

Approve or reject line by line. Only item 1 changes any code.

### Item 1 — Penalise declaring with eligibility left, applied at the draft only

| | |
|---|---|
| **Where** | `src/engine/draft.ts`, `computeDraftResult` |
| **Today** | `const stock = deriveDraftStock(state);` — no class term at the draft. `deriveDraftStock` itself gives `classPart = state.eligibility.classYear === "SR" ? 2 : 0`. |
| **Proposed** | add `export const EARLY_DECLARE_PENALTY = 8;` and, inside `computeDraftResult` only: `const stock = Math.max(0, deriveDraftStock(state) - (state.eligibility.classYear === "SR" ? 0 : EARLY_DECLARE_PENALTY));` |
| **Untouched** | `UNDRAFTED_FLOOR` stays 35. The `9.3` round-band divisor stays 9.3. `deriveDraftStock` stays byte-identical. |

**Why 8, and where the number came from.** The measured mean draft stock of the deliberately-bad
two-season career is **42.93** (`lazyEarly`, QB, n=3000) against an undrafted floor of **35**. The gap
is **7.93**. A penalty of 8 removes exactly the cushion that career currently enjoys, putting its
*median* outcome on the floor rather than a round and a half above it. It is also **8 / 9.3 = 0.86 of
one draft round**, so the design sentence it encodes is "leaving a year of eligibility on the table
costs you most of a round" — which is both true to football and legible.

**Why it goes in `computeDraftResult` and not in `deriveDraftStock`.** `deriveDraftStock` also feeds
`eligibleTiers`, which generates Signing Day and transfer offers. Putting the penalty in the shared
function would silently shrink the offer ladder for every junior — the tier thresholds are 25/45/70
and an 8-point shift moves players across them. Applying it at the draft alone has **zero** effect on
the offer generator. This constraint is not optional; a stage-2 implementation that puts the term in
`deriveDraftStock` is a different change with side effects this report did not measure.

**Predicted effect** — computed exactly against the measured stock distributions, not re-simulated
(`stockCountsByClass` in the probe output makes this exact). Every profile that plays out its
eligibility declares as a SR and is therefore **numerically unchanged, to four decimal places, on
every metric**:

| profile | picked today | picked at P=8 | round 1 today | round 1 at P=8 |
|---|---|---|---|---|
| `good` | 0.9783 | **0.9783** | 0.5270 | **0.5270** |
| `goodStay` | 0.9670 | **0.9670** | 0.5720 | **0.5720** |
| `randomFull` | 0.9730 | **0.9730** | 0.1527 | **0.1527** |
| `longStay` | 0.9713 | **0.9713** | 0.1667 | **0.1667** |
| `lazyFull` | 0.9840 | **0.9840** | 0.0000 | **0.0000** |
| `antisocialFull` | 0.8723 | **0.8723** | 0.0517 | **0.0517** |
| `baselineRandom` | 0.9450 | 0.8640 | 0.0317 | **0.0317** |
| `goodEarly` | 0.9520 | 0.7650 | 0.0000 | 0.0000 |
| `randomEarly` | 0.9143 | 0.7393 | 0.0000 | 0.0000 |
| `antisocialEarly` | 0.9603 | 0.8080 | 0.0000 | 0.0000 |
| **`lazyEarly`** | **0.8920** | **0.5633** | 0.0000 | 0.0000 |

The 014 playtester's career goes from **89% drafted to 56% drafted** (QB; 33% at K, 65% at OL,
n=1000 for the per-position figures).
Round-1 rates do not move at all for anyone, because the floor and the band divisor are untouched.

**The full sweep, so the magnitude is the user's call and not mine.** `lazyEarly` undrafted rate /
`baselineRandom` picked rate, QB, n=3000:

| P | 0 | 2 | 4 | 5 | 6 | 7 | **8** | 9 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|
| `lazyEarly` undrafted | 0.104 | 0.153 | 0.229 | 0.272 | 0.318 | 0.375 | **0.433** | 0.496 | 0.562 | 0.690 |
| `baselineRandom` picked | 0.945 | 0.927 | 0.908 | 0.896 | 0.885 | 0.872 | **0.864** | 0.851 | 0.840 | 0.805 |
| `goodEarly` picked | 0.952 | 0.918 | 0.875 | 0.853 | 0.828 | 0.799 | **0.765** | 0.727 | 0.690 | 0.609 |

**What it costs, honestly.**

1. **It hits the good early declarer too.** `goodEarly` goes from 95.2% picked to 76.5%. This is
   unavoidable, not an oversight: §2.5 shows the best and worst two-season careers are only 6 stock
   points apart, so nothing keyed on quality can separate them at that career length. The change is
   therefore best understood as "two seasons is not enough, for anyone," which is a defensible design
   statement but **is** a design statement and needs the user's assent, not just their approval of a
   number.
2. **It breaches a target band.** STAGE4-HANDOFF's "actually picked 0.85–0.95" band is measured on
   `randomPolicy`, whose declare choice is a coin flip. At P=8 that baseline reads **0.798 (K) –
   0.866 (QB)** across the six positions (n=1000); K and OSKILL fall below 0.85. The band is marked **proposed, not spec** in the
   handoff. **My position: the band should move, and this is the honest reason.** It was set when the
   design belief was "you essentially always get drafted," which is the belief DECISION 029 exists to
   test. Holding it fixed caps the penalty at P=4, where the deliberately-bad two-season career is
   still picked **76.7%** of the time — not materially different from the 89% that produced "I could
   not lose." *Holding the band guarantees the change cannot fix the problem it was authorised to
   fix.* If the user would rather keep the band than move it, **P=4 is the largest value that fits**
   and this item should probably be rejected outright rather than shipped at a magnitude that does
   nothing.
3. **K is the sharpest slice, as always.** At P=8 `lazyEarly` at K is undrafted 66.7% (n=1000). If
   that reads as too punitive, P=6 puts K at 56.1% and QB at 31.4%.
4. **Risk if it goes wrong:** the failure mode is that early declaring becomes strictly dominated and
   the declare screen stops being a decision — trading B19's complaint for a new version of it at a
   different hub. P=12 is where that starts (good early declarers picked 0.57–0.63) and is why this
   report does not recommend going there.

**Verification for stage 2:** re-run `npx tsx src/sim/failure-probe.ts 3000 all QB` and
`npx tsx src/sim/balance.ts 3000 random all`. The full-career rows above must come back **bit-
identical**; if any of them moves, the penalty has leaked into `deriveDraftStock` or the offer
generator.

### Item 2 — Transfer constants: no change

`transfer.moveUpSnapModifier: 0.6`, `lateralSnapModifier: 1.1`, `moveDownSnapModifier: 1.3`,
`buriedSnapThreshold: 250` all stay as they are. B19's premise is refuted by §3: transferring up
already costs 0.43–0.91 overall per move and is the worst of the five offseason lines. Making it
cost *more* would punish a line that is already dominated. **What the offseason needs is for the
player to be able to see the trade, which is interface work for a later brief.**

### Item 3 — `washoutOverallFloor: 45`: no change, but document it

It fires in **0.00%–0.07%** of careers across every policy measured, including one trying to lose. It
sits at or below the minimum of the distribution it is compared against. Raising it to ~55 would make
it fire, but `STARTING_OVERALL` is 60, so a floor there would start eliminating freshmen after one
bad year — the check runs at every `enterOffseason`, including the first. **Recommend: add a comment
in `content/postseason.ts` recording that this is not a usable difficulty lever, so a future wave
does not rediscover it and reach for it.** No value change.

### Item 4 — Bust-event weights: no change

Weights 2–3 give each bust event a 6.9%–12.0% share of its phase's draw once gated in. Under
character-tanking play that already produces a **12.7%** career-ending rate, comfortably above the
0.005–0.03 house band for ordinary play. The path works. It just needs four seasons, which is what
item 1 addresses from the other end.

### Item 5 — Not proposed, recorded for a future decision

`deriveDraftStock` prices character at **1/9th** of overall per point. The measured consequence is
that the *optimising* policy ends under character 35 in 23.0% of careers while the *careless* one
does so in 1.3% — the character spiral currently selects for good players. This is a real
mis-aiming, it is bigger than anything in items 2–4, and it is **out of scope for DECISION 029's
lifted freeze**. Flagging it so it is not lost.

---

## 5. Limitations

- **Every Q1 number is conditional on the definitions in §1.** Both were run and they disagree by an
  order of magnitude on bust rate; §2.2(c) is the finding that survives both.
- **`stat` effects score 0 in the scorer.** They feed All-Conference indirectly and pricing them
  would need a per-position threshold model. This understates stat-bearing options for every policy
  equally, and is the likeliest reason `lazyFull`'s all-conference rate (0.765) is higher than
  expected — it is not avoiding production.
- **The injury cost model in the scorer is a judgement call** (`STOCK_WEIGHTS.injuryStraddle: 0.25`),
  documented at its definition. It affects which option a bad policy picks, not any engine behaviour.
- **Counterfactuals in item 1 are computed against measured stock distributions, not re-simulated.**
  They are exact for the draft outcome and cannot capture second-order effects — but there are none
  available, because the penalty is applied after the career is over.
- **`offseasonChecks` in the probe counts offseason decision points, not season boundaries** (the
  washout check is not a decision point). §2.3's mechanism-1 verdict rests on the directly measured
  `washoutOverallRate`, not on that denominator.
- **Home state is fixed at TX** for comparability with the STAGE4-HANDOFF baselines.

---

## 6. Reproducing this

```
npx tsx src/sim/failure-probe.ts 3000 all QB      # every profile, QB, the tables above
npx tsx src/sim/failure-probe.ts 1000 all all     # all six positions
npx tsx src/sim/failure-probe.ts pools            # analytic bust-event draw shares
npx tsx src/sim/failure-probe.ts 3000 lazyEarly QB
```

New code, all under `src/sim/**`:

- `src/sim/policies.ts` — the draft-stock option scorer, the three bad-play definitions, `makePolicy`,
  and the 20 named `PROFILES` used above. Seed prefix `b018`.
- `src/sim/failure-probe.ts` — `traceCareer` (a recording copy of `playCareer`, pinned equal to it by
  test), the mechanism split, the per-class stock histograms the counterfactuals are computed from,
  and `bustPoolShares`.
- `src/sim/policies.test.ts`, `src/sim/failure-probe.test.ts` — 44 tests. The load-bearing one is
  *"produces exactly the career play-headless produces"*: if the traced loop ever drifts from
  `playCareer`, every number here would be measuring a different game than `npm run balance` does.
