# 059 — Price the thing the user has to approve

**Brief:** `briefs/059-price-the-thing-the-user-has-to-approve.md` · **Wave:** 31 · **Type:** measurement +
exact proposal · **Product code shipped:** none. Two new files under `src/sim/`, nothing else.
**Prices:** DECISION 084. **Supersedes:** report 057 §6 R2.

---

## 0. The one paragraph

**Every number in DECISION 084 reproduces exactly**, independently derived from `CONTENT` rather than
transcribed: 22 / 48 / 136 options, 27 one-way-down cards, 9 mirrors, 21 with the floor removed. Of the
27, **I would credit 11, leave 13 alone, and put 3 in front of the user as genuinely unsure.** The 11
split into two blocks that must be approved separately because they cost twenty-nine times different
amounts. **Tier 1 (6 cards) costs `virtueLoyal` +0.131 ± 0.006 draft stock and `good` +0.016 ± 0.002 —
two hundredths of a point on a base of 83.2.** **Tier 2 (the five `fixed` season openers) costs
`virtueLoyal` +0.51 more and `good` +0.47 more, and it is the only block that changes what a median
career actually reads.** Undrafted rate and bust rate are unmoved in every arm. Two things the board
should hear: **report 057's R2 was priced at +0.17 draft stock and measures at +0.131 — about 23%
high** — and **its claim that `good` moves "exactly 0.00" is false** (`good` takes
`targeting-review/pull-up` in 6.4% of careers). Third and largest: **the brief's acceptance criterion,
*credit p50 ≥ 1 on `virtueLoyal`*, is already satisfied at HEAD** — corpus-wide the median
`virtueLoyal` career reads **2** locker-room credits. It does not discriminate and §5.3 proposes the
criterion that does.

---

## 1. Reproducing DECISION 084 — not trusting it

The brief asked for independent reproduction and said to say so loudly if the numbers differed. They do
not differ. `censusCorpus()` in `src/sim/credit-proposal-probe.ts` walks `CONTENT.events` and classifies
every option by the sign of each outcome's summed `character` effects against a floor:

| | can earn a credit | can be charged | silent both ways | PM's figure |
|---|---|---|---|---|
| 204 options, floor 2 | **22 (10.8%)** | **48 (23.5%)** | **136 (66.7%)** | identical |
| 204 options, floor 1 | **38 (18.6%)** | **59 (28.9%)** | **114 (55.9%)** | identical |

| | one-way-down cards | mirror (one-way-up) | PM's figure |
|---|---|---|---|
| floor 2 | **27 of 106 (25.5%)** | **9** | identical |
| floor 1 | **21 of 106 (19.8%)** | 12 | identical |

(22 + 48 + 136 = 206 > 204 because **2 options can do both** — their two branches disagree in sign.
That reconciliation is not in DECISION 084 and is worth having on the record.)

DECISION 077's distribution claims also reproduce exactly: authored character magnitudes are
`{1,2,3,4,5,6,8,9,10,12,13,20,23,32}`, there are **72** negative character outcomes and **49** of them
land in −1..−4. The positive side, which 077 does not state and which the magnitude argument in §4
needs: **43 positive character outcomes, of which 16 are +1, 10 are +2 and 5 are +3.**

All of the above is pinned in `credit-proposal-probe.test.ts`, so a content edit that moves any of it
fails a test rather than silently invalidating this report.

---

## 2. The candidate list — all 27, read one at a time

**11 credit · 13 leave alone · 3 unsure.** The `now` column is the summed `character` of the branch's
success outcome at HEAD.

### 2.1 Credit (11)

| # | Card | The branch a decent person takes | now | verdict | why |
|---|---|---|---|---|---|
| 1 | `wideopen-two-deep` *The Two-Deep* | `bring-the-walkon-along` | **+1** | credit | Prose: *"the room notices who built him."* The reps are a real cost. Writes a `moment`, scores nothing readable. |
| 2 | `offseason-captain-vote` *The Captain Vote* | `let-the-work-speak` | **0** | credit | *"You never bring it up once, and the room votes for you anyway."* The room's verdict **is** the currency, and this is the one card where it is rendered explicitly — for zero points. |
| 3 | `the-holding-call` *The Holding Call* | `own-it` | **+1** | credit | Taking blame in the film session is public and costs face. The same branch's failure already charges −2; its success is silent. |
| 4 | `trash-talk` *Trash Talk* | `stay-quiet` | **+1** | credit | *"The staff appreciates the poise."* Recognition written into the prose, absent from the numbers. |
| 5 | `the-roughing-call` *The Roughing Call* | `dial-it-back` | **+1** | credit | *"A quiet word of approval from the staff."* Same shape as #4, same file. **Report 057 missed it.** |
| 6 | `asked-to-block` *Asked to Block* | `buy-in` | **+1** | credit | The purest case in the corpus: *"The coaches notice even if the box score doesn't"* — seen, and it costs him his stat line outright. |
| 7–11 | `milestone-opener-{first,no-excuse,your-team,counting,last}` | `stay-within` | **+1** | credit (Tier 2) | `fixed`, fires every played season, charges −2 and can never credit. Three of the five say the room noticed: *"the guys who watched you all summer notice"*, *"the young guys copy it"*, *"the sideline says so out loud"*. |

### 2.2 Leave alone (13)

**The test I applied, stated so a reader can disagree with it precisely: a restraint branch should pay
only if (a) somebody in the room can see it, and (b) it costs the player something he wanted.** Both
clauses matter. Paying for private prudence redefines `character` as a compliance score — "avoided
doing a bad thing" — which is the failure mode the brief warned about, and it is worse than the current
silence because it is *wrong* rather than merely absent.

| Card | Branch | now | why it is left alone |
|---|---|---|---|
| `offfield-sportsbook-nil` | `have-it-read` | `[]` | Having your contract read is prudence, it is invisible, and it costs nothing. Its sibling is −5/−32 because *that* is a violation; the absence of a violation is not standing. |
| `offfield-money-manager` | `hire-a-professional` | `[]` | *"Boring, correct, and nobody's feelings get hurt at Thanksgiving."* Private, prudent, unseen. |
| `offfield-ticket-hookup` | `give-them-away` | `[]` | Not committing an NCAA violation. Same argument. |
| `offfield-training-table` | `wait-your-turn` | `[]` | Visible in principle, but the prose closes the door itself: *"Nobody notices, which is fine."* Baseline decency. |
| `offfield-group-chat` | `apologize` | `[]` | Repairing harm **you caused**. The corpus does not otherwise pay for atonement, and it should not start here. |
| `offfield-bowl-curfew` | `stay-in` | `[]` | **I disagree with the PM.** Curfew is a rule. *"You watch a movie in the hotel room"* — unseen, and the only cost is a night out. Crediting it is the clearest possible case of paying for compliance. |
| `offfield-ghost-media` | `show-up` | `[]` | **I disagree with the PM.** Press availability is **required**. *"Nobody remembers it by dinner."* Crediting it pays a player for doing his job. |
| `blueblood-playoff-or-bust` | — | — | No restraint branch exists: both options are media posture, and both charges are failure rolls. Nothing to credit. |
| `nonconf-watch-list` | `ignore-it` | 0 | The card's authored point is that the list means nothing — *"neither does anybody whose opinion you actually want."* Crediting it contradicts the card. |
| `offseason-going-home` | `stay-and-train` | 0 | Discipline, not standing; unseen; and the card's other branch already pays +1 for **going home**, which is the opposite reading. |
| `weight-room-bet` | `stick-to-your-program` | 0 | The charge is *"the staff reads it as ducking a challenge."* Crediting the same branch would have the card say both things at once. |
| `speeding-georgia` | — | — | Single-option card. There is no branch to credit; the −4 is the 15% failure roll. Structurally out of scope. |
| `milestone-rivalry` | `sit` | **−2** | Correctly one-way-down. The −2 for sitting out the rivalry game **is** the authored point, and the other branch's risk is an ankle, not character. Do not touch. |

### 2.3 Unsure — for the user, not buried (3)

These are not close calls I resolved quietly; they are three where I can argue both sides and would
rather the user chose. **Priced as their own arm in §5.2 so the choice has a number attached.**

| Card | Branch | now | for | against |
|---|---|---|---|---|
| `targeting-review` | `pull-up-at-the-last-second` | +1 | Protecting an opponent at real cost to yourself is sportsmanship, and report 057 proposed it. | It is the corpus's closest thing to plain rule-compliance (*don't commit targeting*), and unlike #4 and #5 the prose grants **no** recognition: *"no flag, no review, just a clean form tackle."* |
| `sideline-camera` | `cool-down` | +1 | De-escalating with a teammate on a national broadcast is visible and it works. | The player **caused** the incident. This is atonement, and §2.2 refuses to pay for atonement on `offfield-group-chat`. Crediting it here would be inconsistent. |
| `offfield-skip-install` | `skip-the-podcast` | `[]` | The only `effects: []` restraint branch that gives up something real — national exposure — for the room. | Nobody sees it (*"The podcast books someone else"*), and the install is a required meeting, which puts it back in the compliance bucket. |

---

## 3. What I would NOT do, and why it matters more than what I would

**A list that says "all 27" has not been read.** Fourteen of the 27 stay one-way-down under my
recommendation and **that is the correct outcome**, not an omission:

- **8 of them are the `offfield-*` transgression family**, whose restraint branches are `effects: []`
  *deliberately*. That family's convention, stated in `offfield.ts` itself, is that the corrosive
  option charges character on the branch you take. The null branch is the author saying *nothing
  happened*, and nothing did. DECISION 084's phrase "the game scores misbehaving and declines to score
  behaving" is true of the corpus as a whole; on this specific family it is also **the design**.
- **`milestone-rivalry` and `speeding-georgia`** cannot be fixed by a credit at all — one is correctly
  charging, the other has no second branch.
- **Three more** (`nonconf-watch-list`, `weight-room-bet`, `offseason-going-home`) would be made
  *self-contradictory* by a credit: each charges the very branch a credit would pay.

If the user reads only one line of this report, it should be this one: **the fix for 14 of the 27 is
not a credit, and a wave that "fixes all 27" would be a worse game than HEAD.**

---

## 4. The exact proposed diff

All files are under `src/content/events/`. `now` and `proposed` are the **summed `character` of the
named outcome**; every other effect on the outcome is untouched.

### Tier 1 — six edits, six cards

| Card id | Option id | Branch | File | Current effects | Proposed effects |
|---|---|---|---|---|---|
| `wideopen-two-deep` | `bring-the-walkon-along` | positive | `school-life.ts` | `[{character:1},{moment:"Built a backup out of a walk-on"}]` | `[{character:`**`2`**`},{moment:"Built a backup out of a walk-on"}]` |
| `offseason-captain-vote` | `let-the-work-speak` | positive | `season-life.ts` | `[{moment:"Voted captain without campaigning for it"}]` | `[{moment:"Voted captain without campaigning for it"},`**`{character:2}`**`]` |
| `the-holding-call` | `own-it` | positive | `ol.ts` | `[{stat:pancakes,+2},{character:1}]` | `[{stat:pancakes,+2},{character:`**`2`**`}]` |
| `trash-talk` | `stay-quiet` | positive | `dl.ts` | `[{stat:tfls,+1},{character:1}]` | `[{stat:tfls,+1},{character:`**`2`**`}]` |
| `the-roughing-call` | `dial-it-back` | positive | `dl.ts` | `[{stat:tfls,+1},{character:1}]` | `[{stat:tfls,+1},{character:`**`2`**`}]` |
| `asked-to-block` | `buy-in` | positive | `oskill.ts` | `[{character:1}]` | `[{character:`**`2`**`}]` |

### Tier 2 — five edits, five cards (approve or reject as a block)

| Card id | Option id | Branch | File | Current effects | Proposed effects |
|---|---|---|---|---|---|
| `milestone-opener-first` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-no-excuse` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-your-team` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-counting` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |
| `milestone-opener-last` | `stay-within` | positive | `milestones.ts` | `[{snaps:10},{character:1}]` | `[{snaps:10},{character:`**`2`**`}]` |

*(The unsure three, if taken, are `targeting-review/pull-up-at-the-last-second` +1→+2 in `dskill.ts`,
`sideline-camera/cool-down` +1→+2 in `qb.ts`, and `offfield-skip-install/skip-the-podcast`
`[]`→`[{character:2}]` in `offfield.ts`.)*

The whole table lives in code as `TIER_1` / `TIER_2` / `UNSURE` in `src/sim/credit-proposal-probe.ts`,
and the test asserts every row's `from` against `src/content/**` at HEAD — so if the corpus moves
before the user approves, the proposal fails a test instead of silently addressing a card that changed.

### 4.1 The magnitude is the decision, and every one is +2

**+2 for all eleven, and the uniformity is deliberate.** Four arguments, in order of weight:

1. **The floor is 2.** `LOCKER_ROOM_MIN_CHARACTER = 2` (`view-model.ts:293`). +1 is invisible, and
   **nine of the eleven already carry +1** — they are not unrewarded, they are *unreadable*. This is
   why the diff is so small: most of the work is already authored and the display eats it.
2. **+2 is an authored magnitude.** Ten outcomes in the corpus already carry exactly +2. Nothing here
   invents a number.
3. **It keeps the credit smaller than the typical charge.** 49 of 72 negative character outcomes are
   −1..−4. A +2 credit sits at the *bottom* of the charge band, so misbehaving still costs more than
   behaving pays and the currency is not farmable. A +3 or +4 credit would invert that.
4. **Any variation above +2 is a second decision the user has not been asked to make** — it would be a
   ranking of virtues (is teaching a walk-on worth more than owning a holding call?), and that is a
   different conversation. Uniform +2 says only "this should be readable at all."

A test pins argument 2: a future row proposing a magnitude the corpus has never authored fails.

---

## 5. The price — measured

`src/sim/credit-proposal-probe.ts`, **3,300 careers per profile per arm** (550 per position × 6
positions; brief minimum 3,000), seed prefix `b59`, `homeState` fixed at `TX` as in every probe in this
directory. Draft stock is the engine's own `deriveDraftStock`, evaluated on the same final state with
`character` replaced by the modelled value and clamped 0..100 exactly as `effects.ts` clamps it. **The
draft-stock delta is a *paired* statistic — the same careers, scored twice — which is why its standard
error is two orders of magnitude tighter than the standard error of either level.**

**These figures are modelled, not observed. See §7.**

### 5.1 Draft stock, undrafted rate, bust rate

| Arm | Profile | stock before | stock after | **paired Δ** | undrafted before → after | bust |
|---|---|---|---|---|---|---|
| **Tier 1** | `virtueLoyal` | 79.86 ± 0.216 | 79.99 ± 0.216 | **+0.131 ± 0.0059** | 1.18% → 1.18% | 0.91% |
| | `virtueAmbitious` | 81.93 ± 0.224 | 82.06 ± 0.224 | **+0.132 ± 0.0059** | 1.24% → 1.21% | 0.64% |
| | **`good`** | 83.16 ± 0.220 | 83.18 ± 0.220 | **+0.016 ± 0.0022** | 0.97% → 0.97% | 0.55% |
| | `baselineRandom` | 70.03 ± 0.245 | 70.10 ± 0.245 | **+0.068 ± 0.0044** | 7.61% → 7.55% | 4.88% |
| **Tier 1+2** | `virtueLoyal` | 79.86 | 80.50 | **+0.638 ± 0.0086** | 1.18% → 1.09% | 0.91% |
| | `virtueAmbitious` | 81.93 | 82.54 | **+0.613 ± 0.0089** | 1.24% → 1.15% | 0.64% |
| | **`good`** | 83.16 | 83.65 | **+0.484 ± 0.0087** | 0.97% → 0.85% | 0.55% |
| | `baselineRandom` | 70.03 | 70.36 | **+0.328 ± 0.0082** | 7.61% → 7.45% | 4.88% |
| **+ unsure 3** | `virtueLoyal` | 79.86 | 80.64 | **+0.777 ± 0.0088** | 1.18% → 1.09% | 0.91% |
| | `virtueAmbitious` | 81.93 | 82.79 | **+0.854 ± 0.0098** | 1.24% → 1.06% | 0.64% |
| | **`good`** | 83.16 | 83.88 | **+0.722 ± 0.0094** | 0.97% → 0.82% | 0.55% |
| | `baselineRandom` | 70.03 | 70.47 | **+0.438 ± 0.0088** | 7.61% → 7.33% | 4.88% |

**Bust rate is identical before and after in every arm, and that is structural, not lucky:** the
soft-washout gate in `advance.ts` reads `overall` and season snaps only. Character reaches the career
outcome through exactly two doors — `deriveDraftStock` (0.15/point) and the `maxCharacter` conditions
on nine cards — and §7 limitation 2 covers the second.

For scale: **DECISION 078's own landed change was measured at +8.6 draft stock to these profiles.**
Tier 1 is **1.5%** of that. Tier 1+2 is **7.4%**.

### 5.2 What it buys — the credit the player actually reads

| Arm | Profile | credit rate before → after | **credit p50** | credit mean | credit p90 |
|---|---|---|---|---|---|
| **Tier 1** | `virtueLoyal` | 84.8% → **92.9%** | 2 → **2** | 1.77 → 2.45 | 3 → 4 |
| | `virtueAmbitious` | 92.6% → **96.4%** | 2 → **3** | 2.38 → 3.03 | 4 → 5 |
| | `good` | 72.5% → **75.6%** | 1 → **1** | 1.20 → 1.31 | 3 → 3 |
| | `baselineRandom` | 78.2% → **84.3%** | 1 → **2** | 1.45 → 1.78 | 3 → 3 |
| **Tier 1+2** | `virtueLoyal` | 84.8% → **100.0%** | 2 → **6** | 1.77 → 6.05 | 3 → 8 |
| | `virtueAmbitious` | 92.6% → **100.0%** | 2 → **7** | 2.38 → 6.62 | 4 → 9 |
| | `good` | 72.5% → **100.0%** | 1 → **5** | 1.20 → 4.90 | 3 → 7 |
| | `baselineRandom` | 78.2% → **97.8%** | 1 → **3** | 1.45 → 3.54 | 3 → 6 |

**Cost p50 is unchanged in every arm** (1 for the three deliberate profiles, 8 for `baselineRandom`).
No row touches a charging branch, by construction and by test.

**The share of the 27 that stops being one-way:**

| | one-way-down cards remaining | retired | share of the 27 |
|---|---|---|---|
| HEAD | 27 | — | — |
| Tier 1 | **21** | 6 | **22.2%** |
| Tier 1+2 | **16** | 11 | **40.7%** |
| + unsure 3 | **13** | 14 | **51.9%** |

The mirror set stays at 9 in every arm — **no credited card becomes one-way-*up***, because each keeps
a chargeable branch. That is asserted in the test, since a fix that merely inverted the asymmetry would
be no fix.

### 5.3 The acceptance criterion does not discriminate, and here is one that does

**The brief's criterion — *credit p50 ≥ 1 on `virtueLoyal`* — is already met at HEAD.** Measured
corpus-wide over 3,300 careers, the median `virtueLoyal` career reads **2** locker-room credits. Report
057's "credit p50 = 0" was true of **the ten spared cards only**; over the whole corpus it is 2, and
about two-thirds of that supply is one card (*Up Forty at Halftime*, 057 §4.5a).

So the criterion passes at HEAD, passes under Tier 1 and passes under Tier 1+2. It cannot tell the user
anything. **The criterion that can** is the same statistic restricted to the population the finding is
about — credits **sourced from the 27 one-way-down cards**, which is **0 by construction** at HEAD:

| Arm | Profile | mean | **p50** | p90 | careers reading zero |
|---|---|---|---|---|---|
| **Tier 1** | `virtueLoyal` | 0.679 | **0** | 2 | **50.8%** |
| | `virtueAmbitious` | 0.647 | **0** | 2 | 53.6% |
| | `good` | 0.113 | **0** | 0 | 90.2% |
| | `baselineRandom` | 0.323 | **0** | 1 | 72.8% |
| **Tier 1+2** | `virtueLoyal` | 4.279 | **4** | 6 | **0.0%** |
| | `virtueAmbitious` | 4.235 | **4** | 6 | 0.0% |
| | `good` | 3.700 | **4** | 4 | 0.0% |
| | `baselineRandom` | 2.089 | **2** | 4 | 7.9% |

**This is the whole decision, in one table. Tier 1 is nearly free and half of all virtuous careers
still read nothing new. Tier 2 reaches every career — and it reaches the `good` profile just as hard,
which is exactly the signal the brief said would mean the list was wrong.**

### 5.4 Why Tier 2 moves `good`, stated rather than hidden

The per-row fire rates (mean fires per career of the exact edited branch) explain the whole table:

| Row | `virtueLoyal` | `virtueAmbitious` | `good` | `baselineRandom` |
|---|---|---|---|---|
| `wideopen-two-deep/bring-the-walkon-along` | 0.141 | 0.053 | **0.000** | 0.055 |
| `offseason-captain-vote/let-the-work-speak` | 0.290 | 0.370 | **0.000** | 0.156 |
| `the-holding-call/own-it` | 0.055 | 0.046 | **0.000** | 0.024 |
| `trash-talk/stay-quiet` | 0.068 | 0.062 | **0.000** | 0.035 |
| `the-roughing-call/dial-it-back` | 0.052 | 0.056 | 0.054 | 0.023 |
| `asked-to-block/buy-in` | 0.074 | 0.059 | 0.059 | 0.031 |
| each `milestone-opener-*/stay-within` | ~0.90 | ~0.90 | **~0.90** | ~0.35 |

**`good` takes four of the six Tier-1 branches exactly zero times** — it is a stock-maximiser and those
four are stock-negative. It takes the other two because they are stock-neutral-to-positive, which is
why Tier 1's `good` delta is +0.016 rather than 0.
**`good` takes every opener's `stay-within` ~90% of the time**, because `best` scores it at 0.040
against `handle-it`'s 0.019. That is the entire Tier-2 `good` cost. It is not a modelling artifact; it
is that `stay-within` is already the stock-optimal pick and Tier 2 pays it more.

`virtueLoyal` never fires `milestone-opener-last` (declines the redshirt, so it never reaches
`seasonIndex 4`); `virtueAmbitious` never fires `-no-excuse` (takes the redshirt, which lands on
`seasonIndex 1`). Both are correct and are a useful check that the probe is playing real careers.

### 5.5 Recommendation

**Approve Tier 1. Put Tier 2 to the user as a separate yes/no with §5.3's table attached. Take none of
the unsure three this wave.**

Tier 1 is as close to free as a content change gets — +0.016 stock on `good`, 0.02% of that profile's
base — and it retires six one-way-down cards including the two the playtester and report 057
independently converged on. It passes the brief's `good` test by an enormous margin.

Tier 2 is the only thing on the table that moves the median career, and it is a genuine authorial
choice rather than a measurement: it takes `good`'s credit rate from 72.5% to 100%, which means a
player who never thinks about the locker room once would start getting told he has standing every
September. **That may be right — the openers are the game's most-played beat and they currently charge
−2 for nerves and pay nothing for poise — but it is not "a change a good player should not notice."**
A user who wants the openers fixed without that side effect has a cleaner option this lane can name but
was not asked to price: **remove the −2 from `handle-it`'s failure outcome** instead of adding a credit
to `stay-within`. That makes the openers silent-both-ways rather than one-way-down, costs the virtue
profiles nothing, and does not pay anybody for being calm. It is a different shape of fix and it
deserves its own brief.

---

## 6. Relation to report 057 §6 R2 — superseded, with two corrections

R2 proposed six edits at an estimated **+0.17 draft stock**. This lane **keeps four, drops two, and
adds seven.**

| R2 row | Disposition | Reason |
|---|---|---|
| `wideopen-two-deep/bring-the-walkon-along` +1→+2 | **keep** (Tier 1 #1) | — |
| `the-holding-call/own-it` +1→+2 | **keep** (Tier 1 #3) | — |
| `trash-talk/stay-quiet` +1→+2 | **keep** (Tier 1 #4) | — |
| `offseason-captain-vote/let-the-work-speak` 0→+2 | **keep** (Tier 1 #2) | — |
| `targeting-review/pull-up-at-the-last-second` +1→+2 | **moved to unsure** | Closest thing in the corpus to rule-compliance, and unlike its two siblings the prose grants no recognition. Not dropped — surfaced for the user (§2.3). |
| `playing-through-the-hand/play-through-it` 0→+2 | **dropped** | **It does not fix the finding.** `playing-through-the-hand` is *not* one of the 27: its only charge is −1 (`sit-and-let-the-backup-go`), which the floor of 2 already silences. The card is silent both ways, not one-way-down. Raising the other branch to +2 would make it one-way-**up** — the mirror defect. |

Added: `the-roughing-call/dial-it-back`, `asked-to-block/buy-in`, and the five openers. The first two
are structurally identical to rows R2 kept and were simply missed; the openers are the largest lever on
DECISION 084 and R2 did not consider them.

**Two corrections to 057's own numbers, both measured on 3,300 careers with R2's exact six:**

| | 057 §6 claim | measured here |
|---|---|---|
| `virtueLoyal` draft stock | +0.17 | **+0.131 ± 0.0059** (≈23% lower) |
| `virtueAmbitious` draft stock | +0.17 | **+0.140 ± 0.0060** |
| `good` draft stock | "**exactly 0.00** … by construction" | **+0.008 ± 0.0016** |

The stock gap is because 057 converted character points at a flat 0.15 and did not account for
`deriveDraftStock`'s integer rounding and its clamp at 100. The `good` figure is a straightforward
error: 057 asserted the `good` profile takes none of R2's six branches; it takes
`targeting-review/pull-up-at-the-last-second` in **6.4%** of careers. Both corrections are small and
neither changes 057's recommendation — but 057 stated "exactly 0.00 … by construction" as a fact, and
it is not one.

---

## 7. Limitations — the figures are modelled, not observed

Report 057's limitation 4 is the same issue and stated it honestly; this follows it, and closes part of
it.

1. **The probe cannot edit content and does not.** It replays real careers and adds the proposed
   character delta on top of the outcome the engine actually produced. No figure here was produced by a
   build with the edit in it. **The only way to confirm these numbers is to make the edit and re-run
   this probe with an empty proposal**, which is one command.
2. **What the model provably does not capture: the `maxCharacter` gates.** Nine cards carry a
   `maxCharacter` condition (five `offfield-*` at 55, four `bust-*` at 20–35). Raising a career's
   character makes those cards *less* likely to be offered. Every figure here therefore understates the
   change slightly for careers near those thresholds. Direction is known, size is not measured: it
   matters most for `baselineRandom` (4.88% bust) and is near-irrelevant for the virtue profiles.
3. **Policy re-selection: closed for ten rows of eleven, open for one, and named.** 057 had to assume
   "the take counts carry over". This lane tests it: for every proposed row, both the `virtue` and the
   `best` scorers are re-evaluated with the edit applied. **`virtue` never changes its pick. `best`
   changes its pick on exactly one card — `trash-talk`, where `stay-quiet` scores 0.150 against
   `let-it-fuel-you`'s 0.160 at HEAD and 0.300 after.** A margin of one hundredth of a draft-stock
   point. So **the `good` profile's Tier-1 cost is understated**: it would begin taking `stay-quiet`,
   which it currently never does. The size is small (`good` meets `trash-talk` in ~6% of careers and
   the swing is fractions of a stock point) but it is real, and the flip set is **pinned in a test** so
   a future content change that adds or removes one fails rather than silently invalidating this §.
4. **The bust rate cannot move by construction** and is reported only to show it does not. See §5.1.
5. **`homeState` is fixed at `TX`** across every career, as in `rung-probe`, `virtue-probe` and
   `spared-card-probe`. Region determines the Signing Day school pool, so `wideopen-two-deep`'s fire
   rate in particular is stated for that fixture.
6. **The virtue policies take the highest-character branch every time.** A human takes the good branch
   some fraction of the time, so every fire rate in §5.4 is an **upper bound** on a real player's, and
   every credit figure is correspondingly an upper bound.
7. **"The branch a decent person takes" is a judgement, not a measurement**, and so is the two-clause
   test in §2.2. Both are stated explicitly and per-card so a reader who disagrees can see exactly where
   the disagreement starts. The clearest place to disagree is §2.2's two PM candidates.
8. **B79 interaction.** Several of the credited cards carry `requiresPlaying`, which does not currently
   know about injury or suspension. Fixing B79 would reduce their fire rates and therefore the price.

---

## 8. The counter-case — the strongest argument for shipping nothing

Stated at its best, because it is good.

**A game in which restraint is unscored and transgression is punished is a coherent authorial position,
and it is the position the corpus actually holds.** `offfield.ts` states the convention outright: the
corrosive option charges character on the branch you take. `effects: []` on *"Stay in and get the
rest"* is not an oversight — it is the author writing *nothing happened*, because nothing did. **A
locker room does not hand out credit for making curfew.** It notices when you don't. That asymmetry is
not a bug in the fiction; it is the most accurate thing the fiction says. Every adult who has been in
an institution recognises it: standing is slow to earn, fast to lose, and almost never awarded for
compliance. The corpus's 3:2 charge-to-credit ratio may be the most honest number in the game.

**The playtester never said the game was wrong.** They said the ladder read as inert and they stopped
tracking it around decision 12. That is a complaint about a *display* — about a widget that promised
movement it never delivered — and DECISION 084's own reasoning concedes the point in the other
direction when it refuses `80/67`: a prepared remedy is owed a check that it points at the thing that
fired it. **A credit pack is a content change offered in answer to a UI complaint**, and the board has
already been burned once this month by exactly that mismatch. The cheaper and more honest response may
be to stop showing a ladder the corpus cannot move, or to show it as what it is — a thing you mostly
protect rather than climb.

**And there is a real cost to being wrong.** Once `character` pays for restraint, its meaning changes
permanently, and the failure mode is not a balance number: it is a currency that comes to mean *"avoided
doing a bad thing."* §2.2 holds thirteen cards back from exactly that, but thirteen judgements made by
one reader in one afternoon is a thin wall. **A currency can be recalibrated in a wave; it cannot be
un-cheapened.** `bands.ts` has now been recalibrated twice; the corpus has never been edited for this,
and there is a reason the freeze exists.

**The strongest single form of the argument:** DECISION 084's finding is that the corpus has an
authored shape. The lane that discovered it has proposed changing it. Nobody has yet asked the author
whether the shape was intended, and **the person who can answer that is the user reading this report.**
That question is worth more than any number in §5.

---

## 9. What I added, and verification

**Added — two files, both new, nothing else touched:**

- `src/sim/credit-proposal-probe.ts` — the proposal tables (`TIER_1`, `TIER_2`, `UNSURE`, `PROPOSALS`),
  the corpus census (`censusCorpus`), and the paired before/after career probe. CLI:
  `npx tsx src/sim/credit-proposal-probe.ts 550 virtueLoyal,virtueAmbitious,good,baselineRandom all b59`
- `src/sim/credit-proposal-probe.test.ts` — 47 tests. They pin: the two copied constants against
  `view-model.ts` and `draft.ts`; every proposal row's `from` against `src/content/**`; that every
  proposed magnitude is one the corpus already authors; DECISION 084's six census figures; that every
  proposed row sits on a card that is one-way-down today; that each tier retires exactly the cards it
  names and creates no one-way-**up** card; that `virtue` never re-selects and that `best`'s flip set is
  exactly `{trash-talk}`; and that an empty proposal is an exact identity.

**No existing probe was modified** (the brief forbids it) — the prose-match resolver and the floor
constant are duplicated, and both copies are asserted against their source in the test, which is the
convention `spared-card-probe` and `human-lazy-probe` already use.

**Verification run:**

| Check | Command | Result |
|---|---|---|
| Tests | `npm test` | **803 passed**, 44 files, at the point this lane finished its code (756 at HEAD + 47 added). A later re-run read **810 / 45 files**: lane 058 landed `src/ui/screens/career-screen.test.ts` (+7) on the shared tree mid-session. Green both times. |
| Typecheck, pass 1 | `npx tsc -p tsconfig.engine.json` | **exit 0** |
| Typecheck, both passes ×2 | `npm run typecheck` (twice) | **exit 0, exit 0** |
| Balance identity, seed A | `npx tsx src/sim/balance.ts 2000 random all` | **byte-identical to HEAD** (`md5 71acaf49853ee129c0668aa2f121dc5b`) |
| Balance identity, seed B | `npx tsx src/sim/balance.ts 2000 first all` | **byte-identical to HEAD** (`md5 9a63f3518203dd930ccb256082c6bb1f`) |
| Working tree | `git status --porcelain` | from this lane: only `?? src/sim/credit-proposal-probe.ts`, `?? src/sim/credit-proposal-probe.test.ts` and this report. **Nothing modified under `src/engine/**` or `src/content/**`.** The `M src/ui/screens/CareerScreen.tsx`, `M src/ui/styles/career.css` and `?? src/ui/screens/career-screen.test.ts` entries are lane 058's, untouched here. |

The balance comparison is a genuine A/B, not an assertion: HEAD was materialised with
`git archive HEAD | tar -x` into a scratch directory (no `checkout`, `restore` or `stash` was run at any
point) and both binaries were executed against their own trees. **Identity is the pass, and it passed
on both seeds.**

**One cross-lane note, reported rather than touched:** during this session
`src/ui/screens/CareerScreen.tsx` (lane 058's file, out of bounds for this lane) was transiently
failing the second typecheck pass — `Cannot find name 'locker'`, then `Cannot find name
'StandingLadder'`. It resolved on its own within a few minutes, and the final `npm run typecheck` runs
recorded above are both exit 0. Flagging it only so lane 058 knows its intermediate saves were briefly
red on a shared tree.
