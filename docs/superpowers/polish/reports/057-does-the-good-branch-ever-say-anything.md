# 057 — The ten spared cards: the good branch does say something, and on three of them the only thing it can ever say is that you lost

**Brief:** `briefs/057-does-the-good-branch-ever-say-anything.md` · **Wave:** 30 · **Type:** measurement +
proposal · **Product code shipped:** none. One new probe under `src/sim/` and its test.

---

## 0. The one paragraph

**The brief's mechanism does not hold, and the thing underneath it is worse in a more specific way.**
A good-teammate career is **not** silent: **59.4%** of `virtueLoyal` careers and **66.0%** of
`virtueAmbitious` careers get a locker-room line off a good branch of the ten spared cards at least
once, and the per-career **median is 1**, not 0. But when you count only the line that means *the game
recognised what you did* — "Earned you credit in the locker room." — it is **43.3% / 51.8%**, and for
`virtueLoyal`, **the playtester's literal career shape, the per-career median number of credits from
the ten spared cards across a whole career is zero.** In those words: **the median good-teammate career
that signs once and stays never hears one of these ten cards say a good word about it.** Two thirds of
the credit that does arrive comes from **one card**. And on **three of the ten**, the branch a good
teammate takes is structurally incapable of printing a credit and can only ever print a **cost** — the
playtester's *"only something you can lose"* reproduced at the level of a single card.

---

## 1. What the brief's mechanism claimed, clause by clause, against what was measured

| # | The brief's claim | Verdict |
|---|---|---|
| 1 | `LOCKER_ROOM_MIN_CHARACTER = 2` gates the line; sub-floor character produces no comment | **Holds.** Verified in source, `view-model.ts:293` and `:307`. The probe's copy is asserted against that source text by a test. |
| 2 | The four "help the man taking your job" cards are +2, +2, +1, +2; a +1 branch is silenced and a +2 clears the floor by exactly nothing | **Holds verbatim** (five-star +2, transfer-qb +2, two-deep +1, blowout +2). **But it is not the main cause of the silence.** Across 5,680 good-branch takes under `virtueLoyal`, the floor eats a real ±1 on **16.0%** of them and **27.5%** carry **no character effect at all**. More of the silence is cards that were never given a number than the floor eating one. |
| 3 | Realized frequency may be low enough that a whole good career meets one of them once, or never | **Partly holds.** **19.3%** of `virtueLoyal` careers (15.1% `virtueAmbitious`) never meet **any** of the ten. Mean good-branch takes of the ten per career: **1.58 / 1.75**. So "once or never" describes a large minority, not the typical career. |
| — | "If all three hold, the cards that teach what the currency means are, in practice, silent" | **Refuted as stated.** They speak in the majority of careers. What they do not reliably do is speak **in the player's favour**, and the reason is a different one from the brief's. |

**Stated plainly, because the brief asked for it:** the mechanism this lane was sent to confirm is
wrong. The floor is a contributor, not the cause. The cause is three authored shapes described in §3.

---

## 2. The card table — every card resolved to source at HEAD

All eleven exist at HEAD with the effects the documents describe. **No card in DECISIONS.md §078 or
report 051 §4.1 is missing or mis-stated**, which is a different outcome from 051's own finding about
050's list, and it is reported as such. Every id, every option id and every character delta in this
table is pinned by `src/sim/spared-card-probe.test.ts`, so a later content edit breaks the test rather
than silently re-pointing this report.

`P` is the branch's authored success probability. **"Speaks?"** is evaluated against
`LOCKER_ROOM_MIN_CHARACTER = 2`.

| # | Card | File | Good branch | P | char on success | char on failure | Speaks on success? | Speaks on failure? | Gating | Else visible on that branch |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | The Toe-Tap | `oskill.ts:221` | `wave-it-off` | 0.75 | **+2** | 0 | **yes, credit** | no | OSKILL · `requiresPlaying` · conference · w3 | +10 scrimmage yds; failure −20 yds, −1 OVR |
| 2 | Bowl Opt-Out | `oskill.ts:306` | `play` | 0.65 | **+2** | 0 | **yes, credit** | no | OSKILL · tier [1,2] · `requiresPlaying` · `minClass: JR` · `minOverall: 70` · postseason · w3 | +90 yds, +1 OVR; failure collarbone injury, −2 OVR |
| 3 | Up Forty at Halftime | `season-life.ts:140` | `work-the-sideline` | 0.75 | **+2** | **−4** | **yes, credit** | yes, cost | `requiresPlaying` only — **position-agnostic** · nonconf · w3 | snaps −15 on both outcomes |
| 4 | The Transfer QB | `qb.ts:57` | `mentor` | **1.0** | **+2** | — (deterministic) | **yes, credit, always** | — | **QB only** · offseason · w3 · no `requiresPlaying` | nothing else |
| 5 | Playing Through the Hand | `ol.ts:269` | `play-through-it` | 0.60 | **0** | **0** | **no** | **no** | OL · `requiresPlaying` · conference · w3 | +4 pancakes, +1 OVR; failure +2 sacksAllowed, −2 OVR |
| 6 | The Two-Deep | `school-life.ts:71` | `bring-the-walkon-along` | 0.70 | **+1** | **−3** | **no** | yes, **cost** | `schoolTrait: wideOpen` · `requiresPlaying` · nonconf · w3 | success: `moment` *"Built a backup out of a walk-on"*; failure −1 OVR |
| 7 | The Holding Call | `ol.ts:223` | `own-it` | 0.80 | **+1** | **−2** | **no** | yes, **cost** | OL · `requiresPlaying` · conference · w2 | +2 pancakes on success |
| 8 | Trash Talk | `dl.ts:270` | `stay-quiet` | **1.0** | **+1** | — (deterministic) | **no** | — | DL · `requiresPlaying` · conference · w2 | +1 TFL |
| 9 | The Captain Vote | `season-life.ts:16` | `let-the-work-speak` | 0.70 | **0** | **−3** | **no** | yes, **cost** | `minClass: SO` · offseason · w3 · position-agnostic · no `requiresPlaying` | success: `moment` *"Voted captain without campaigning for it"* |
| 10 | The Five-Star Behind You | `universal.ts:76` | `bring-him-along` | 0.70 | **+2** | 0 | **yes, credit** | no | **tier [3,4]** · `minClass: SO` · offseason · w2 | +1 OVR on success; failure −2 OVR |
| 11* | Targeting Review | `dskill.ts:280` | `pull-up-at-the-last-second` | **1.0** | **+1** | — (deterministic) | **no** | — | DSKILL · `requiresPlaying` · conference · w2 | +3 tackles |

\* the eleventh, which DECISION 078 resolved as correct rather than spared. It is excluded from every
"ten" figure below and reported separately.

**Three source notes the table compresses.**

- **All eleven are `kind: "random"`.** `selectFixedEvent`'s `phaseFiredEventIds` suppression does not
  apply to them and there is no once-per-career flag in the engine, so every one of them is
  **repeatable**: it is redrawn by weight in every matching phase. That is why *Up Forty at Halftime*
  has a firing **rate** of 0.406 and a firing **mean** of 0.499 per career.
- **Report 051 §4.1 row 21 is accurate but easy to misread.** It records *The Captain Vote* as
  *"'Let the work speak' −3 vs 'Make the case for yourself' −4"*. Those are the **failure** rolls. The
  branch a good teammate takes carries **no character effect at all** on success, and 078 inherited the
  row without that distinction. Same for row 17: *Playing Through the Hand*'s good branch is not
  "cheap", it is **empty** — the card's only character effect anywhere is the `−1` on the sit branch.
- **Seven of the eleven carry `requiresPlaying`**, which `select-event.ts:38` still evaluates only
  against `redshirtSeasonActive` and not against injury or suspension (B79, DECISION 079). That does
  not change any number in this report, but it means these seven can be raised at a player who is on
  the boot, and the proposal in §6 should not be read as independent of B79.

---

## 3. The three authored shapes that actually cause the silence

The floor is one of them and it is the smallest.

**Shape A — the good branch cannot ever earn a credit; it can only ever be charged (3 cards).**
*The Two-Deep*, *The Holding Call*, *The Captain Vote*. Success is +1, +1 and **0**, all silenced.
Failure is −3, −2 and −3, all of which print **"Cost you in the locker room."** Measured over 3,600
`virtueLoyal` careers: **0 credits and 719 costs** from those three cards' good branches
(215 + 46 + 458). Over 3,600 `virtueAmbitious` careers: **0 credits and 670 costs**. This is the
playtester's *"only something you can lose"*, and it is not the ladder calibration — it is what these
three cards are, one card at a time.

**Shape B — the card cannot speak at all, on any branch (2 of the ten, plus the eleventh).**
*Playing Through the Hand* has no character effect above ±1 anywhere on it: the good branch is 0/0 and
the sit branch is −1. In **10,800 careers across all three profiles it printed a locker-room line zero
times.** *Trash Talk*'s `stay-quiet` (+1, deterministic) and *Targeting Review*'s `pull-up`
(+1, deterministic) are the same: **every** time a virtue player takes them the card is silent, by
construction, with no roll involved — 241 + 225 takes under `virtueLoyal`, 236 + 221 under
`virtueAmbitious`, **all silent**.

> **The line the playtester quoted is from Shape B.** *"You get grief in the meeting room for missing
> it"* is `playing-through-the-hand` / `sit-and-let-the-backup-go`, a **−1** eaten by the floor. Their
> report that it *"returned prose with no number at all"* is exactly correct, and it is about the
> branch the card **charges**, not the good branch. Both branches of that card are silent.

**Shape C — the floor eats a real ±1 (4 branches).** *The Two-Deep* +1, *The Holding Call* +1,
*Trash Talk* +1, *Targeting Review* +1. Under `virtueLoyal` this is **909 of 5,680 good-branch takes
(16.0%)**; under `virtueAmbitious`, **603 of 6,284 (9.6%)**. This is the brief's mechanism and it is
real, but it is smaller than the **27.5% / 31.1%** of takes that carry **no character at all**.

---

## 4. The frequency measurement — denominator is careers

`src/sim/spared-card-probe.ts`, **3,600 careers per profile** (600 per position × 6 positions),
seed prefix `b57`. The probe instruments the decision loop directly: for every `advance()` it records
the event raised, the option taken, the outcome that fired (matched on prose, exactly as
`cardAccount`/`firedOutcomes` does, including returning *nothing said* on an ambiguous match), and
reproduces `accountOf` + `lockerRoomVerdict` to decide whether the card printed a line.

### 4.1 The headline

| Profile | N | Careers where a good branch of the ten **says anything** | ... **median per career** | Careers where it says **credit** | ... **median per career** | Careers meeting **none** of the ten |
|---|---|---|---|---|---|---|
| `virtueLoyal` | 3,600 | **59.4%** | **1** (p90 2, mean 0.89) | **43.3%** | **0** (p90 2, mean 0.57) | 19.3% |
| `virtueAmbitious` | 3,600 | **66.0%** | **1** (p90 2, mean 1.04) | **51.8%** | **1** (p90 2, mean 0.72) | 15.1% |
| `good` | 3,600 | **0.0%** | **0** | **0.0%** | **0** | 15.1% |

**The p50 the brief asked about, in the words it asked for: for `virtueLoyal` — one school, no
transfer, declines the redshirt, which is the playtester's literal shape — the median number of times
in a whole career that a spared card credits the good branch is zero.** The "says anything" median is
1 only because the *cost* line on a failed good branch counts as the game saying something.

**Per-career distribution of "how many times did a spared card say anything back"** (share of careers):

| count | 0 | 1 | 2 | 3 | 4 | 5+ |
|---|---|---|---|---|---|---|
| `virtueLoyal`, any line | 40.6% | 36.5% | 17.2% | 4.5% | 1.1% | 0.03% |
| `virtueLoyal`, **credits only** | **56.7%** | 31.7% | 9.5% | 1.9% | 0.3% | — |
| `virtueAmbitious`, any line | 34.0% | 37.9% | 20.4% | 6.3% | 1.2% | 0.2% |
| `virtueAmbitious`, **credits only** | **48.2%** | 35.4% | 13.1% | 2.8% | 0.5% | — |

### 4.2 `good` is 0.0%, and that is a fact about the policy, not about the cards

The `good` profile is the draft-stock maximiser. It prices a character point at 0.15 against an overall
point's 1.4, so **it never takes the good branch of any of the ten** — its only take anywhere in the
eleven is *Targeting Review*'s `pull-up` (215 takes, all silent). The row is reported because it is the
honest answer to "what does an ordinary optimising player hear from this family", and the answer is
**nothing, ever**. The cards still fire at it at the same rate (it meets one in 84.9% of careers); it
just never takes the branch. That is a content-incentives observation, not a defect this lane can fix.

### 4.3 Per card, per career

`virtueLoyal` / `virtueAmbitious`. "fires" = share of careers the card is raised in at least once;
"good" = share taking the good branch at least once; "credit"/"cost" = share hearing that line off the
good branch at least once.

| Card | fires | mean fires | p90 | good | **credit** | cost | silent by floor | silent, no char | `moment` |
|---|---|---|---|---|---|---|---|---|---|
| Up Forty at Halftime | 40.6 / 43.4% | 0.50 / 0.53 | 1 / 1 | 40.6 / 43.4% | **32.6 / 34.4%** | 11.2 / 12.6% | — | — | — |
| The Captain Vote | 36.3 / 42.4% | 0.42 / 0.52 | 1 / 1 | 36.3 / 42.4% | **0 / 0%** | 12.4 / 14.1% | — | 26.0 / 32.3% | 26.0 / 32.3% |
| The Two-Deep | 16.7 / 7.3% | 0.20 / 0.08 | 1 / 0 | 16.7 / 7.3% | **0 / 0%** | 5.7 / 2.4% | 12.2 / 5.0% | — | 12.2 / 5.0% |
| The Five-Star Behind You | **0.0** / 18.8% | 0.00 / 0.20 | 0 / 1 | 0.0 / 18.8% | **0.0 / 13.4%** | — | — | 0 / 5.9% | — |
| Playing Through the Hand | 8.4 / 7.0% | 0.10 / 0.08 | 0 / 0 | 8.4 / 7.0% | **0 / 0%** | 0 / 0% | — | 8.4 / 7.0% | — |
| The Toe-Tap | 8.3 / 7.8% | 0.10 / 0.10 | 0 / 0 | 8.3 / 7.8% | **6.5 / 6.1%** | — | — | 2.4 / 2.7% | — |
| The Transfer QB | 7.5 / 8.7% | 0.09 / 0.11 | 0 / 0 | 7.5 / 8.7% | **7.5 / 8.7%** | — | — | — | — |
| Trash Talk | 5.9 / 5.7% | 0.07 / 0.07 | 0 / 0 | 5.9 / 5.7% | **0 / 0%** | — | 5.9 / 5.7% | — | — |
| The Holding Call | 5.1 / 5.6% | 0.06 / 0.06 | 0 / 0 | 5.1 / 5.6% | **0 / 0%** | 1.3 / 1.2% | 4.2 / 4.6% | — | — |
| Bowl Opt-Out | 3.7 / **0.3%** | 0.04 / 0.00 | 0 / 0 | 3.7 / 0.3% | **2.4 / 0.2%** | — | — | 1.3 / 0.1% | — |
| *Targeting Review* (11th) | 5.5 / 5.4% | 0.06 / 0.06 | 0 / 0 | 5.5 / 5.4% | **0 / 0%** | — | 5.5 / 5.4% | — | — |

**Take-level split** (denominator = good-branch takes of the ten, not careers):

| Profile | takes | credit | cost | silenced by floor (±1) | no character at all |
|---|---|---|---|---|---|
| `virtueLoyal` | 5,680 | 2,065 (36.4%) | 1,144 (20.1%) | 909 (16.0%) | 1,562 (27.5%) |
| `virtueAmbitious` | 6,284 | 2,589 (41.2%) | 1,138 (18.1%) | 603 (9.6%) | 1,954 (31.1%) |

### 4.4 The split the brief demanded be kept separate: never fired vs floor ate it

Of the careers that hear **nothing at all** from the ten:

| Profile | silent careers | never met any of the ten | met one, took a good branch, heard nothing | met one but never took a good branch |
|---|---|---|---|---|
| `virtueLoyal` | 1,463 (40.6%) | **695 (47.5%)** | **768 (52.5%)** | 0 |
| `virtueAmbitious` | 1,223 (34.0%) | **543 (44.4%)** | **680 (55.6%)** | 0 |

**Roughly half and half, and they are different defects.** Raising the magnitudes fixes the right-hand
column and does nothing for the left. Raising the frequency fixes the left and does nothing for the
right. No single route fixes both, and a proposal that claims it does is wrong.

### 4.5 Two structural findings the aggregate hides

**(a) The recognition is one card.** Remove *Up Forty at Halftime* — the only credit-capable card in
the ten with no position gate and no tier gate — and the numbers collapse:

| Profile | credit rate, all ten | credit rate without *Up Forty at Halftime* |
|---|---|---|
| `virtueLoyal` | 43.3% | **15.6%** |
| `virtueAmbitious` | 51.8% | **26.6%** |

66% of every credit a `virtueLoyal` career gets from this family comes from that one card. The "ten
cards that teach what the currency means" are, for recognition purposes, **one card plus a QB-only
card plus three cards gated behind a career shape most players do not have.**

**(b) *The Five-Star Behind You* is unreachable without a transfer.** It fired in **0 of 3,600**
`virtueLoyal` careers and 18.8% of `virtueAmbitious` careers. The mechanism was checked separately:
over 1,200 careers per profile, **Signing Day offered a tier-3 or tier-4 school exactly zero times** —
`eligibleTiers` gates blue-bloods on draft stock a true freshman does not have. So the card's
`tier: [3,4]` condition makes it a **transfer-only** card. *Bowl Opt-Out* is its mirror image
(`tier: [1,2]`, 3.7% under `virtueLoyal` and **0.3%** under `virtueAmbitious`, which transfers up out of
its gate). The two cards are near-mutually-exclusive by career shape, and a player who signs once and
stays can reach neither of the two +2 cards that are not position-locked.

### 4.6 Position spread

Share of careers hearing a **credit** from the ten, `virtueLoyal` / `virtueAmbitious`:

| QB | OSKILL | OL | DL | DSKILL | K |
|---|---|---|---|---|---|
| 63.5 / 74.7% | 63.5 / 59.8% | 33.0 / 43.7% | 34.2 / 42.8% | 34.3 / 45.2% | **31.5 / 44.5%** |

QB is carried by *The Transfer QB* (deterministic +2, no `requiresPlaying`). OL, DL and DSKILL each own
exactly one spared card and it is a Shape A or Shape B card in every case, so their entire credit
supply is *Up Forty at Halftime* plus whatever the offseason cards give them. **A kicker's whole
good-teammate content is two position-agnostic cards, one of which can never pay him.**

---

## 5. What is *not* the bug

Per the brief's hard constraints, and stated so no later wave re-opens it: **a card returning "no
number" for character is correct behaviour.** `character` is a band phrase, never an integer; it swings
draft stock ~±7.5 against `overall`'s ~82 and an integer would overstate it tenfold. Nothing in this
report proposes showing a character number. The defect measured here is that **nothing at all is said**,
and on three cards that the only thing that can be said is a charge.

---

## 6. The proposal — four routes, priced

### R0 — leave it alone

**Cost:** zero. **What it breaks:** nothing mechanically. **What it leaves:** the median
`virtueLoyal` career hears zero credits from this family, and the three Shape A cards keep teaching
the exact lesson the playtester reported learning. **Decider:** the playtest running against HEAD right
now. If the player's answer to "can you earn it" is yes on the strength of the ladder change alone,
R0 is defensible for this wave.

### R1 — lower the floor for this family

**Measured, not estimated.** The floor is global, so this was priced across the whole bundle on the
same careers (`floorCensus` in the probe, 3,600 careers per profile):

| Profile | cards resolved / career | locker lines / career at floor **2** (HEAD) | at floor **1** | share of resolved cards speaking, 2 → 1 |
|---|---|---|---|---|
| `virtueLoyal` | 31.9 | **2.52** | **7.14** | 7.9% → **22.4%** |
| `virtueAmbitious` | 35.9 | **3.32** | **8.02** | 9.3% → **22.4%** |
| `good` | 35.9 | **2.77** | **7.41** | 7.7% → **20.7%** |

**Cost:** a **2.8×** increase in how often the line is read, straight back to the ~22% that
DECISION 075 raised the floor to escape. **And it does not buy what this lane wants:** of the 16,653
extra lines a floor of 1 produces under `virtueLoyal`, **only 909 — 5.5% — come from the ten cards**
(3.6% under `virtueAmbitious`). **This route pays 18 lines of wallpaper for every one line it is
trying to buy.** A *family-scoped* floor avoids that but requires `view-model.ts` to know a list of
event ids, which puts content knowledge in the view model and is the kind of special case that has to
be maintained forever. **What would decide it:** nothing — the 5.5% figure is decisive on its own.
**Recommend against.**

### R2 — raise the branch magnitudes (content is frozen; this is a proposal only)

Six edits, all in `src/content/events/**`:

| Card | branch | now | proposed | shape fixed |
|---|---|---|---|---|
| The Two-Deep | `bring-the-walkon-along` success | +1 | **+2** | A and C |
| The Holding Call | `own-it` success | +1 | **+2** | A and C |
| Trash Talk | `stay-quiet` | +1 | **+2** | B and C |
| Targeting Review | `pull-up-at-the-last-second` | +1 | **+2** | B and C |
| The Captain Vote | `let-the-work-speak` success | **0** | **+2** | A |
| Playing Through the Hand | `play-through-it` success | **0** | **+2** | B |

**Cost, computed from the measured take counts:** +3,978 character points over 3,600 `virtueLoyal`
careers = **+1.11 character per career → ≈ +0.17 draft stock**; +4,090 over 3,600 `virtueAmbitious`
careers = **+1.14 → ≈ +0.17 stock**. For scale, DECISION 078's own landed change was measured at
**+8.6 draft stock** to the same profiles. **This is ~2% of that, and it lands on the virtue profiles
only** — the `good` profile takes none of these branches, so the standing test ("a change a good player
should not notice barely moves that row") passes by construction at exactly 0.00.
**What it breaks:** the content freeze, and it needs the 057 balance baselines retaken.
**What it buys, recomputed over the same 3,600 careers** (the virtue policies already take all six of
these branches, so the take counts carry over unchanged — see limitation 4): `virtueLoyal` credit rate
**43.3% → 71.2%**, credit p50 **0 → 1**, p90 2 → 3, mean 0.57 → 1.22; `virtueAmbitious`
**51.8% → 75.8%**, mean 0.72 → 1.34. The three Shape A cards stop being cost-only and the two Shape B
cards start speaking at all. **What would decide it:** re-run this probe
after the edit; the acceptance criterion is *credit p50 ≥ 1 on `virtueLoyal`* and *no Shape A card left
in the ten*. **This is the recommendation — see §6.1.**

### R3 — make the recognition arrive with ceremony rather than as a line

Keep the per-card line as is, and add an end-of-season or career-summary beat that names what the
player did — the game already carries the material: *The Two-Deep* and *The Captain Vote* both write a
`moment`, and they are the two Shape A cards a player meets most (26.0% and 12.2% of `virtueLoyal`
careers respectively).
**Cost:** new UI surface in `src/ui/**`, which is the most expensive kind of change on this board and
is out of bounds this wave and next while the playtest runs. **What it breaks:** nothing measurable;
it is additive. **What it does not fix:** the three Shape A cards still print *"Cost you in the locker
room."* on their failure roll and still print nothing on success, so the card the player is reading in
the moment is unchanged. Ceremony at the end does not answer *"what did that choice just do?"*
**What would decide it:** a playtest question — *did you ever feel recognised for playing for the room,
and where did that feeling come from?* This is worth asking regardless of which route ships.

### R4 — fix the reachability, not the magnitude

The credit supply is one card (§4.5a) and the two non-position-locked +2 cards are mutually exclusive
by career shape (§4.5b). Widening *Up Forty at Halftime*'s weight, or dropping *The Five-Star Behind
You*'s `tier: [3,4]` to `[2,3,4]` so a non-transferring player can reach it, moves the left-hand column
of §4.4 — the 47.5% of silence that is "never met one".
**Cost:** content, frozen; and weight changes move the whole draw pool, so every balance baseline
moves, unlike R2 which only moves character. **What it breaks:** *The Five-Star Behind You*'s authorial
premise is the blue-blood arms race; it reads differently at a tier-2 school. **What would decide it:**
a frequency-only variant of this probe run against a candidate weight table. **Recommend deferring:**
it is strictly more expensive than R2 and fixes the smaller half.

### 6.1 The recommendation

**R2, deferred to the wave that lifts the content freeze; R0 until then; R3 as the follow-on if the
playtester's answer to §6's ceremony question is "no".**

R2 is the only route that is both cheap in balance terms (**+0.17 draft stock, 2% of DECISION 078's
own landed change, and exactly 0.00 on the `good` profile**) and targeted at the defect that was
actually measured. R1 is disqualified by its own number — 5.5% of what it buys is on target. R4 costs
more and fixes less. R3 is real and additive but it is a `src/ui/**` change during a playtest, and it
does not touch the card the player is reading.

**The one thing to carry to the user, because it is an authorial call and not a measurement:** on
*The Two-Deep*, *The Holding Call* and *The Captain Vote*, doing the right thing and having it work
says **nothing**, and doing the right thing and having it fail says **"Cost you in the locker room."**
Whether that asymmetry is a bug or an authored statement about how locker rooms actually work is not a
question this probe can answer, and R2 assumes it is a bug.

---

## 7. What I added, and verification

**Added (the only files touched):**

- `src/sim/spared-card-probe.ts` — instruments the decision loop; reproduces `accountOf`,
  `firedOutcomes` and `lockerRoomVerdict` (including returning *nothing said* on an ambiguous prose
  match); reports every rate with **careers** in the denominator; `floorCensus` prices R1 across the
  whole bundle. CLI: `npx tsx src/sim/spared-card-probe.ts 600 virtueLoyal,virtueAmbitious,good all b57`.
- `src/sim/spared-card-probe.test.ts` — 16 tests. Pins all eleven card ids, all eleven good-branch
  option ids and all 21 character deltas against `src/content/**` at HEAD; asserts the probe's copy of
  `LOCKER_ROOM_MIN_CHARACTER` against the literal in `view-model.ts` (the constant is not exported and
  this wave may not edit `src/ui/**`, so the guard reads the source text — the same shape of guard
  `human-lazy-probe.test.ts` puts on its copy of the band table); asserts determinism on a seed.

**No existing probe was modified.** `src/engine/**`, `src/content/**` and `src/ui/**` are untouched.

**`npm test` — green: 43 files, 756 tests.** The brief says 728; **HEAD is 740 before this lane**
(measured by running the suite with the new file excluded), so the brief's figure is stale by twelve
and nothing regressed. 740 + 16 = 756.

**`npm run typecheck` — two passes, both exit 0.** `tsc -p tsconfig.engine.json && tsc -p tsconfig.json`,
run twice, exit 0 both times.

**Identity check — and identity is the pass.** `npm run balance` was run on two configurations and
compared **byte for byte** against the same commands run out of a pristine export of HEAD
(`git archive HEAD` into a temp tree — no `checkout`, `restore` or `stash` was used at any point):

- `npm run balance -- 2000 random QB` — **byte-identical** (`cmp` clean). It printed, among others,
  `"draftedRate": 0.9505`, `"bustedRate": 0.0495`, `"washoutRate": 0.0005`, `"undraftedRate": 0.0365`,
  `"round1Rate": 0.0935`, `"allConfRate": 0.753`, `"avgSeasons": 4.7115`.
- `npm run balance -- 500 random all` — **byte-identical** (`cmp` clean).

**`git status --porcelain`** shows only the two new `src/sim/` files as untracked, plus one modified
doc that belongs to another agent (`reports/056-can-you-earn-it-now.md`) and which this lane did not
touch. **Nothing modified under `src/engine/**`, `src/content/**` or `src/ui/**`.** **Nothing committed.**

---

## Appendix — limitations

1. **"The branch a good teammate would plausibly take" is a judgement, not a measurement.** It is
   stated per card in §2 and pinned in the test, so a reader who disagrees can see exactly what was
   assumed. The one genuinely contestable call is *Playing Through the Hand*, where the "good" branch
   is the one that is **not charged** rather than one that is rewarded — the card has no rewarded
   branch. Reading the sit branch as the good one instead makes the card's silence worse, not better
   (that branch is −1 and also silenced), so the conclusion is insensitive to the call.
2. **The virtue policies take the highest-character branch every time.** A human plays the good branch
   some fraction of the time, so every "good branch take" rate here is an **upper bound** on a real
   player's, and every silence figure is correspondingly a **lower bound**.
3. **`homeState` is fixed at `TX`** across every career, as in `rung-probe` and `virtue-probe`. Region
   affects which schools appear at Signing Day, so the tier findings in §4.5b are stated for that
   region; the *"zero tier-3/4 offers in 1,200 careers"* result was measured under the same fixture.
4. **The projected R2 outcome in §6 is arithmetic on the measured take counts, not a re-run.** Raising
   a branch from +1 to +2 changes nothing about which branch the virtue policy takes (it is already the
   highest-character branch on all six), so the take counts carry over, but the character trajectory
   shifts slightly and could move a bust gate or a rung in a small number of careers. The acceptance
   criterion in §6 is stated as a re-run for that reason.
5. **B79 interaction.** Seven of the eleven carry `requiresPlaying`, which does not currently know
   about injury or suspension. Fixing B79 would reduce every firing rate in §4.3 for those seven. The
   direction is known; the size is not measured here.
