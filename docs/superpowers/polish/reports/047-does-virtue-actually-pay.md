# 047 — B62: does virtue actually pay in a played career, and what do the no-choice cards cost?

**Type:** measurement + proposal · **Wave:** 25 · **Status:** Part 1 complete, Part 2 complete
**Nothing in the repo working tree was modified except this file.** All prototypes were built in a
detached worktree at HEAD (`39e7cb7`) and destroyed.

## Headline

**Yes — an ordinary good career sees more *Earned* than *Cost* lines, but only if "good" means
*actually taking the team-first branch*. The `good` profile in `src/sim/policies.ts` is not that
player and never was.**

| the player | Earned/career | Cost/career | net |
|---|---:|---:|---:|
| `good` (`events: "best"`, today's "good player" row) | **1.42** | **4.34** | **−2.92** |
| max-virtue, playtester's shape (`virtueLoyal`) | **2.71** | **2.13** | **+0.58** |
| max-virtue, ambitious (`virtueAmbitious`) | **3.20** | **2.49** | **+0.71** |
| ordinary play (`baselineRandom`) | 2.13 | 9.11 | −6.98 |

So the brief's hypothesis is **partly confirmed and partly refuted**, and the most useful finding is
neither of the two things it was looking for. See "The thing nobody asked about" at the end — it is
the strongest result in this report and it changes what the implementing wave should build.

---

## Method

Harness: `src/sim/virtue-probe.ts` (worktree only, thrown away). It drives the engine's own loop
(`createCareer → getDecision → advance`, the reference loop in `play-headless.ts`, same shape as
`repetition-probe.ts`) and calls **`cardAccount` from `src/ui/session/view-model.ts` directly** on
each `(before, after, decision, optionId)`. That is not an approximation of the card — it *is* the
function that decides whether the card prints *"Earned you credit in the locker room."* or *"Cost you
in the locker room."* Nothing about the accounting is re-implemented.

**Sample size: 3,000 careers per cell, 4 positions (QB, OSKILL, DL, OL) × 6 profiles = 72,000
careers** for the main table; separate 5,000-career runs for the line histograms and the attribution
split. Home state TX throughout, matching every baseline in `STAGE4-HANDOFF.md`. Runtime 44s.

### The `good` profile is not a good teammate — and this is the first finding

The brief asked what `best` actually maximises. It maximises **expected NFL draft stock**, priced by
`deriveDraftStock`: **1.4 stock per overall point against 0.15 per character point**. A card offering
`+1 overall / −6 character` therefore scores `+1.4 − 0.9 = +0.5` and **`best` takes it**. Measured:

> `good/QB` takes options worth **E[character] = −8.04 per career** when the best-available option on
> the same cards was worth **+0.77**. It walks past **1.9 of the 4.0 virtuous options it is offered.**

`good` is a stock-maximiser that sells character whenever character is cheap, which under the engine's
own exchange rate it almost always is. So the row every report in this project has cited as "the
player who plays well" is, on the locker-room axis, a mild version of `humanLazy`. **This alone
explains most of the corpus-vs-career contradiction the brief was convened over** — the corpus was
measured against virtuous options, and the career was measured against a policy that declines them.

I therefore added a **`virtue` event strategy** in the worktree: take the option with the highest
expected character delta, ties broken by maximising draft stock. It is the exact mirror of
`humanLazy` and it is the policy the playtester described. Two profiles use it:

- `virtueAmbitious` — identical to `good` except the event strategy (highest tier, transfer up, take
  the redshirt). The clean A/B.
- `virtueLoyal` — the playtester's literal shape: **one school, no transfers, declines the redshirt,
  four seasons.**

**Recommendation: keep `virtue` in `src/sim/policies.ts` permanently.** Diff is in Appendix A. Without
it the project has no row for "played well and behaved", which is the single most common way a human
actually plays, and every "good player" number on this board is currently measuring something else.

---

## Part 1 — the realized-frequency sweep

### 1. Realized *Earned* vs *Cost* lines (3,000 careers/cell)

| cell | Earned mean | Earned median | **P(0 Earned)** | Cost mean | Cost median | net | **P(Earned > Cost)** |
|---|---:|---:|---:|---:|---:|---:|---:|
| good/QB | 1.42 | 1 | 21.6% | 4.34 | 4 | −2.92 | 5.4% |
| good/OSKILL | 1.51 | 1 | 19.4% | 4.60 | 4 | −3.10 | 5.3% |
| good/DL | 2.04 | 2 | 10.1% | 4.48 | 4 | −2.44 | 10.5% |
| good/OL | 1.18 | 1 | 27.7% | 5.22 | 5 | −4.04 | 2.8% |
| baselineRandom/QB | 2.13 | 2 | 9.8% | 9.11 | 9 | −6.98 | 0.3% |
| baselineRandom/OSKILL | 2.38 | 2 | 7.6% | 9.55 | 10 | −7.17 | 0.7% |
| baselineRandom/DL | 2.52 | 2 | 7.0% | 9.38 | 9 | −6.86 | 0.9% |
| baselineRandom/OL | 1.97 | 2 | 12.5% | 10.06 | 10 | −8.09 | 0.1% |
| **virtueAmbitious/QB** | **3.20** | 3 | **3.0%** | **2.49** | 2 | **+0.71** | **54.1%** |
| virtueAmbitious/OSKILL | 3.54 | 3 | 2.2% | 2.42 | 2 | +1.12 | 60.0% |
| virtueAmbitious/DL | 4.04 | 4 | 0.9% | 2.40 | 2 | +1.64 | 69.2% |
| virtueAmbitious/OL | 2.64 | 3 | 5.4% | 2.48 | 2 | +0.16 | 43.2% |
| **virtueLoyal/QB** | **2.71** | 3 | **5.7%** | **2.13** | 2 | **+0.58** | **50.7%** |
| virtueLoyal/OSKILL | 3.32 | 3 | 2.3% | 2.06 | 2 | +1.26 | 64.0% |
| virtueLoyal/DL | 3.61 | 4 | 1.0% | 2.05 | 2 | +1.56 | 69.2% |
| virtueLoyal/OL | 2.49 | 2 | 6.3% | 2.19 | 2 | +0.30 | 45.1% |
| humanLazyAmbitious/QB | 0.49 | 0 | 60.5% | 14.79 | 15 | −14.30 | 0.0% |
| antisocialFull/QB | 0.41 | 0 | 65.3% | 13.25 | 13 | −12.84 | 0.0% |

**OL is the worst position on this axis in every profile** — it is offered the fewest virtuous options
(2.87/career vs DL's 3.84) and it is the only cell where the max-virtue player's median character
delta is negative. Nobody asked; it is real and it is consistent across all 3,000-career cells.

### How far out is the playtester's run? (5,000 careers, QB)

Their report: **0 Earned, 5 Cost, four seasons, one school, max virtue** → compare `virtueLoyal/QB`.

```
virtueLoyal/QB    Earned lines:  0:5.0%  1:17.3%  2:25.3%  3:24.3%  4:15.7%  5:8.1%  6:2.9% ...
                  Cost   lines:  0:9.4%  1:24.3%  2:29.5%  3:20.9%  4:11.1%  5:3.3%  6:1.2% ...
                  P(0 Earned)=5.00%   P(Cost>=5)=4.82%   P(BOTH)=0.26%

good/QB           Earned lines:  0:21.4% 1:36.0%  2:26.5%  3:11.5%  4:3.7%   5:0.9% ...
                  Cost   lines:  0:0.9%  1:4.6%   2:11.8%  3:18.5%  4:20.6%  5:17.7% 6:12.5% ...
                  P(0 Earned)=21.40%  P(Cost>=5)=43.72%  P(BOTH)=10.60%
```

**Under true max-virtue play their exact tally is a 1-in-385 career (0.26%). Under `good` — the
stock-maximiser — it is a 1-in-9 career (10.6%).** That 40× gap is the most informative number in
Part 1 and it is addressed under "The thing nobody asked about".

### 2. Final-minus-starting character (start = 70, `STARTING_CHARACTER`)

| cell | p05 | p25 | **median** | p75 | p95 | mean | **ended below start** |
|---|---:|---:|---:|---:|---:|---:|---:|
| good/QB | −19 | −11 | −7 | −4 | 0 | −8.01 | **92.0%** |
| good/OL | −21 | −13 | −9 | −5 | 0 | −9.20 | 94.2% |
| baselineRandom/QB | −65 | −43 | −29 | −18 | −9 | −31.57 | 99.8% |
| **virtueAmbitious/QB** | −9 | −3 | **0** | +4 | +8 | +0.09 | **43.8%** |
| virtueAmbitious/DL | −8 | −3 | +1 | +4 | +8 | +0.42 | 39.7% |
| virtueAmbitious/OL | −10 | −4 | −1 | +2 | +7 | −1.01 | 52.2% |
| **virtueLoyal/QB** | −8 | −3 | **0** | +3 | +7 | −0.09 | **44.5%** |
| virtueLoyal/OSKILL | −8 | −2 | +1 | +4 | +8 | +0.61 | 37.5% |
| virtueLoyal/DL | −7 | −2 | +1 | +3 | +7 | +0.27 | 40.6% |
| virtueLoyal/OL | −9 | −4 | −1 | +2 | +6 | −0.95 | 51.7% |
| humanLazyAmbitious/QB | −70 | −70 | −70 | −57 | −43 | −63.04 | 100.0% |

**This is the load-bearing table, and it is where the playtester was right.** A maximum-virtue career
has a median character delta of **exactly zero** and a **44.5% chance of finishing below where it
started** (52% at OL). The player is not wrong that virtue felt like a coin flip: on the axis the
game shows them — the standing band — it *is* a coin flip.

And note the contradiction between tables 1 and 2: the same career sees **more Earned lines than Cost
lines (+0.58)** while netting **zero character points**. That is arithmetically fine and
experientially awful — **the average Cost line is bigger than the average Earned line.** For
`virtueLoyal/QB`: 4.85 positive points over 2.71 lines = **+1.79/line**, against 4.94 negative points
over 2.13 lines = **−2.32/line**. Virtue wins on frequency and loses on size, so the ledger the player
reads says "you came out ahead" and the band they land in says otherwise. **B48 ("the ledger disagrees
with the season") is the same defect seen from the other end.**

### 3. Attribution of negative character traffic

Share of a career's total **negative character points**, and of its **Cost *lines***:

| cell | % points from the 7 one-button cards | % points from the 5 `milestone-opener-*` | % points from chosen options | Cost *lines* from one-button | Cost *lines* from openers | Cost *lines* chosen |
|---|---:|---:|---:|---:|---:|---:|
| **virtueLoyal/QB** | **44.4%** | **40.1%** | 55.6% | **1.05** | **0.99** | 1.08 |
| virtueLoyal/DL | 45.8% | 40.9% | 54.2% | 1.05 | 0.99 | 1.00 |
| virtueAmbitious/QB | 41.3% | 33.8% | 58.7% | 1.11 | 1.00 | 1.37 |
| good/QB | 22.2% | 18.7% | 77.8% | 1.09 | 0.99 | 3.25 |
| baselineRandom/QB | 6.1% | 5.2% | 93.9% | 1.08 | 0.99 | 8.03 |
| humanLazyAmbitious/QB | 2.8% | 2.4% | 97.2% | 0.98 | 0.90 | 13.81 |

**The PM's hypothesis is confirmed for the virtuous player and refuted for everybody else.** The seven
one-button cards deliver an essentially **constant ~1.05 Cost lines and ~2.4 character points per
career regardless of how you play** (they are unchooseable, so they must). What varies is the
denominator. For `humanLazy` they are 2.8% of the damage and invisible; for a max-virtue player they
are **44% of all character damage and roughly half of every *"Cost you in the locker room."* line the
player reads.** The openers alone are 40%.

Finer split of a virtuous player's Cost lines by *why* (3,000 careers each):

| | one-button (never asked) | chose the virtuous option, roll failed | chose neutral | **every option on the card cost character** |
|---|---:|---:|---:|---:|
| virtueLoyal/QB | **49.2%** | 21.9% | 2.8% | **26.1%** |
| virtueLoyal/DL | 50.9% | 19.4% | 2.8% | 26.9% |
| virtueAmbitious/QB | 44.2% | 27.2% | 0.6% | 28.0% |
| good/QB | 25.3% | 12.2% | 0.0% | 62.5% |

**Roughly three-quarters of a max-virtue player's *"Cost you"* lines are cards where virtue was not on
the menu** — half were one-button, and another quarter were cards where the best available option
still had negative expected character. Only ~20–27% are the honest "you chose well and the dice said
no" case the design intends. That is the structural core of the complaint.

### 4. The gap between the corpus and the career

The corpus counts options. The career gets offered **weighted, gated events**. Three multiplications
sit between the two, and together they account for the whole gap.

**(a) The guaranteed skeleton carries no virtue at all.** All 10 `fixed` events — the spine that fires
in every career — and their character profile:

```
recruiting               1 opt   E[char]  0.00
milestone-fall-camp      1 opt   E[char]  0.00
milestone-opener-first   1 opt   E[char] -0.50
milestone-opener-no-excuse 1 opt E[char] -0.50
milestone-opener-your-team 1 opt E[char] -0.50
milestone-opener-counting  1 opt E[char] -0.50
milestone-opener-last      1 opt E[char] -0.50
milestone-rivalry        2 opts  E[char]  0.00 / -2.00
milestone-senior-day     1 opt   E[char]  0.00
milestone-bowl-season    2 opts  E[char] -0.60 /  0.00
```

**Zero of the 10 fixed events contain an option with positive expected character. Seven of ten are
strictly non-positive. The best a player can do on the guaranteed part of a career is break even.**
Every drop of upside lives in the random pool, which is exactly where luck lives.

**(b) A third of the virtue-bearing pool is gated behind already having fallen.** 36 of 106 events
carry a positive-E[character] option; **all 36 are `random`, none are `fixed`.** Eleven of them are
gated `maxCharacter ≤ 55` (the five `offfield-*` redemption cards and six `bust-*` cards at ≤35/30/25/20).
A player who behaves **never sees them**. Reachable virtue weight, by position:

| position | virtue-bearing share of the position's random pool | **share actually reachable at high character** |
|---|---:|---:|
| QB | 36.8% | **19.2%** |
| OSKILL | 41.4% | 25.0% |
| OL | 37.7% | **19.8%** |
| DL | 40.9% | 24.3% |
| DSKILL | 41.7% | 25.2% |
| K | 44.6% | 28.7% |

**Behaving well halves your access to the content that rewards behaving well.** The redemption
mechanic is doing this on purpose and it is good design, but nothing replaces the missing upside for
the player who never needs redeeming.

**(c) The realized count.** A career takes ~38–41 decisions, ~22–27 of them multi-option, and is
offered a positive-E[character] option on only **2.87 (OL) to 4.70 (DL)** of them — **11–18% of its
choice cards.** So: the corpus's 42 virtuous options at +2.35 × 0.81 imply a large pot, and a career
draws about **four tickets**, against a guaranteed spine of five openers that can only take.

**Answer to Q4: the realized count is far below what the corpus implies, and the cause is weighting
and gating, in that order — not the pool failing to surface them.** The events fire at their authored
rate; there are simply few of them, they are all in the random pool, a third of them are locked
behind low character, and the `fixed` spine that every career is guaranteed contributes none.

*(Note: I count 39 options with strictly positive E[character] against the brief's 42 "options whose
success branch pays character". The criteria differ — an option can pay character on success and lose
more on failure. The direction of every conclusion is unaffected.)*

---

## Part 2 — pricing the three routes

Each route was patched into the content in the detached worktree and measured with the **identical
harness, identical seeds (`b62p2`), 3,000 careers per cell, QB/OL/DL**, so every row below is directly
comparable to the Part 1 rows above. Five variants were run:

- **R1** — the five `milestone-opener-*` succeed with `+2` character as well as `snaps 25`. (+2/−2)
- **R1all** — R1 plus symmetrising `speeding-georgia` (+4) and `the-missed-tackle-reel` (+1).
- **R2** — the five openers get a **second option**, a real trade. Authored as `"steady"`: `p=0.90`,
  success `snaps +10, character +1`, failure `overall −1`. The existing branch is untouched.
- **R3op** — strip the character effect from the five openers only. (+0/−0)
- **R3** — strip it from all seven one-button cards.

> **A correction, recorded because it changes a number.** My first R3 patch used a global
> string replace on `milestones.ts` and silently also stripped `milestone-rivalry/sit` and
> `milestone-bowl-season/prepare` — both **chosen** options, not part of any route. That run made R3
> look twice as strong as it is (`antisocialFull/QB` busted 11.70% vs the true 17.33%). Every R3 number
> below is from the corrected, index-bounded patch. Anyone reproducing this should bound the edit per
> event id; `effects: [{ kind: "character", amount: -2 }],` appears **seven** times in that file.

### The virtuous player — does the route fix the complaint?

`virtueLoyal/QB` (the playtester's exact shape):

| route | Earned | Cost | net | P(E>C) | **median Δchar** | **ends below start** | avg final char |
|---|---:|---:|---:|---:|---:|---:|---:|
| **base** | 2.73 | 2.15 | +0.58 | 50.9% | **0** | **43.9%** | 69.9 |
| R1 | 5.71 | **2.16** | +3.55 | 88.5% | +6 | 11.8% | 75.9 |
| R1all | 6.04 | **2.16** | +3.89 | 90.6% | +7 | 9.3% | 77.2 |
| **R2** | 6.31 | **1.14** | +5.17 | 99.3% | +6 | **8.0%** | 75.5 |
| R3op | 2.73 | 1.15 | +1.58 | 72.3% | +2 | 25.9% | 71.9 |
| R3 | 2.73 | 1.09 | +1.64 | 73.7% | +2 | 23.3% | 72.2 |

`virtueLoyal/OL` — the worst case, and the one a route has to clear:

| route | Earned | Cost | median Δchar | **ends below start** |
|---|---:|---:|---:|---:|
| base | 2.52 | 2.18 | **−1** | **50.9%** |
| R1 | 5.48 | 2.18 | +5 | 15.1% |
| R1all | 5.83 | 2.18 | +7 | 12.2% |
| **R2** | 6.09 | **1.16** | +5 | **11.3%** |
| R3op | 2.52 | 1.15 | +2 | 31.5% |
| R3 | 2.52 | 1.10 | +2 | 29.3% |

**Read the Cost column.** R1 and R1all leave it at 2.16 — **they do not remove a single "Cost you in
the locker room." line; they pay for them elsewhere.** The player still reads ~1 unexplained standing
hit per career from a card they were never asked about; it is just offset by ~2.8 unexplained credits
from the same cards. R2 and R3 both actually reduce it, because they remove the mechanism rather than
compensating for it. R2 reduces it *and* moves the distribution; R3 reduces it and moves the
distribution about half as far.

### Does the game stay losable?

Baselines the brief set: ordinary play busts ~5.67%, a badly-behaved career ~35.00%.

| profile / position | base | R1 | R1all | **R2** | R3op | R3 |
|---|---:|---:|---:|---:|---:|---:|
| baselineRandom/QB busted | 5.37% | **4.13%** | **3.83%** | 4.83% | 5.17% | 5.07% |
| baselineRandom/OL busted | 5.83% | **4.97%** | **4.40%** | 5.67% | 5.37% | 5.33% |
| baselineRandom/QB charUnder55 | 83.67% | **67.93%** | **62.33%** | 77.43% | 79.87% | 78.63% |
| baselineRandom/QB charUnder35 | 39.00% | **28.60%** | **26.03%** | 34.23% | 34.93% | 34.40% |
| humanLazyAmbitious/QB busted | 33.10% | **30.03%** | **28.53%** | **33.10%** | 32.20% | 32.03% |
| humanLazyAmbitious/OL busted | 35.77% | **32.87%** | **31.17%** | **35.77%** | 29.57%* | 29.57%* |
| antisocialFull/QB busted | 18.63% | **15.40%** | **14.90%** | **18.63%** | 17.33% | 17.33% |
| antisocialFull/QB charUnder35 | 93.20% | **84.77%** | **81.93%** | **93.20%** | 91.00% | 90.63% |

\* the OL R3 cells vary more between runs than the QB ones; treat the OL badly-behaved row as ±1pp.

**R2's badly-behaved rows are bit-identical to base — 0.51/14.73/33.10% and 0.38/13.28/18.63%, not
approximately, exactly.** That is not luck. A corrosive policy keeps taking the original branch, so
adding a second option it will never choose changes nothing about its career. **R2 is the only route
with zero leakage to the player it is not meant to help.**

R1 is the opposite. It cuts the ordinary bust rate by **23% relative** (5.37% → 4.13%), the antisocial
bust rate by **17%**, and moves `baselineRandom`'s band-2 entry rate by nearly 16 points. That is not a
five-card fix; it is a re-tuning of the whole character economy, and DECISION 062's economy is
explicitly not reopened.

### The argument that kills R1, stated as a number

R1 pays `+2` on a `p=0.75` branch of a card that fires **once per season in 100% of careers**. Over a
four-season career that is `4 × 0.75 × 2 = +6.0` expected character, handed to every player
unconditionally. Measured: `virtueLoyal/QB` average final character goes 69.9 → 75.9, **exactly +6.0.**

Against that, the entire realized virtue budget of a max-virtue career — every positive character
point from every option the player actually chose — is **+4.85**.

> **Under R1, more than half of a virtuous player's standing gain (6.0 of 10.85) comes from cards they
> were never asked about.** The single largest source of character in the game becomes the one thing
> the player cannot influence. R1 makes the *number* go up and makes *virtue* pay relatively less. It
> is aimed at the symptom the playtester reported and it inverts the thing they were complaining about.

### Route table

| | **what it does to the numbers** | **build cost** | **risk** | **what it breaks / loses** |
|---|---|---|---|---|
| **R1** | virtuous: below-start 43.9%→11.8%, median Δ 0→+6. **Cost lines unchanged (2.15→2.16).** | One line × 5 cards. Trivial. | Overshoots: 88.5% of virtuous careers now net positive, a ratchet rather than a payoff. | Ordinary bust 5.37%→4.13% (−23% rel), antisocial 18.63%→15.40%. Hands +6 char/career to the antisocial player. **Makes the unchoosable spine the biggest character source in the game.** |
| **R1all** | R1, more so. | Trivial. | All of R1's, worse. | All of R1's, worse. Plus `speeding-georgia` would pay **+4 character for talking your way out of a speeding ticket at 96mph** — indefensible authorially, and it is the one one-button hit in the bundle that is clearly *earned*. **Do not do R1all.** |
| **R2** | virtuous: below-start 43.9%→8.0% (OL 50.9%→11.3%), median Δ 0→+6, **Cost 2.15→1.14**. | **5 labels + 10 outcome descriptions ≈ 15 prose strings, ~180 words, plus `milestones.test.ts` assertions. One authoring session, ~half a day.** | **The numbers are a function of what is authored, not of the route.** My "steady" option was also, by 0.02 stock points, what `best` picks — a slightly different `snaps` figure flips that. The acceptance criterion below exists to control this. | **Nothing measurable.** Badly-behaved rows bit-identical. Ordinary bust 5.37%→4.83% (−10% rel), the mildest dilution of any route that moves the virtuous distribution. |
| **R3op** | virtuous: below-start 43.9%→25.9% (OL 50.9%→31.5%), median Δ 0→+2, Cost 2.15→1.15. | One line × 5 cards. Trivial. | Half a fix. Leaves OL's virtuous player still 31.5% likely to finish down. | Ordinary bust 5.37%→5.17% (−4% rel) — the smallest leak of any route. **What is lost:** the openers stop being able to say anything about standing at all. "It takes a half to stop feeling like a guest" becomes a line with no consequence, and the game loses its only authored statement that nerves have a cost. |
| **R3** | R3op plus the two random cards; within noise of R3op. | Trivial. | Same as R3op. | **Additionally deletes `speeding-georgia`'s −4.** That card is the most defensible character hit in the bundle: you got suspended two games, and the standing hit is the point. Contributes ~0.06 cost lines/career. **If R3 is chosen, do R3op and keep `speeding-georgia`.** The two random cards buy almost nothing (23.3% vs 25.9% below-start) and cost the bundle its clearest cause-and-effect. |

---

## Recommendation

**Do R2, restricted to the five `milestone-opener-*` cards. Do not do R1 or R1all. Hold R3op as the
fallback if authoring capacity is not available this wave, and accept, in writing, that it is half a
fix.**

Reasoning, in the order the numbers support it:

1. **R2 is the only route that answers the actual complaint.** The complaint was not "my character
   number was too low" — it was *"I was told I cost the locker room five times and never once asked
   about it."* R1 leaves the Cost line count at 2.16 and buys it off with credits from the same
   unchoosable cards. R2 takes it to 1.14 by making the card a decision. R3 takes it to 1.15 by
   deleting the beat. Only one of those three is a game design.
2. **R2 is the only route with zero leakage.** `humanLazyAbmitious` and `antisocialFull` come back
   bit-identical. R1 hands the antisocial player 3.2 points of bust rate; R3op hands them 1.3.
   The brief said helping the antisocial player is a side effect, not a bonus — R2 has none.
3. **R2 does the most for the worst case.** OL's virtuous player is the only cell whose median
   character delta is negative today (−1, 50.9% below start). R2 takes it to +5 / 11.3%. R3op leaves
   it at 31.5%, i.e. still a one-in-three chance that maximum virtue finishes down.
4. **R2 is the only route that leaves ordinary play losable.** 4.83%/5.67% against a 5.37%/5.83%
   base, versus R1's 4.13%/4.97%.
5. **The cost is real but small and it is authoring, which this project is good at.** Five cards, one
   new option each, ~180 words. The existing branch is untouched, so no existing prose is rewritten
   and no existing test assertion about the old option changes.

**What I would NOT do:** R1, on the strength of the +6.0 number above; and R1all under any
circumstances. I also would not combine routes — R2 already clears every criterion below on its own,
and stacking R1 on top of it would blow past the upper bound in B5.

### Acceptance criterion — stated in advance, as numbers, and failable

Measured with `src/sim/virtue-probe.ts` (or its successor) at **3,000 careers per cell, positions QB +
OL + DL, seed prefix `b62p2`, homeState TX**, against the `virtue` event strategy from Appendix A.
**A miss is reported as a miss. The route is not re-tuned until it passes.**

**MUST HIT — the fix worked:**

| id | criterion | base (QB/OL/DL) | R2 measured |
|---|---|---|---|
| **A1** | `virtueLoyal` share of careers ending **below** starting character **≤ 25%** at every position | 43.9 / 50.9 / 38.9 | 8.0 / 11.3 / 7.5 ✓ |
| **A2** | `virtueLoyal` **median** character delta **≥ +2** at every position | 0 / −1 / +1 | +6 / +5 / +6 ✓ |
| **A3** | `virtueLoyal/QB` mean **Cost** lines **≤ 1.40** — the "I was never asked" test; it must *fall*, not be offset | 2.15 | 1.14 ✓ |

**MUST NOT BREAK — the game is still losable and DECISION 062's economy is intact:**

| id | criterion | base (QB/OL/DL) | R2 measured |
|---|---|---|---|
| **B1** | `baselineRandom` bustedRate **≥ 5.00%** at every position | 5.37 / 5.83 / 5.27 | 4.83 / 5.67 / 5.20 — **QB misses by 0.17pp** |
| **B2** | `humanLazyAmbitious` bustedRate **≥ 32.0%** and charUnder35Rate **≥ 98.5%** at every position | 33.10 / 35.77 / 32.53 | identical to base ✓ |
| **B3** | `antisocialFull` bustedRate **≥ 18.0%** at every position | 18.63 / 21.30 / 18.20 | identical to base ✓ |
| **B4** | **No virtuous payout is widened.** The 39 options with E[character] > 0 have byte-identical `effects` before and after. DECISION 063 is not reopened. | — | ✓ (R2 adds options; it edits none) |
| **B5** | `virtueLoyal/QB` mean **Earned** lines **≤ 7.0** — an upper bound, so the fix cannot be achieved by carpeting the career in credit | 2.73 | 6.31 ✓ |

**This criterion is genuinely failable, and my own prototype fails one cell of it.** R2 as I authored
it lands `baselineRandom/QB` at 4.83% against a 5.00% floor — a 0.17pp miss, inside two standard
errors of a 3,000-career sample (σ ≈ 0.40pp) but a miss on the stated number. The implementing wave
should re-run it at 10,000 careers and **report the result either way**. If it still misses, the
`"steady"` option's failure branch needs a character cost of its own (it currently has none), which is
the correct repair — not a loosening of B1.

The criterion also correctly rejects the routes I am not recommending: **R1 fails A3** (2.16 vs ≤1.40)
**and B1** (4.13 vs ≥5.00) **and B3** (15.40 vs ≥18.0). **R3op fails A1 at all three positions**
(25.9 / 31.5 / 25.3 vs ≤25%). If the user chooses R3op as the cheap fallback anyway, the honest move
is to relax A1 to **≤ 32%** in advance and record that the wave is buying half the fix for none of the
authoring — not to let R3op pass a criterion written for R2.

---

## The thing nobody asked about, and it is the biggest finding here

**The brief may be aimed at the wrong card.** Two numbers from Part 1, side by side:

> The playtester's exact tally — **0 Earned, 5 Cost, four seasons** — occurs in **0.26%** of genuinely
> max-virtue careers. It occurs in **10.60%** of `good`-profile careers.
>
> **Their reported experience is 40× more consistent with a player optimising overall than with a
> player taking the team-first branch.**

They are not lying, and they are not a 1-in-385 outlier either. The likeliest explanation is that
**what a player believes is the team-first option is not the option that pays character**, and the
corpus says why:

> Of the **60** multi-option events where character differentiates the options, on **34 (56.7%)** the
> most-virtuous option is **strictly worse on the only number the game shows the player**, by a mean
> of **0.91 expected OVR**.

```
nonconf-blowout-sideline: "Coach up the freshman behind you"   E[c]=+0.50  E[OVR]= 0.00
                     vs   "Lobby for one more series"          E[c]=-2.00  E[OVR]=+0.60
wideopen-two-deep:        "Spend your reps teaching the walk-on" E[c]=-0.20 E[OVR]=-0.30
                     vs   "Take every rep you can get"         E[c]=-2.10  E[OVR]=+1.30
offfield-money-manager:   "Hire an actual financial advisor"    E[c]= 0.00  E[OVR]= 0.00
                     vs   "Let him handle it"                  E[c]=-11.60  E[OVR]=+1.20
```

The game shows `overall` as an integer and character only as a band phrase (DECISION 002, correctly —
character moves draft stock ±7.5 against overall's ±82). But that asymmetry means a player reading the
cards and steering by the visible signal takes the corrosive branch on the **majority** of character
cards **without ever intending to**, and then gets a moral verdict printed on each one. `good/QB`'s
1.41 Earned against 4.41 Cost is what that player's career looks like, and it is almost certainly what
the playtester saw.

**So there is a real defect in B62's neighbourhood that no route in DECISION 070 touches.** It is not
the openers; the openers are ~20–25% of that player's negative traffic. It is that **a card can cost
you standing without ever having signalled that standing was on the table**, and the only cue is prose
the player has no reason to read as a price.

I am not proposing a fix — this brief's hard constraints forbid displaying EV or probability, and I
have not measured any remedy. I am proposing that **the implementing wave run a cheap legibility audit
first**, on those 34 conflict cards: read each pair of labels cold and mark whether a player could tell
which one the locker room is watching. If a majority fail that read, **B62 is a legibility bug wearing
a balance bug's clothes**, R2 is worth doing anyway (it is cheap, correct and leak-free) but it will
not close the complaint, and the next brief should be about the 34 cards, not the 5.

### Two smaller things

- **`good` should probably be renamed or retired.** Every report on this board from 018 onward cites
  `good` as "the player who plays well". It takes options worth **−8.04 expected character per
  career** and declines half the virtuous options it is offered. It is a stock-maximiser, and on the
  locker-room axis it is a mild `humanLazy`. Nothing is wrong with the profile; the *name* has been
  carrying an unearned claim through a dozen reports.
- **OL is the worst position on this axis and always has been.** It is offered the fewest virtuous
  options (2.87/career vs DL's 3.84, because it has the smallest position-specific virtue-bearing
  pool) and it is the only position where max-virtue play has a negative median character delta. Every
  route helps it least. Worth its own look sometime.

---

## Appendix A — the `virtue` event strategy (recommended for permanent inclusion)

**Not applied to the repo working tree.** This is the diff from the detached worktree. It adds one
strategy and two profiles and changes no existing behaviour: `EventStrategy` gains a member, the
`ENDING_WEIGHT` record gains a key, and a new branch is added before the `humanLazy` branch.

```diff
-export type EventStrategy = "first" | "random" | "lazy" | "saboteur" | "antisocial" | "humanLazy" | "best";
+export type EventStrategy = "first" | "random" | "lazy" | "saboteur" | "antisocial" | "humanLazy" | "best" | "virtue";

-const ENDING_WEIGHT: Record<"lazy" | "saboteur" | "antisocial" | "humanLazy" | "best", number> = {
+const ENDING_WEIGHT: Record<"lazy" | "saboteur" | "antisocial" | "humanLazy" | "best" | "virtue", number> = {
+  virtue: ENDING_PENALTY,
   lazy: 0,
   saboteur: ENDING_PENALTY,
```

```diff
+    // ---- virtue (brief 047) ---------------------------------------------
+    // The exact mirror of `humanLazy`: always take the option with the HIGHEST
+    // expected character delta, ties (most options carry no character effect)
+    // broken by maximising draft stock. This is the maximum-virtue playtester:
+    // team-first on every card, still trying to get drafted.
+    //
+    // It exists because `best` is NOT this player. `best` maximises draft
+    // stock, which prices a character point at 0.15 against an overall point's
+    // 1.4, so it sells character wherever character is cheap -- measured at
+    // E[character] = -8.04 per career. Without `virtue` the project has no row
+    // for "played well and behaved", which is how most humans play.
+    if (profile.events === "virtue") {
+      const EPS = 1e-9;
+      let chosen = ev.options[0]!;
+      let chosenChar = optionCharacterScore(chosen);
+      let chosenStock = optionScore(chosen, position, content, ENDING_PENALTY);
+      for (const o of ev.options) {
+        const c = optionCharacterScore(o);
+        const st = optionScore(o, position, content, ENDING_PENALTY);
+        if (c > chosenChar + EPS || (Math.abs(c - chosenChar) <= EPS && st > chosenStock + EPS)) {
+          chosen = o;
+          chosenChar = c;
+          chosenStock = st;
+        }
+      }
+      return chosen.id;
+    }
+
     if (profile.events === "humanLazy") {
```

```diff
   humanLazyAmbitious: { events: "humanLazy", recruiting: "highestTier", transfer: "up", redshirt: "take" },
+  // Brief 047: the maximum-virtue playtester. Identical to `good` except the
+  // event strategy, so the only variable against `good` is "optimise stock" vs
+  // "always take the team-first branch".
+  virtueAmbitious: { events: "virtue", recruiting: "highestTier", transfer: "up", redshirt: "take" },
+  // The playtester's actual shape: one school, no transfers, four seasons.
+  virtueLoyal: { events: "virtue", recruiting: "random", transfer: "stay", redshirt: "decline" },
   randomFull: { events: "random", recruiting: "random", transfer: "random", redshirt: "random" },
```

A `virtue vs humanLazy` symmetry test belongs with it: on any event where some option has
E[character] > 0, `virtue` must pick an option with E[character] ≥ every other option's, and the two
strategies must never pick the same option unless all options tie on character.

## Appendix B — reproducing this

Worktree only; all of it was destroyed. To rebuild: `git worktree add --detach <wt> HEAD`, symlink
`node_modules`, apply Appendix A to `src/sim/policies.ts`, add `src/sim/virtue-probe.ts` (drives
`createCareer → getDecision → advance` and calls `cardAccount` from `src/ui/session/view-model.ts` on
each `(before, after, decision, optionId)`), then
`npx tsx src/sim/virtue-probe.ts 3000 <profiles> <positions> b62p2`.

Sample sizes actually used: **3,000 careers/cell** for every table except the line histograms and the
cost-line attribution split, which used **5,000** and **3,000** respectively. Total ≈ 200,000 careers.
Whole sweep runs in under a minute; nothing here needs a long-running process.
