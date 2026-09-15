# 039 — Misbehaving stops paying, and the honour starts discriminating

**Type:** developer (content + engine, under an explicit freeze lift) · **Wave:** 19 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Implement two changes the user chose from measured options, then re-measure and report. **Do not
tune.** If the numbers miss, you stop and report — you do not adjust constants to hit a target.

## Why

A playtester played five seasons of deliberate sabotage, finished Round 4 with an All-American, and
wrote: *"I stopped believing the game is counting what I do."* `reports/037-does-the-game-count-what-you-do.md`
measured the cause. **Read §2, §4 and §7 of that report before you touch anything** — it is the
evidence base for both changes and it names the exact code sites.

Two facts from it you must not lose:

- All 14 character-loss/overall-gain blocks in `src/content/events/offfield.ts` are **net-positive
  draft stock** (one overall point = 9.33 character points). The `good` policy takes a
  character-losing branch on **9 of 13** cards and ends with median character **41**.
- All-American is a **flat 0.60 band from overall 85 to 99**, so the five-point gap between a good
  and a bad career buys **zero** extra probability.

## Change 1 — the off-field cards pay only when you get away with it

**The user's call, chosen over three alternatives.** In each of the 14 paired blocks in
`src/content/events/offfield.ts`, the `overall` gain currently appears on **both** the
`positiveOutcome` (you got away with it) and the `negativeOutcome` (you got caught). Compliance flags
the resale listing with your name in the metadata — and you gain a point of overall.

**Remove the `overall` gain from the `negativeOutcome` branches only. Leave the `positiveOutcome`
branches exactly as they are.** Leave every `character` amount alone, on both branches.

**Why this shape and not the obvious one.** Stripping the gain from both branches would make the
selfish option pure downside — a strictly-dominated non-choice, which is the exact defect class
DECISION 057 deleted the declare card to be rid of. The fiction (*"skipping the install buys you
training time"*) is sound; it is the price that is wrong. This keeps the card a gamble: get away with
it and you gain, get caught and you only pay.

**Expect this to change what `good` does** — it should stop taking those branches as reliably, and its
median character should rise out of *"a problem they are managing."* **That is the point of the
change**, and it is the headline you report.

## Change 2 — All-American discriminates above 85

**Also the user's call.** The `allAmerican` band table (037 §4 names the file and line) reads
`85→0.6, 80→0.3, 75→0.1`. Give it rungs so the honour reflects the rating — 037 §P3 suggests
`92→0.6, 88→0.4, 85→0.25, 80→0.12, 75→0.04` as a starting shape. **Heisman already demonstrates the
shape works; copy its idiom.**

**The trap, stated so you do not walk into it.** Per-position multipliers already make this award
scarce for some positions — **OL is ×0.15 and K is ×0.05.** Adding rungs lowers everyone's rate, and
it could take OL and K to effectively zero. **Measure every position separately and report each one.**
This project has been bitten three waves running by an aggregate that hid a per-position failure; do
not make it four.

## Then re-measure

Re-run the `humanLazy` probe from `src/sim/human-lazy-probe.ts` (committed, yours to use and extend),
same shape as 037 §3 — `good` vs `humanLazy`, per position, thousands of careers.

**Report, per position:** undrafted %, round-1 %, median round, overall P50, All-American %,
All-Conference %, and **median final character for `good`**.

## Acceptance — stated per position, on purpose

1. **A well-played career stays safe.** `good` undrafted stays **≤1%** at every position, and its
   round-1 rate does not fall materially. This is the hard disqualifier — **if a well-played career
   starts failing, stop and report.**
2. **`good` stops cheating.** Its median final character rises out of the *"a problem they are
   managing"* band. Report the before and after number.
3. **The honour discriminates.** A good career's All-American rate should now beat a bad one's by
   materially more than today's 72.2% vs 52.6%.
4. **Nothing is zeroed.** OL and K keep a non-trivial All-American rate. If either lands near zero,
   **stop and report** — do not fix it by tuning.

**If an acceptance test misses, you stop and write it up.** Constants are the user's to choose, not
yours to search. Reporting a miss is a successful outcome for this brief.

## Constraints — HARD, do not violate

- **The freeze is lifted for this work and only this work:** `src/content/events/offfield.ts`
  (change 1) and the `allAmerican` band table (change 2). **`src/engine/**` and `src/content/**` are
  otherwise frozen** — anything else you think needs changing is a written proposal, not an edit.
- **`npm run play` seed baselines will move by construction** — that is expected here, the DECISION
  040 precedent. Re-baseline whatever fixture pins them and say in your report that you did.
- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names. Traits are meant to be discovered by replaying, never stated.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **Do not commit.** Never run `git checkout`, `git restore` or `git stash`. The PM commits.
- Never run a foreground command that does not terminate (`npm run dev` will hang you). If a tool call
  fails 3 times, stop that line of attack and write up what you have.

## Verify before reporting

`npm test` (**671** green at HEAD — keep them green, and update any test that pins a number these
changes legitimately move, saying which and why), `npm run typecheck` (both passes exit 0),
`npm run build`.

**REPORT:** write findings to `docs/superpowers/polish/reports/039-misbehaving-stops-paying.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. **Never the full findings.**
Lead your bullets with `good`'s median character before and after, the `good` vs `humanLazy`
All-American gap, and any position where an acceptance test missed.
