# 050 — B72: can a player tell which option the locker room is watching?

**Type:** blind audit + measurement · **Wave:** 26 · **Status:** done
**Verdict: B72 REFUTED as stated. The audit found a different and sharper defect, and the brief's own
framing ("B62 is a legibility bug wearing a balance bug's clothes") is backwards on the evidence.**

Nothing in the repo was edited. Phase files live in the session scratchpad
(`phase1-blind.md`, `phase1-KEY.json`, `phase2-judgements.csv`, `phase3-scored.md`, `phase3b.md`,
`phase3c.md`); everything load-bearing from them is reproduced below, because the scratchpad does not
survive the session.

---

## 0. The one sentence

> **B72 is refuted: on a blind read of prompt + labels alone I flagged the 34 conflict cards as
> standing decisions 58.8% of the time against 46.2% on the unmarked controls — indistinguishable at
> n=60 (z≈0.98, p≈0.33), and pointing the *wrong way* for B72; the cards I could not read are the ones
> where nothing is at stake, and the cards where the most is at stake I read almost perfectly.**

---

## 1. Method, and that the blind held

The classification reproduced the brief's measurement exactly before anything was read:

```
multi-option events:                      88
character differentiates the options:     60
virtuous strictly worse on expected OVR:  34
not worse (controls):                     26
mean OVR gap on the 34:                   0.9118
```

`optionCharacterScore` (unmodified, from `src/sim/policies.ts`) picked the most-virtuous option;
expected OVR is the probability-weighted sum of `overall` effects on each branch. All 26 controls were
used, not the 10 the brief asked for — a bigger control group is strictly better and it cost nothing.

**Phase 1** wrote a 60-card deck, deterministically shuffled (mulberry32, seed 20500), containing only
`title`, `description` and the option `label`s. No effects, no probabilities, no ids, no outcome prose,
no group marking. The key was written to a separate file and not opened.

**Phase 2** recorded, for all 60 cards, before the key was opened: legibility (yes/no/ambiguous), the
option a "get drafted" player takes, the option I predicted the locker room rewards, and whether the cue
lives in the *label* or only in the *fiction*. Committed to disk before Phase 3 began.

**The blind is faithful to the real screen.** `CareerScreen.tsx:731-736` renders each option as a bare
`<button>` carrying `o.label` and nothing else, with a comment stating every option carries identical
emphasis on purpose. At decision time the player sees exactly what Phase 1 contained. This matters for
§5.

---

## 2. The headline result — hit rate versus control

```
                                                  THE 34            THE 26 CONTROLS
Q1 legible = yes                               20/34  (58.8%)      12/26  (46.2%)
Q1 legible = yes or ambiguous                  29/34  (85.3%)      20/26  (76.9%)
Q1 legible = no (read as pure football)         5/34  (14.7%)       6/26  (23.1%)
Q3 cue is in the LABEL (strong)                19/34  (55.9%)      14/26  (53.8%)
Q3 cue in the label incl. weak                 24/34  (70.6%)      15/26  (57.7%)
Q3 NO cue anywhere                              6/34  (17.6%)       8/26  (30.8%)
"Silent trap" (not legible + no label cue)      9/34  (26.5%)      10/26  (38.5%)
My draft-pick = actual best-OVR option         26/34  (76.5%)      21/26  (80.8%)
Named the rewarded option correctly            25/34  (73.5%)      26/26 (100.0%)
```

Two-proportion z-tests at n=34/26: legibility z≈0.98 (p≈0.33), label-cue z≈0.16 (p≈0.87), silent-trap
z≈−0.99 (p≈0.32). **Three of the four legibility measures are flat, and every one of them that moves,
moves against B72** — the conflict cards read as *more* signposted than the controls, and carry *fewer*
silent traps. If B72 were right, the 34 should have been the ones I could not see. They were not.

The one measure that does separate — naming the rewarded option, 73.5% vs 100% (z≈−2.85, p≈0.004) — is
**confounded by construction and must not be quoted as evidence of anything.** On a control card the
character-positive option is also the OVR-best option, so the two cues point the same way and any
sensible read lands on it. The 100% is the definition of the control group talking, not a legibility
result.

---

## 3. What the blind actually found: the 34 are three different populations

Splitting the 34 by the size of the character swing — which is the only thing that decides whether the
card is a moral fork or set dressing — the picture separates completely:

| bucket | n | legible=yes | named rewarded option | mean OVR gap | mean net draft-stock delta of the virtuous option |
|---|---|---|---|---|---|
| **Moral fork** (character spread ≥ 3) | 12 | **11/12 (92%)** | **12/12 (100%)** | 1.62 | −0.83 (stock-**positive** on 7/12) |
| Mid (1.5–3) | 9 | 5/9 (56%) | 8/9 (89%) | 0.51 | −0.44 |
| **Flavour nudge** (< 1.5) | 13 | **4/13 (31%)** | **5/13 (38%)** | 0.53 | −0.72 |

**On the twelve cards where standing is genuinely on the table I read 11 correctly and named the
rewarded branch on all twelve, cold.** *Ghosting the Media*, *The Entourage*, *Bowl Trip Curfew*,
*The Exit Interview*, *The Portal Rumor*, *The NIL Deal Nobody Read*, *The Group Chat*, *Bed Check*,
*Skip the Install*, *The Ticket Hookup*, *The Team Banquet* — every one of them announces itself in the
label. "Sneak out after curfew." "Take the money and post." "Let them think you mean it." "Sell the comp
tickets." These are not ambushes. The content is doing its job.

The thirteen cards I could not read are the thirteen where the entire character swing is ≤1.5 points.
**One character point is 0.15 draft stock, against overall's 1.4.** Missing them costs a player
essentially nothing, and the reason they are illegible is that there is nothing in the fiction to read —
because there is nothing there.

**The magnitude of the loss B72 describes is inversely correlated with the difficulty of seeing it.**
That is the opposite of a legibility bug.

---

## 4. The finding nobody asked for, and the one I would act on: the effort inversion

Here is why my nine naming errors were not random. Seven of the nine ran in the **same direction**: I
picked the option that reads as *trying harder*, and the game rewards the option that reads as *doing
less*.

Across the 22 cards of the 34 with a character swing under 3, the character-rewarded branch is
systematically the lower-effort, more deferential, less tough one:

| card | the game rewards | the game charges OVR to |
|---|---|---|
| Senior Bowl Invite | "Decline and rest the injuries" (+1) | "Accept and practice all week" |
| Bowl Practice Reps | "Manage your reps and stay fresh" (+1) | "Go live on every rep" |
| Next Man Up | "Ask for a series off to get your legs back" (+0.8) | "Take every snap and do not come off" |
| Kickoff Duties Too | "Ask them to find someone else for kickoffs" (+1) | "Take both jobs and don't complain" |
| Bowl Season | "Enjoy the trip" (+0.6) | "Treat it like a playoff game" |
| Coverage Install | "Lean on the veterans to decode it" (+1) | "Memorize the whole manual" |
| New Holder | "Strip the operation down to basics" (+1) | "Drill the operation until it's automatic" |
| Travel With the No. 1 | "Take the help over the top" (+1) | "Lock him down man-to-man" |
| Iced | "Use the free rehearsal to reset" (+2) | "Keep the same routine, ice or no ice" |
| Bubble Screen Diet | "Take what's given" (+1.5) | "Push the staff for downfield shots" |

This directly contradicts the convention `offfield.ts` states in its own header and the six bust events
enforce — *"the corrosive option charges character on the branch you take."* On the off-field cards,
character tracks **integrity**. On the football cards, it has quietly come to track **humility and
self-care**, and those are not the same currency. A card cannot mean both and still teach a rule.

It also contradicts the model every human brings to a football career sim, and specifically the one the
014 playtester brought: *grind = standing*. On these cards the player's moral intuition is not merely
under-cued. **It is pointed backwards.** That is worse than invisible — and it is worth ±1 character, so
it is invisible, wrong, and worthless at the same time.

**`Kickoff Duties Too` is the reductio.** The label is literally `"Take both jobs and don't complain"` —
an explicit, authored, unmistakable standing cue, which I scored `legible=yes, cue=label, high
confidence` — and the game charges that branch and pays the player for asking to be let off. Any player
who reads the label correctly gets it wrong.

---

## 5. Why B72's mechanism cannot work, independent of the above

B72 says: *"a player steering by the visible signal would take the corrosive branch."* Two facts kill
the premise.

**(a) There is no visible signal at decision time.** The option button renders the label and nothing
else (`CareerScreen.tsx:731-736`), by explicit design. The player is not steering by a number; they are
steering by prose. "Strictly worse on the only number the game shows the player" describes a quantity
computed after the fact by `optionScore`, over authored `probability` fields the player is never shown
and the UI is forbidden to show.

**(b) On 26 of the 34, the gap is below the display resolution anyway.**

```
mean OVR gap, all 34:                                    0.91
 — the 4 three-option off-field cards:                   3.54
 — the other 30:                                         0.56
cards where the gap is < 1.0 expected OVR:              26/34
cards where the gap is < 0.5 expected OVR:              14/34
```

**The 0.91 headline is four cards wearing a corpus-wide costume.** Strip *The Portal Rumor* (4.10),
*The Entourage* (3.60), *The Exit Interview* (3.45) and *Bed Check* (3.00) and the remaining thirty
average 0.56 expected OVR — less than the integer the player is shown can render. A player cannot be
systematically steered by a difference smaller than one displayed point, because they never see it.

So the "34 of 60" measurement is a true statement about the **engine's optimum**, not about any
player-perceptible gradient. It measures a policy, not a person.

---

## 6. What the OVR-steering player is actually shown — and the real invisibility

`lockerRoomLine` (`CareerScreen.tsx:81-91`) prints "Cost you in the locker room." / "Earned you credit
in the locker room." / nothing, keyed on the sign of the character effect. Taking the best-OVR option on
each card produces:

```
                          THE 34            THE 26 CONTROLS
"Cost you..."          24/34 (70.6%)       7/26 (26.9%)
nothing printed        10/34 (29.4%)      10/26 (38.5%)
"Earned you credit"     0/34  (0.0%)       9/26 (34.6%)
```

**Zero. On the 34, an OVR-steering player can never be told they earned anything** — not because credit
is hidden, but because on those cards, by construction, the character-positive branch is never the
OVR-best one. The playtester's *"0 Earned, 5 Cost over four seasons"* is not evidence of an ambush. It is
the arithmetic signature of the classification itself. The tally the brief treats as 40× evidence for a
hypothesis is partly a tautology of how the set was drawn.

Of the 24 that do print "Cost", **I read 16 (66.7%) as legible standing decisions cold.** The 8 I
missed:

```
[MISSED] Bubble Screen Diet         −0.5  character
[MISSED] Scouts on the Sideline     −0.15
[MISSED] Next Man Up                −0.8
[MISSED] Bowl Season                −0.6
[MISSED] Targeting Review           −0.9
[MISSED] Trash Talk                 −0.8
[MISSED] Playing Through the Hand   −1.0
[MISSED] Family Business           −11.6   <-- the only real one
```

Seven of eight cost ≤1 character point = ≤0.15 draft stock. **`Family Business` is the single card in
the whole corpus where B72 is unambiguously true**: −11.6 character, the third-largest hit in the
bundle, on a card I rated only *ambiguous* — because the fiction has no locker room in it at all. It is
a cousin, a business card, and some money, and then the game prints a verdict about *the locker room*.
The audience the verdict names is not in the scene. One card. If B72 were the shape of the corpus, that
list would not be seven rounding errors and an outlier.

**And the genuinely invisible thing is the other column.** On 10 of the 34, taking the best-OVR option
prints *nothing at all* — no "Cost", no "Earned", no line:

- *Senior Bowl Invite*, *Iced*, *The Toe-Tap*, *Bowl Opt-Out*, *Bowl Practice Reps*, *Kickoff Duties
  Too*, *The Transfer QB*, *Travel With the No. 1*, *Coverage Install*, *New Holder*.

The player forgoes +1 to +2 character and is told nothing. **The invisible thing in this system is not a
hidden cost. It is a hidden forgone credit** — and you cannot learn a rule you are never shown missing.

---

## 7. Verdict

> **B72 is refuted as stated, and replaced.** A player *can* tell which option the locker room is
> watching wherever it materially is: on the 12 genuine moral forks I read 11/12 blind and named the
> rewarded branch 12/12, and the flag rate on the 34 (58.8%) is statistically identical to the unmarked
> controls (46.2%, p≈0.33). What the audit found instead is a **currency-meaning split**: on 22 of the
> 34 the character swing is under 3 points and rewards the *lower-effort* branch, inverting the
> convention `offfield.ts` states and the intuition every player brings — illegible, backwards, and
> worth ≤0.22 draft stock all at once.

**And the brief's framing is backwards.** "B62 is a legibility bug wearing a balance bug's clothes" —
the evidence says the reverse. The four cards carrying almost all the OVR cost (*Portal Rumor*,
*Entourage*, *Exit Interview*, *Bed Check*: gaps 3.00–4.10, net −2.7 draft stock on option C) are the
four I read **perfectly** — all `legible=yes`, all `cue=label`, all named correctly, all high
confidence. The player sees that fork completely, and is charged 3 overall for taking it anyway. That is
a balance bug wearing nothing at all, it is B62, and **no amount of display work will touch it.** The
content fix in flight on five cards is aimed at the right family of problem; it will not close the
complaint, but not for the reason B72 gives.

---

## 8. Remedies

All live inside the constraint: **no EV, no probability, no character number, ever.** Ranked by value
per unit of risk. `src/content/**` is frozen and `milestones.ts` is being authored this wave, so
everything touching content is a proposal only.

### R1 — Threshold the locker-room line. *(recommended; UI-only, 0 content files)*

`cardAccount` in `src/ui/session/view-model.ts:371` maps any non-zero character delta to
`direction(character)`. A −0.15 and a −13.4 print the identical sentence. Add a magnitude threshold
(≈±1.5 suggests itself from the bucket split in §3) below which no line prints.

- **Cost:** ~5 lines in `view-model.ts` — the only module allowed to read `GameState`, so this is in
  bounds. Zero content files. Touches **0 of the 34** in content; changes the printed verdict on ~13.
- **Why it is the right first move:** the line is currently read on 37.5% of resolved cards and means
  nothing on a third of those. Reserve it for the twelve cards where it is worth 0.5–3 draft stock and
  it becomes a fact instead of wallpaper — which is the stated intent in the `lockerRoomLine` docblock,
  not a new one.
- **It also cures the complaint directly.** The playtester's "5 Cost" is partly composed of −0.5s and
  −0.8s the player had no way to anticipate and no reason to care about. Stop printing those and the
  moral verdict stops arriving on cards that did not earn one.
- **Risk:** someone will read the drop in frequency as "the character system went quiet." It is not
  quieter; it is finally proportionate. Note this is corpus-wide, not scoped to the 60.

### R2 — Resolve the effort inversion in the character *model*, not the labels. *(content, proposal)*

The 22 sub-3 cards where +character rewards the lower-effort branch (§4) should either be rewritten so
character tracks integrity consistently, or have their character effects **deleted**. Deleting is
cheaper and, at ≤0.22 draft stock, costs the balance nothing.

- **Cost:** ~22 effect entries across `oskill.ts`, `dskill.ts`, `ol.ts`, `dl.ts`, `k.ts`, `qb.ts`,
  `season-life.ts`, `milestones.ts`. Touches **22 of the 34**. No prose rewrite needed for the delete
  variant.
- **Why:** this is the only remedy that makes the currency mean one thing. As long as character pays for
  "ask for a series off", every cue in every label is untrustworthy, and R3 cannot work.
- **Interacts with R1:** R1 hides this defect; R2 removes it. **Doing R1 alone is defensible for one
  wave and not for two** — it silences a contradiction rather than resolving it.
- **`Kickoff Duties Too` is the mandatory one** either way: an authored, explicit standing cue pointing
  at the charged branch is a bug no player can route around.

### R3 — Rewrite the one card where B72 is real. *(content, proposal, 1 card)*

`Family Business` (`offfield-money-manager`): −11.6 character on a card whose fiction contains no
audience. Either put the locker room in the scene (a teammate who got burned the same way; the
compliance office) or make the label carry it — "Let him handle it" gives no hint that anyone will ever
know. **The verdict line names an audience the card never introduced.**

- **Cost:** one description and one label in `offfield.ts`. Touches **1 of the 34**. Highest
  value-per-word in the entire audit.

### R4 — The four expensive off-field cards are a balance question, and should be re-opened as one. *(content, proposal)*

*Portal Rumor*, *Entourage*, *Exit Interview*, *Bed Check*: option C costs −3 overall for +6.5 to +7.2
character, netting −2.7 draft stock for taking the maximally right branch. These four carry 3.54 of the
0.91 corpus mean single-handed.

- **Cost:** four `overall` amounts. Touches **4 of the 34**.
- **This is the one place a player is genuinely punished for a choice they fully understood.** It is not
  a display problem and this brief is not the vehicle for it, but it is where the money is.

### R5 — The forgone-credit line. *(considered and NOT recommended)*

For the 10 cards that print nothing (§6), print the counterfactual direction only — that the other
branch was one the room would have noticed. No number, no EV, in bounds.

- **Cost:** ~20 lines across `view-model.ts` and `CareerScreen.tsx`. Touches 10 of the 34, 0 content.
- **Why I would hold it:** it teaches by regret, on cards worth ≤0.3 draft stock, and regret-after-the-
  fact is the exact mechanic that generated the original complaint. R1 + R2 make these cards stop
  mattering, which is better than making them louder. Listed for completeness, with a recommendation
  against.

---

## 9. What I would tell the next wave

1. **Do not spend a wave on legibility prose for the 34.** The blind says the signal is already there
   wherever it is worth anything, and adding warnings to cards worth 0.15 draft stock will make the
   corpus preachy without changing a single decision.
2. **The measurement that generated this brief should be re-run with a magnitude floor.** "60 events
   where character differentiates the options" counts a ±1 flavour nudge and a −13.4 moral fork as the
   same event. Every downstream number inherits that — including the 56.7% and the 0.91. With a ≥3
   character floor the finding becomes *"12 events, of which the virtuous option is worse on OVR on
   12, mean 1.62, and 4 of them account for most of it"* — a much smaller, much more actionable claim.
3. **The "0 Earned / 5 Cost" tally is partly a tautology.** On the 34, an OVR-optimising player earns
   credit on 0 of 34 *by the definition of the set*. Before treating that tally as 40× evidence for
   anything, check what the same policy scores on the other 26 — where it prints "Earned" 34.6% of the
   time. The playtester's experience is real; the inference drawn from it is not safe.
4. **The thing genuinely worth a brief is §4.** Two authored conventions for one currency, one of them
   undocumented and pointing away from the player's intuition, is a content-integrity problem that will
   keep producing bug reports under different names until it is named once.

---

## Appendix A — Phase 2 judgements scored against the key

`group` was concealed during Phases 1–2. `myVirt` is the option I predicted the locker room rewards;
`actVirt` is the truth. `gap` is expected-OVR advantage of the best alternative over the virtuous
option (negative means virtue is also OVR-best). `charSpread` is max−min expected character across the
options.

| # | title | group | legible | cue | myVirt | actVirt | hit | draftPick | bestOVR | gap | charSpread |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Ghosting the Media | CONFLICT | yes | label | B | B | Y | B | A | 0.6 | 6 |
| 2 | All-Star Practice Week | CONTROL | ambiguous | none | B | B | Y | A | A/B | 0 | 1 |
| 3 | Playoff or Bust | CONTROL | yes | label | B | B | Y | B | B | -0.4 | 0.6 |
| 4 | Bubble Screen Diet | CONFLICT | ambiguous | label-weak | A | A | Y | B | B | 0.5 | 1.5 |
| 5 | The Blindside | CONTROL | yes | label | A | A | Y | A | A | -0.3 | 1 |
| 6 | Senior Bowl Invite | CONFLICT | ambiguous | none | A | B | N | A | A | 0.2 | 1 |
| 7 | The Entourage | CONFLICT | yes | label | C | C | Y | C | A | 3.6 | 15.55 |
| 8 | Failed Drug Test | CONTROL | yes | label | A | A | Y | B | A/B | 0 | 6.6 |
| 9 | The Doghouse | CONTROL | yes | fiction | A | A | Y | A | A/B | 0 | 7.5 |
| 10 | Gap Discipline | CONTROL | ambiguous | label | B | B | Y | A | A/B | 0 | 1 |
| 11 | The Yips | CONTROL | no | none | B | B | Y | A | A/B | 0 | 2 |
| 12 | On the Sideline, On Camera | CONTROL | yes | label | C | C | Y | B | A/B/C | 0 | 16.7 |
| 13 | Bowl Trip Curfew | CONFLICT | yes | label | B | B | Y | B | A | 0.1 | 4.45 |
| 14 | The Exit Interview | CONFLICT | yes | label | C | C | Y | C | A | 3.45 | 16.75 |
| 15 | Iced | CONFLICT | no | none | A | B | N | A | A | 0.2 | 2 |
| 16 | Caught on the Sideline Camera | CONTROL | yes | label | A | A | Y | B | A/B | 0 | 1.4 |
| 17 | Asked to Block | CONTROL | yes | label | A | A | Y | B | A | -0.6 | 2.2 |
| 18 | The Portal Rumor | CONFLICT | yes | label | C | C | Y | A | A | 4.1 | 19.9 |
| 19 | The Toe-Tap | CONFLICT | yes | label | B | B | Y | A | A | 0.35 | 1.5 |
| 20 | 6 A.M. Lifts | CONTROL | ambiguous | label | A | A | Y | A | A | -2.75 | 4 |
| 21 | Bowl Opt-Out | CONFLICT | yes | fiction | B | B | Y | A | A | 0.05 | 1.3 |
| 22 | Bowl Practice Reps | CONFLICT | no | none | A | B | N | A | A | 0.4 | 1 |
| 23 | Cutting the Line | CONTROL | yes | label | B | B | Y | A | A/B | 0 | 4.5 |
| 24 | Scouts on the Sideline | CONFLICT | ambiguous | fiction | B | A | N | A | B | 0.65 | 0.15 |
| 25 | The Get-Off | CONTROL | no | none | A | A | Y | A | A | -0.4 | 1 |
| 26 | Next Man Up | CONFLICT | ambiguous | label-weak | A | B | N | A | A | 0.8 | 0.8 |
| 27 | The Position Switch | CONTROL | yes | label | A | A | Y | B | A | -0.2 | 1 |
| 28 | Up Forty at Halftime | CONFLICT | yes | label | A | A | Y | B | B | 0.6 | 2.5 |
| 29 | Kickoff Duties Too | CONFLICT | yes | label | A | B | N | A | A | 0.1 | 1 |
| 30 | The NIL Deal Nobody Read | CONFLICT | yes | label | B | B | Y | A | A | 1.4 | 13.1 |
| 31 | Bowl Season | CONFLICT | ambiguous | label-weak | A | B | N | A | A | 1.4 | 0.6 |
| 32 | The Group Chat | CONFLICT | yes | label | B | B | Y | A | A | 0.7 | 6.7 |
| 33 | Targeting Review | CONFLICT | ambiguous | fiction | B | B | Y | A | A | 0.2 | 1.9 |
| 34 | The Transfer QB | CONFLICT | yes | label | B | B | Y | A | A | 0.4 | 2 |
| 35 | Bulk Up or Slim Down | CONTROL | no | none | A | A | Y | A | A | -0.4 | 1 |
| 36 | Playing Through the Hand | CONFLICT | ambiguous | fiction | A | A | Y | A | B | 0.2 | 1 |
| 37 | The Two-Deep | CONFLICT | yes | label | B | B | Y | A | A | 1.6 | 1.9 |
| 38 | The Holding Call | CONFLICT | yes | label | A | A | Y | A | B | 0.35 | 0.95 |
| 39 | The Weight Room Bet | CONTROL | no | none | A | A | Y | A | A | -0.1 | 0.6 |
| 40 | You Got Catfished | CONTROL | ambiguous | none | A | A | Y | B | A/B | 0 | 0.4 |
| 41 | Booked at 3 A.M. | CONTROL | yes | label | A | A | Y | A | A/B | 0 | 3.6 |
| 42 | Family Business | CONFLICT | ambiguous | label-weak | B | B | Y | A | A | 1.2 | 11.6 |
| 43 | Saturday Night, Everybody Watching | CONTROL | no | none | A | A | Y | B | A | -1 | 0.35 |
| 44 | The Roughing Call | CONTROL | yes | label | B | B | Y | A | A/B | 0 | 2 |
| 45 | The Watch List | CONTROL | ambiguous | label-weak | A | A | Y | B | A | -0.9 | 2.7 |
| 46 | Trash Talk | CONFLICT | ambiguous | label-weak | B | B | Y | A | A | 0.2 | 1.8 |
| 47 | Bed Check | CONFLICT | yes | label | C | C | Y | B | A/B | 3 | 16.75 |
| 48 | Travel With the No. 1 | CONFLICT | no | none | B | B | Y | A | A | 0.65 | 1 |
| 49 | Skip the Install | CONFLICT | yes | label | B | B | Y | B | A | 0.3 | 4 |
| 50 | The Captain Vote | CONFLICT | yes | label | A | A | Y | B | B | 0.55 | 0.9 |
| 51 | Going Home for the Summer | CONTROL | ambiguous | fiction | A | A | Y | A | A | -0.9 | 0.9 |
| 52 | The Fake | CONTROL | no | none | B | B | Y | A | A/B | 0 | 1 |
| 53 | The Ticket Hookup | CONFLICT | yes | label | B | B | Y | A | A | 0.6 | 6 |
| 54 | Rivalry Week | CONTROL | ambiguous | fiction | A | A | Y | A | A | -1.2 | 2 |
| 55 | The Team Banquet | CONFLICT | yes | label | A | A | Y | B | B | 0.4 | 3.3 |
| 56 | Academic Probation | CONTROL | ambiguous | label | A | A | Y | B | A/B | 0 | 8.36 |
| 57 | Coverage Install | CONFLICT | no | none | A | B | N | A | A | 0.8 | 1 |
| 58 | The Five-Star Behind You | CONFLICT | yes | label | A | A | Y | B | B | 0.55 | 2.3 |
| 59 | The Carousel Comes for Your Staff | CONTROL | yes | label | A | A | Y | B | A | -0.65 | 1.95 |
| 60 | New Holder | CONFLICT | no | none | A | B | N | A | A | 0.8 | 1 |

## Appendix B — limitations

- **n=60 is small.** Every flat comparison in §2 has wide confidence intervals; the honest claim is
  "no detectable difference", not "proven identical". But B72 predicts a *large* difference in a
  *specific* direction, and the point estimates run the other way on three of four measures. That is
  enough to refute the hypothesis as posed.
- **One judge, one pass, no re-read.** The judgements are mine and were committed before the key was
  opened, which is the only guarantee available. A second agent running the same deck cold would
  strengthen §3 considerably and is cheap — the deck is reproducible from `phase1.ts` with seed 20500.
- **The control group is not a clean control for "naming the rewarded option"** (§2), by construction.
  It is a clean control for legibility and cue presence, which is what the brief asked it for.
- **Snapshot.** Taken with `src/content/**` unmodified; `src/sim/policies.ts` gained a `virtue` strategy
  from a concurrent agent mid-run, which does not touch `optionCharacterScore` or `optionScore` and so
  does not affect any number here. `milestone-bowl-season` is in the deck and `milestones.ts` is being
  authored this wave — if that card changes, re-derive.
- **Expected OVR ignores injury-mediated overall.** `effectScore` prices injuries at 0.25 of their
  overall delta because they heal; I used raw `overall` effects only, matching the brief's "the only
  number the game shows". This is why the reproduction matched 34/60 and 0.9118 exactly.
