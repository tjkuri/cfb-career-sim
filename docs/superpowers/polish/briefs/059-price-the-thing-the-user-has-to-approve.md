# 059 — Price the thing the user has to approve

**Type:** measurement + exact proposal. **No product code ships.** · **Wave:** 31 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Turn *"the corpus scores misbehaving and declines to score behaving"* from a finding into **a diff the
user can approve or reject in one sitting**, with its balance cost measured rather than estimated.

## Why

`src/content/**` is frozen: every fix for this defect is the user's call, not the team's. A user asked
to approve *"give the restraint branches a credit"* cannot answer, because that is a direction and not
a change. This lane produces the change — every line, priced — so the decision costs them one reading
and the implementation afterwards costs one commit.

**You are not authorised to edit content, and you must not.** Read DECISION 084 in
`docs/superpowers/polish/DECISIONS.md` first; it is the finding you are pricing.

## The measurement already done — verify it, do not trust it

The PM swept all 106 cards at HEAD and found, against the display floor of 2 (`LOCKER_ROOM_MIN_CHARACTER`
in `view-model.ts`):

- 204 authored options: **22 (10.8%)** can earn a locker-room credit, **48 (23.5%)** can be charged,
  **136 (66.7%)** are silent both ways.
- **27 of 106 cards (25.5%)** can charge the player and can never credit him. The mirror set is **9**.
- Floor removed, it is still **21 of 106 (19.8%)** — so the asymmetry is authored, not a display artifact.

**Reproduce these numbers independently before building on them.** If you get different ones, that is
the finding and you should say so loudly — this board has twice shipped reasoning on a PM's arithmetic
that did not survive a second reader, and both times catching it saved a wave.

## What to produce

### 1. The candidate list — every restraint branch that should arguably pay

For each of the 27 one-way-down cards: the card, the branch a decent person takes, what it carries now
(often literally `effects: []`), and **whether it should pay at all.**

**Not every one should, and a list that says "all 27" is a list that has not been read.** Some
restraint is genuinely its own reward and crediting it would make the currency mean "avoided doing a
bad thing", which is not integrity. `offfield-bowl-curfew` / *"Stay in and get the rest"* and
`offfield-ghost-media` / *"Show up and answer the questions"* are the PM's two clearest candidates —
say whether you agree, with reasons, and name the ones you would leave alone.

Mark each row **credit / leave alone / unsure**, and put the unsure ones in their own short section for
the user rather than burying them.

### 2. The exact proposed diff

File, card id, option id, the current effects array, the proposed one. **Magnitudes are the decision:**
the floor is 2, so a `+1` is invisible and a `+2` is the smallest thing a player can be told about.
Justify every magnitude against the authored distribution — DECISION 077 established the corpus uses
integers `{1,2,3,4,5,6,8,9,10,12,13,20,23,32}` and that **49 of the 72 authored negative character
outcomes land in −1..−4**, so a credit should be sized against that, not invented.

**Report 057 §6 already proposes six such edits (R2), priced at +0.17 draft stock.** Your list should
**supersede or absorb** it, not duplicate it — say explicitly which of its six you keep, and why any
you drop are dropped.

### 3. The price

Using the probes in `src/sim/` — `spared-card-probe.ts` is the closest model, and reusing one beats
writing a harness — measure over **at least 3,000 careers per profile** for `virtueLoyal`,
`virtueAmbitious`, `good` and `baselineRandom`:

- draft stock, undrafted rate and bust rate, **before and after**, with standard errors;
- the credit rate and the **per-career median number of credits**, before and after;
- the share of the 27 one-way-down cards that stop being one-way.

**The acceptance criterion the user will be shown:** credit p50 ≥ 1 on `virtueLoyal`, and the `good`
profile's draft stock materially unmoved (that profile takes few of these branches, so a large move
there means the list is wrong).

**You cannot edit content to measure this.** Model the change in the probe — apply the proposed deltas
as data the probe adds on top of the real outcome, and **say plainly in the report that the figures are
modelled rather than observed**, plus what that cannot capture (policies may choose differently once
the effects change; report 057's limitation 4 is the same issue and states it honestly — follow it).

### 4. The counter-case, in its own section

The strongest argument for **doing nothing**, stated fairly. It exists: a game where restraint is
unscored and transgression is punished is a defensible authorial position about consequences, and the
playtester never said the game was *wrong* — they said it was inert. Give the user that reading at its
best, not a strawman.

## Hard constraints — design intent, not preferences

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names.
- `src/engine/**` and `src/content/**` are **frozen** and this lane may not edit either. Reading them
  is the entire job.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`.
- 756 tests stay green. Both typecheck passes exit 0.

## Files

**Yours:** `docs/superpowers/polish/reports/059-*.md`, and a **new** probe under `src/sim/` plus its
test if you need one.
**Out of bounds:** all of `src/ui/**` (lane 058 owns `CareerScreen.tsx` and `career.css` this wave),
`src/engine/**`, `src/content/**`, and the existing probes — do not modify them; take a parameter.

## Verify before reporting

- `npm test` green; `npm run typecheck` two passes, both exit 0.
- **Identity is the pass:** you change no product behaviour, so `npm run balance` must be
  **byte-identical** to HEAD on two seeds. Say what you ran.
- `git status` shows nothing modified under `src/engine/**`, `src/content/**`, `src/ui/**`.

**Do not commit.** Never `git checkout`, `restore`, or `stash`. **Never run a foreground command that
does not terminate** (`npm run dev` is already running — do not start one). If a tool call fails 3
times, stop and write up what you have.

**REPORT:** write to `docs/superpowers/polish/reports/059-price-the-thing-the-user-has-to-approve.md`.
Return to the PM **only**: status, **≤5 bullets**, and that path. Never the full findings.
Lead with: how many of the 27 you would credit and how many you would leave alone; the measured
draft-stock cost to each profile; and whether you reproduced the PM's corpus numbers.
