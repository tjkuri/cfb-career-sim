# 040 — Getting caught has to bite

**Type:** developer (content, under an explicit freeze lift) · **Wave:** 20 · **Status:** done —
**all four acceptance criteria PASS. Six penalties derived from the shipped scorer, applied once,
not searched.**
**2026-09-15** · **Careers measured:** 72,000 (2 profiles × 6 positions × 3,000 × 2 trees, seed
prefix `b037`, home state TX — the same seeds as reports 037 and 039, so every column below is
comparable to both)
**Changed in the repo:** `src/content/events/offfield.ts` (**6 numbers**, all
`negativeOutcome` `character` amounts), `src/sim/policies.test.ts` (one assertion re-baselined, §5).
**Nothing in `src/engine/**`. No `positiveOutcome` branch touched. No probability, weight,
description or label touched.**

---

## Headline

| | |
|---|---|
| **Acceptance 1 — `good` stops cheating** | **PASS. Median final character 40–44 → 61–65**, at every position. Out of *"a problem they are managing"* and into *"just a guy in the building"*, with 6–20% now reaching *"the staff trusts you"* |
| Cards flipped | **6 of 13**, by name: `offfield-group-chat`, `offfield-money-manager`, `offfield-sportsbook-nil`, `offfield-ticket-hookup`, `offfield-ghost-media`, `offfield-portal-rumor`. The other 7 were already clean picks or are structurally unreachable (§3) |
| **Acceptance 2 — a well-played career stays safe** | **PASS, with room. `good` undrafted 0.2–0.5%**, every position, ≤1%. **Bust rate *fell*** (QB 3.0% → 1.8%) |
| **Acceptance 3 — round 1, reported not protected** | `good` round 1 falls **1.1–5.5pp** (−5% to −14% relative). **Median round is unchanged at every position.** Nowhere near the "half of today's figure" stop line |
| **Acceptance 4 — the band distribution moves** | **PASS, and it is the most visible result in the report.** `good` at *"the staff has stopped defending you"*: **12.7–19.1% → 0.0%** at all six positions. `humanLazy` **bottoms out** there: 95.6% → 96.0% at QB, and its median character is now **0** |
| The one-line answer | **`good` now picks the honest option on every band-1 off-field card, 100% of the time, and the fraction of good careers that ever fall low enough to see a band-2 card goes 90.4% → 12.6%.** Wave 19's miss was that the penalty was too small by a factor of 4 to 40; the arithmetic says exactly how much too small, and this is that number |

---

## 1. The derivation

**This is arithmetic, not a sweep. No value was tried and replaced.**

`optionScore` (`src/sim/policies.ts`) is

```
score(option) = p · S(positiveOutcome) + (1 − p) · S(negativeOutcome)
```

with `S` summing `STOCK_WEIGHTS`: **1.4** per overall point, **0.15** per character point, 0.005 per
snap, `moment`/`stat` = 0. All six caught branches in scope carry **a character effect and nothing
else**, so `S(neg) = 0.15 · a` where `a` is the authored amount. The `best` policy takes the
highest-scoring option, so flipping card *c* means

> **a < [ S(alt) − p · S(pos) ] / ( 0.15 · (1 − p) )**

where `S(alt)` is the best *other* option on that card. Every term on the right is authored content.

| card | option | p | S(pos) | p·S(pos) | best alternative | S(alt) | 0.15(1−p) | **a must be <** | **chosen a** | was |
|---|---|---|---|---|---|---|---|---|---|---|
| `offfield-group-chat` | `let-it-fly` | 0.70 | 0.80 | 0.560 | `apologize` | 0.000 | 0.0450 | **−12.444** | **−13** | −6 |
| `offfield-money-manager` | `let-him-handle-it` | 0.60 | 2.20 | 1.320 | `hire-a-professional` | 0.000 | 0.0600 | **−22.000** | **−23** | −5 |
| `offfield-sportsbook-nil` | `take-the-money` | 0.70 | 2.05 | 1.435 | `have-it-read` | 0.000 | 0.0450 | **−31.889** | **−32** | −7 |
| `offfield-ticket-hookup` | `sell-them` | 0.60 | 0.80 | 0.480 | `give-them-away` | 0.000 | 0.0600 | **−8.000** | **−9** | −6 |
| `offfield-ghost-media` | `no-show` | 0.60 | 0.80 | 0.480 | `show-up` | 0.000 | 0.0600 | **−8.000** | **−9** | −6 |
| `offfield-portal-rumor` | `let-it-work` | 0.55 | 1.60 | 0.880 | `ride-it-out` | −0.450 | 0.0675 | **−19.704** | **−20** | −9 |

`S(pos)` in full, so the table can be checked by hand:

- `let-it-fly` / `sell-them` / `no-show`: char −4 (−0.60) + ovr +1 (+1.40) = **0.80**
- `let-him-handle-it`: char −4 (−0.60) + ovr +2 (+2.80) = **2.20**
- `take-the-money`: char −5 (−0.75) + ovr +2 (+2.80) + moment (0) = **2.05**
- `let-it-work`: char −8 (−1.20) + ovr +2 (+2.80) = **1.60**

### Rounding, and the two cases that needed one extra point

The brief's rule — *"if the derivation says 12.7, use 13"* — is the next integer strictly past the
bound. That gives **−13**, **−32**, **−20** directly.

**Three bounds land on an exact integer** (−22.000, −8.000, −8.000), and there the next integer is
*not* the bound itself. `makePolicy`'s `best` branch scores with strict `>` and keeps the incumbent
on a tie, and the incumbent is `ev.options[0]` — which is the selfish option in all three of these
blocks. At −22 / −8 the score is exactly equal to the clean option's and the selfish pick **survives
the tie**. So those three take one further point: **−23, −9, −9.** This is a fact about the shipped
tiebreak, not a margin I chose.

### Resulting scores, from the shipped `optionScore` (QB; identical at all six positions — none of
these options carries an injury or suspension, the only position-dependent effects)

| card | selfish option, before → after | clean option | flips? |
|---|---|---|---|
| `offfield-group-chat` | +0.290 → **−0.025** | 0.000 | ✅ |
| `offfield-money-manager` | +1.020 → **−0.060** | 0.000 | ✅ |
| `offfield-sportsbook-nil` | +1.120 → **−0.005** | 0.000 | ✅ |
| `offfield-ticket-hookup` | +0.120 → **−0.060** | 0.000 | ✅ |
| `offfield-ghost-media` | +0.120 → **−0.060** | 0.000 | ✅ |
| `offfield-portal-rumor` | +0.273 → **−0.470** | −0.450 | ✅ |

**The "before" column reproduces report 039 §2 exactly**, which confirms the measurement is
like-for-like. **Margins are thin by construction** — the derivation asks for the smallest authored
number that flips the pick, and `take-the-money`'s margin is 0.005 stock. That is deliberate and it
is not fragile in the way a tuned constant would be: the scorer is deterministic, the probabilities
are authored, and nothing stochastic sits between the number and the decision. Anything larger would
be padding I could not justify from the content.

### The ladder

Band widths (`ui/session/bands.ts`, mirrored in the probe) are 15 / 15 / **20 / 20** / 30 points.
**−23 and −32 are each wider than a band**, so getting caught on the family-business or sportsbook
card drops the player **at least one rung from wherever he was standing**, and from mid-band the
sportsbook card drops him two. That is the brief's stated intent — *"getting caught in an NIL
scandal should be devastating to how the building sees you"* — arriving as a consequence of the
arithmetic rather than as a separate decision.

---

## 2. What is in the file

Six numbers. Nothing else in `src/content/**` was touched.

```
offfield-group-chat    / let-it-fly        negative (p 0.30)  char  −6 → −13
offfield-money-manager / let-him-handle-it negative (p 0.40)  char  −5 → −23
offfield-sportsbook-nil/ take-the-money    negative (p 0.30)  char  −7 → −32
offfield-ticket-hookup / sell-them         negative (p 0.40)  char  −6 →  −9
offfield-ghost-media   / no-show           negative (p 0.40)  char  −6 →  −9
offfield-portal-rumor  / let-it-work       negative (p 0.45)  char  −9 → −20
```

Every `positiveOutcome` is byte-identical to HEAD, so the asymmetry the user chose is intact: **get
away with it and you still gain; get caught and it is now the worst week of your career.**
`STOCK_WEIGHTS` and `src/engine/**` are untouched.

---

## 3. The seven cards that did not flip, and why — read this before assuming a shortfall

Of the 13 off-field cards in 039's table, 6 flipped. The other 7 split into two groups, and neither
is a case where a derived penalty was available and skipped.

**Four were already clean picks at HEAD** and stayed clean: `offfield-skip-install`
(`skip-the-podcast`), `offfield-training-table` (`wait-your-turn`), `offfield-bowl-curfew`
(`stay-in`), `offfield-coordinator-blowup` (`apologize-on-tape`, which *gains* +7.2 character).

**Three are structurally out of reach of this freeze lift:** `offfield-entourage`,
`offfield-curfew-check`, `offfield-exit-interview`. On each, `good` picks **`ride-it-out`** — the
passive middle option, worth −3 character. `ride-it-out` has `probability: 1` and **no
`negativeOutcome` branch at all**, so there is no caught-branch character amount to raise. The
selfish options on those three cards (`lean-in` −0.480, `stay-out` −1.399, `argue-the-tape` −0.802)
are **already net-negative in draft stock** and already score below `ride-it-out`, so the brief's
Goal — *"make the off-field temptation cards net-negative in expected draft stock"* — is already
satisfied on them and no derivation applies. Raising their caught-branch costs would change nothing
about `good` and would only deepen `humanLazy`'s losses; I did not do it, because it would be a
number with no derivation behind it.

**This turned out not to matter, for a reason the arithmetic did not predict.** Those three cards
are gated at `maxCharacter: 55`. With band 1 fixed, `good` rarely falls that far any more:

| | HEAD | after |
|---|---|---|
| `good` QB careers that were ever at character ≤55 when an event fired | **90.4%** | **12.6%** |

So the three unreachable cards now fire about **0.056 times per career**, down from 1.006. Measured
picks per career, `good` at QB, 3,000 careers:

| card | HEAD | after |
|---|---|---|
| `offfield-group-chat` | `let-it-fly` 0.645 | **`apologize` 0.695** |
| `offfield-money-manager` | `let-him-handle-it` 0.639 | **`hire-a-professional` 0.706** |
| `offfield-sportsbook-nil` | `take-the-money` 0.799 | **`have-it-read` 0.847** |
| `offfield-ticket-hookup` | `sell-them` 0.978 | **`give-them-away` 1.015** |
| `offfield-ghost-media` | `no-show` 0.812 | **`show-up` 0.894** |
| `offfield-portal-rumor` | `let-it-work` 0.231 | **`ride-it-out` 0.010** |
| `offfield-entourage` | `ride-it-out` 0.233 | `ride-it-out` **0.011** |
| `offfield-curfew-check` | `ride-it-out` 0.330 | `ride-it-out` **0.018** |
| `offfield-exit-interview` | `ride-it-out` 0.443 | `ride-it-out` **0.027** |

**`good` now takes the honest option on every band-1 card, every time, and almost never sees band 2
at all.** The residual character drain from the three unreachable cards is ~0.17 points per career.

---

## 4. The full re-measurement, per position

`good` vs `humanLazyAmbitious`, 3,000 careers each, seed prefix `b037`, home state TX.
`humanLazyAmbitious` differs from `good` **only** in the event strategy.

### `good`

| pos | undrafted | busted | round 1 | median round | OVR P50 | All-American | All-Conference | **char P50** | char mean |
|---|---|---|---|---|---|---|---|---|---|
| QB | 0.2% → **0.3%** | 3.0% → **1.8%** | 43.2% → 38.9% | 2 → **2** | 90 → 88 | 50.9% → 41.3% | 61.8% → 61.4% | **41 → 63** | 40.9 → 62.0 |
| OSKILL | 0.4% → **0.3%** | 3.2% → **1.9%** | 40.4% → 35.2% | 2 → **2** | 90 → 87 | 42.0% → 32.8% | 63.6% → 62.2% | **41 → 62** | 40.8 → 61.9 |
| OL | 0.1% → **0.2%** | 2.7% → **2.0%** | 43.2% → 40.8% | 2 → **2** | 92 → 89 | 10.3% → 7.7% | 59.6% → 57.8% | **40 → 61** | 39.8 → 60.9 |
| DL | 0.5% → **0.4%** | 3.3% → **1.8%** | 37.8% → 33.8% | 2 → **2** | 90 → 87 | 24.1% → 17.9% | 57.8% → 56.2% | **42 → 63** | 41.6 → 62.4 |
| DSKILL | 0.4% → **0.2%** | 2.9% → **2.0%** | 40.3% → 34.8% | 2 → **2** | 90 → 87 | 25.5% → 18.5% | 59.7% → 58.8% | **41 → 63** | 41.1 → 62.5 |
| K | 0.5% → **0.5%** | 7.2% → **4.8%** | 22.2% → 21.1% | 3 → **3** | 91 → 88 | 3.2% → 2.3% | 49.6% → 48.2% | **44 → 65** | 43.3 → 64.4 |

### `humanLazyAmbitious`

| pos | undrafted | busted | round 1 | median round | OVR P50 | All-American | All-Conference | **char P50** | char mean |
|---|---|---|---|---|---|---|---|---|---|
| QB | 0.5% → 0.4% | 25.6% → **34.0%** | 15.0% → 12.9% | 3 → 3 | 86 → 85 | 30.7% → 28.2% | 73.6% → 68.5% | **7 → 0** | 9.7 → 7.3 |
| OSKILL | 0.3% → 0.3% | 24.7% → **34.0%** | 11.6% → 9.8% | 3 → 3 | 85 → 84 | 23.9% → 21.6% | 78.4% → 72.9% | **5 → 0** | 9.0 → 6.9 |
| OL | 0.2% → 0.1% | 28.5% → **35.3%** | 12.0% → 10.5% | 3 → 3 | 87 → 85 | 6.0% → 4.9% | 71.7% → 68.0% | **5 → 0** | 8.6 → 6.5 |
| DL | 0.4% → 0.3% | 24.8% → **34.8%** | 9.7% → 8.5% | 3 → 3 | 86 → 84 | 12.6% → 11.6% | 71.6% → 66.8% | **6 → 0** | 9.3 → 7.2 |
| DSKILL | 0.6% → 0.5% | 24.8% → **33.1%** | 11.9% → 10.9% | 3 → 3 | 86 → 85 | 14.7% → 13.7% | 75.2% → 70.5% | **6 → 0** | 9.2 → 6.8 |
| K | 1.4% → 1.3% | 25.8% → **35.5%** | 4.0% → 2.9% | 4 → 4 | 87 → 85 | 2.2% → 1.8% | 64.1% → 59.8% | **6 → 0** | 9.7 → 7.2 |

`good`'s average seasons are unchanged (4.93 → 4.95); `humanLazy` busts ~9pp more often, which is
the same change seen from the other side.

### The ending reasons, QB, 3,000 careers — the cleanest statement of what moved

| | HEAD | after |
|---|---|---|
| `good`, character-driven endings (*academically ineligible*, *removed from the program*, *dismissed*, *ran out of rope*) | 24 careers | **0 careers** |
| `good`, football endings (*buried on the depth chart*, *career-ending injury*) | 65 | 53 |
| `humanLazy`, *removed from the program* | 221 | **347** |
| `humanLazy`, *dismissed from the team* | 187 | **266** |

**A well-played career can no longer end for a character reason at all.** Every `good` career that
ends early now ends because of the depth chart or an injury.

---

## 5. Verification

- **`npm test` — 671 passed, 39 files, 0 failed.** Same count as HEAD. **One assertion moved and was
  re-baselined; it is the only one.**
- **`npm run typecheck` — both passes exit 0** (`tsconfig.engine.json`, then `tsconfig.json`).
- **`npm run build` — clean**, 83 modules, `dist/assets/index-BtG8cfdB.js` 393.79 kB.

### The one test that moved, and why it is a legitimate re-baseline

`src/sim/policies.test.ts` — *"the antisocial profile reaches the character band the bust events gate
on; the lazy one does not"* asserted `under35(lazyFull) < 0.2`.

`lazyFull` **minimises** draft stock. It held that threshold **because the off-field temptations were
net-positive stock** — so a stock-minimiser *declined* them and kept its character near the starting
70. This change makes those options net-negative, so the stock-minimiser now **takes** them and
bleeds character as a side effect. Measured on the test's own 40 seeds, and again on 400:

| profile | metric | HEAD | after |
|---|---|---|---|
| `lazyFull` | `under35`, n=40 | 0.000 | **0.350** |
| `lazyFull` | `under35`, n=400 | 0.010 | **0.448** |
| `lazyFull` | median character, n=400 | 55 | **38** |
| `antisocialFull` | `under35`, n=400 | 0.910 | **0.930** |
| `antisocialFull` | median character, n=400 | 18 | **13** |

The separation the two profiles exist to express is still there and is what the test now pins
(`anti > 0.5`, `lazy < 0.6`, **and `anti − lazy > 0.4`** — an explicit gap assertion that did not
exist before, so the re-baseline is not a loosening). The sentence *"the lazy one does not reach the
band"* is no longer true and is no longer asserted; the comment records the measured before/after
and the reason. **Nothing was skipped, deleted, or weakened.**

**This is a real finding, not just bookkeeping:** the two definitions of "bad play" have partly
converged. Minimising draft stock now *also* costs character on the off-field cards, because the
content and the objective function finally agree about them. That is the point of the change, and
`humanLazy` remains clearly distinct (median character 0 vs `lazy`'s 38).

### Bit-identity — recomputed on both sides, per DECISION 064

Seeds moved by construction, as expected for a content change. **Both sides were recomputed fresh**
from a `git archive HEAD` tree with `node_modules` symlinked — no written-down hash was trusted, and
the working tree was never touched (no `git checkout`, `git restore` or `git stash` was run):

| seed | policy | HEAD (`2ed2f9c`) | after 040 |
|---|---|---|---|
| 24 | random | `59da6b803bf76655b5279c99342c815d` | **`b58d72173b1588fdb8acece871713ae9`** |
| 77 | random | `791b3ceba6e191ac8055f4b3a9a13e47` | **`c11919799af733dd69e17a824054b19e`** |
| 101 | random | `4930e62258eb61aaede71b328ce4ee61` | **`ae2a7e493b5873d6366d029b075bff0c`** |

Measured with `npx tsx src/sim/play-headless.ts <seed> random | md5` (the `npm run play` banner
gotcha applies). **The recomputed HEAD column matches report 039 §6's "after 039" values exactly at
all three seeds**, which independently confirms both the pristine tree and 039's bookkeeping. Seed
101 moved this time where it did not in wave 19 — that career draws one of the six edited branches.

### Method

Two trees: pristine `git archive HEAD` and the working tree, `node_modules` symlinked into each so
nothing outside the working tree was modified. Every probe run used the committed
`npx tsx src/sim/human-lazy-probe.ts 3000 good,humanLazyAmbitious all`, seed prefix `b037`, home
state TX — **the same seeds as reports 037 and 039**, so §4's "before" column reproduces 039's
"after" column to the tenth at every cell. The decision tables in §1 and §3 were produced by calling
the **shipped** `optionScore` / `optionCharacterScore` against each tree's own `OFFFIELD_EVENTS`, and
§3's pick counts by wrapping the shipped `makePolicy(PROFILES.good)` and recording what it returned —
so both are the policy's real behaviour, not a re-derivation of it.

**Reproduce:** `npx tsx src/sim/human-lazy-probe.ts 3000 good,humanLazyAmbitious all` (~20s).

---

## 6. Acceptance, stated per position

### 1. `good` stops cheating — **PASS at every position**

| pos | `good` median final character | band |
|---|---|---|
| QB | **41 → 63** | *a problem they are managing* → ***just a guy in the building*** |
| OSKILL | **41 → 62** | → *just a guy in the building* |
| OL | **40 → 61** | → *just a guy in the building* |
| DL | **42 → 63** | → *just a guy in the building* |
| DSKILL | **41 → 63** | → *just a guy in the building* |
| K | **44 → 65** | → *just a guy in the building* |

A rise of **21 points**, uniformly. The means move with the medians (QB 40.9 → 62.0), so this is a
shift of the whole distribution, not a median crossing a nearby edge.

**Cards flipped: 6 of 13**, named in §3. Seven did not flip — four were already clean, three are
unreachable by this freeze lift and now almost never fire.

### 2. A well-played career stays safe — **PASS, and it got safer**

**`good` undrafted, after: QB 0.3% · OSKILL 0.3% · OL 0.2% · DL 0.4% · DSKILL 0.2% · K 0.5%.**
All ≤1%, all within 0.2pp of HEAD. **The hard disqualifier does not fire at any position.**

The bust rate **fell** at every position (QB 3.0% → 1.8%, K 7.2% → 4.8%) and character-driven endings
went to **zero** (§4). Average seasons 4.93 → 4.95. **A well-played career is not failing; it is
failing less.**

### 3. Round 1 — reported, not protected

| pos | round 1 | round 1–2 | round 6–7 | **median round** | median overall pick |
|---|---|---|---|---|---|
| QB | 43.2% → **38.9%** (−4.2pp, −10% rel.) | 57.0% → 53.9% | 5.5% → 6.2% | **2 → 2** | 44 → 55 |
| OSKILL | 40.4% → **35.2%** (−5.2pp, −13%) | 54.8% → 50.6% | 4.2% → 5.4% | **2 → 2** | 50 → 61 |
| OL | 43.2% → **40.8%** (−2.4pp, −6%) | 60.9% → 58.1% | 3.5% → 3.7% | **2 → 2** | 42 → 48 |
| DL | 37.8% → **33.8%** (−4.0pp, −11%) | 54.3% → 50.4% | 4.4% → 5.5% | **2 → 2** | 52 → 62 |
| DSKILL | 40.3% → **34.8%** (−5.5pp, −14%) | 55.7% → 52.0% | 4.8% → 5.4% | **2 → 2** | 49 → 57 |
| K | 22.2% → **21.1%** (−1.1pp, −5%) | 40.4% → 36.9% | 6.9% → 8.4% | **3 → 3** | 75 → 80 |

**It does not collapse.** The brief's stop line is a fall past roughly half of today's figure; the
largest fall is 14% relative. **The median round does not move at any position** — the number the
player reads on the final screen is the same as it was at HEAD. This is the ordinary decline the
brief said to expect: `good` used to collect +1 to +2 overall on ~4 cards per career and now
collects none, which is the whole of the 2–3 point OVR P50 drop.

**The honest reading:** a perfectly played career's round-1 rate was partly bought with misbehaviour.
38.9% at QB is the clean number.

### 4. The locker-room band distribution moves — **PASS, and this is the player-visible face**

`good`, band shares before → after:

| pos | *run through a wall* | *staff trusts you* | *just a guy* | *a problem* | *stopped defending* |
|---|---|---|---|---|---|
| QB | 0.0 → 0.0 | 0.2 → **7.8** | 24.7 → **88.7** | 58.0 → 3.5 | 17.1 → **0.0** |
| OSKILL | 0.0 → 0.0 | 0.2 → **8.3** | 24.8 → **88.2** | 57.5 → 3.6 | 17.5 → **0.0** |
| OL | 0.0 → 0.0 | 0.3 → **6.3** | 21.1 → **88.4** | 59.5 → 5.3 | 19.1 → **0.0** |
| DL | 0.0 → 0.0 | 0.3 → **9.7** | 26.2 → **87.0** | 58.2 → 3.4 | 15.4 → **0.0** |
| DSKILL | 0.0 → 0.0 | 0.2 → **10.0** | 25.0 → **86.7** | 58.0 → 3.2 | 16.9 → **0.0** |
| K | 0.0 → 0.0 | 0.4 → **20.1** | 33.0 → **77.8** | 53.9 → 2.0 | 12.7 → **0.0** |

**A well-played career can no longer end at *"the staff has stopped defending you"*, at any
position.** It used to do so about one time in six.

`humanLazyAmbitious`:

| pos | *just a guy* | *a problem* | ***stopped defending*** |
|---|---|---|---|
| QB | 0.5 → 0.4 | 3.9 → 3.6 | **95.6 → 96.0** |
| OSKILL | 0.5 → 0.4 | 3.6 → 3.3 | **95.9 → 96.3** |
| OL | 0.4 → 0.4 | 3.5 → 2.5 | **96.1 → 97.2** |
| DL | 0.6 → 0.5 | 4.1 → 3.8 | **95.3 → 95.8** |
| DSKILL | 0.5 → 0.4 | 4.0 → 3.4 | **95.5 → 96.2** |
| K | 0.7 → 0.5 | 4.7 → 3.9 | **94.6 → 95.6** |

**Yes — `humanLazy` bottoms out at *"the staff has stopped defending you"***, at 96–97% of careers.
It already did at HEAD (95–96%); what this change adds is **depth**: its median final character is
now **0**, the floor of the clamp, at all six positions, down from 5–7. The two players are now at
opposite ends of the ladder with nothing in between: `good` at 61–65, `humanLazy` at 0.

---

## 7. Side effects worth the user's attention — reported, not fixed

**1. `good`'s honours fell, because `good` is now 2–3 overall points worse.** All-American QB
50.9% → 41.3%, Heisman 37.8% → 27.2%. This is the same mechanism as the round-1 drop: the +1/+2
overall on the temptation cards is gone from a well-played career. Not an acceptance criterion this
wave, but 039 tracked it, so: the `good` vs `humanLazy` All-American **ratio narrowed** (QB 1.66× →
1.46×, DL 1.91× → 1.55×) while staying above 1.3× everywhere. The ratio narrowed because `good` fell
and `humanLazy` barely moved — `humanLazy` was never collecting those gains, it was picking the
most-corrosive branch regardless of stock.

**2. `humanLazy` still finishes with more total awards than `good` at five of six positions**
(`anyAward`, after: OL 61.6% vs 69.8%, K 49.6% vs 60.4%). 039 identified the cause — All-Conference
is a snaps award and nothing in either wave touches snaps — and this change does not address it. QB
is now **77.4% vs 74.9%**, the good player ahead, up from a 80.7% / 80.7% tie.

**3. `humanLazy` busts ~9pp more often** (25–28% → 33–36%). A player who misbehaves now washes out
of the program noticeably more, which is the intended fiction, but it is a real change to how often a
badly-played career ends early and the user may want to price it.

---

## 8. What I did not do

- **I did not tune.** Each of the six numbers is the next integer past a bound computed from the
  shipped `optionScore` and the authored probabilities, stated in §1 with every term shown. No value
  was tried and replaced; no aggregate was optimised. The three "+1" cases are forced by the
  tiebreak, not chosen for margin.
- **I did not touch any `positiveOutcome` branch**, any probability, weight, label or description, or
  anything in `src/engine/**` or `STOCK_WEIGHTS`. In `src/content/**` I changed six integers in the
  one file the freeze lift names.
- **I did not invent penalties for the four band-2 selfish options** (`lean-in`, `double-down`,
  `stay-out`, `argue-the-tape`). They are already net-negative in stock and already lose to the
  alternative `good` takes, so the derivation returns nothing for them. §3.
- **I did not fix the round-1 or All-American decline**, the residual `ride-it-out` drain, or
  `humanLazy`'s award count. All reported in §6.3 and §7.
- **I did not commit.** No `git checkout`, `git restore` or `git stash` was run.
- **Note for the PM:** `docs/superpowers/polish/STATE.md` and `DECISIONS.md` also show as modified in
  the working tree. **Those changes are not mine** — they appeared during this run (DECISION 064, the
  verification-method section) and I left them untouched. My diff is `src/content/events/offfield.ts`
  and `src/sim/policies.test.ts` only.
