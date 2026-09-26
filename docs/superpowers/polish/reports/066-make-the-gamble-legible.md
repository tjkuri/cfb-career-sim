# 066 — Make the gamble legible. Batch 1, for approval

**Written by:** PM session 14 directly (the dispatched lane stalled twice under a throttled session)
**Status:** PROPOSAL. Nothing is applied. `src/content/**` is untouched.
**Protocol:** DECISION 090 — propose, user approves per batch, PM applies only what is approved.

**8 cards.** Five are the season openers, which fire once a season in 100% of careers. Two are the
cards the owner named by hand. The eighth is the cause of the repetition they felt, which turned out
to be a different card than expected.

**No effect changes in this batch.** Prose only — card `description`, option `label`, outcome
`description`. No probability, weight, EV or draft stock is stated or implied anywhere.

---

## The rule being applied

> **"the decisions should generally be in the form of A. play it safe or B. risk/reward"** — the owner

And the actionable half: **the risk and the reward must both be legible in the prose, without a
number.** The standard is the owner's own rewrite — *"he has little experience but that means hes going
to hunt whales"* — which names the risk and the reward in one clause.

**A finding that changes what these edits are:** on all five openers and both off-field cards, **the
mechanics are already a real gamble. Only the prose fails.** The openers trade more of the game against
looking unready; Family Business trades a real rating gain against a catastrophic loss. **So this batch
does not invent trades — it says out loud what the cards already do.** That is a smaller, safer change
than it looks.

---

## 1–5. The five season openers · `src/content/events/milestones.ts`

**Why these first:** they are `fixed`, fire **once a season in every career**, and **all five currently
share the identical label "Take care of business"** — so a four-season career reads that same phrase
four times. That is simultaneously the legibility defect the owner quoted and a repetition defect
nobody had catalogued.

**The trade these cards already implement**, per the authored rationale in `milestones.ts`:
`handle-it` claims more of the game and the room sees it when the nerves show; `stay-within` takes less
of the game but you did your job. **The labels carry none of that.** Each rewrite below makes the
existing trade legible and gives each season its own words.

### 1. `milestone-opener-first` — "The First One"

| Field | Current | Proposed |
|---|---|---|
| `description` | Everything until now was practice for this. Your hands are cold and it is seventy degrees. | Everything until now was practice for this. Your hands are cold and it is seventy degrees. More of it is yours if you go and take it — so is the film, if you are not ready. |
| `handle-it` label | Take care of business | **Go and take it** |
| `stay-within` label | Let the game come to you | **Let it come to you** |

*Buys:* the player can see that one option claims more of the game at the cost of exposure, and the
other takes what is offered.

### 2. `milestone-opener-no-excuse` — "No Longer New"

| Field | Current | Proposed |
|---|---|---|
| `description` | Last September the nerves were allowed. This year they are just nerves. | Last September the nerves were allowed. This year they are just nerves. You can take more of this one than you are handed, and being a step late is nobody's fault but yours now. |
| `handle-it` label | Take care of business | **Take more than you are handed** |
| `stay-within` label | Trust the work you put in | **Trust the work you put in** *(unchanged — it already names an action)* |

### 3. `milestone-opener-your-team` — "Your Team Now"

| Field | Current | Proposed |
|---|---|---|
| `description` | The young guys watch how you take the field now. You noticed in August. | The young guys watch how you take the field now. You noticed in August. Whatever you do on the first series, eleven people copy it. |
| `handle-it` label | Take care of business | **Set the tone on the first series** |
| `stay-within` label | Play it for the room | **Give them something safe to copy** |

*Buys:* the stake is the room, and it is legible on **both** branches rather than only on failure.

### 4. `milestone-opener-counting` — "You Start Counting"

| Field | Current | Proposed |
|---|---|---|
| `description` | More of these behind you now than ahead. You did that math in June. | More of these behind you now than ahead. You did that math in June. Chase everything and some of it will not be there; take only what is, and there may not be much to show. |
| `handle-it` label | Take care of business | **Leave nothing out there** |
| `stay-within` label | Take nothing that is not there | **Take only what is there** |

*Buys:* this is the one card where **both** options now carry a stated downside, which is the shape the
owner asked for.

### 5. `milestone-opener-last` — "The Last One"

| Field | Current | Proposed |
|---|---|---|
| `description` | Last one of these you get. Everybody in the building has mentioned it. Repeatedly. | Last one of these you get. Everybody in the building has mentioned it. Repeatedly. You can play it like it means something, or you can play it like a football game. |
| `handle-it` label | Take care of business | **Play it like it means something** |
| `stay-within` label | Let it be a football game | **Play it like a football game** |

*Buys:* the risk of the first option — sentiment getting in the way — is now on the card, and it is
already exactly what its failure branch describes.

---

## 6. `offfield-money-manager` — "Family Business" · `src/content/events/offfield.ts`

**The owner wrote this fix themselves.** The card's mechanics are a genuine high-variance bet — the good
branch hands you a rating gain, the bad branch is the largest single character loss in the corpus — and
the current description reads as pure comedy with no stake in it.

| Field | Current | Proposed |
|---|---|---|
| `description` | Your cousin wants to manage your NIL money. He has a business card now. He is very confident. | Your cousin wants to manage your NIL money. He has a business card now, no track record, and no interest in anything but the big swings. He is very confident. |

*Buys:* **no track record** is the risk and **only interested in the big swings** is the reward, in one
sentence, with no number — the owner's "hunt whales" rendered in the game's register. "He is very
confident" is kept because it is the best line on the card.

**Observation, NOT proposed here:** this card's good branch prints a success, hands `overall +2`, and
charges `character −4`, so the game congratulates you and docks your standing on the same card. That is
an effect-level question and is out of scope for a prose batch.

---

## 7. `offfield-ticket-hookup` — "The Ticket Hookup" · `src/content/events/offfield.ts`

The owner: *"what would even be the upside here? they cant just be 'kill a kid or say a prayer'."*
They are right — the card names the rule you would break and never names what you would get.

| Field | Current | Proposed |
|---|---|---|
| `description` | Every player gets a comp allotment for home games. A guy from your hometown offers real money for yours — well above face, and very much against the rules. | Every player gets a comp allotment for home games. A guy from your hometown offers real money for yours — well above face, and very much against the rules. It is more than your monthly check, and it would quietly solve two or three things. |
| `give-them-away` positive outcome | Less money, zero risk, and your family gets good seats. | Your mother sits on the forty and tells everybody within reach whose mother she is. The money would have been nice. |

*Buys:* the first change makes the upside concrete, so refusing is a decision instead of the only sane
read. **The second is the more important one:** the current line literally announces *"zero risk"* —
the prose equivalent of the display defect where a refusal renders "No change" in the loudest type.
**The safe option should cost something, and the player should feel it.**

---

## 8. `milestone-bowl-season` — "Bowl Season" — and this is the repetition the owner felt

**The repetition has a different cause than the brief assumed, and this is the finding.** The five
openers are already `seasonIndex`-partitioned, one per season, so they were never the repeat.
**`milestone-bowl-season` is `fixed` with no `seasonIndex` condition at all** — the *same card, same
title, same description, same two labels* fires in **every season of every career**. That is the
"I just saw this for the third time" the owner reported.

**And it is worse in the artifact the player keeps.** Its `prepare` branch pushes the moment
**"Carried the team through bowl season"**, which is why the owner's summary listed that one string in
**four of five seasons** while season 2 read *"A year with nothing to put on this list."*

**This one cannot be fixed by prose alone** — it needs the same treatment the openers already have:
**split into `seasonIndex`-gated variants**, each with its own description and its own moment string.
`EventConditions` already carries `seasonIndex`, so **no engine change is required**; it is new card
entries in `milestones.ts` of exactly the shape the openers use.

**I am not writing five variants blind in this batch.** It is the largest item here and it should be
approved in principle first. If you want it, the next batch is five Bowl Season variants with five
distinct moment strings.

---

## What I deliberately left alone

- **`hire-a-professional` / "Hire an actual financial advisor"** and the other genuinely-null restraint
  branches. A prior decision established that paying for private prudence turns `character` into a
  compliance score. These cards are fine; their siblings just needed a visible upside, which is what
  #6 and #7 do.
- **Every card whose options already name an action and a stake** — `Own it in the film session`,
  `Spend your reps teaching the walk-on behind you`, `Sell the comp tickets`. The defect is not
  corpus-wide and this batch should not pretend it is.
- **All effects.** Three looked wrong while reading and are noted as observations only.

## The one I am least sure about

**#5, "The Last One."** Its two proposed labels are close to a restatement of the card's own
description, which risks reading as the game telling you the answer. It is also the most emotionally
loaded of the five and the current wording may be doing something deliberate. **Start here if you only
want to change some of them.**
