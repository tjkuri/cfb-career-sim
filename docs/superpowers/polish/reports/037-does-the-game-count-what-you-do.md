# 037 — Does the game count what you do? The human bad player, measured

**Type:** research / measurement · **Wave:** 18 · **Status:** done — **needs a user decision**
**2026-09-15** · **Careers measured:** 108,000 (6 profiles × 6 positions × 3,000, seed prefix `b037`, home state TX)
**Changed in the repo:** `src/sim/policies.ts` (additive: one event strategy, two profiles),
`src/sim/human-lazy-probe.ts` + `.test.ts` (new). **Nothing in `src/engine/**` or `src/content/**`.**

---

## Headline

| | |
|---|---|
| The playtester's complaint | *"I ducked, cheated and quit for five straight seasons and finished Round 4 with an All-American. I stopped believing the game is counting what I do."* |
| Is it real? | **Yes, and the numbers are almost exactly the ones they reported.** |
| `good` QB | 0.2% undrafted · 50.0% round 1 · OVR P50 **92** · All-American **72.2%** |
| `humanLazy` QB (same offseason policy, bad on every card) | 0.5% undrafted · 19.0% round 1 · OVR P50 **87** · All-American **52.6%** |
| The gap the player reads | **5 overall points**, 2 median rounds — and the bad career is *more* likely to be All-Conference (72.9% vs 62.1%) |
| Root cause 1 | The All-American draw is **flat from overall 85 to 99** — a 0.60 band. The 5-point gap is invisible to it |
| Root cause 2 | All-Conference is gated on **snaps**, and `good`'s transfer-up policy costs snaps. The good player plays **292 snaps a season; the bad player plays 492** |
| Root cause 3 | 14 authored outcome blocks pay **overall for character**, and `deriveDraftStock` prices character at 0.15 against overall's 1.4. Nine of thirteen off-field temptations are **net-positive draft stock** |
| The surprise | **`good` takes a character-losing branch on 9 of the 13 off-field cards**, including the single most corrosive option in the bundle. The optimiser cheats, because cheating pays |
| The one-line answer | **The game counts what you do — but almost entirely in a number it never shows you.** Bad play costs 5 points of a hidden-until-the-end rating and a 1-in-4 chance of busting; it costs *nothing* in the honours and the draft round the player reads as the verdict |

---

## 1. The `humanLazy` policy: what I built and why the definition is the finding

**The problem with every bad-play policy in the repo:** they are all defined against the engine's own
objective function, `deriveDraftStock`. That is a *machine's* definition of bad play, and it produces
a player no human resembles.

`lazy` minimises draft stock. Stock prices a character point at **0.15** and an overall point at
**1.4**. So the off-field temptations — which charge character and pay overall — are *net-positive
stock*, and **`lazy` declines them.** It then throws away overall on the football cards instead. It
ducks the cheating and sandbags the rating: the exact inverse of the playtester.

`antisocial` (character-minimising with a stock-*minimising* tiebreak) gets rule 1 right and rule 2
wrong: it also sandbags the football cards.

### The definition, stated explicitly

`humanLazy` is lexicographic, against **authored intent** rather than against the scorer:

1. **Take the most self-serving option** — the one with the most negative *expected character delta*.
   Character loss is the only marker the content carries for "this is the corrosive branch", and
   `offfield.ts` states the convention outright in its own header: *"the corrosive option charges
   character on the branch you take, not merely on the branch where you fail."* Every authored
   temptation obeys it.
2. **Break ties by MAXIMISING draft stock.** Most options carry no character effect at all, so this
   fires on the majority of cards — and it is the load-bearing half. **A human who ghosts the media
   and sells his tickets still wants to be good at football on Saturday.** He is misbehaving, not
   sandbagging. This is precisely why the playtester finished with an All-American.

So: `humanLazy` = `best` on the football cards, *most corrosive available* on the character cards.

**Justification that it behaves like the playtester's career.** Over 3,000 QB careers it finishes
with a median overall of 87 against `good`'s 92 (the playtester measured a five-point gap), a median
round of 3 against `good`'s 1 (they reported a one-round gap; two is the cohort median and one is
well inside the spread — see the round distribution in §5), 52.6% All-American (they got one), and 95.6% of careers in the bottom locker-room
band. It also diverges from all three existing policies rather than duplicating one: over the 88
multi-option events, it disagrees with `good` on 38.6%, with `lazy` on 60.2%, and with `antisocial`
on 25.0%.

**One honest limitation, and it is itself a finding: there is no authored marker for EFFORT.** The
content marks corrosion (`character`) but nothing marks "this is the lazy option". `gym-grind` pays
overall for grinding, but `film-room-rat` pays *more* overall for "keep it reasonable" than for
"grind every morning". A rule that reads low effort as "the option that pays less overall" would be
wrong roughly as often as it was right. So `humanLazy` models *ducking and cheating*, which the
content does mark, and does **not** model *trying less*, which it does not.

**Two profiles, because the event policy and the offseason policy are different questions:**

| profile | events | recruiting | transfer | redshirt | isolates |
|---|---|---|---|---|---|
| `humanLazyFull` | humanLazy | lowestTier | stay | decline | identical to `lazyFull` except the event strategy |
| `humanLazyAmbitious` | humanLazy | highestTier | up | take | **identical to `good` except the event strategy** — the headline comparison |

`humanLazyAmbitious` is the playtester: playing to get drafted, behaving badly on every card. Every
`good` vs bad comparison below uses it, because it is the only variable that differs.

---

## 2. The mechanical cause: misbehaving off the field is profitable

**14 outcome blocks pair a character LOSS with an overall GAIN.** All 14 are in `offfield.ts`,
across 11 options in 10 events. The brief's count is exact:

| event | option | branch | p | character | overall | this branch's draft stock |
|---|---|---|---|---|---|---|
| offfield-group-chat | let-it-fly | positive | 0.70 | −4 | +1 | **+0.80** |
| offfield-group-chat | let-it-fly | negative | 0.30 | −6 | +1 | **+0.50** |
| offfield-money-manager | let-him-handle-it | positive | 0.60 | −4 | +2 | **+2.20** |
| offfield-money-manager | let-him-handle-it | negative | 0.40 | −5 | +1 | **+0.65** |
| offfield-sportsbook-nil | take-the-money | positive | 0.70 | −5 | +2 | **+2.05** |
| offfield-sportsbook-nil | take-the-money | negative | 0.30 | −7 | +1 | **+0.35** |
| offfield-skip-install | do-the-podcast | positive | 0.65 | −4 | +1 | **+0.80** |
| offfield-ticket-hookup | sell-them | positive | 0.60 | −4 | +1 | **+0.80** |
| offfield-ticket-hookup | sell-them | negative | 0.40 | −6 | +1 | **+0.50** |
| offfield-bowl-curfew | sneak-out | positive | 0.55 | −4 | +1 | **+0.80** |
| offfield-ghost-media | no-show | positive | 0.60 | −4 | +1 | **+0.80** |
| offfield-entourage | lean-in | positive | 0.60 | −8 | +1 | **+0.20** |
| offfield-portal-rumor | let-it-work | positive | 0.55 | −8 | +2 | **+1.60** |
| offfield-exit-interview | argue-the-tape | positive | 0.45 | −9 | +1 | **+0.05** |

**Every one of the 14 is net-positive draft stock on its own branch.** Even `−9 character, +1
overall` clears zero.

Expected value per option, and what each policy actually picks (QB, `STOCK_WEIGHTS`):

| off-field event | corrosive option | EV char | EV ovr | **EV stock** | clean option's EV stock | `lazy` picks | **`good` picks** |
|---|---|---|---|---|---|---|---|
| offfield-group-chat | let-it-fly | −4.60 | +1.00 | **+0.71** | +0.00 | apologize | **let-it-fly** |
| offfield-money-manager | let-him-handle-it | −4.40 | +1.60 | **+1.58** | +0.00 | hire-a-professional | **let-him-handle-it** |
| offfield-sportsbook-nil | take-the-money | −5.60 | +1.70 | **+1.54** | +0.00 | have-it-read | **take-the-money** |
| offfield-skip-install | do-the-podcast | −4.00 | +0.30 | −0.18 | +0.00 | do-the-podcast | skip-the-podcast |
| offfield-training-table | cut-the-line | −4.50 | +0.00 | −0.60 | +0.00 | cut-the-line | wait-your-turn |
| offfield-ticket-hookup | sell-them | −4.80 | +1.00 | **+0.68** | +0.00 | give-them-away | **sell-them** |
| offfield-bowl-curfew | sneak-out | −4.45 | +0.10 | −0.53 | +0.00 | sneak-out | stay-in |
| offfield-ghost-media | no-show | −4.80 | +0.60 | **+0.12** | +0.00 | show-up | **no-show** |
| offfield-entourage | lean-in | −8.80 | +0.60 | −0.48 | −3.19 | clear-the-room | **ride-it-out** (−3 char) |
| offfield-portal-rumor | let-it-work | −8.45 | +1.10 | **+0.27** | −3.22 | kill-it-yourself | **let-it-work** (−8.45 char) |
| offfield-coordinator-blowup | double-down | −9.50 | +0.00 | −1.39 | +0.98 | double-down | apologize-on-tape |
| offfield-curfew-check | stay-out | −9.55 | +0.00 | −1.40 | −3.12 | own-it-monday | **ride-it-out** (−3 char) |
| offfield-exit-interview | argue-the-tape | −9.55 | +0.45 | −0.80 | −3.12 | ask-what-it-takes | **ride-it-out** (−3 char) |

**Three things fall out of that table, and they matter more than the headline rates:**

1. **The brief's thesis is confirmed and then some.** `lazy` takes the *clean* option on five of
   these cards and the actively *virtuous* option on four more. **The policy every measurement in
   this phase called "bad play" behaves better off the field than the policy called "good play."**
   DECISION 058's calibration was measured against a player who avoids exactly the cards a human bad
   player is drawn to.
2. **`good` takes a character-losing branch on 9 of the 13 off-field cards**, including
   `let-it-work` — at EV −8.45 character, the single most corrosive option a stock-maximiser can be
   induced to take. The optimiser cheats, because in this economy cheating is the optimal line.
   Under `good` the median career ends at character **41**: *"a problem they are managing."*
3. **The clean option is authored as strictly dominated.** On **all eight** ungated band-1 cards the
   clean branch is literally `effects: []`. It is not a trade-off; it is a button that does nothing.

`deriveDraftStock` is the whole economy here: `(overall − 40) × 1.4` against `(character − 50) ×
0.15`, so one overall point is worth **9.33 character points**. A card paying `−6 character,
+1 overall` is a bargain by a factor of 1.5.

---

## 3. The headline: `good` vs `humanLazy`, per position

3,000 careers each. `humanLazyAmbitious` differs from `good` **only** in the event strategy.

| pos | undrafted `g`/`h` | **busted** `g`/`h` | round 1 `g`/`h` | median round `g`/`h` | median overall pick `g`/`h` | OVR P50 `g`/`h` | **ΔOVR** | **All-American `g`/`h`** | All-Conference `g`/`h` | any trophy `g`/`h` |
|---|---|---|---|---|---|---|---|---|---|---|
| QB | 0.2% / 0.5% | 2.7% / **25.5%** | 50.0% / 19.0% | 1 / 3 | 32 / 76 | 92 / 87 | **5** | 72.2% / **52.6%** | 62.1% / **72.9%** | 86.5% / 80.8% |
| OSKILL | 0.3% / 0.2% | 3.1% / **25.1%** | 46.1% / 14.7% | 2 / 3 | 37 / 83 | 91 / 86 | **5** | 61.3% / **42.0%** | 63.1% / **77.5%** | 86.5% / 78.8% |
| OL | 0.0% / 0.2% | 2.8% / **28.3%** | 48.7% / 15.2% | 1 / 3 | 32 / 74 | 93 / 87 | **6** | 15.0% / **10.3%** | 59.6% / **71.6%** | 87.3% / 80.2% |
| DL | 0.3% / 0.2% | 3.1% / **24.4%** | 43.2% / 12.4% | 2 / 3 | 43 / 86 | 91 / 87 | **4** | 37.0% / **24.8%** | 57.2% / **71.9%** | 87.1% / 79.0% |
| DSKILL | 0.3% / 0.3% | 2.9% / **24.7%** | 45.9% / 14.9% | 2 / 3 | 37 / 81 | 91 / 87 | **4** | 37.9% / **25.9%** | 60.9% / **75.4%** | 87.5% / 80.6% |
| K | 0.4% / 1.0% | 7.2% / **25.9%** | 26.0% / 4.5% | 3 / 4 | 66 / 107 | 92 / 88 | **4** | 5.6% / **4.2%** | 49.5% / **63.7%** | 84.1% / 78.7% |

**Read this per position, not in aggregate — the pattern is the same at all six, which is itself the
answer.** There is no position where bad play is meaningfully punished at the draft. The undrafted
rate is **≤1.0% for a deliberately bad player at every position**, and at three of six it is at or
*below* the good player's (OSKILL 0.2% vs 0.3%, DL 0.2% vs 0.3%, DSKILL 0.3% vs 0.3%).

**What actually separates the two careers is the bust, not the draft.** The bad player's real cost
is a **1-in-4 chance the career ends early** — 24.4%–28.3%, against 2.7%–7.2%. The ending reasons
confirm it is the character spiral doing all the work (QB, per 3,000): *Removed from the program*
230, *Academically ineligible* 194, *Dismissed from the team* 179, *Ran out of rope* 126 — against
21 buried and 15 injured. That mechanism is working exactly as authored.

**But conditional on surviving — which is the playtester's situation — the difference nearly
vanishes:**

| profile | pos | picked % | OVR P50 | All-American | **All-Conference** | any award | median round |
|---|---|---|---|---|---|---|---|
| good | QB | 97.1% | 92 | 73.9% | 63.5% | 89.4% | 1 |
| **humanLazyAmbitious** | QB | 74.0% | **88** | **64.0%** | **80.0%** | **92.7%** | 3 |
| good | OSKILL | 96.5% | 92 | 63.1% | 64.8% | 87.8% | 2 |
| humanLazyAmbitious | OSKILL | 74.8% | 88 | 52.0% | 83.9% | 93.0% | 3 |
| good | OL | 97.1% | 93 | 15.4% | 60.9% | 68.5% | 1 |
| humanLazyAmbitious | OL | 71.5% | 90 | 12.9% | 80.6% | 84.2% | 3 |
| good | DL | 96.6% | 91 | 38.2% | 58.9% | 76.9% | 2 |
| humanLazyAmbitious | DL | 75.3% | 88 | 30.3% | 78.8% | 85.8% | 3 |
| good | DSKILL | 96.9% | 92 | 39.0% | 62.4% | 78.4% | 2 |
| humanLazyAmbitious | DSKILL | 75.0% | 89 | 31.5% | 83.0% | 89.2% | 3 |
| good | K | 92.5% | 93 | 6.0% | 52.6% | 56.3% | 3 |
| humanLazyAmbitious | K | 73.1% | 90 | 5.1% | 71.9% | 73.7% | 4 |

**A bad career that reaches the draft board is four overall points short, one to two rounds later,
and ends with MORE honours than a good one** — 92.7% vs 89.4% for a QB earning at least one award.
That is the playtester's report, reproduced at n=3,000.

---

## 4. Where do awards come from? The mechanism, described, not changed

### All-American and Heisman are **prestige** awards: a function of `overall` alone

`resolveAwards` (`engine/postseason.ts:42`) rolls, once per non-redshirt season:

```
p = bandProb(overall, award.bands) × positionMultiplier[position] × (wonAnyTrophy ? 1.3 : 1)
```

`bandProb` is a **step function** (`postseason.ts:36`). Nothing else enters. Character does not.
Snaps do not. Stats do not. What the player chose does not, except through `overall`.

| overall | All-Am band | QB, no trophy | QB, w/ trophy | OL (×0.15) | K (×0.05) | Heisman band |
|---|---|---|---|---|---|---|
| 74 | 0.00 | 0.000 | 0.000 | 0.000 | 0.000 | 0.00 |
| 75–79 | 0.10 | 0.100 | 0.130 | 0.019 | 0.007 | 0.00 |
| 80–84 | 0.30 | 0.300 | 0.390 | 0.058 | 0.019 | 0.00 |
| **85–99** | **0.60** | **0.600** | **0.780** | **0.117** | **0.039** | 0.08 → 0.50 |

**This is the sharpest finding in the report.** A `good` career's median overall is 92; a bad one's
is 87. **Both sit in the same 0.60 band.** The five overall points that the entire draft economy is
built on — the thing 109 of 199 authored options push around — buy **exactly zero** additional
All-American probability. The only reason `good` earns more All-Americans at all is that it *reaches*
85 in more seasons, not that it goes further past it. Heisman is the one honour that does
discriminate (0.08 at 84 → 0.25 at 88 → 0.50 at 92), and it is also the one almost nobody sees.

### All-Conference is a **production** award: a function of snaps

```
if (stats[award.stat] < threshold) return;   // no draw at all
if (rng.next() < 0.7) award                  // 0.6 for K
```

Stats come from `simulatePhaseProduction`: `yield = per100 × snaps/100 × (overall/70) × jitter`.
Snaps come from a per-position roll scaled by `snapModifier` — which is set by the **recruiting
offer, the transfer, the redshirt and the school trait**, not by the event cards. Only 16 of 199
authored options carry a `snaps` effect at all.

**So All-Conference measures playing time, and `good`'s offseason policy destroys playing time:**

| profile | avg career snaps (QB) | avg seasons | **snaps per season** | All-Conference |
|---|---|---|---|---|
| `good` (transfer up every year, redshirt) | 1,443 | 4.94 | **292** | 62.1% |
| `humanLazyAmbitious` (same offseason policy) | 1,609 | 4.78 | 337 | 72.9% |
| `humanLazyFull` (stay put, no redshirt) | 1,937 | 3.94 | **492** | **88.6%** |
| `lazyFull` (stay put, no redshirt) | 1,960 | 3.98 | 492 | 78.2% |

`transfer.moveUpSnapModifier` is **0.6** and `redshirt.sitSnapModifier` is **0.05**. A player who
climbs the ladder every year and redshirts plays roughly 60% of the snaps of one who never moves.
The QB All-Conference threshold is 1,240 passing yards; at 292 snaps and overall 92 a season yields
roughly 1,000. **The optimal draft career is systematically below the All-Conference bar, and the
career that stays put and coasts is comfortably above it.** That is why the honour "goes to the bad
career", exactly as the playtester said.

**Plain answer to the brief's question:** *Yes.* All-American is a sim-rolled draw off a step
function of `overall` that a player's choices barely touch above 85, and All-Conference is a
sim-rolled draw off snaps, which the event cards touch in 16 options out of 199. **Neither honour
reads the player's conduct, and one of them is actively anti-correlated with playing well.**

---

## 5. The Kicker question

DECISION 059's falsifier fired: a playtester finished a well-played kicker at **Round 3 Pick 8** and
called it *"too easy — not a thing for a kicker."* The full distribution, as a share of careers that
reached the draft board:

| profile | pos | undrafted | R1 | R2 | R3 | R4 | R5 | R6 | R7 |
|---|---|---|---|---|---|---|---|---|---|
| **good** | QB | 0.2% | **51.4%** | 13.8% | 13.7% | 9.5% | 6.8% | 3.5% | 1.1% |
| good | OSKILL | 0.3% | 47.6% | 16.4% | 15.1% | 11.1% | 6.3% | 2.5% | 0.7% |
| good | OL | 0.0% | 50.1% | 17.0% | 16.0% | 9.9% | 4.6% | 1.9% | 0.4% |
| good | DL | 0.3% | 44.6% | 17.2% | 16.2% | 11.2% | 7.0% | 2.4% | 1.0% |
| good | DSKILL | 0.3% | 47.3% | 16.6% | 14.9% | 11.1% | 6.1% | 3.1% | 0.6% |
| **good** | **K** | **0.4%** | **28.0%** | **20.6%** | **19.4%** | **16.1%** | 9.6% | 4.4% | 1.5% |
| humanLazyAmbitious | QB | 0.7% | 25.5% | 16.8% | 20.4% | 17.2% | 11.5% | 6.1% | 1.9% |
| **humanLazyAmbitious** | **K** | **1.4%** | **6.0%** | 13.5% | 23.5% | 22.8% | 17.5% | 11.2% | 4.2% |
| humanLazyFull | QB | 0.6% | 14.2% | 16.7% | 23.3% | 21.5% | 16.4% | 5.5% | 1.8% |
| **humanLazyFull** | **K** | **1.8%** | **0.7%** | 5.9% | 17.0% | 28.3% | 26.0% | 14.0% | 6.2% |

**K's round-1 rate is 26.0% of all careers / 28.0% of drafted, confirming the 26.9% already on the
board — and that is not the interesting number.** The whole picture:

- **K is genuinely the hardest position, everywhere except the one place the player looks.** Its
  All-American rate under `good` is **5.6%** against QB's 72.2% (positionMultiplier 0.05 vs 1.0);
  its median overall pick is **66** against QB's 32; it busts at **7.2%** against the field's ~2.9%,
  almost all of it *"Buried on the depth chart"* (173 of 215 bust endings, against 48 for a QB);
  under `lazyFull` it goes undrafted **32.6%** of the time against the field's 7.6–15.1%. Every
  discriminator except one says K is hard mode and working.
- **The one that does not is the round band, and it is not a K bug.** A well-played kicker reaches
  overall 92 like everyone else (`snapsPerDevPointByPosition.K = 62` correctly normalises for the
  ~34% workload), and `deriveDraftStock` is ~82 points of overall against ~15 of production and ~7.5
  of character. **Once a kicker's overall is high, the draft cannot tell it is a kicker**, because
  the only position-aware term in the entire stock formula is `awards.length × 3` — and awards are
  where K is already penalised. K's round-1 rate is 28% instead of QB's 51% *solely* because K loses
  the award and trophy points, not because the draft model knows what a kicker is.
- **Round 3 Pick 8 for a well-played kicker is the median outcome, not a fluke.** K's median round
  under `good` is exactly **3**, median overall pick **66**. The playtester found the centre of the
  distribution and correctly read it as too generous.

`deriveDraftStock` has no position term. That is the fact behind the complaint; whether it should is
a balance decision, not a measurement.

---

## 6. Locker-room band: the one place the game *is* counting

Final character, bucketed with `ui/session/bands.ts`'s `TRUST_BANDS` — the phrases a player is
actually shown. (The probe's copy of the table is asserted equal to the UI's at every integer value.)

| profile | pos | char P50 | run through a wall | staff trusts you | just a guy | a problem they are managing | **staff has stopped defending you** |
|---|---|---|---|---|---|---|---|
| good | QB | 41 | 0.0% | 0.2% | 24.8% | 58.0% | 17.0% |
| good | OL | 40 | 0.0% | 0.3% | 20.9% | 59.9% | 18.9% |
| good | K | 44 | 0.0% | 0.4% | 32.9% | 53.7% | 12.9% |
| randomFull | QB | 46 | 0.0% | 0.2% | 39.6% | 48.0% | 12.2% |
| lazyFull | QB | **55** | 0.0% | 0.2% | **77.5%** | 22.0% | 0.3% |
| antisocialFull | QB | 19 | 0.0% | 0.0% | 1.0% | 19.1% | 79.9% |
| humanLazyFull | QB | 19 | 0.0% | 0.0% | 0.6% | 19.3% | **80.1%** |
| **humanLazyAmbitious** | QB | **7** | 0.0% | 0.0% | 0.5% | 3.9% | **95.6%** |
| humanLazyAmbitious | K | 6 | 0.0% | 0.0% | 0.7% | 4.8% | 94.5% |

Per-position spread is negligible (bottom band 94.5%–96.2% for `humanLazyAmbitious`, 80.1%–86.3% for
`humanLazyFull`); the band is a pure character read and character is position-independent.

**Three things to notice:**

1. **The band discriminates perfectly and nobody is looking at it.** `humanLazyAmbitious` ends in the
   bottom band 95.6% of the time; `good` ends there 17.0% of the time. This is the *only* measured
   quantity that cleanly separates the two careers. It is also the quantity the game deliberately
   never shows as a number, and which contributes ±7.5 to a draft stock with ±82 of overall.
2. **`lazyFull` ends with the HIGHEST character of any profile** — median 55, and only 0.3% in the
   bottom band, better than `good`'s 17.0%. A stock-minimising policy declines every off-field
   temptation, so "the worst player in the sim" finishes as the best citizen. This is the clearest
   possible statement that the character economy is inverted.
3. **`good`'s median character is 41 — "a problem they are managing."** A player who optimises
   perfectly ends every career with the staff half out of patience, because the optimiser is told to
   sell his tickets and ghost the media. The band is telling the truth; it is the economy that is
   wrong.

---

## 7. Proposal — changes I am NOT making, for the PM and the user to decide

Every item here touches `src/content/**` or `src/engine/**`, which are frozen. Ranked by ratio of
effect to blast radius.

### P1 — Stop paying overall for character on the off-field cards (content, `offfield.ts`)

**What:** remove the `overall` gain from the 14 paired outcome blocks in §2, or move it to the clean
branch. **Pros:** kills the exploit at its source; the clean option stops being strictly dominated;
`good` stops cheating (it would pick the clean branch on 9 of 13 cards immediately); it is 14 line
edits in one file with no balance constant touched. **Cons:** the corrosive options become pure
downside, which weakens them as *temptations* — a choice with no upside is not a dilemma, and this
content was deliberately authored as one. The fiction ("skipping the install buys you training time")
is sound; it is the *price* that is wrong. **Risk:** low mechanically, real narratively.

### P2 — Reprice character in `deriveDraftStock` (engine, `draft.ts`, one constant)

**What:** raise `characterPart` from `× 0.15` toward `× 0.6–0.9`, so one overall point is worth ~2
character points rather than 9.33. **Pros:** one number; makes the 14 blocks net-negative without
touching a word of content; preserves the temptation as a genuine trade. **Cons:** re-opens DECISION
058's calibration — `UNDRAFTED_FLOOR = 50` and `ROUND_BAND_DIVISOR = 6.8` were measured against the
current weight and both would have to be re-swept. It also breaks the stated UI constraint's
rationale: character currently swings stock ±7.5 against overall's ±82, which is *why* it is shown
as a band and not a number. At ×0.6 it swings ±30 and the band starts under-representing it.
**Risk:** medium-high. Do not do this without re-running report 034's sweep.

### P3 — Make All-American discriminate above 85 (content, `postseason.ts`, band table)

**What:** the `allAmerican` bands are `85→0.6, 80→0.3, 75→0.1`. Adding rungs (e.g. `92→0.6, 88→0.4,
85→0.25, 80→0.12, 75→0.04`) would make the five-point gap between a good and a bad career visible in
the honour the player reads as the verdict. **Pros:** directly answers the playtester's sharpest
complaint; three lines; no engine change; Heisman already demonstrates the shape works. **Cons:**
lowers everyone's All-American rate, which is a headline number the phase may not want moved; needs
re-measuring against the position multipliers (OL at ×0.15 and K at ×0.05 are already scarce).
**Risk:** low-medium, entirely measurable.

### P4 — Decide whether All-Conference should reward staying put (no change, or `transfer.ts` config)

**What:** `moveUpSnapModifier: 0.6` means the optimal draft career plays too few snaps to clear the
All-Conference threshold. This may be **correct and good** — it is a real trade-off, authored or not:
climb the ladder and get drafted higher, or stay and pile up honours. But it is currently invisible,
undocumented, and reads to a player as the game not counting what they do. **Pros of leaving it:**
it is the most interesting strategic tension in the game. **Pros of changing it:** it is the specific
mechanism that hands the bad career the honour. **Recommendation: leave the mechanic, surface the
trade-off** — this is a UI/telegraphing question for a later wave, not a balance bug.

### P5 — Give `deriveDraftStock` a position term (engine, `draft.ts`)

**What:** K is hard mode everywhere except the round band, because the stock formula has no position
awareness. **Cons:** this is a genuinely new mechanic, re-opens DECISION 058 wholesale, and the
existing per-position award multipliers already do most of the job. **Recommendation: do not,** until
P1–P3 are settled; K's 28% round-1 rate may move on its own once the award economy changes.

**My recommendation, if asked: P1 first, alone, and re-run this probe.** It is the smallest change
that addresses the measured cause, it needs no constant re-swept, and it is reversible. P3 second if
the user wants the *honours* to discriminate rather than merely the rating. P2 only with a full
re-sweep of report 034, and P5 not at all this phase.

---

## 8. Verification

- `npm test` — **671 passed, 39 files, 0 failed.** HEAD is 650; the delta is **+10 from this brief**
  (`src/sim/human-lazy-probe.test.ts`) and **+11 from another agent's concurrent, uncommitted
  `src/ui/session/ledger.test.ts` work in the same tree** (see the caveat below).
- `npm run typecheck` — both passes exit 0 (`tsconfig.engine.json`, then `tsconfig.json`).
- **Seed baselines unaffected, proved on two seeds × two policies.** `git archive HEAD` to a temp
  dir, then `npx tsx src/sim/play-headless.ts <seed> <policy>` in both trees:
  `demo`/first, `demo`/random, `b037-seed-A`/first, `b037-seed-A`/random — **all four byte-identical.**
- **Existing profiles unaffected.** `npx tsx src/sim/failure-probe.ts 400 good all` and
  `... 400 lazyFull all` are byte-identical between HEAD and the working tree. The `humanLazy` branch
  returns before any existing code path, and `ENDING_WEIGHT` gained a key that no existing profile
  reads.
- **Concurrency caveat, flagged rather than absorbed.** Another agent was editing the same working
  tree during this measurement (`src/ui/**`, `src/content/events/k.ts`). I verified `k.ts`'s diff is
  **prose only** — two `description` strings on `bowl-game-winner`, no effect, probability, weight or
  condition changed — so no number in this report is affected. I touched nothing they own.
- **Reproduce:** `npx tsx src/sim/human-lazy-probe.ts 3000 good,lazyFull,antisocialFull,humanLazyFull,humanLazyAmbitious,randomFull all`
  (~55s, 108,000 careers). Seed prefix `b037`, home state TX, matching every prior baseline.
