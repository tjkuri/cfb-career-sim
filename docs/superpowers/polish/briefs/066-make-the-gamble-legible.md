# 066 — Make the gamble legible. First batch, proposal only

**Type:** content writer (PROPOSAL ONLY — you edit no files under `src/content/**`) · **Wave:** 34 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Read first, and only this:** the section **"THE PRODUCT OWNER PLAYED IT"** in `STATE.md`, and
`DECISIONS.md` **090**. Both are short. Do not read the rest of either file, or the reports.

## The principle, in the owner's own words

> **"the decisions should generally be in the form of A. play it safe or B. risk/reward"**

They played one career and could not tell what they were choosing between. Their examples:

- ***The First One*** (`milestone-opener-first`): **"Take care of business"** vs **"Let the game come
  to you"** — *"like wtf are even these options???"*
- ***The Ticket Hookup*** (`offfield-ticket-hookup`): sell the comps vs give them to family —
  *"what would even be the upside here? they cant just be 'kill a kid or say a prayer' there has to be
  a choice to be made"*
- ***Family Business*** (`offfield-money-manager`): and here they wrote the fix themselves, which is
  **the standard for this whole task** —

> *"your cousin wants to manage your NIL, he has little experience but that means hes going to hunt
> whales"*

**Study that sentence.** It names the risk (no experience) and the reward (he will swing big) in one
clause, in the game's voice, **with no number and no probability.** That is the target.

## The rule, stated so you can apply it card by card

**A player reading the card, before choosing, should be able to say what each option is trading.**
Not the odds — the *shape*. What do I stand to gain, and what am I putting at risk?

- **An option whose upside is invisible is not a choice, it is a formality.** *The Ticket Hookup* fails
  this: the money is real and against the rules, but nothing on the card tells you what the money is
  worth to you, so "give them to your family" is the only sane read.
- **An option that names neither an action nor a stake fails it too.** *"Take care of business"* is a
  mood, not a plan.
- **Do not make every card a dilemma.** Some cards are texture and should stay quiet. Say which ones
  you are deliberately leaving alone and why.

## Hard constraints — these are not negotiable and a cold agent will not know them

- **You edit NO files. This is a proposal.** Write exact before/after prose into your report. The PM
  applies what the user approves, per DECISION 090's propose-then-approve protocol.
- **Never state a probability, a weight, an expected value, or a draft-stock figure** — not in prose,
  not as "likely", "usually", "most of the time", or "a good chance". **The shape of the gamble is
  allowed; the odds are not.** This is the oldest rule on the project and the easiest one to break by
  accident while trying to be helpful.
- **Never name or imply school tier**, and never name a school trait.
- **`overall` may be referred to as a number; `character` may never be.** Do not write prose that
  implies a character score, a meter, or a count.
- **Do not propose effect changes in this batch.** Prose only — `description`, option `label`, and
  outcome `description`. Effects move balance and are priced separately. If a card's *effects* look
  wrong to you, note it in a separate section as an observation; do not fold it into the rewrite.
- Keep the existing voice. It is dry, concrete, present-tense, unsentimental, and it never explains the
  joke. **Read the cards around the one you are rewriting before you rewrite it.**

## Scope — a SMALL first batch, and small is deliberate

**The user approves batch by batch and an unreviewable batch will not get read.** Target **8–12 cards
maximum**, chosen for traffic and severity:

1. **The five `milestone-opener-*` cards** in `src/content/events/milestones.ts`. They are `fixed`,
   fire **once a season in 100% of careers**, and share the illegible `handle-it` / `stay-within`
   option pair the owner quoted. **These are the highest-traffic cards in the game and they are also
   item 2 below, so fixing them pays twice.**
2. **`offfield-ticket-hookup`** and **`offfield-money-manager`** in `src/content/events/offfield.ts` —
   both named by the owner, and the second has their own rewrite to work from.
3. **Two to four more of your own choosing**, found by reading for the defect rather than by being
   told. Say why you picked each.

**A note on the openers, because it is an argument and not a fact.** Their two branches were authored
deliberately — the rationale is in a long comment above them in `milestones.ts`, and it says
`stay-within` means *"you are the guy who did the job, and the room notices"* while `handle-it` means
taking the game on. **The intent is a real trade; the labels do not carry it.** So this is a wording
problem on top of a sound design, and your rewrite should make the existing trade legible rather than
invent a new one. **Read that comment before touching them.**

## Item 2 — the same five cards are also why the game feels repetitive

The owner saw *Bowl Season* three times and *Family Business* twice in one career, and their summary
screen listed **"Carried the team through bowl season" in four of five seasons** while season 2 read
*"A year with nothing to put on this list."*

Measured previously: five `milestone-*` events are **40% of a career** and fire in **100%** of them,
and the first verbatim repeat lands at **decision 13** in **99.3%** of careers.

**`EventConditions` already carries `seasonIndex`, `minOverall` and `requiresFinalSeason`, so
per-season and per-quality variants are authorable with NO engine change.** The five openers are
already `seasonIndex`-partitioned one per season — **so check what is actually repeating before you
propose variants**, and if the repetition the owner felt is coming from a *different* card
(`milestone-bowl` in `milestones.ts` is the Bowl Season one), say so and aim there instead.

**Propose variant prose for whichever cards genuinely repeat.** Same rule: exact before/after, no
effect changes.

## Refuting this brief is a success condition

If a card the brief names reads fine to you, **say so and leave it**. If the repetition has a different
cause than the one above, name it. Four of this board's best results came from an agent that found its
brief's premise wrong and fixed what was actually there.

## What to deliver

For every proposed change, in a table or block the user can read straight through:

- card id, option id, which field (`description` / `label` / outcome `description`)
- **the current text, verbatim**
- **the proposed text**
- **one line: what the change buys** — specifically, what the player can now tell that they could not
  before

Then: the cards you considered and deliberately left alone, with reasons; any effects that looked wrong
(as observations only); and **the one card you are least sure about**, so the user can start there.

## Process rules

- **Write your report stub as your FIRST action** and append as you go. A lane lost all its work to a
  600s watchdog kill by not doing this.
- **Do not run `npm run dev`** — it is already running on 5173 and never exits. Keep every command
  under ~7 minutes.
- **Do not commit. Never `git checkout` / `restore` / `stash`** — other lanes hold uncommitted work.
- `git status` must show **no modified files at all** when you finish. Your only new file is the report.

**REPORT:** `docs/superpowers/polish/reports/066-make-the-gamble-legible.md`.
Return **only**: status, ≤5 bullets, that path. Lead with how many cards you propose changing, then
what you found the real cause of the repetition to be, then the card you are least sure about.
