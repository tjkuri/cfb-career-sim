# 054 — A rung you can actually reach

**Status:** done · **Branch:** `polish/ui-phase` · **Tests:** 739 green (728 + 11 new) · both typecheck
passes exit 0 · `npm run build` clean · clicked through at `localhost:5173`

**Shipped:** `TRUST_BANDS` top two floors `85 → 80` and `70 → 66`. The PM's proposed pair, endorsed on
measurement rather than implemented blind. Two alternatives were measured and are named below.

---

## 1. The instrument, and why the existing one could not answer this

Every previous character measurement on this board reports an **endpoint** — final `character`, or Δ
from the start. DECISION 080's sweep is built that way, and that is why it reached a conclusion this
task had to correct (§2).

The complaint B81 was opened over is not about an endpoint. *"Only something you can lose"* and *"the
first one came on decision 2"* are statements about **movement**: which direction the ladder first
moved, how often it moved at all, whether the top rung was ever stood on. A career that dips to 69 on
click two and recovers to 76 has the same endpoint as one that never moved, and a completely different
experience. None of the four things the brief asks for is recoverable from a final value.

So the new probe — **`src/sim/rung-probe.ts`**, with **`src/sim/rung-probe.test.ts`** (9 tests) —
keeps the whole per-decision `character` trajectory and scores it against a **band table passed in as a
parameter**. That is the load-bearing design choice: the old and new calibrations are scored against
**the same careers** — identical seeds, identical policies, identical trajectories, only the thresholds
differ. A side-by-side that re-rolled the careers would be comparing two samples as well as two tables.

`rungOf` is pinned equal to the shipped `trustRungOf(trustPhrase(c))` for all c in 0..100, so the
measurement cannot drift from the ladder the player actually reads.

**Sample: 14,400 careers.** Six profiles × six positions × 400 runs, seed prefix `b81`.

## 2. A correction to DECISION 080: the top rung was not unreachable, it was reached by 1 in 44

DECISION 080 states the top rung *"cannot be reached by any policy at any position"* and *"not one of
18 cells reaches 85"*. That is true **of the cell statistics it measured** — no cell's *mean* or *p95*
reaches 85. It is **not** true of individual careers.

| under the OLD 85/70 table | careers ever touching the top rung |
|---|---|
| `virtueAmbitious` | **2.25%** (54 of 2,400) |
| `virtueLoyal` | **0.50%** (12 of 2,400) |
| `good` | 0.13% |
| `baselineRandom` / `lazyFull` / `saboteurFull` | 0.00% |

The distinction matters for the record but changes nothing about the verdict. 1-in-44 for a *perfect*
virtue policy, against a playtester who played three careers, is indistinguishable from impossible in
play — and the playtester's own experience is the correct read. **DECISION 080's conclusion stands;
only its word "unreachable" needs the footnote.** Worth keeping because it is the second time this
board has had a cell-aggregate hide a per-career tail.

## 3. The four measurements the brief asked for

All figures pooled across six positions. Per-position tables in §5; no position is an outlier.

### 3.1 / 3.2 — Rung occupancy at career end, and the top-rung reach rate

Occupancy is the share of careers finishing on each rung, rung 0 = *"they would run through a wall for
you"*, rung 4 = *"the staff has stopped defending you"*.

| profile | table | rung 0 | rung 1 | rung 2 | rung 3 | rung 4 | **ever touched rung 0** |
|---|---|---|---|---|---|---|---|
| `virtueAmbitious` | old | 0.021 | 0.871 | 0.108 | 0.000 | 0.000 | 2.25% |
| | **new** | **0.210** | 0.760 | 0.030 | 0.000 | 0.000 | **23.1%** |
| `virtueLoyal` | old | 0.005 | 0.912 | 0.083 | 0.000 | 0.000 | 0.50% |
| | **new** | **0.141** | 0.842 | 0.018 | 0.000 | 0.000 | **15.7%** |
| `good` | old | 0.001 | 0.585 | 0.412 | 0.002 | 0.000 | 0.13% |
| | **new** | 0.013 | 0.817 | 0.169 | 0.002 | 0.000 | **1.79%** |
| `baselineRandom` | old | 0.000 | 0.009 | 0.388 | 0.378 | 0.225 | 0.00% |
| | **new** | 0.000 | 0.031 | 0.366 | 0.378 | 0.225 | **0.04%** |
| `lazyFull` | old | 0.000 | 0.000 | 0.220 | 0.435 | 0.345 | 0.00% |
| | **new** | 0.000 | 0.001 | 0.219 | 0.435 | 0.345 | **0.00%** |
| `saboteurFull` | old | 0.000 | 0.000 | 0.219 | 0.428 | 0.353 | 0.00% |
| | **new** | 0.000 | 0.001 | 0.218 | 0.428 | 0.353 | **0.00%** |

**Against the brief's stated target shape:**

- *a minority of `virtueLoyal` and `virtueAmbitious`* — **23.1% and 15.7%.** A clear minority, nowhere
  near the "more than half" line the brief set as the threshold-is-wrong signal.
- *near-zero for `good`* — **1.79%.**
- *zero for `baselineRandom`, `lazyFull`, `saboteurFull`* — **0.04% / 0.00% / 0.00%.** The
  `baselineRandom` figure is a single career out of 2,400, and it merely touches the rung; **none finish
  on it.**

Worth stating plainly, because it sets the expectation for the next playtest: `virtueAmbitious` and
`virtueLoyal` are policies that take the team-first branch on **every single card**. No human plays
that. A real player who is trying sits between `good` (1.8%) and virtue (23%). That is the right place
for a phrase the game intends as rare but earnable.

**The bottom of the ladder is untouched, as instructed.** `lazyFull` occupancy at rungs 2/3/4 is
`0.220 / 0.435 / 0.345` before and `0.219 / 0.435 / 0.345` after. The single 0.001 is one lazy career
in a thousand finishing between 66 and 70. Nothing about the downward half was redesigned.

### 3.3 — The rate at which a career's FIRST rung change is downward

This is the playtester's actual complaint, and it is the largest movement in the whole table.

| profile | first move is down, share of **all** careers | of the careers that move **at all**, share moving down first | falls a rung within **2** decisions | within **5** decisions |
|---|---|---|---|---|
| `virtueAmbitious` | 37.6% → **10.8%** | **94.5% → 31.9%** | 3.75% → **0.00%** | 11.4% → **0.21%** |
| `virtueLoyal` | 30.0% → **5.0%** | **98.4% → 24.3%** | 3.75% → **0.00%** | 12.2% → **0.00%** |
| `good` | 64.1% → **29.1%** | 99.8% → 94.2% | 3.75% → **0.00%** | 13.5% → **2.17%** |
| `baselineRandom` | 99.6% → 98.0% | 100% → 100% | 29.3% → 11.3% | 76.2% → 34.5% |
| `lazyFull` | 100% → 99.96% | 100% → 100% | 55.9% → 23.3% | 94.5% → 71.7% |
| `saboteurFull` | 100% → 99.96% | 100% → 100% | 55.9% → 23.3% | 94.5% → 71.7% |

**The second column is the sentence *"only something you can lose"* as a number.** Under the old table,
of every maximally-virtuous career whose ladder moved at all, **94.5% moved DOWN first**. Under the new
one it is 31.9%: the first thing the ladder does to a virtuous player is now **more than twice as
likely to be a promotion as a demotion**, and for `virtueLoyal` three times as likely.

**The specific experience the brief was written to end is gone.** A rung fall within the first two
decisions goes from 3.75% to **0.00%** for every non-mercenary profile — zero careers in 7,200. The
3.75% figure being *identical* across `virtueAmbitious`, `virtueLoyal` and `good` under the old table
is itself the finding: the early fall was **unrelated to how well you played**, because the opening
cards fire before any policy difference has accumulated and a 1-point buffer catches all of them.

Mercenary profiles keep falling, as required — `lazyFull` still falls a rung inside five decisions in
71.7% of careers and still finishes below rung 2 in 78% of them.

### 3.4 — How many rung changes a career sees at all (the failure mode on the other side)

| profile | rung changes/career | **upward** moves | **downward** moves | careers whose ladder never moves |
|---|---|---|---|---|
| `virtueAmbitious` | 0.80 → **0.50** | 0.36 → **0.34** | 0.44 → **0.16** | 60.2% → **66.1%** |
| `virtueLoyal` | 0.64 → **0.29** | 0.28 → **0.20** | 0.36 → **0.08** | 69.5% → **79.3%** |
| `good` | 1.25 → **0.60** | 0.42 → **0.22** | 0.83 → **0.38** | 35.7% → **69.1%** |
| `baselineRandom` | 2.50 → 2.47 | 0.39 → 0.41 | 2.11 → 2.06 | 0.4% → 2.0% |
| `lazyFull` | 2.95 → **2.98** | 0.49 → 0.53 | 2.45 → 2.46 | 0.0% → 0.0% |
| `saboteurFull` | 2.93 → **2.97** | 0.48 → 0.52 | 2.45 → 2.45 | 0.0% → 0.0% |

**This is the one metric the change moves in the unwanted direction, and it is reported as such.** The
ladder is quieter for virtuous and `good` careers: 66% of `virtueAmbitious` careers now never see a
rung change, up from 60%.

Three reasons this is judged acceptable rather than a defect, in descending order of confidence:

1. **The loss is almost entirely downward movement.** `virtueAmbitious` upward moves are essentially
   unchanged (0.36 → 0.34) while downward moves fall by 64% (0.44 → 0.16). The ladder did not go quiet;
   it stopped shouting in one direction.
2. **The remaining movement means something it did not mean before.** Under 85/70 an "up" was almost
   always *climbing back from a fall* — the top rung was out of play, so there was nothing above the
   starting rung to climb to. Under 80/66, 23% of virtuous careers reach a rung that **no career could
   previously occupy**. Same count of ups, a destination that now exists.
3. **Mercenary careers move slightly MORE** (2.95 → 2.98, 2.93 → 2.97), because the extra 66–70 rung
   boundary is one more thing to fall through on the way down.

The honest residual: **`good` is the profile that got quietest** (35.7% → 69.1% never moving). `good`
optimises draft stock and is indifferent to character; its median Δ is +1. A ladder that stays still
for a player who is neither building nor destroying standing is arguably correct, but this is the
number to watch if the next playtest reports the locker room as gone quiet. It is the named falsifier
for this change.

## 4. Why 80 and 66 specifically, and the two alternatives that were measured

The brief's numbers were adopted, but not on the brief's reasoning for `66`.

**80** — the sweep ran the top floor from 76 to 85 against the same 14,400 careers:

| top floor | 76 | 78 | **80** | 82 | 84 | 85 |
|---|---|---|---|---|---|---|
| `virtueAmbitious` ever reaches | 59.1% | 40.3% | **23.1%** | 10.1% | 4.1% | 2.3% |
| `virtueLoyal` ever reaches | 56.8% | 33.7% | **15.7%** | 5.2% | 1.4% | 0.5% |
| `good` ever reaches | 23.0% | 8.9% | **1.8%** | 0.4% | 0.2% | 0.1% |

76 and 77 fail the brief's own test — a majority of virtuous careers reach the rung, so it is not rare.
78 puts `good` at 8.9%, which starts to read as ordinary. **80 is the highest floor at which the rung
is genuinely in play and the lowest at which `good` stays under 2%.** Endorsed as proposed.

**66** — the brief's stated reason is *"the smallest character effect in the bundle is 1, so a single
bad card can no longer move the marker."* That argument is too weak for the number it is defending: it
is equally satisfied by a floor of **69**. The number is defensible on a measurement the brief did not
have. The bundle's authored negative `character` outcomes, counted directly from `CONTENT`:

| size | −1 | −2 | −3 | −4 | −5 | −6 | −8 | −9 | −10 | ≤−13 |
|---|---|---|---|---|---|---|---|---|---|---|
| count | 11 | 18 | 9 | 11 | 5 | 3 | 2 | 5 | 4 | 4 |

72 negative outcomes. A buffer of **4 absorbs 49 of them (68%)**; a buffer of 3 absorbs 53%, a buffer
of 1 absorbs 15%. **66 is the floor at which two thirds of the bundle's single bad cards cannot move
the marker** — that is the real argument, and it is the one that belongs in the code comment.

**The alternatives, measured, in case the board weighs §3.4 differently:**

| candidate | `vA` first-move-down | `vA` rung changes | `vA` never moves | falls within 5 |
|---|---|---|---|---|
| 85/70 (old) | 37.6% | 0.80 | 60.2% | 11.4% |
| 80/68 | 21.8% | 0.76 | 55.5% | 4.42% |
| **80/67** | 15.4% | 0.61 | **61.6%** | 0.83% |
| **80/66 (shipped)** | 10.8% | 0.50 | 66.1% | 0.21% |
| 80/65 | 7.0% | 0.44 | 69.9% | 0.00% |

**`80/67` is the genuine alternative and is recorded here for the board rather than buried.** It holds
ladder activity at exactly the old level (61.6% never-moves against the old 60.2%, versus 66.1% at
`66`) while still eliminating the decision-2 fall entirely, at the cost of a 4× higher early-fall rate
and a weaker buffer (53% of bad cards absorbed, against 68%).

**`66` was shipped** because the buffer argument is the stronger of the two and the metric `67` protects
is the one that improves in composition anyway (§3.4 reason 1). **If the next playtest reports the
ladder as inert rather than fair, `67` is the one-character change that answers it** and the sweep is
already in `rung-probe.ts` to re-check it.

## 5. Per-position, so the pooled figures are not hiding a cell

Careers ever touching the top rung, **new (old)**:

| profile | QB | OSKILL | OL | DL | DSKILL | K |
|---|---|---|---|---|---|---|
| `virtueAmbitious` | 30.3% (3.0%) | 20.5% (2.5%) | 21.3% (1.5%) | 23.3% (2.5%) | 20.5% (1.5%) | 22.8% (2.5%) |
| `virtueLoyal` | 20.3% (1.3%) | 20.5% (0.3%) | 12.5% (0.3%) | 14.0% (0.3%) | 13.0% (0.0%) | 13.8% (1.0%) |
| `good` | 1.8% (0.3%) | 1.5% (0.0%) | 0.5% (0.0%) | 2.0% (0.0%) | 2.0% (0.0%) | 3.0% (0.5%) |
| `baselineRandom` | 0.0% | 0.3% | 0.0% | 0.0% | 0.0% | 0.0% |
| `lazyFull` / `saboteurFull` | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% |

First rung change is downward, share of all careers, **new (old)**:

| profile | QB | OSKILL | OL | DL | DSKILL | K |
|---|---|---|---|---|---|---|
| `virtueAmbitious` | 8.0% (33.8%) | 12.5% (38.3%) | 13.8% (37.8%) | 7.5% (36.0%) | 12.0% (41.0%) | 11.0% (39.0%) |
| `virtueLoyal` | 5.0% (27.5%) | 4.5% (30.0%) | 5.3% (33.8%) | 4.5% (28.5%) | 6.0% (32.8%) | 5.0% (27.8%) |
| `good` | 29.8% (64.8%) | 30.3% (65.8%) | 34.0% (68.5%) | 25.3% (61.5%) | 29.5% (65.3%) | 25.8% (59.0%) |
| `lazyFull` | 99.8% (100%) | 100% | 100% | 100% | 100% | 100% |

No cell is an outlier. QB is the most generous at the top (30.3%) and K the least (22.8%) for
`virtueAmbitious`; the spread is 10 points and every cell is well under half.

## 6. The two identity checks, both ways round

**Non-vacuous rule — the display MUST move.** It does. `human-lazy-probe` band occupancy shifts in 432
lines of diff across all six positions and every profile (e.g. `baselineRandom` QB *"the staff trusts
you"* 0.010 → 0.045). The §3 tables are the full account.

**Balance identity — the numbers MUST NOT move.**

| baseline | result |
|---|---|
| `npm run balance` (2,000 runs: `draftedRate`, `bustedRate`, undrafted, draft stock, OVR percentiles) | **byte-identical** |
| `virtue-probe` 200 runs × 6 profiles × 6 positions (77 KB of character deltas, bust rates, card accounting) | **byte-identical** |
| `human-lazy-probe` 200 runs × all cells | **every field identical except the three trust-band phrase keys** — no draft, bust, overall or character statistic moved |

Confirmed by key-name extraction over the diff: the only keys that changed anywhere are `"they would
run through a wall for you"`, `"the staff trusts you"` and `"just a guy in the building"`. This is
display calibration and it changed only the display.

## 7. Constraints

- **`TRUST_BANDS` stays phrases-only.** Two integers changed inside the boundary; nothing was exported
  and no new consumer was added. `TRUST_LADDER` is still `TRUST_BANDS.map(b => b.phrase)` and
  `trustRungOf` still returns an index. No threshold, count or `character` value is reachable through
  the module. `bands.ts`'s header claim remains true.
- **No engine or content edit.** `STARTING_CHARACTER` is untouched at 70; the bands moved around it.
  `src/engine/**` and `src/content/**` are clean in `git status`.
- **Nothing forbidden was displayed.** No tier, `draftStock`, `probability`, `weight`, EV or trait name.
- **`view-model.ts` is still the only module reading `GameState`.** Not modified.
- **Stayed out of B82's lane.** No change to `src/content/**`, the event-outcome path, `reducer.ts` or
  the summary screen. `reducer.ts` calls `trustPhrase` and is unmodified.

## 8. Files changed

| file | change |
|---|---|
| `src/ui/session/bands.ts` | `TRUST_BANDS` floors `85 → 80`, `70 → 66`, plus the derivation as a comment |
| `src/sim/human-lazy-probe.ts` | `TRUST_BAND_FLOORS`, the sim-side copy pinned equal to the UI table |
| `src/ui/session/bands.test.ts` | boundaries updated + 2 new tests (below) |
| `src/sim/rung-probe.ts` | **new** — the trajectory probe |
| `src/sim/rung-probe.test.ts` | **new** — 9 tests |

### Tests changed, named as the brief requires

Two existing assertions described the old calibration and were updated. **Neither was weakened.**

1. `bands.test.ts` → *"changes at each documented boundary"* — edge list `[30, 50, 70, 85]` →
   `[30, 50, 66, 80]`. Same assertion, new thresholds.
2. `bands.test.ts` → *"says nothing when there is nothing to say"* — the same-rung case
   `trustMove(trustPhrase(70), trustPhrase(84))` was chosen as two values inside the old second band.
   Under the new table 70 and 84 straddle the top floor and it correctly returns `"up"`. Replaced with
   `trustMove(trustPhrase(66), trustPhrase(79))`, two values inside the **new** second band. The
   property under test — same rung reports nothing — is unchanged.

Two tests were **added** to `bands.test.ts`, stating the change as a property rather than a constant:

- *"does not drop a starting career a rung on one bad card"* — asserts the marker does not move for a
  hit of 1, 2, 3 or 4 from `FRESH.character`, i.e. 49 of the bundle's 72 negative outcomes.
- *"puts the top rung inside the reach of a virtuous career"* — asserts +14 from the start (virtue's
  measured ceiling) crosses a rung boundary. **This is the test that fails if anyone restores 85.**

`bands.test.ts` was confirmed to fail 4/21 before the implementation landed and pass 21/21 after.

## 9. Verification

| check | result |
|---|---|
| `npm test` | **739 passed**, 42 files. 728 before, +9 `rung-probe.test.ts`, +2 `bands.test.ts` |

*(A later run of the same tree reports 740. The extra test is B82's, landing in the concurrent
lane's unstaged working-tree changes to `view-model.ts` / `CareerScreen.tsx`; it is not part of this
diff and none of those files are staged here. 739 is the number for this change alone.)*
| `npm run typecheck` (both passes) | **exit 0** |
| `npm run build` | clean, 397.58 kB |
| balance identity | see §6 |

### Clicked through at `localhost:5173`

1. **A restored career already on the summary screen rendered the top rung occupied** — *"they would
   run through a wall for you / YOU ENDED HERE"*, with the other four rungs listed beneath it. This is
   a career that under 85/70 would have read *"the staff trusts you"*. The summary ladder marks the
   right rung and the top rung is occupiable in the shipped build, not only in the probe.
2. **A fresh career reads *"the staff trusts you"*** at `character` 70 — the start still sits in the
   second band, one rung below the top, as intended.
3. **A rung change still renders its callout correctly.** Taking the corrosive option on *Family
   Business* printed *"a problem they are managing"* with **"Down from 'the staff trusts you'"**
   beneath it and *"Cost you in the locker room."* on the card — the large, clear callout the 053
   playtest singled out, unchanged and naming the rung left behind.
4. **The marker clears on the following card**, leaving the bare phrase with no stale direction line.

**One note for the board:** clicking *New career* to run check 2 replaced the in-progress save in that
browser's `localStorage`. The finished career from check 1 was already on its summary screen and
remains in *Past careers*.

## 10. No proposals for frozen code

None. This task needed no engine or content change, exactly as DECISION 080 predicted.
