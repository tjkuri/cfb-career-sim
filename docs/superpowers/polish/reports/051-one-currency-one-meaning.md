# 051 — One currency, one meaning: R1 landed and works; B76's premise does not survive contact

**Status: `needs-decision`.** R1 is implemented, measured and committed. **B76 was not performed**, because
Step 4's own stop condition fired: the brief allows up to three of the 22 cards to reward the
higher-effort/integrity branch before the deletion must halt. **Ten do, plus one ambiguous.** The set is
not an inversion; it is a coin flip.

Repo `/Users/tkuri/Documents/personal_projects/cfb-career-sim`, branch `polish/ui-phase`, HEAD at
dispatch `4076822`.

---

## 0. The one sentence

The census that R1 needed says the character currency is coarser than anyone on this board has been
writing down — every realized character amount in the bundle is an **integer**, so `≈±1.5` and `2` are
the same function — and once you read the same corpus card by card instead of by its across-options
spread, **B76's 22 "inverted" cards are 11 inverted, 10 correctly oriented, and 1 ambiguous.**

---

## 1. Step 0 — baseline, and the sample size

**3,000 careers per (profile, position) cell, six positions, three profiles = 54,000 careers.**

The brief asked for a size at which a ±0.1 change in mean Earned/Cost per career is outside the standard
error. A 300-career pilot put the per-career SD of the Earned count at ≈1.64. At 18,000 careers per
profile that is **SE ≈ 0.012**, so ±0.1 is **≥6.7 SE**. 3,000/cell is 047's number and it is already
eight times more than this question needs; the cost is 32 seconds of wall clock, so there was no reason
to trim it.

The brief says "the `virtue` and `good` profiles". `virtue` is an *event strategy*, not a profile; the
profiles built on it are `virtueAmbitious` and `virtueLoyal` (`src/sim/policies.ts:388-398`), and both
are reported.

The instrument is `traceVirtue` from `src/sim/virtue-probe.ts`, called through a thin scratch wrapper
that adds standard errors and a per-(event, option) tally. **`src/sim/virtue-probe.ts` is unmodified** —
the wrapper imports it, so every number below comes from `cardAccount` itself.

| profile | Earned/career | Cost/career | lines/career | mean character at end | mean draft stock |
|---|---|---|---|---|---|
| `good` | 5.395 ± 0.011 | 3.535 ± 0.013 | 8.929 | 67.885 ± 0.043 | 83.109 ± 0.096 |
| `virtueAmbitious` | 7.318 ± 0.015 | 1.465 ± 0.009 | 8.783 | 75.988 ± 0.037 | 73.593 ± 0.098 |
| `virtueLoyal` | 6.828 ± 0.013 | 1.155 ± 0.008 | 7.982 | 75.694 ± 0.032 | 70.771 ± 0.091 |

---

## 2. Step 1 — the census, and the thing it found that nobody had written down

The brief was right that this is the step most likely to go wrong, and it goes wrong in a way the brief
did not predict.

`accountOf` sums the `character` effects **on the one outcome that fired** and thresholds that. So the
census has to be over **(event, option, branch) triples** — every character total a player can actually
be shown — not over per-option expected values, and not over `charSpread`.

**348 outcome branches in `src/content/events/**`. 129 carry a non-zero character total. Their
magnitudes are:**

```
  |char| 1        37   ####################################
  |char| 2        31   ###############################
  |char| 3-4      27   ###########################
  |char| 5-9      23   #######################
  |char| >=10     11   ###########
```

**The distinct magnitudes are {1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 20, 23, 32}. There are no fractional
values anywhere.**

That is the finding. **The `−0.15` in the brief and in DECISION 075 cannot be printed by any card**, and
neither can a `−13.4`. Those are probability-weighted *expectations* — report 050's `charSpread`, which
is a property of an event's option set, not of anything a player is ever shown. The smallest verdict the
game has ever printed is for a **±1**, and the largest is for a **−32** (*The NIL Deal Nobody Read*).
The real ratio is 32:1, not 89:1, and every threshold in the 1.01–2.00 range is **the identical
function**.

So 075's suggested `≈±1.5` is not wrong — it is *unresolvable*. Stated as an implementable number it is
**2**.

### 2.1 The threshold, and what it does not do cleanly

The brief asked for a threshold that keeps the 12 moral forks and drops the 13 flavour nudges. Mapping
Appendix A's buckets onto the realized census (my census reproduces Appendix A's `charSpread` column
exactly on all 60 cards, and §5 below reproduces 047's `34/60, 0.9118` to four decimals, so the
instrument agrees with 050's):

| bucket | realized branch magnitudes present |
|---|---|
| **Moral forks** (12) | 2, 3, 4, 5, 8, 9, 10, 13, 20, 23, 32 — **minimum 2** |
| Mid (9) | 1, 2, 3, 4, 5, 6 |
| **Flavour nudges** (13) | **1, 2, 3, 4** |

**No single threshold does both cleanly, and here is the overlap.**

- **T = 2 is forced from above.** *The Team Banquet*'s credit branch is `+2` — the smallest branch on any
  of the twelve forks. T = 3 would take its line away, violating constraint 1.
- **T = 2 is not enough from below.** Five of the thirteen flavour nudges keep a line at T = 2, because
  their *branch* magnitude is 2–4 even though their *option-EV spread* is under 1.5:
  *Bowl Opt-Out* (+2), *Bowl Season* (−2), *Next Man Up* (−2/−3 failure branches), *The Holding Call*
  (−2 failure branch), and **The Captain Vote (−3 and −4)**, whose spread is 0.90 purely because both
  options carry similar-sized penalties.

This is the measure-versus-measure error the brief warned about, seen from the other side: a card can
have a negligible *spread* and a large *branch*. **The Captain Vote has an 0.9 spread and a −4 branch.**

**Chosen threshold: `LOCKER_ROOM_MIN_CHARACTER = 2`.** It is the largest value that keeps all twelve
forks, and the smallest value that does anything at all. What it silences corpus-wide is the **37
single-point branches across 34 events** — enumerated in §3.2.

---

## 3. Steps 2 and 3 — R1 implemented, and it moves the numbers hard

### 3.1 The change

`src/ui/session/view-model.ts` — a named constant with its derivation, and a `lockerRoomVerdict` wrapper
that `accountOf` now calls in place of `direction` for the `lockerRoom` field only. **`later` is
untouched**, as instructed. Docblocks updated in three places so the prose states the threshold:
`view-model.ts` (the new constant and function), `CareerScreen.tsx`'s `lockerRoomLine` (whose stated
intent this finally implements), and `types.ts`'s `CardAccount.lockerRoom`.

**Test added (TDD, failing first):** `view-model.test.ts` — *"says nothing about the locker room for a
character delta too small to matter"*. It asserts silence on four `±1` branches and a surviving verdict
on the two smallest and two largest fork branches. **No existing test was changed**; 727 → **728**.

### 3.2 The measurement. Identity would have been a failure; it is nowhere near identity.

| profile | Earned | Cost | lines/career |
|---|---|---|---|
| `good` | 5.395 → **1.254** (−4.141) | 3.535 → **2.794** (−0.740) | 8.93 → **4.05** (−55%) |
| `virtueAmbitious` | 7.318 → **2.458** (−4.860) | 1.465 → **0.948** (−0.517) | 8.78 → **3.41** (−61%) |
| `virtueLoyal` | 6.828 → **1.838** (−4.990) | 1.155 → **0.787** (−0.367) | 7.98 → **2.62** (−67%) |

Every movement is 30–400 SE. Mean character and mean draft stock are **bit-identical** before and after,
which is the correct result for a display-only change and is the control that says the probe measured
the display and not the model.

**31 (event, option) pairs went quiet across the three profiles.** The top of the list is the
finding-inside-the-finding:

| pair | lines/career silenced (`good`) | lines/career silenced (`virtueLoyal`) |
|---|---|---|
| `milestone-opener-*/stay-within` (×4 of 5 per career) | 3.59 | 3.59 |
| `postseason-coaching-carousel/hold-the-room` | 0.336 | 0.215 |
| `conference-primetime/play-your-game` | 0.120 | 0.128 |
| `playing-through-the-hand/sit-and-let-the-backup-go` | 0.095 | — |
| `kickoff-duties-too/stick-to-field-goals` | 0.088 | 0.085 |
| `wideopen-next-man-up/ask-for-a-series` | — | 0.171 |
| `wideopen-two-deep/bring-the-walkon-along` | — | 0.138 |
| 24 others | ≈0.65 | ≈1.03 |

**73% of the entire Earned drop is one card family: the Season Opener.** `stay-within` is `+1` at p=0.9,
it fires once a season, and there are four or five seasons. It was authored **last wave** (`ae03d50`),
and it was quietly the single largest source of locker-room verdicts in the game — a card that was
printing a moral verdict roughly four times per career for a movement worth 0.15 draft stock. R1's
largest effect is on content that post-dates every report that motivated R1.

That is worth flagging to the PM on its own: **R1's headline "37.5% of resolved cards" understates the
noise, because the measurement predates the openers.**

### 3.3 Click-through (`localhost`, dev server)

Played into season 1. *The Group Chat* → "Let the screenshot ride" (−13) prints **"Cost you in the
locker room."** in full weight above the `+1 OVR`. *The First One* (Season Opener) → "Let the game come
to you" (+1) now prints **prose and nothing else** — no verdict, no number. The big one speaks, the
noise does not.

---

## 4. Step 4 — B76, and why it is not in this commit

The 22 are `group = CONFLICT` and `charSpread < 3` from Appendix A. I resolved all 22 to event ids and
verified each against the current source. Two notes before the table:

- **The file list in the brief is incomplete.** It names eight; the real set is **ten** — `universal.ts`
  (`blueblood-scouts-at-practice`, `blueblood-five-star`) and `school-life.ts` (`wideopen-next-man-up`,
  `wideopen-two-deep`) were not listed. Both contain cards in the 22.
- **`milestone-bowl-season` re-derived against current `milestones.ts`** as Appendix B demanded. It is
  unchanged by `ae03d50`: `prepare` carries a `−2` on its **failure** branch and `enjoy` carries nothing,
  which is exactly what 050 describes.

### 4.1 The orientation table. This is the result.

`E` = does character reward the higher-**effort** branch? `I` = does it reward the higher-**integrity**
branch? A `+` means the currency points the way `offfield.ts`'s header says it should.

| # | card | event id | the character-rewarded (or less-charged) branch | E | I | verdict |
|---|---|---|---|---|---|---|
| 1 | Bubble Screen Diet | `bubble-screen-diet` | "Take what's given" +1 | − | ~ | **inverted** |
| 2 | Senior Bowl Invite | `senior-bowl-invite` | "Decline and rest the injuries" +1 | − | ~ | **inverted** |
| 3 | Iced | `iced` | "Use the free rehearsal to reset" +2 | − | ~ | **inverted** |
| 4 | Bowl Practice Reps | `bowl-practice-reps` | "Manage your reps and stay fresh" +1 | − | ~ | **inverted** |
| 5 | Scouts on the Sideline | `blueblood-scouts-at-practice` | *nothing rewarded*; −1 charged to the **clean-week** branch's failure | − | − | **inverted** |
| 6 | Next Man Up | `wideopen-next-man-up` | "Ask for a series off" +1 | − | ~ | **inverted** |
| 7 | **Kickoff Duties Too** | `kickoff-duties-too` | "Ask them to find someone else" +1; "Take both jobs and don't complain" **0** | − | − | **inverted (the reductio)** |
| 8 | Bowl Season | `milestone-bowl-season` | "Enjoy the trip" 0; "Treat it like a playoff game" −2 on failure | − | ~ | **inverted** |
| 9 | Targeting Review | `targeting-review` | "Pull up at the last second" +1; the hit charged −2 when flagged | − | **+** | **ambiguous** |
| 10 | Travel With the No. 1 | `travel-with-the-no-1` | "Take the help over the top" +1 | − | ~ | **inverted** |
| 11 | Coverage Install | `coverage-install` | "Lean on the veterans to decode it" +1 | − | ~ | **inverted** |
| 12 | New Holder | `new-holder` | "Strip the operation down to basics" +1 | − | ~ | **inverted** |
| 13 | **The Toe-Tap** | `the-toe-tap` | "Wave it incomplete before the booth does" **+2** vs "Sell the catch" | ~ | **+** | **correct — honesty** |
| 14 | **Bowl Opt-Out** | `bowl-opt-out` | "Suit up and play" **+2**, and it carries the injury risk; "Sit out" 0 | **+** | **+** | **correct** |
| 15 | **Up Forty at Halftime** | `nonconf-blowout-sideline` | "Coach up the freshman behind you" **+2** vs "Lobby for one more series" | ~ | **+** | **correct — team-first** |
| 16 | **The Transfer QB** | `transfer-qb` | "Take him under your wing" **+2** vs "Win the job outright" | ~ | **+** | **correct — team-first** |
| 17 | **Playing Through the Hand** | `playing-through-the-hand` | "Sit and let the backup play" **−1**; playing through the cast costs nothing | **+** | **+** | **correct** |
| 18 | **The Two-Deep** | `wideopen-two-deep` | "Teach the walk-on behind you" +1; hoarding reps **−6** on failure | ~ | **+** | **correct — team-first** |
| 19 | **The Holding Call** | `the-holding-call` | "Own it in the film session" +1 vs "Argue the call with the official" | ~ | **+** | **correct — accountability** |
| 20 | **Trash Talk** | `trash-talk` | "Stay quiet and play your game" +1; retaliating −2 | ~ | **+** | **correct — composure** |
| 21 | **The Captain Vote** | `offseason-captain-vote` | "Let the work speak" −3 vs "Make the case for yourself" −4 | ~ | **+** (weak) | **correct — humility** |
| 22 | **The Five-Star Behind You** | `blueblood-five-star` | "Teach him the install" **+2** vs "Give him nothing" −2 | ~ | **+** | **correct — team-first** |

**Tally: 11 inverted, 10 correct, 1 ambiguous.**

Even on the most conservative reading — striking the two weakest (#20 *Trash Talk*, #21 *The Captain
Vote*) and the ambiguous one — **eight cards reward the higher-effort or higher-integrity branch.** The
brief's trigger is *more than three*. It fires with room to spare, so **I stopped before editing any
content file. `src/content/**` is untouched.**

### 4.2 What 050 got right, and what it extrapolated

050 §4 tabled **ten** cards. All ten are in my "inverted" column and every one of them checks out
verbatim. The eleventh, `blueblood-scouts-at-practice`, I add: it rewards nothing and charges `−1` to the
*professional* branch, which is the same defect in a different shape.

The extrapolation from those ten to all 22 is where it breaks. **The twelve cards 050 did not table
contain a coherent, correctly-oriented family it did not notice**, and it is the most valuable content
in the set:

> **The four "help the man who is trying to take your job" cards** — *The Five-Star Behind You* (+2 to
> "Teach him the install"), *The Transfer QB* (+2 to "Take him under your wing"), *The Two-Deep* (+1 to
> teaching the walk-on, **−6** to hoarding reps), *Up Forty at Halftime* (+2 to coaching up the freshman
> over lobbying for yourself).

Those four are the clearest statement in the whole corpus of the convention `offfield.ts` states in its
header. **B76 as written deletes all four.** Deleting them does not make the currency mean one thing; it
removes four of the cards that teach what the one thing is, and leaves the corpus with proportionally
*more* inversion than it has now.

Alongside them: *The Toe-Tap* rewards telling the truth about a catch, *The Holding Call* rewards owning
your penalty in the film session, *Bowl Opt-Out* pays +2 to the branch that puts your draft stock at
injury risk, and *Playing Through the Hand* is the one card in the set that **charges the player for
sitting** — the exact opposite of the pattern B76 exists to delete.

### 4.3 Why this diagnosis is itself checkable

Process rule 2 applies to me. My orientation call is a judgement, not a measurement, and the honest
statement of its uncertainty is the `E`/`I` split: on the **effort** axis alone, 050's claim holds up
much better — most of the "correct" cards are effort-neutral and win on **integrity**. If the board's
position is that character should track *effort* specifically, the count of clearly-correct cards drops
to **two** (#14, #17) and B76 should proceed.

**That is the decision I am handing back, and it is a one-sentence authorial question:** *when character
rewards a player for teaching the five-star who is about to take his job, is that the currency working
or the currency inverted?* If it is working, B76's set is wrong and needs re-cutting to the eleven.
If it is inverted, B76 is right as written and I will run it.

---

## 5. Step 5 — the prediction, and what can still be said without B76

**Prediction, stated before the fact and now unfalsifiable by measurement:** the printed Earned/Cost
tally would have moved very little after B76, because R1 already silenced most of these. The census now
lets that be settled **arithmetically** rather than by a third probe run:

**R1 already silences 9 of the 11 inverted cards.** Eight are `±1` on every branch and go completely
quiet (`senior-bowl-invite`, `bowl-practice-reps`, `kickoff-duties-too`, `travel-with-the-no-1`,
`coverage-install`, `new-holder`, `blueblood-scouts-at-practice`, `bubble-screen-diet`), and
`wideopen-next-man-up` loses its rewarded branch. **Only `iced` (+2) and `milestone-bowl-season` (−2)
still print an inverted verdict after R1, out of 11.**

So the prediction is confirmed on the part of the set that is actually inverted: B76 would have removed
roughly **0.02 printed lines per career** beyond what R1 already removed. **B76 is a fix to the model and
not to the display, exactly as the brief said** — which also means the case for it stands or falls
entirely on §4.2, with no help from the frequency numbers.

**The non-vacuous check is the one that cannot be run**, and that matters: DECISION 076's stop condition
compares R1 and B76 on the realized Earned/Cost counts, and with B76 not applied there is no second
direction to compare. The stop condition is **not** satisfied and **not** violated; it is unevaluated.
This report is not evidence that they agree.

---

## 6. Step 6 — the bonus measurement, floored

047's source figure, re-derived from the current bundle. The reproduction is exact, which is the
instrument check:

| corpus | character-differentiating events | virtuous option strictly worse on OVR | mean gap on those |
|---|---|---|---|
| **047's original** (excl. the new openers) | 60 | **34 (56.7%)** | **0.9118** |
| **with a ≥1.5 character floor** | 34 | 21 (61.8%) | 1.1452 |
| **with a ≥3 character floor** | **19** | **12 (63.2%)** | **1.6208** |
| below the floor (<3) | 41 | 22 | 0.5250 |
| **at HEAD today** (openers included) | 65 | 39 (61.5%) | 0.8077 |

DECISION 075 item 1 is upheld and sharpened. **"34 of 60 at 0.91 OVR" is really "12 of 19 at 1.62 OVR",
with 22 of 41 sub-threshold cards at 0.53 OVR making up the rest.** The *rate* barely moves (56.7% →
63.2%), so the qualitative claim survives; the **population is a third of the size** and the **gap on it
is 78% larger**. The twelve that clear the floor are precisely the twelve moral forks of §3 — an
independent confirmation that 050's bucket split cut the corpus at the right place, even though it cut
it on the wrong quantity for R1's purposes.

Note also that 047's headline is now stale on its own terms: at HEAD the figure is **39 of 65**, because
the Season Opener added five character-differentiating events after the measurement was taken.

---

## 7. What I changed, and verification

**Commit 1 (R1), the only commit.** Four files:

- `src/ui/session/view-model.ts` — `LOCKER_ROOM_MIN_CHARACTER = 2` + `lockerRoomVerdict`, wired into
  `accountOf`'s `lockerRoom` only.
- `src/ui/screens/CareerScreen.tsx` — `lockerRoomLine` docblock states the floor.
- `src/ui/session/types.ts` — `CardAccount.lockerRoom` doc states the floor.
- `src/ui/session/view-model.test.ts` — one new test.

**No content file was touched. `src/engine/**` untouched. `src/sim/virtue-probe.ts` untouched.**

- `npm test` — **728 passed** (727 + the one new test, named above). No existing test changed.
- `npm run typecheck` — both passes, **exit 0**.
- `npm run build` — clean, 83 modules.
- Click-through verified in the browser (§3.3).

---

## 8. What I would tell the PM

1. **R1 is done and it is bigger than advertised** — it removes 55–67% of all locker-room verdicts, and
   the largest single source is the Season Opener authored last wave, which no report had measured.
2. **The character currency is coarser than the board's own numbers say.** Every printed verdict is an
   integer from 1 to 32. `−0.15` and `−13.4` are expectations that no card can print, and several
   downstream statements are phrased as though they were card facts.
3. **B76 needs one authorial sentence before it can run**, and §4.3 states it. Deleting all 22 removes
   the four best-oriented cards in the corpus.
4. **A re-cut B76 is available immediately and is a clean, defensible item:** delete the character
   effects on the **eleven** verified-inverted cards (§4.1 rows 1–12 excluding row 9), keep the ten, and
   send *Targeting Review* to the same authorial question. `kickoff-duties-too` is row 7 and is in that
   eleven, so the mandatory card is covered either way. This is the recommendation.
5. **Nothing here revisits DECISION 076's substance** — the user's call was made on 050's claim that all
   22 were inverted. That claim is 50% true, and this is the first measurement of the other half.

## Appendix — limitations

- **The orientation table is a judgement, not a measurement.** It is reproducible (the labels and effect
  amounts are in the table), and §4.3 gives the axis on which it could come out differently. A second
  reader scoring the same 22 blind, with the `E`/`I` axes stated but the verdicts hidden, would settle
  it cheaply — the same instrument report 050 used on itself.
- **T = 2 silences five flavour nudges' large branches and keeps them audible** (§2.1). They are not the
  moral forks and the line is arguably still wallpaper on them. Raising the floor is not available
  without losing *The Team Banquet*; narrowing it would need a per-card decision, which is content.
- **The Step 5 non-vacuous check was not run**, because B76 was not applied. §5's arithmetic is a
  prediction derived from the census, not a measured result.
- **Only three profiles.** `good`, `virtueAmbitious`, `virtueLoyal` — the ones the brief named. R1's
  effect on `humanLazy*` and the `antisocial`/`saboteur` profiles is unmeasured; those profiles take the
  large-magnitude branches, so the floor should barely touch them, but that is an inference.
