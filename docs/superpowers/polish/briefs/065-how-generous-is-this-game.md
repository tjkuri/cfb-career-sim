# 065 — How generous is this game, and does anything know where you played?

**Type:** measurement only · **Wave:** 34 · **Status:** ready

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

**Goal:** the product owner played a career they described as *"pretty middling"* and finished with a
**Heisman, All-American, All-Conference, Bowl Win, OVR 96 and Round 1 Pick 12** — at **Incarnate Word →
Stephen F. Austin → North Texas.** Establish, in numbers, how typical that is and whether any award
condition knows what programme the player was at.

**You ship NO balance change and NO product code.** The user's ruling is *"investigate, don't change
yet."* `src/engine/**` and `src/content/**` are frozen and this decision does not lift that.

**Read first, and only this:** the section **"THE PRODUCT OWNER PLAYED IT"** in `STATE.md` and
`DECISIONS.md` **090**.

## The method that is now standard here, and it is better than modelling

**The engine takes `content` as a call-time parameter** — `createCareer(setup, seed, CONTENT)`,
`getDecision(s, CONTENT)`, `advance(s, choice, CONTENT)`, `makePolicy(profile, content)`. So you can
play **real careers** against a patched content object built inside `src/sim/` without touching a file
under `src/content/**`. **Prefer observed arms over modelled deltas**, and label every figure as one or
the other. `src/sim/route3-rung-probe.ts` is a worked example of the technique.

## What to measure

Per **profile** and per **position**, ≥3,000 careers each, identical seeds across any comparison:

1. **Award rates.** How often does a career take the Heisman, All-American, All-Conference, Bowl Win?
   **Report the rate for the whole population and split by profile** — a 40% Heisman rate on a
   stock-maximiser and 40% on a random player mean very different things.
2. **OVR growth.** The distribution of final overall, and the curve from the universal start of 60.
   **What fraction of careers finish at 90+?** The owner's hit **96**.
3. **Draft outcomes.** Distribution of round and pick. **What fraction go in round 1?**
4. **Does anything gate on programme tier?** This is the sharpest question. Resolve the award
   conditions **to source by hand** and state plainly whether tier appears in any of them. Then
   measure: **what is the Heisman rate for a career that never leaves tier 1–2, against one that
   reaches tier 3–4?** If those rates are equal, the award does not know where you played.
5. **Is "middling" actually middling?** The owner's career was, in their own judgement, unremarkable.
   Find where it sits: what percentile is a 96 OVR / round-1 / Heisman career? **If that outcome is
   near the median, the finding is that the game has almost no downside**, which is a different
   problem from the awards being loose.

## Context you need, and one trap

A prior lane established that **every career starts at `overall 60` / `character 70`**, that
`deriveDraftStock` therefore returns **exactly 31** for all 35 position × home-state pairs, and that
**tier 3/4 is unreachable at Signing Day** — big programmes are transfer-only. So the owner's
small-school path is not unusual; it may be the norm. **Check that and say so**, because if most
careers never leave tier 1–2 then "a Heisman at North Texas" is not an edge case, it is the default
story the game tells.

**The trap, and this board has been caught by it three times:** *a statistic measured on a
sub-population is not a corpus statistic*, and *when a claim is about what a player can experience the
denominator is careers, not cells.* Report denominators with every figure.

**Also note `good` is misnamed** — it is a draft-stock maximiser, not "a player who plays well."
Describe profiles by behaviour, not by name.

## Refuting this brief is a success condition

The framing above assumes the game is too generous. **It may not be** — the owner played one career and
may have had a good one, or may be a better player than the policies. If the numbers say the outcome
was a genuine outlier, **say so plainly**; that is a more useful result than confirming a worry.

## What to deliver

1. The tables above, with confidence intervals and denominators.
2. **A yes/no with evidence: does any award condition reference programme tier?**
3. **Where the owner's career sits in the distribution**, stated as a percentile.
4. **Options, not a decision.** If generosity is real, lay out the levers — award conditions, OVR
   growth rates, the draft stock curve — with the approximate cost of each, and **state which ones
   touch `src/engine/**` (frozen, needs the user) versus `src/content/**` (propose-then-approve).**
5. **Limitations**, and what would falsify your own conclusion.

## Hard constraints

- **No product code. New files under `src/sim/` and your report only.** Nothing under `src/engine/**`,
  `src/content/**`, or `src/ui/**` — the last is another lane's this wave.
- Because you ship nothing, **balance must be byte-identical to HEAD.** Confirm it and say so.
- Never display rules still apply to anything you propose for the UI.
- **Do not commit. Never `git checkout` / `restore` / `stash`.**
- **Do not run `npm run dev`.** Keep every command under ~7 minutes — chunk sweeps by arm or profile
  and write each chunk's numbers to the report as it lands. Agents have died to a 600s watchdog.
- **Write your report stub as your FIRST action** and append as you go.

## Verify before reporting

`npm test` (846 green plus what you add), `npm run typecheck` both passes exit 0, `git status` clean
outside `src/sim/` and your report. Paste the `git status` into the report.

**REPORT:** `docs/superpowers/polish/reports/065-how-generous-is-this-game.md`.
Return **only**: status, ≤5 bullets, that path. Lead with the Heisman rate and whether any award knows
the programme tier, then where the owner's career sits as a percentile.
