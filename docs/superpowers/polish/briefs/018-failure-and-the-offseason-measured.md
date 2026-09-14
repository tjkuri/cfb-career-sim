# 018 — Can you lose, and is the offseason a decision? Measure, then propose numbers

**Type:** developer (measurement only) · **Wave:** 7 · **Status:** ready
**Repo:** `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Answer two questions with numbers, then write a proposal naming **specific values** for a balance
change. **You do not implement the change.** Stage 2 happens only after the user approves your
numbers.

## Why

A playtester played a career deliberately badly — skipped the install, ghosted the media twice, let
a relative handle the money, played hurt — declared after two seasons at **OVR 65 on a 5-7 record**,
and was drafted **Round 7, Pick 2**. Their words: *"I could not lose."* They had separately worked
out that transferring up every offseason is free overall, so *"the offseason stopped being a
decision."*

That is the named cause of a cold playtester refusing a third career. It is the single largest
remaining problem in the project and it is **not** an interface problem, which is why it needs
measurement rather than an opinion. Read `docs/superpowers/polish/DECISIONS.md` entry **029** — it
is the decision that authorises this work and it defines the two stages.

## The two questions

### Q1 — Is failure reachable, and what does it take?

- Write a **deliberately-bad policy** (the natural opposite of the existing ones: prefer the option
  a player trying to fail would pick). You will have to decide what "bad" means without a reward
  signal to lean on — **state your definition explicitly in the report**, because every number you
  produce is conditional on it. If a defensible alternative definition exists, run both.
- Measure the outcome distribution under it across all six positions and a few hundred careers
  each: drafted / undrafted / busted / washout rates, round distribution, final overall, seasons
  played.
- **The specific thing to explain:** the playtester declared after **two seasons**. Does declaring
  early dodge the failure paths entirely? Compare a bad policy that plays a full career against one
  that declares as soon as it can. If short careers are the loophole, say so — that reframes the
  whole item.
- Name the mechanisms that *can* end a career badly and report how often each actually fires under
  bad play. If a path exists in code but effectively never fires, that is a finding.

### Q2 — Is the offseason a decision?

- Measure the "transfer up every year" line against realistic alternatives: final overall, draft
  round, seasons played, anything else that separates them.
- **Quantify the claim.** How much overall does transferring up actually buy, per transfer and
  across a career? Is there any cost today at all?
- If transferring up is dominant, say by how much. If it is **not** dominant — if the playtester
  inferred a pattern from three careers that the distribution does not support — say that just as
  plainly. **Refuting this is as valuable as confirming it**; two of the eight claims in an earlier
  playtest were wrong as stated and catching that saved a wave.

## The proposal you write (this is the deliverable)

End the report with a numbered proposal the user can approve or reject line by line. For each
proposed change:

- the exact constant or rule, where it lives, and its value today
- the value you propose, and **the measurement that produced that number** — not a round figure
  chosen by eye
- the predicted effect on the distributions you measured
- what it costs: who it makes the game worse for, and what could go wrong

**Aim at the smallest change that makes failure reachable**, not at a difficulty overhaul. The
engine is finished and good; the likely failure mode here is a plausible idea applied at the wrong
magnitude. A player who plays well should not notice the change at all.

## Tools that already exist — read them before writing anything

- `src/sim/balance.ts` — `runBalance(runs, seedPrefix, policy, position, homeState)` already reports
  drafted / busted / **washout** / undrafted / round-1 rates, seasons, injuries, character
  percentiles and final overall. `npm run balance`.
- `src/sim/policies.ts` — `firstOptionPolicy`, `randomPolicy`. Your new policy goes here.
- `src/sim/play-headless.ts` — `playCareer(setup, seed, policy)`. `npm run play -- <seed> random`.
- `WASHOUT_REASONS` in the engine's index, and `src/engine/bust.ts` / `draft.ts` / `transfer.ts` are
  the code to *read* for mechanism.
- `docs/superpowers/STAGE4-HANDOFF.md` records earlier balance baselines — check whether yours are
  comparable before treating a difference as new.

## Files

**You may edit:** `src/sim/**` (new policies, a measurement script, their tests) and your report.
**Out of bounds — you may read, you may not edit:** `src/engine/**`, `src/content/**`,
`src/ui/**`, `docs/superpowers/polish/STATE.md`, `docs/superpowers/polish/DECISIONS.md`.

A playtester is playing the live app in a browser at the same time as you. **Do not touch any
`src/ui/**` file, do not touch `src/content/**`, do not run `npm run dev`, and do not open a
browser** — any of those changes the game under them and wastes their session.

## Constraints (hard — these are design intent, not preferences)

- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or
  `weight`, EV, or school trait names. Traits are meant to be discovered by replaying.
- `src/engine/**` and `src/content/**` are **frozen**. DECISION 029 lifts that freeze **only for
  stage 2, only for B18/B19, and only after the user approves your numbers.** In this brief you are
  stage 1. You write a proposal; you do not edit the engine.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **501 tests stay green. Both typecheck passes exit 0.** Verify before reporting.
- Aesthetic direction is fixed: dark theme, clean sans-serif, card-based, generous whitespace,
  minimal chrome, the decision and its options are the clear focal point.

## Verify before reporting

`npm test` (501 green) and `npm run typecheck` (**two** passes, both exit 0). No dev server, no
browser. Never run a foreground command that does not terminate on its own.

## Report

Write to `docs/superpowers/polish/reports/018-failure-and-the-offseason.md`.
Return to the PM **only**: status (done / blocked / needs-decision), **at most five bullets**, and
that path. Never the full findings. Lead with the answer to *"can you lose?"* in one sentence and a
number.
