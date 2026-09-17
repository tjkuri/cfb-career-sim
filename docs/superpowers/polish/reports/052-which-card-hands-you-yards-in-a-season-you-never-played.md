# 052 — Which card hands you 130 yards in a season the engine says you never played

**Status: `needs-decision`.** Measurement lane only. **No change was landed to `src/engine/**`,
`src/content/**`, `src/ui/**`, or anything else in the main tree.** All instrumentation lived in a
detached worktree pinned at `4076822`, which has been removed. The only file this lane writes is this
report.

**The headline is not the one the brief expected, and it is bigger than the brief's.**

1. **Attribution is complete: 138 of 138 bad rows name an authored `stat` effect.** No row came back
   with an empty attribution history. DECISION 073's relocation of the cause to
   `src/content/events/**` is **confirmed by instrumentation**, not inferred.
2. **But the framing around it is wrong, and it is wrong in the player's favour.** On **all 138** bad
   rows, `simulatePhaseProduction` never wrote a single snap to that line, because the player was
   **sidelined (injury or suspension) in every on-field phase of that season**. The ledger's `0 snaps`
   is **true**. The upperclass `−4` is **correct**. *"A season on the sideline cost you ground"* is
   **accurate prose about a season actually spent on the sideline.** The one false thing on that screen
   is the **stat line** — production a card handed a player who was in a boot all year.
3. **DECISION 073's own stated mind-changer fires — and it still does not exonerate anything.** 073
   said it would change its mind given *"a repro of a bad row whose snap-effect history is non-empty."*
   **29 of the 138 have one.** On **24** of them an authored **`+10`** snap effect
   (`milestone-opener-*|stay-within`) granted playing time and a later **`−15`**
   (`nonconf-blowout-sideline|work-the-sideline`) had it clamped back to `0` by `effects.ts:61`. The
   clamp **does** destroy authored playing time. It still is not the cause of the production, and the
   reverted floor-of-1 fix would have saved **0 of the 29** (measured by replaying every history:
   every stat effect landed *after* the last snap effect, so the "has production" floor was `0` at the
   moment the clamp fired). **073's revert stands; its "the clamp never touches one of them" line does
   not.**
4. **The root cause is an existing invariant with a hole in it.** DECISION 048 already ruled that an
   on-field event awarding `stat`/`snaps` must set `conditions.requiresPlaying`, and
   `schema.ts:263` **enforces** it. But `select-event.ts:38` implements `requiresPlaying` as
   `!state.redshirtSeasonActive` **only**. It does not consider `isSidelined(state)`. That is why not
   one of the 138 bad rows is a redshirt season — the gate works where it is wired — and why **20.8%
   of every authored `stat` write in the corpus (44,028 of 212,085) lands on a player who is currently
   hurt or suspended.** The bad row is the visible 0.5% tail of that.

---

## 0. Method, and why it is trustworthy

Worktree: `git worktree add --detach <scratch>/wt052 4076822`, `node_modules` symlinked, removed at
the end. Every number below comes from an instrumented build in that worktree.

Instrumentation attaches an **enumerable** `__hist` array to each `SeasonLine` and appends a record
for **every** mutation of `snaps` or `stats`, from all four sites that can perform one
(`effects.ts` `stat`, `effects.ts` `snaps`, `simulate.ts` snaps, `simulate.ts` stats), plus a
`sim-skip` marker whenever `simulatePhaseProduction` returns early on `isSidelined`. A grep over
`src/engine/**` and `src/content/**` confirms those are the *only* writers. `(eventId, optionId,
effectIndex)` is threaded from `advance.ts applyChoice` and `postseason.ts`.

**Enumerable matters.** `advance()` clones state with `JSON.parse(JSON.stringify(...))`. A probe that
attached history via a `WeakMap` or a non-enumerable property would lose it on the very next
`advance`, and would report **"no snap-effect history"** on every row. That is one plausible
explanation for 073's `with any snap effect at all 0`; the other is seed luck (see §2). This probe's
history demonstrably survives — `z-206`'s row below carries entries from three different phases and
many `advance` calls.

**Sweep.** 6 profiles × 6 positions × 2,000 careers = **72,000 careers / 324,872 season rows**.
Profiles: `baselineRandom`, `good`, `virtueAmbitious`, `virtueLoyal`, `humanLazyAmbitious`,
`humanLazyFull` — i.e. the brief's required `good`, `virtue` and human-shaped policies, not
`baselineRandom` alone.

A **bad row** is `snaps === 0` with at least one positive stat, the same predicate 073 used.

---

## 1. Attribution — measured, not read

```
rows 324,872   bad rows 138   bad careers 138   (no career ever had two)
bad rows with an EMPTY attribution history ................. 0   <-- the headline that did NOT happen
bad rows with >= 1 authored `stat` effect .................. 138 (100%)
bad rows where simulate.ts ever wrote a snap ............... 0   (0%)
bad rows sidelined in every on-field phase of the season ... 135
bad rows sidelined in 2 phases (career busted mid-season) ... 3
bad rows that were a redshirt season ....................... 0
stat-effect writes per bad row: 4 (x90), 5 (x33), 6 (x14), 7 (x1)
```

**Every bad row is fully attributed and the attribution is always an authored `stat` effect on a
season the player spent injured or suspended.** The hypothesis in the brief is confirmed; its
companion claim, that the engine "says you never played" wrongly, is refuted — the engine is right.

### 1a. The offending `(eventId, optionId, stat, amount)` table

203 attributed writes across **70 distinct signatures** and **53 distinct `event|option` pairs**. There
is no dominant card: the largest single signature is 11 of 203.

| n | eventId | optionId | stat | amount |
|---:|---|---|---|---:|
| 11 | `bowl-practice-reps` | `manage-the-reps` | tfls | 1 |
| 9 | `the-long-one` | `turn-it-upfield` | scrimmageYards | 80 |
| 9 | `the-long-one` | `turn-it-upfield` | totalTds | 1 |
| 8 | `signature-win` | `ball-out` | passYards | 320 |
| 8 | `signature-win` | `ball-out` | passTds | 3 |
| 6 | `stat-padding-saturday` | `pin-your-ears-back` | sacks | 1 |
| 6 | `stat-padding-saturday` | `pin-your-ears-back` | tfls | 2 |
| 6 | `return-duty` | `decline` | scrimmageYards | 20 |
| 5 | `silent-count` | `burn-timeout` | passYards | 70 |
| 5 | `audible-authority` | `own-it` | ints | 1 |
| 5 | `the-toe-tap` | `wave-it-off` | scrimmageYards | 10 |
| 5 | `the-bowl-interception` | `trust-the-film` | ints | 1 |
| 5 | `guard-or-tackle` | `work-out-at-guard` | pancakes | 5 |
| 4 | `signature-win` | `ball-out` | ints | 2 |
| 4 | `the-long-one` | `turn-it-upfield` | scrimmageYards | 70 |
| 4 | `combine-buzz` | `chase-the-number` | tfls | 1 |
| 4 | `double-teamed-all-day` | `trust-the-scheme` | sacks | 1 |
| 4 | `special-teams-gunner` | `play-it-safe-off-the-line` | tackles | 3 |
| 4 | `the-blindside` | `embrace-the-assignment` | pancakes | 5 |
| 4 | `gap-discipline` | `hold-your-gap` | tackles | 2 |
| 4 | `playing-through-the-hand` | `play-through-it` | pancakes | 4 |
| 4 | `onside-kick` | `pooch-it-perfect` | fieldGoals | 2 |
| 4 | `onside-kick` | `pooch-it-perfect` | points | 6 |
| 4 | `onside-kick` | `pooch-it-perfect` | gameWinners | 1 |
| 3 | `two-minute-drill` | `lead-it` | ints | 1 |
| 3 | `the-drop` | `shake-it-off` | scrimmageYards | 65 |
| 3 | `the-strip-sack` | `dig-for-the-ball` | sacks | 2 |
| 3 | `feature-back-workload` | `spread-it` | scrimmageYards | 80 |
| 3 | `trash-talk` | `stay-quiet` | tfls | 1 |
| 3 | `the-missed-tackle-reel` | `answer-it` | tackles | 13 |
| 3 | `the-pick-six` | `take-it-to-the-house` | ints | 1 |
| 2 | `facing-the-freak` | `handle-him-solo` | sacksAllowed | 3 |
| 2 | `the-roughing-call` | `keep-playing-physical` | sacks | 1 |
| 2 | `the-strip-sack` | `stay-on-your-feet` | sacks | 1 |
| 2 | `combine-buzz` | `point-to-the-tape` | sacks | 1 |
| 2 | `travel-with-the-no-1` | `play-with-safety-help` | tackles | 4 |
| 2 | `film-study` | `study` | passYards | 120 |
| 2 | `the-blindside` | `embrace-the-assignment` | sacksAllowed | 2 |
| 2 | `bowl-practice-reps` | `go-live-every-rep` | sacks | 1 |
| 2 | `third-and-long` | `go-deep` | passYards | 180 |
| 2 | `the-drop` | `shake-it-off` | scrimmageYards | 10 |
| 2 | `cadence-trouble` | `reset-the-get-off` | pancakes | 3 |
| 1 | `two-minute-drill` | `lead-it` | passYards | 220 |
| 1 | `all-star-invite` | `accept` | passYards | 200 |
| 1 | `sideline-camera` | `stay-hot` | passYards | 110 |
| 1 | `third-and-long` | `check-down` | passYards | 40 |
| 1 | `feature-back-workload` | `embrace` | scrimmageYards | 60 |
| 1 | `the-toe-tap` | `sell-it` | scrimmageYards | 40 |
| 1 | `the-toe-tap` | `sell-it` | totalTds | 1 |
| 1 | `guard-or-tackle` | `insist-on-tackle-only` | pancakes | 2 |
| 1 | `all-star-practice-week` | `keep-it-fundamentally-sound` | tackles | 3 |
| 1 | `gambling-on-the-jump` | `stay-on-top-of-it` | tackles | 5 |
| 1 | `the-bowl-interception` | `play-your-zone` | tackles | 5 |
| 1 | `the-holding-call` | `argue-the-call` | pancakes | 5 |
| 1 | `the-roughing-call` | `dial-it-back` | tfls | 1 |
| 1 | `audible-authority` | `own-it` | passYards | 150 |
| 1 | `the-holding-call` | `own-it` | pancakes | 2 |
| 1 | `all-star-invite` | `accept` | ints | 2 |
| 1 | `bubble-screen-diet` | `stay-professional` | scrimmageYards | 35 |
| 1 | `pancake-highlight` | `ride-the-momentum` | pancakes | 1 |
| 1 | `targeting-review` | `pull-up-at-the-last-second` | tackles | 3 |
| 1 | `pancake-highlight` | `ride-the-momentum` | pancakes | 4 |
| 1 | `the-chip-shot` | `trust-your-leg` | fieldGoals | 1 |
| 1 | `the-chip-shot` | `trust-your-leg` | points | 3 |
| 1 | `third-and-long` | `go-deep` | ints | 1 |
| 1 | `bubble-screen-diet` | `push-for-more` | scrimmageYards | 110 |
| 1 | `asked-to-block` | `lobby` | scrimmageYards | 70 |
| 1 | `senior-bowl-invite` | `accept-and-practice` | sacksAllowed | 2 |
| 1 | `the-long-attempt` | `tell-him-to-punt-it-instead` | fieldGoals | 1 |
| 1 | `the-long-attempt` | `tell-him-to-punt-it-instead` | points | 3 |

**The tail is the finding, not the table.** Restricting to the *set of cards that can do this*, rather
than the set caught in 72,000 careers: **78 distinct `event|option` pairs and 123 distinct
`(event, option, stat, amount)` signatures fired at a sidelined player** during the sweep, against
**124 authored `stat` effects** in the bundle. Effectively *every* production card in the game can
land on a player who is out. Any route framed as "fix the small set §1 names" is fixing a sample of a
long tail (see RC in §4, which measured it).

### 1b. `z-206`, the repro 073 left open — resolved

`npx tsx src/sim/z206.ts z-206` under the instrumented build, OL, random policy:

```
season 0 FR  snaps=420  {pancakes:18, sacksAllowed:7}
season 1 SO  snaps=522  {pancakes:30, sacksAllowed:10}
season 2 JR  snaps=0    {sacksAllowed:2}   <-- BAD
      nonconf     sim-skip  __sidelined
      conference  sim-skip  __sidelined
      postseason  sim-skip  __sidelined
      postseason  event  senior-bowl-invite | accept-and-practice  sacksAllowed +2  (0 -> 2)
season 3 SR  snaps=290  {pancakes:18, sacksAllowed:6}
```

**No snap effect of any kind touched this line.** Report 048's mechanism — a `−20` clamped by
`effects.ts:61` — is refuted *at its own named repro*, by direct measurement rather than by a
before/after count. The whole junior season was missed to injury/suspension, and one postseason card
put two sacks-allowed on the line.

(Unrelated and out of lane, but worth one line for the content owner: `senior-bowl-invite` fired on a
**JR** season.)

### 1c. 073's mind-changer: it fired, and it changes less than it looks

```
bad rows with a non-empty snap-effect history ............ 29 of 138 (21.0%)
  ... by profile: virtueLoyal 21, virtueAmbitious 5, baselineRandom 3
snap-effect amounts seen on those rows: +10 (x24), -15 (x28), -20 (x1)
  `milestone-opener-{first,counting,your-team,no-excuse} | stay-within`   +10  (24)
  `nonconf-blowout-sideline | work-the-sideline`                          -15  (28)
  `offfield-coordinator-blowup | apologize-on-tape`                       -20  (1)
snaps value the clamp ate: always 0 or 10 -- never real, simulated playing time
rows the reverted floor-of-1 fix would have saved ......... 0 of 29
```

A worked example (`w52-baselineRandom-DL-432`, season 1, SO):

```
nonconf     sim-skip   __sidelined
nonconf     event  milestone-opener-no-excuse | stay-within   snaps +10   (0 -> 10)
nonconf     event  nonconf-blowout-sideline   | work-the-sideline  snaps -15  (10 -> 0)   <-- clamped
conference  sim-skip   __sidelined
conference  event  the-strip-sack | dig-for-the-ball   sacks +2   (0 -> 2)
postseason  sim-skip   __sidelined
postseason  event  combine-buzz   | chase-the-number   tfls  +1   (0 -> 1)
```

So: **the clamp does erase authored playing time** (10 snaps, on 24 rows in 72,000 careers = 240
snaps, worth 240/200 = **1.2 draft-stock points spread over 24 careers**, i.e. 0.05 each, below
rounding). It is **not** the source of the production, it is **not** load-bearing for any of the 138
rows, and the specific fix 073 reverted would still have fixed nothing, because on every one of the 29
the stat effects arrive *after* the snap effects. **The revert was right. The sentence "the clamp never
touched a single one of the 29" should be corrected in the log to "the clamp is not the cause, and the
proposed fix would not have fired on any of them" — those are different claims and only the second one
survived measurement.**

I cannot separate "073's probe lost its history to the JSON clone" from "073's 56,481 `baselineRandom`
rows got unlucky". My own `baselineRandom` slice (56,626 rows) has 3 of 25 with a snap-effect history;
at that rate, seeing 0 of 29 by chance is ~2%. Unlikely, not impossible.

---

## 2. Frequency a *player* meets, not the row rate

### Careers with >= 1 bad season

| profile | careers | bad careers | rate | rows | bad rows |
|---|---:|---:|---:|---:|---:|
| `baselineRandom` | 12,000 | 25 | **0.208%** | 56,626 | 25 |
| `good` | 12,000 | 14 | **0.117%** | 59,846 | 14 |
| `virtueAmbitious` | 12,000 | 22 | **0.183%** | 59,786 | 22 |
| `virtueLoyal` (the playtester's shape) | 12,000 | 53 | **0.442%** | 47,818 | 53 |
| `humanLazyAmbitious` | 12,000 | 9 | **0.075%** | 54,609 | 9 |
| `humanLazyFull` | 12,000 | 15 | **0.125%** | 46,187 | 15 |
| **all** | **72,000** | **138** | **0.192%** | **324,872** | **138** |

**The human-shaped policy does not produce a case the random sweep never does** — that was 073's open
question and the answer is no; `humanLazy` is the *least* affected profile. **The policy that does is
`virtueLoyal`**: 2.1× `baselineRandom` and 3.8× `good`. It is the shape of the player who filed the
bug. The mechanism is unglamorous: `virtueLoyal` declines the redshirt and stays put, so it plays the
most *unprotected* seasons — a redshirt season is immune (see §1, zero redshirt rows).

Row rate is 0.0425% overall; **career rate is 4.5× that**, and one bad season never repeats in a
career (138 bad rows, 138 distinct careers). A player meets this once or never, exactly as the brief
argued.

### Per position

| position | bad careers / 12,000 | rate |
|---|---:|---:|
| DL | 33 | 0.275% |
| OSKILL | 29 | 0.242% |
| QB | 27 | 0.225% |
| OL | 23 | 0.192% |
| DSKILL | 20 | 0.167% |
| K | 6 | **0.050%** |

Worst cell: **`virtueLoyal` × OSKILL, 15/2,000 = 0.75%** — about 1 career in 133. K is 5× safer
(fewer position-gated production cards).

### Distribution of harm, when it happens

| | |
|---|---|
| **Honours stolen** | **Zero.** Production awards are gated on `season.stats` (`postseason.ts:56`), so a false stat line *could* buy an All-Conference. Measured by diffing per-seed `awards` between base and RA: **0 of the 138 bad-row careers changed their award set** (6 careers in 72,000 changed at all, both directions, RNG divergence). |
| **Draft-stock loss** | **Zero.** Of the 138 careers carrying a bad row, **0 changed draft stock or status** when the defect was removed (RA, §4). Mean stock over all 72,000 moved by **−0.0003**. 073's "`productionScore` loses those snaps from draft stock" is **false** — there were no snaps to lose. The only stock in play is the 0.05 from the clamped `+10` on 24 rows. |
| **The −4 upperclass decline fired** | **71 of 138 (51.4%)** — every JR (36) and SR (35) row. FR (48) and SO (19) take `developmentDelta(0) = 0`. |
| **"A season on the sideline cost you ground" printed** | The same 71 rows (`view-model.ts seasonCost` recomputes `seasonOverallDelta` from the stored line, so the verdict is exactly the decline). **And on all 71 it is true.** |
| **Size of the false stat line** | max single stat: min 1, **median 4**, max 500. **17 of 138 (12.3%)** carry a yardage stat >= 100 — the "130 yards you never played" headline shape. The worst observed: `QB JR {passYards: 500, passTds: 3}` on a season with no snaps. **121 of 138 are small** (a sack, two tackles, a field goal). |
| **Career outcome** | 123 drafted, 15 busted; 20 of the 123 undrafted. Mean stock of a bad-row career 62.7 vs 75.1 corpus-wide — these are *already* weak careers, which is consistent with "lost a whole season to injury". |

### Clustering

* **By redshirt: perfectly anti-clustered — 0 of 138.** `requiresPlaying` already protects the sit
  season. This is the single most important structural clue in the report (§4, RE).
* **By season index:** 0 → 48 (34.8%), 1 → 19, 2 → 36, 3 → 29, 4 → 6. The **freshman** year is the
  most common, and it is also the harmless one (FR takes no decline).
* **By class year:** FR 48, SO 19, JR 36, SR 35. Roughly half land where the decline bites.
* **By position:** see above; K is the outlier, 5× safer.
* **By event:** **no cluster.** 70 signatures / 53 options, max 11. The offending card is whichever one
  happened to be drawn while the player was hurt.

---

## 3. What the mechanism actually is

```
autoProgress (advance.ts:320-345):
    tickPhaseStart              -> injuries decrement / heal
    push season line if needed
    rollAmbientInjury
    simulatePhaseProduction     -> RETURNS EARLY on isSidelined(state)      == no snaps, no stats
    selectFixedEvent / selectRandomEvent -> a card fires ANYWAY
        eventMatches: `c.requiresPlaying && state.redshirtSeasonActive` -> false
                      ^ the flag DECISION 048 requires on every production card
                        checks the redshirt and NOT the injury
    applyChoice -> applyEffect  -> `stat` writes production onto a line with 0 snaps
```

Production is simulated **before** cards fire in a phase, so `snaps === 0` at the moment a `stat`
effect lands means *"the player has not taken a snap this season yet"* — always because they were
sidelined. Measured:

```
total authored `stat` writes ..................................... 212,085
  ... landing while the player is sidelined ......................  44,028  (20.8%)
  ... landing on a line that still has 0 snaps ...................   1,093  ( 0.52%)
      ... of which the player was sidelined .......................  1,093  (100%)
season rows receiving >= 1 zero-snap stat write ..................     811
  ... that ended the season with snaps > 0 (played later) ........     672
  ... that ended at 0 snaps  = THE DEFECT .........................    138
```

The defect is the intersection of two facts that were each individually fine: cards may fire while you
are hurt (they must — that is what `requiresInjury` content is for), and production cards are gated on
"playing" by a flag that only knows about redshirts.

---

## 4. The routes, each one simulated

Every route was run over the **same 72,000 careers / same seeds** as the baseline, on the instrumented
build. Nothing below is an estimate.

| route | bad rows | bad careers | mean stock | Δ stock | undrafted | bust | decisions/career | careers whose stock changed | authored stat writes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **base** | 138 | 138 | 75.103 | — | 2.556% | 10.079% | 38.82 | — | 212,085 |
| **R0** do nothing | 138 | 138 | 75.103 | 0 | 2.556% | 10.079% | 38.82 | 0 | 212,085 |
| **RA** `stat` no-ops at 0 snaps | **0** | **0** | 75.103 | **−0.0003** | 2.556% | 10.079% | 38.82 | **11** | 212,088 |
| **RB** `stat` implies 1 snap | **0** | **0** | 75.103 | +0.0002 | 2.556% | 10.079% | 38.82 | 11 | 212,085 |
| **RA2** `stat` no-ops while sidelined | **0** | **0** | 75.073 | −0.0307 | 2.573% | 10.072% | 38.82 | 1,345 | 212,018 |
| **RC** strip the 53 named options | **2** | 2 | 74.955 | −0.148 | 2.607% | 10.119% | 38.82 | 10,863 | 211,963 |
| **RE** widen `requiresPlaying` | **0** | **0** | 73.012 | **−2.092** | **3.881%** | 10.419% | **36.86** | **48,928** | 167,698 |
| **RD** downstream only | 138 | 138 | 75.103 | 0 | 2.556% | 10.079% | 38.82 | 0 | 212,085 |

*(`careers whose stock changed` includes pure RNG divergence: a stat that no longer crosses a
production-award threshold skips an `rng.next()` draw and the rest of the career reshuffles. It is the
honest blast radius, not a directional cost.)*

### R0 — do nothing

**What it costs, honestly.** 0.192% of careers (1 in 520) show a season line with production and
`0 snaps`; 0.024% (1 in 4,235) show one with >= 100 yards. **Mechanically it costs nothing** — no
draft stock, no round, no bust. The `−4` and the sideline verdict that 073 counted as harm are
**correct** on every row. What remains is a credibility defect, and a real one: the ledger asserts two
incompatible things about the same season and the player cannot tell which to believe. For the
`virtueLoyal` OSKILL player it is 1 career in 133.

DECISION 071 picked the R0 analogue on this board once already, and the case here is stronger than it
was there, because the measured mechanical harm is exactly zero. **Files: none. Freezes: none.**

### RA — a `stat` effect is a no-op when the season line has no snaps

```diff
     case "stat": {
       const s = currentSeason(state);
+      // Production requires playing time. A card cannot put yards on a season
+      // line that has not recorded a snap -- the player was sidelined for every
+      // on-field phase so far, and `simulatePhaseProduction` returned early.
+      if (s && s.snaps === 0) return;
       if (s) s.stats[effect.stat] = Math.max(0, (s.stats[effect.stat] ?? 0) + effect.amount);
       return;
     }
```

**Measured: 138 → 0 bad rows. 1,093 stat writes suppressed across 811 season rows. 11 careers of
72,000 change draft stock; mean stock moves −0.0003; undrafted and bust rates are unchanged to three
decimals; per-profile stock deltas are within ±0.002 for all six profiles** (including `good`, the
"a good player should not notice" control).

**The cost is not mechanical, it is legibility, and it is 5× more frequent than the defect it fixes.**
672 of the 811 suppressed rows are seasons the player *did* go on to play. On those, a card's prose
promises production (`film-study | study` → 120 passing yards, 55 occurrences) and the rail's stat line
silently does not move. 22,448 stat units are deleted this way. That is the same
card-says-one-thing-ledger-says-another family as B64 itself, traded down from 138 loud instances to
672 quiet ones. Mitigating: `cardAccount` (`view-model.ts:343-366`) deliberately never renders a `stat`
effect as a number, so the contradiction is never side-by-side on one screen.

**Files: `src/engine/effects.ts` (1 line + comment). Needs the engine freeze lifted.**

### RB — a `stat` effect implies snaps

Measured at `RB_MIN = 1`: **138 → 0 bad rows, 811 rows gain exactly 1 invented snap (811 snaps total
across 72,000 careers), 11 careers change stock, mean stock +0.0002.** Mechanically free.

**It does not fix the thing the bug report was about.** With 1 snap the ledger stops printing `0`, but
`seasonOverallDelta(1, "JR", …)` is still far below `declineSnapFloor`, so the **−4 still fires and
"A season on the sideline cost you ground" still prints** on the same 71 rows. To suppress those you
need an invented snap count above the decline floor, which is a large fabrication (tens to ~100+ snaps
per position), would feed `productionScore` and would move draft stock for real.

And it invents playing time the schedule never granted, on a player the engine had *correctly* marked
as out all year — so the summary would then say the player took snaps in a season they missed with a
torn ACL. **That is a worse lie than the one it fixes**, because `snaps` is the field every downstream
consumer trusts. **Files: `src/engine/effects.ts`. Needs the engine freeze lifted.**

### RC — fix the authored effects

Simulated as: strip the `stat` effect from every one of the **53 `event|option` pairs §1 named**.

**Measured: 184,148 stat writes suppressed (86.8% of all production in the game), and it still leaves
2 bad rows.** Mean stock −0.148, undrafted 2.556% → 2.607%, 10,863 careers' stock changed.

Two separate findings here, both fatal to "possibly very cheap":

1. **The named set is not small and not separable.** Those 53 options are ordinary, frequently-drawn
   production cards; removing their `stat` effects removes most of the game's authored production. A
   "pair it with an authored `snaps` effect" variant avoids that, but it is RB restricted — same
   fabrication problem, 53 cards to hand-author instead of one line.
2. **The set is a sample, not a population.** 78 distinct `event|option` pairs and 123 distinct
   `(event, option, stat, amount)` signatures were observed firing at a sidelined player — essentially
   all 124 authored `stat` effects. Fixing the 53 that happened to surface in 72,000 careers leaves the
   other 25+ live, which is exactly why RC still measured 2 bad rows.

**Files: many, across `src/content/events/**`. Needs the content freeze lifted. Not recommended at any
size.**

### RD — downstream only

No engine or content change; **138 bad rows remain by construction**, all numbers identical to R0.
The UI work would be: teach the ledger row to print the stat line without the contradictory `0 snaps`,
and soften the decline verdict when the line carries production.

**Measurement says do not do this.** The `0 snaps` and the `−4` are the **true** halves of the row.
RD would suppress the accurate signal to protect the inaccurate one, and it would also suppress it on
the far larger population of *honest* zero-snap seasons — a player who really did miss a year to
injury would stop being told why their overall dropped, which is precisely the legibility DECISION 058
bought. **Files: `src/ui/session/view-model.ts`, `src/ui/screens/CareerScreen.tsx`. No freeze lifted,
and still the wrong trade.**

### RE — widen `requiresPlaying` to mean what its name says (**not in the brief; found by §1c**)

```diff
-  if (c.requiresPlaying && state.redshirtSeasonActive) return false;
+  // `requiresPlaying` is the gate DECISION 048 requires on every on-field card
+  // that awards production (schema.ts:263). It knew about the redshirt and not
+  // about the boot: a player sidelined all season is equally not playing.
+  if (c.requiresPlaying && (state.redshirtSeasonActive || isSidelined(state))) return false;
```

**This is the only route that fixes the cause rather than the symptom**, and it needs no content
change at all, because `validateContent` already guarantees every on-field production card carries the
flag. The card never fires, so no prose ever promises production that does not arrive — RA's collateral
does not exist here. **Measured: 138 → 0 bad rows, and `stat` writes while sidelined 44,028 → 0.**

**And it is by far the most expensive route on the board.**

```
mean draft stock  75.103 -> 73.012   (-2.09)
undrafted          2.556% -> 3.881%  (+1.33pp, a 52% relative increase)
bust rate         10.079% -> 10.419%
decisions/career   38.82 -> 36.86    (-1.96 cards a career)
careers whose stock changed: 48,928 of 72,000 (68%)
authored stat writes: 212,085 -> 167,698 (-21%)

per profile:  baselineRandom -1.90 | good -5.07 | virtueAmbitious -1.49
              virtueLoyal -1.55 | humanLazyAmbitious -0.62 | humanLazyFull -1.27
undrafted:    good 0.57% -> 2.90%
```

Most of that cost is **not** the lost production: it is the ~2 cards a career that never fire at all,
taking their `overall`, `character`, trophy and award effects with them. It hits **`good` hardest**
(−5.07 stock, undrafted 5×), which fails the board's standing test that a change a good player
"should not notice" barely moves that row. Every balance baseline on the board — 018 §4, 022 §1, 034,
047 — would have to be retaken. **Files: `src/engine/select-event.ts` (1 line). Needs the engine
freeze lifted, and a re-baselining wave.**

---

## 5. Recommendation

**R0 for this wave. RE as the real fix, scheduled deliberately with a re-baselining wave behind it.
Not RA, not RB, not RC, not RD.**

The reasoning, in the order the numbers forced it:

* The defect **costs the player nothing mechanical** — measured, not argued: zero of the 138 affected
  careers change draft stock, round or status when it is removed. Everything 073 priced as harm (the
  `−4`, the verdict, the lost production score) is either correct or nonexistent.
* What is left is one false sentence on a ledger row, in **0.192% of careers** (0.442% for the
  playtester's shape), and in **87% of those it is a single sack or a field goal**, not 130 yards.
* **RA is nearly free and fixes 100% of it — and I am still not recommending it**, because it converts
  138 loud contradictions into 672 quiet ones of the same family. That is a judgement call about which
  defect the board would rather own, and it is the user's, not mine. If the user weighs "the ledger
  must never contradict itself" above "a card must always deliver what it narrates", **RA is the
  correct pick and it is one line.**
* **RE is right and it is not cheap.** Paying −2.09 mean stock and +1.33pp undrafted, and invalidating
  every balance baseline on the board, to fix a cosmetic defect in 1 career in 520, is a bad trade
  *this wave*. It stops being a bad trade the moment the board is re-baselining anyway, or the moment
  someone decides that a hurt player being handed a 500-yard game is a content-integrity problem in its
  own right — which it is: **20.8% of all authored production in this game is currently awarded to
  players who are injured or suspended.** The 138 bad rows are the only ones where that is *visible*.

**The falsifier that would change this recommendation.** Any one of:

1. **A measured mechanical cost.** The obvious candidate was the false stat line *crossing a
   production-award threshold* (`postseason.ts:56` gates production awards on `season.stats`) and
   handing a sidelined player an All-Conference. **I ran it: it does not happen.** Diffing the per-seed
   `awards` set between base and RA over the same 72,000 careers, **0 of the 138 bad-row careers
   changed their award set**; 6 careers in 72,000 changed at all, in both directions, which is RNG
   divergence (corpus totals 49,309 → 49,306 allConference, 7,441 → 7,440 allAmerican, heisman
   identical). At higher N a rare crossing may exist; at 72,000 it does not, and R0 survives its
   sharpest test. A crossing found later kills R0 immediately.
2. **A player report where the fake line is large.** The median is 4. If the reports cluster on the
   17-in-72,000 tail (>= 100 yards), the visibility argument is much stronger than the rate suggests
   and RA becomes worth its collateral.
3. **RE's cost turning out to be mostly re-baselining rather than real.** If the −2.09 is dominated by
   the lost *cards* rather than the lost production, a variant that lets the selector draw a
   replacement card when a production card is gated out could land RE's correctness at RA's price.
   That variant is one more probe run and I did not build it; it is the highest-value follow-up on this
   brief.

Conversely, the thing that would **not** change it: another instrumented sweep finding a different
offending card. §1a's table is a sample of a 78-option population, and no route should be sized off it.

---

## 6. Corrections this report owes the log

* **DECISION 073, "the clamp never touched one of the 29."** Measured false as a general statement:
  21% of bad rows carry snap-effect history, and on 24 of them the clamp ate an authored `+10`. The
  conclusion (revert; the clamp is not the cause; the proposed fix would have changed nothing) is
  **confirmed** — the fix would have fired on **0 of 29** — but the supporting claim needs restating.
* **DECISION 073, "`productionScore` loses those snaps from draft stock."** Measured false. There are
  no snaps. Draft-stock impact of the entire defect is **0 careers in 72,000**.
* **DECISION 073, "the −4 and the verdict on a season the player lived through."** The player lived
  through it **on the sideline**, in all three on-field phases. The decline and the verdict are
  correct; only the stat line is not.
* **Report 048 §5's mechanism, at its own repro `z-206`.** Refuted by instrumentation: no snap effect
  of any kind touched that line.

---

## 7. Verification

| Check | Result |
|---|---|
| Instrumentation confined to detached worktree at `4076822` | yes; `git worktree remove` run, `git worktree list` shows only the main tree |
| `src/engine/**`, `src/content/**`, `src/ui/**`, `src/sim/**` in the main tree | **untouched** — this lane's only write is this report |
| `npx tsc --noEmit -p tsconfig.engine.json` in the worktree, instrumented | exit 0 |
| Main tree `npm run typecheck` | both passes exit 0 |
| Main tree `npm test` | **728 passed**, 41 files (the brief said 727; a concurrent lane landed one more) |
| Main tree `git status --short` | only this report, plus `DECISIONS.md` modified by the concurrent lane — nothing from here |
| Award-set diff, base vs RA, same 72,000 seeds | 6 careers changed, 0 of them bad-row careers |
| Non-vacuity of every route | each route moved at least one of {bad rows, stat writes, careers' stock} against the same seeds; RA, RB, RA2, RE all took bad rows 138 → 0, RC to 2 |
| History survives `advance()`'s `JSON` clone | yes, by design (enumerable property); demonstrated across phases at `z-206` |

**Probes are not landed.** `src/sim/probe052.ts` and `src/sim/z206.ts` existed only in the worktree
and went away with it. The two one-line route diffs worth keeping are reproduced verbatim in §4 (RA and
RE); the sweep harness is a straightforward loop over `playCareer` and is cheaper to rewrite than to
carry.
