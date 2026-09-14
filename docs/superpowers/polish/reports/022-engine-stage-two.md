# 022 — Engine stage 2: the three approved changes, as measured

**Type:** developer · **Wave:** 9 · **Status:** done
**Brief:** `briefs/022-engine-stage-two.md` · **Implements:** DECISIONS 038, 039 (completing 029)

---

## 1. The bit-identity check — the part that matters

**It held. Every full-eligibility profile came back identical on every field, not merely to four
decimal places.**

`npx tsx src/sim/failure-probe.ts 3000 all QB`, run before any edit and again after all three
changes. The comparison is a field-by-field `JSON.stringify` equality over the whole
`FailureReport` object — all ~40 fields, including `roundShare`, `stockHistogram` and
`stockCountsByClass`, not just the nine printed below.

| profile (full eligibility) | picked | round 1 | undrafted | busted | avg stock | avg final OVR | avg seasons | avg snaps | verdict |
|---|---|---|---|---|---|---|---|---|---|
| `good` | 0.9783 → 0.9783 | 0.5270 → 0.5270 | 0.0000 → 0.0000 | 0.0217 → 0.0217 | 88.8487 → 88.8487 | 90.5517 → 90.5517 | 4.9490 → 4.9490 | 1449.9547 → 1449.9547 | **identical** |
| `goodStay` | 0.9670 → 0.9670 | 0.5720 → 0.5720 | 0.0000 → 0.0000 | 0.0330 → 0.0330 | 90.2134 → 90.2134 | 91.2303 → 91.2303 | 4.9263 → 4.9263 | 1717.5827 → 1717.5827 | **identical** |
| `goodUp` | 0.9783 → 0.9783 | 0.5270 → 0.5270 | 0.0000 → 0.0000 | 0.0217 → 0.0217 | 88.8487 → 88.8487 | 90.5517 → 90.5517 | 4.9490 → 4.9490 | 1449.9547 → 1449.9547 | **identical** |
| `randomFull` | 0.9730 → 0.9730 | 0.1527 → 0.1527 | 0.0003 → 0.0003 | 0.0267 → 0.0267 | 76.4192 → 76.4192 | 82.1453 → 82.1453 | 4.7253 → 4.7253 | 1796.1117 → 1796.1117 | **identical** |
| `longStay` | 0.9713 → 0.9713 | 0.1667 → 0.1667 | 0.0003 → 0.0003 | 0.0283 → 0.0283 | 76.7389 → 76.7389 | 82.2700 → 82.2700 | 4.7297 → 4.7297 | 1846.2947 → 1846.2947 | **identical** |
| `longUp` | 0.9747 → 0.9747 | 0.1023 → 0.1023 | 0.0013 → 0.0013 | 0.0240 → 0.0240 | 73.9997 → 73.9997 | 80.9590 → 80.9590 | 4.7360 → 4.7360 | 1572.5603 → 1572.5603 | **identical** |
| `lazyFull` | 0.9840 → 0.9840 | 0.0000 → 0.0000 | 0.0033 → 0.0033 | 0.0127 → 0.0127 | 60.2248 → 60.2248 | 71.4477 → 71.4477 | 3.9750 → 3.9750 | 1950.4720 → 1950.4720 | **identical** |
| `saboteurFull` | 0.9837 → 0.9837 | 0.0000 → 0.0000 | 0.0033 → 0.0033 | 0.0130 → 0.0130 | 60.2280 → 60.2280 | 71.4483 → 71.4483 | 3.9750 → 3.9750 | 1950.4720 → 1950.4720 | **identical** |
| `antisocialFull` | 0.8723 → 0.8723 | 0.0517 → 0.0517 | 0.0003 → 0.0003 | 0.1273 → 0.1273 | 74.2227 → 74.2227 | 82.8300 → 82.8300 | 3.9207 → 3.9207 | 1934.3927 → 1934.3927 | **identical** |

Report 018 §4 item 1 named six of these (`good`, `goodStay`, `randomFull`, `longStay`, `lazyFull`,
`antisocialFull`) and every one matches its predicted value exactly. The three extra rows
(`goodUp`, `longUp`, `saboteurFull`) are the other profiles that play out their eligibility; they
are included because they are the same test and they pass it too.

**Round-1 rates did not move for anyone** — not for the full-eligibility rows above, and not for a
single early-declaring row either. The floor (35) and the band divisor (9.3) are untouched, so no
career crossed a round boundary it was not already on.

### The rows that were expected to move, and did — to the predicted value

| profile | picked, predicted | picked, measured | undrafted before → after |
|---|---|---|---|
| `baselineRandom` | 0.945 → 0.864 | **0.9450 → 0.8640** | 0.0407 → 0.1217 |
| `goodEarly` | 0.952 → 0.765 | **0.9520 → 0.7650** | 0.0343 → 0.2213 |
| `randomEarly` | 0.914 → 0.739 | **0.9143 → 0.7393** | 0.0773 → 0.2523 |
| `antisocialEarly` | 0.960 → 0.808 | **0.9603 → 0.8080** | 0.0337 → 0.1860 |
| `lazyEarly` | 0.892 → 0.563 | **0.8920 → 0.5633** | 0.1040 → 0.4327 |

All five landed on their predicted figure. The 014 playtester's career (`lazyEarly`) goes from
**89.2% drafted to 56.3%**, and its mean draft stock from 42.9260 to 34.9260 — exactly 8, and now
one hundredth of a point below the undrafted floor, which is what "8 is the measured gap" meant.

Five further rows moved that report 018's table did not list: `saboteurEarly` (identical to
`lazyEarly` to four decimals, as DECISION 038 already recorded — trying to lose is indistinguishable
from not trying) and the four `offseason*` profiles, which leave the declare choice random and so
contain early declarers by construction. Their movement is the same movement, not a second effect:
picked 0.9357–0.9390 → 0.8520–0.8557, round-1 unchanged in every case.

### `balance.ts` — one field moved, across all six positions

`npx tsx src/sim/balance.ts 3000 random all`. **`undraftedRate` is the only field in the entire
report that changed, at any position.** `round1Rate`, `bustedRate`, `washoutRate`, `allConfRate`,
`avgSeasons`, `avgInjuries`, `injuredRate`, every character metric and every overall metric are
bit-identical.

| position | picked before → after | undrafted before → after | round 1 | busted |
|---|---|---|---|---|
| QB | 0.9333 → 0.8343 | 0.0527 → 0.1517 | 0.0247 → 0.0247 | 0.0140 → 0.0140 |
| OSKILL | 0.9263 → 0.8240 | 0.0527 → 0.1550 | 0.0203 → 0.0203 | 0.0210 → 0.0210 |
| OL | 0.9533 → 0.8637 | 0.0340 → 0.1237 | 0.0293 → 0.0293 | 0.0127 → 0.0127 |
| DL | 0.9400 → 0.8367 | 0.0470 → 0.1503 | 0.0220 → 0.0220 | 0.0130 → 0.0130 |
| DSKILL | 0.9307 → 0.8303 | 0.0523 → 0.1527 | 0.0227 → 0.0227 | 0.0170 → 0.0170 |
| K | 0.8997 → 0.7910 | 0.0750 → 0.1837 | 0.0057 → 0.0057 | 0.0253 → 0.0253 |

K is the sharpest slice, as DECISION 038 anticipated. The retired STAGE4-HANDOFF band (0.85–0.95) is
breached at every position on this harness, deliberately and per DECISION 038.

**Conclusion: the penalty did not leak.** It is charged at the draft and nowhere else.

---

## 2. Change 1 — `EARLY_DECLARE_PENALTY = 8`

`src/engine/draft.ts`. `deriveDraftStock` is **byte-identical** — the diff touches only the new
constant and `computeDraftResult`'s first statement:

```ts
export const EARLY_DECLARE_PENALTY = 8;

export function computeDraftResult(state: GameState, rng: Rng): DraftResult {
  const stock = Math.max(
    0,
    deriveDraftStock(state) -
      (state.eligibility.classYear === "SR" ? 0 : EARLY_DECLARE_PENALTY),
  );
```

`UNDRAFTED_FLOOR` stays 35; the 9.3 band divisor stays 9.3. The constant is exported from `draft.ts`
for its tests but **not** re-exported from `src/engine/index.ts`, so the engine's public surface is
still the same five export statements.

Six new tests in `src/engine/draft.test.ts` pin the change, two of them as standing guards against
the leak the brief exists to prevent:

- `does not leak into deriveDraftStock` — FR, SO and JR derive identical stock, and a SR differs by
  `classPart` 2 and never by 8.
- `does not leak into eligibleTiers` — the 25/45/70 gates are re-asserted against **junior** states,
  the class the offer ladder actually matters for. If the penalty ever migrates into the shared
  function, this fails.

### The two existing tests that changed, and what each was pinning

Both failures had the same cause: `createCareer` returns a **FR**, so two fixtures that were written
to pin band arithmetic would now silently be charged the penalty and become penalty tests.

1. **`maps elite stock to round 1 with a valid overall pick`** pinned the *top* of the round-band
   arithmetic — maximal stock lands in round 1, and the pick stays inside a 32-team round. It was
   never a statement about early declaring; the fixture was a freshman only by accident of `base()`.
   **Fix: the fixture is now a senior**, which is the player the assertion is about — a decorated,
   elite, fully-eligible prospect. The new value is right because the band arithmetic is unchanged
   (stock 93 → round 1, as before); only the fixture's class year was wrong for what it claims.
   *Numbers were not updated to go green:* the asserted round is still 1.

2. **`undrafted floor: stock 34 is undrafted, 35 is drafted in round 7`** pinned
   `UNDRAFTED_FLOOR = 35` and the round-7 band edge. DECISION 038 leaves the floor untouched, so
   this test must keep asserting exactly what it asserted. But the floor is now compared against the
   stock *after* the penalty, and only a senior's draft-time stock equals his derived stock — a
   freshman fixture would be measuring the penalty, not the floor. **Fix: a second helper,
   `srStockState`, builds the same target stock as a senior** (compensating for `classPart` 2), with
   a new test proving the helper hits its target exactly. The assertions themselves are byte-for-byte
   the ones that were there: 34 undrafted, 35 in round 7.

The original FR-based `stockState` helper is kept and still used by the `deriveDraftStock` and
`eligibleTiers` boundary tests, which are unaffected by the change and should stay that way.

---

## 3. Change 2 — `SeasonLine.redshirt`

Additive, matching DECISION 009's shape including its treatment of saves written before the field
existed:

- **`src/engine/types.ts`** — `redshirt?: boolean`, optional. `undefined` means "this save predates
  the field", which is not the same as `false`; a consumer renders the absence rather than asserting
  the season was played.
- **`src/engine/advance.ts:289`** — the kickoff push. `redshirtSeasonActive` is set by `applyChoice`
  during the preceding offseason and cleared by `enterOffseason` at the *next* boundary, so at the
  instant of the push it is true for exactly the season being sat out.

### A second write site the proposal missed

Report 020 named `advance.ts` as "the one write, at the existing push site". **It is not the only
one.** `src/engine/recruiting.ts:45` (`newSeasonLine`, called from `applyRecruitingChoice`) creates
the **FR line at Signing Day**, and `autoProgress`'s kickoff push is then skipped for season 0
because a line for it already exists. Writing the flag only in `advance.ts` left every career's
first row `undefined` — a live career claiming it did not know its own freshman year.

Measured before the fix: **12,000 of 12,000 careers had exactly one `undefined` season, all at
index 0.** After adding `redshirt: state.redshirtSeasonActive` at that site: **0**. Signing Day is
the first decision of a career, before any offseason hub, so the value read there is always `false`;
it is read rather than hardcoded for the same reason `overall` and `classYear` beside it are.

### Correctness, measured

12,000 careers (6 positions × 2,000, `randomPolicy`):

| | count |
|---|---|
| careers with `redshirtUsed` | 9,206 |
| …with exactly one flagged season | **9,175** |
| …with more than one flagged season | **0** |
| careers without `redshirtUsed` carrying any flag | **0** |
| season lines with `redshirt === undefined` | **0** (was 36,619 → 12,000 at index 0) |

The 31 careers with `redshirtUsed` and no flagged season were inspected individually: **all 31 are
`busted`, all with a career-ending injury, and in every case the sat season has no line at all**
because `tickPhaseStart` ended the career before the kickoff push. There is nothing to flag — the
season was never recorded. This is correct behaviour, not a gap.

### Additive: byte-identical on three seeds

`npm run play -- <seed> random` (the summary JSON does not include `seasons[]`, so it is the right
oracle for "nothing else moved"):

```
$ diff before/play-alpha.json   after/play-alpha.json     # empty
$ diff before/play-bravo.json   after/play-bravo.json     # empty
$ diff before/play-charlie.json after/play-charlie.json   # empty
```

Empty on all three, measured after change 2 and before changes 1 and 3.

**The UI half is not in this change.** `src/ui/**` is untouched, and `classYearLabel` stays derived
from sequence per DECISION 039.

---

## 4. Change 3 — the `FG -1` floor

`src/engine/effects.ts`, the `stat` case:

```ts
if (s) s.stats[effect.stat] = Math.max(0, (s.stats[effect.stat] ?? 0) + effect.amount);
```

Measured over 9,000 careers (6 positions × 1,500, `randomPolicy`), careers carrying at least one
negative stored stat:

| | before | after |
|---|---|---|
| careers with a negative season stat | **82** | **0** |
| …of which had redshirted | 79 (96%) | — |

Per stat: `K:fieldGoals` 38, `DL:sacks` 19, `DSKILL:tackles` 10, `QB:passYards` 7, `OL:pancakes` 6,
`OSKILL:scrimmageYards` 2. The redshirt concentration confirms the mechanism in DECISION 039:
`sitSnapModifier: 0.05` rounds generated production to 0, so an authored `-1` has nothing to eat.

**Zero balance effect, and the bit-identity table above is the proof** — this change was in place for
that run, and every full-eligibility row is identical on `avgCareerSnaps`, `avgFinalOverall` and
`avgDraftStock`. Season stats feed only `resolveAwards`, which reads them as thresholds a negative
value could never have crossed anyway.

Five new tests in `src/engine/effects.test.ts` cover the floor, the clamp-not-saturate case, and
that ordinary subtraction and positive effects are unchanged.

### The other effect kinds that can go negative — findings, not fixes

Every kind was checked. `overall` and `injury` go through `clampOverall` (0–99); `character` through
`clampCharacter` (0–100); `trophy` only ever increments. Two kinds have no lower bound:

1. **`stat`** — fixed above.
2. **`snaps`** — **not fixed, and this needs a decision.** `applyEffect` does
   `s.snaps += effect.amount` with no floor, and content authors three negative snap effects
   (`season-life.ts:156` −15, `offfield.ts:496` −20, `dskill.ts:308` −8). Measured over the same
   9,000 careers: **15 careers store a negative `snaps` on a season line, and all 15 redshirted** —
   mechanically the identical bug.

   **I did not fix it, deliberately.** It is the same *mechanism* but not the same *change*.
   `snaps` is not a display value: `productionScore` sums `seasons[].snaps` across a career and
   feeds `deriveDraftStock`, so clamping it is a balance change. It would alter draft stock for
   careers that are full-eligibility five-season careers — precisely the rows DECISION 038 requires
   to come back bit-identical — and would confound the acceptance test this whole brief is built
   around. The magnitude is small (0.17% of careers, ≤20 snaps against 200 snaps per stock point,
   so at most 1 stock point) but it is not zero, and no decision covers it.

   **Recommendation: a one-line follow-up decision.** The fix is
   `s.snaps = Math.max(0, s.snaps + effect.amount)` and the acceptance test is the same probe re-run.
   DECISION 039 item 2 called the `stat` case "a bug, nothing outstanding"; this one deserves the
   same sentence plus an explicit note that it moves the full-eligibility rows by a hair.

---

## 5. Verification

| check | result |
|---|---|
| `npx tsx src/sim/failure-probe.ts 3000 all QB` | exit 0; full-eligibility rows identical on every field |
| `npx tsx src/sim/balance.ts 3000 random all` | exit 0; `undraftedRate` the only field that moved |
| `npm run play -- <3 seeds> random` | empty diff on all three (change 2) |
| `npm test` | **560 passed / 560**, 37 files, exit 0 (baseline 545; +15 new, 2 updated) |
| `tsc -p tsconfig.engine.json` (pass 1) | **exit 0** |
| `tsc -p tsconfig.json` (pass 2) | **exit 2 — 7 errors, all in `src/ui/**`, none mine.** See below. |

### The second typecheck pass fails on the UI agent's in-flight work

All seven errors are missing-property errors on two fields that exist only in
`src/ui/session/types.ts` — `Resolved.hub` and `CareerView.decisionNote` — in
`src/ui/session/reducer.ts`, `view-model.ts`, `storage.test.ts` and `view-model.test.ts`. The UI
agent has added both fields to the types and has not yet finished updating every construction site.

Neither symbol exists anywhere in `src/engine/**`, no error mentions `SeasonLine`, `redshirt`,
`draftStock` or `EARLY_DECLARE_PENALTY`, and the engine-only pass exits 0. I have not touched
`src/ui/**`. Per the brief, this is reported and left alone. **No UI test fails** — the whole suite
is green; it is only the second typecheck pass.

---

## 6. Files changed

| file | change |
|---|---|
| `src/engine/draft.ts` | `EARLY_DECLARE_PENALTY = 8`, applied in `computeDraftResult` only |
| `src/engine/draft.test.ts` | 2 fixtures made senior (with reasons), +1 helper test, +6 penalty/leak tests |
| `src/engine/types.ts` | `SeasonLine.redshirt?: boolean` |
| `src/engine/advance.ts` | kickoff push writes the flag |
| `src/engine/recruiting.ts` | Signing Day's FR line writes the flag (second write site, not in the proposal) |
| `src/engine/advance.test.ts` | +3 tests on the flag |
| `src/engine/effects.ts` | `stat` effects floored at zero |
| `src/engine/effects.test.ts` | +5 tests on the floor |

`src/ui/**`, `src/content/**`, `STATE.md` and `DECISIONS.md` untouched.

## 7. Reproducing

```
npx tsx src/sim/failure-probe.ts 3000 all QB
npx tsx src/sim/balance.ts 3000 random all
npm test && npm run typecheck
```

---

## 8. DECISION 040 — the `snaps` floor lands, and the baseline moves with it

Added after §1–§7 were written. §1 is left exactly as it was: it is the record of the
early-declare leak check, that test passed, and it is banked. **The numbers below supersede it as
the reference.**

### The change

`src/engine/effects.ts`, the `snaps` case, as specified in §4 and approved in DECISION 040:

```ts
if (s) s.snaps = Math.max(0, s.snaps + effect.amount);
```

Four new tests in `src/engine/effects.test.ts`. Negative stored values over 9,000 careers
(6 positions × 1,500, `randomPolicy`), the same probe as §4:

| | before 022 | after §4 (`stat` only) | after DECISION 040 |
|---|---|---|---|
| careers with a negative season stat | 82 | **0** | **0** |
| careers with negative season snaps | 15 | 15 | **0** |

---

### ⚠️ THE NEW BASELINE — full eligibility, `failure-probe.ts 3000 all QB`

**This table, not §1's and not 018 §4's, is the reference for any future engine change.** A
comparison against the older tables will show a difference in the third and fourth decimal place;
that difference is DECISION 040, not a regression.

| profile (full eligibility) | picked | round 1 | undrafted | busted | avg stock | avg final OVR | avg snaps |
|---|---|---|---|---|---|---|---|
| `good` | 0.9783 | 0.5270 | 0.0000 | 0.0217 | **88.8521** | **90.5530** | **1450.1907** |
| `goodStay` | 0.9670 | 0.5720 | 0.0000 | 0.0330 | **90.2168** | **91.2323** | **1717.8387** |
| `goodUp` | 0.9783 | 0.5270 | 0.0000 | 0.0217 | **88.8521** | **90.5530** | **1450.1907** |
| `randomFull` | 0.9730 | 0.1527 | 0.0003 | 0.0267 | **76.4209** | **82.1457** | **1796.2133** |
| `longStay` | 0.9713 | 0.1667 | 0.0003 | 0.0283 | **76.7407** | **82.2703** | **1846.3633** |
| `longUp` | 0.9747 | 0.1023 | 0.0013 | 0.0240 | **74.0010** | **80.9597** | **1572.6533** |
| `lazyFull` | 0.9840 | 0.0000 | 0.0033 | 0.0127 | **60.2259** | **71.4480** | **1950.5070** |
| `saboteurFull` | 0.9837 | 0.0000 | 0.0033 | 0.0130 | **60.2290** | **71.4487** | **1950.5070** |
| `antisocialFull` | 0.8723 | 0.0517 | 0.0003 | 0.1273 | 74.2227 | 82.8300 | 1934.3927 |

Bolded cells moved from §1; the rest are unchanged. **`picked`, `round 1`, `undrafted` and `busted`
did not move for a single full-eligibility profile** — every change is in the third or fourth decimal
of a mean. `antisocialFull` is untouched on every field.

### The new baseline, early and mixed profiles

| profile | picked | round 1 | undrafted | busted | avg stock | avg final OVR | avg snaps |
|---|---|---|---|---|---|---|---|
| `baselineRandom` | 0.8640 | 0.0317 | 0.1217 | 0.0143 | **54.7301** | **73.2800** | **1081.9477** |
| `goodEarly` | 0.7650 | 0.0000 | 0.2213 | 0.0137 | **40.8310** | **71.0003** | **451.8873** |
| `randomEarly` | 0.7393 | 0.0000 | 0.2523 | 0.0083 | 42.4901 | 69.2073 | **715.0103** |
| `antisocialEarly` | 0.8080 | 0.0000 | 0.1860 | 0.0060 | 40.8974 | 70.1503 | 986.1737 |
| `lazyEarly` | 0.5633 | 0.0000 | 0.4327 | 0.0040 | **34.9264** | 64.6607 | **978.7193** |
| `saboteurEarly` | 0.5633 | 0.0000 | 0.4327 | 0.0040 | **34.9264** | 64.6607 | **978.7193** |
| `offseasonStay` | 0.8540 | 0.0347 | 0.1277 | 0.0183 | **54.3705** | **73.0917** | **1088.7907** |
| `offseasonUp` | 0.8520 | 0.0190 | 0.1327 | 0.0153 | **52.8534** | **72.4717** | **963.4883** |
| `offseasonUpOrLateral` | 0.8533 | 0.0227 | 0.1323 | 0.0143 | **53.4349** | **72.7103** | **992.5807** |
| `offseasonLateral` | 0.8557 | 0.0353 | 0.1267 | 0.0177 | **55.2307** | **73.3887** | **1143.9200** |
| `offseasonRandom` | 0.8640 | 0.0317 | 0.1217 | 0.0143 | **54.7301** | **73.2800** | **1081.9477** |

**Every headline rate — `picked`, `round 1`, `undrafted`, `busted` — is unchanged for all eleven.**
The early-declare penalty's effect, the thing §1 measured, is completely intact.

### `balance.ts 3000 random all` — the new baseline

| position | picked | undrafted | round 1 | busted | avg final OVR |
|---|---|---|---|---|---|
| QB | 0.8343 | 0.1517 | **0.0250** | 0.0140 | **72.9510** |
| OSKILL | 0.8240 | 0.1550 | 0.0203 | 0.0210 | **72.5600** |
| OL | 0.8637 | 0.1237 | 0.0293 | 0.0127 | **73.6570** |
| DL | 0.8367 | 0.1503 | 0.0220 | 0.0130 | **72.9360** |
| DSKILL | 0.8303 | 0.1527 | 0.0227 | 0.0170 | **72.9400** |
| K | **0.7913** | **0.1840** | 0.0057 | **0.0247** | **72.7433** |

K is the only position whose `picked` rate moved at all (0.7910 → 0.7913, i.e. one career in 3,000).

---

### Magnitude check against DECISION 040's stated bound

Measured exactly, not inferred: a **pre-clamp copy of the engine** was built in the scratchpad
(identical but for that one line) and the full 20-profile × 6-position grid was played on **identical
seeds** through both, comparing career by career. n = 60,000 careers.

| | measured | DECISION 040's bound | |
|---|---|---|---|
| careers whose career-total snaps changed | 383 (**0.6383%**) | — | — |
| careers whose **draft stock** changed | 61 (**0.1017%**) | ≤ 0.2% | ✅ **within** |
| careers whose final OVR changed | 54 (0.09%), all **+1** | — | — |
| max change in career-total snaps | 20 | — | — |
| **max change in draft stock** | **2** | **≤ 1 point** | ❌ **exceeded** |

Distribution of the stock change, all 61 cases: **+1 on 39 careers, +2 on 22 careers.** Every single
movement is **upward**; not one career came out worse. Eight careers changed draft round —
`r4→r3` ×4, `r3→r2` ×2, `r5→r4` ×1, and one career **`undrafted → round 7`**.

### Stating it plainly: the ≤1-point half of the prediction was wrong

DECISION 040 names this as the thing that would change our mind, so it gets said without softening:
**the per-career magnitude reaches 2 draft-stock points, not the ≤1 I predicted in §4.** The share of
careers affected is comfortably inside its bound; the per-career size is not.

**Why my §4 bound was wrong.** I reasoned only through `productionScore` — ≤20 recovered snaps
against 200 snaps per stock point is ≤0.1 raw points, so "at most 1". That missed a second path.
Season snaps also feed **`developmentDelta`**:

```ts
return Math.min(cfg.devCap, Math.floor(seasonSnaps / perPoint));
```

With a *negative* `seasonSnaps`, `Math.floor` returns a **negative** value, so the bug was not merely
storing an impossible number — it was **docking the player an OVR point** for a season whose snaps
had gone negative. `overall` is weighted ×1.4 in `deriveDraftStock`, so restoring that point is worth
~1.4 raw stock on its own; combined with the recovered production and `Math.round`'s boundary, the
integer stock can move by 2. The measured OVR change confirms it exactly: 54 careers, **all +1, none
−1**.

Two worked examples from the paired run:

| seed | OVR | stock | round | season snaps, pre → post |
|---|---|---|---|---|
| `good/K/b018-72` | 83 → 84 | 71 → 73 | r4 → r3 | `[227, **−12**, 137, 202, 117]` → `[227, **4**, 137, 202, 117]` |
| `baselineRandom/OL/b018-437` | 75 → 75 | 45 → 46 | r6 → r6 | `[589, **9**, …]` → `[589, **19**, …]` |

The second shows the pure-production path with no OVR change at all: +10 snaps is +0.05 raw, and it
still moved the integer stock by 1 because `Math.round` happened to sit on a boundary. The first
shows both paths together.

### What I am not doing about it

Nothing, and this is a report rather than a `needs-decision`, for three reasons. The **direction** is
uniformly favourable and removes an unintended penalty nobody designed — a negative-snaps season was
quietly costing development, which is a strictly worse bug than the display one DECISION 040 set out
to fix. The **share** of careers is within bound. And the **headline rates are unmoved** on every
full-eligibility profile and every early profile, so nothing DECISION 038 was measured on has shifted.

But the discrepancy belongs on the record, because DECISION 040 asked for it by name and because the
next agent comparing to a table needs to know the bound in that decision reads low. **If the PM
wants the ≤1-point clause in DECISION 040 amended to ≤2 with the development path named, that is a
one-line edit to a file I do not own.**

### Verification after the clamp

| check | result |
|---|---|
| `npx tsx src/sim/failure-probe.ts 3000 all QB` | exit 0 — new baseline above |
| `npx tsx src/sim/balance.ts 3000 random all` | exit 0 — new baseline above |
| negative stored stats / snaps over 9,000 careers | **0 / 0** |
| `npm test` | **578 passed / 578**, 37 files, exit 0 |
| `tsc -p tsconfig.engine.json` (pass 1) | **exit 0** |
| `tsc -p tsconfig.json` (pass 2) | **exit 0** |

**Both typecheck passes now exit 0.** The seven `src/ui/**` errors reported in §5 are gone — the UI
agent finished the `Resolved.hub` / `CareerView.decisionNote` work while this section was being
measured. Nothing in `src/ui/**` was touched by me.

### Files changed in this section

| file | change |
|---|---|
| `src/engine/effects.ts` | `snaps` effects floored at zero |
| `src/engine/effects.test.ts` | +4 tests on the snap floor |
