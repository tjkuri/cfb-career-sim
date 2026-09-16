# 040 — Getting caught has to bite

**Type:** developer (content, under an explicit freeze lift) · **Wave:** 20 · **Status:** ready — dispatch now

Repo: `/Users/tkuri/Documents/personal_projects/cfb-career-sim`

## Goal

Finish what wave 19 started: make the off-field temptation cards **net-negative** in expected draft
stock, by raising the **character** cost on the branch where you get caught — not by removing the
upside on the branch where you get away with it.

## Why — read this before you touch anything

Wave 19 removed the `overall` gain from the caught branches. **It changed no behaviour.**
`reports/039-misbehaving-stops-paying.md` proved with the shipped `optionScore` that the `good`
policy makes the **identical pick on all 13 off-field cards** afterwards: expected stock fell
(`let-it-fly` +0.71→+0.29, `sell-them` +0.68→+0.12, `let-him-handle-it` +1.58→+1.02,
`take-the-money` +1.54→+1.12) but every one stayed **above the clean option's 0.00**.

**The reason is structural and it tells you where to aim.** Only **4** paired blocks sat on a caught
branch. **17 remain on the branch where you get away with it** — deliberately, because that upside is
what keeps the card a gamble instead of a strictly-dominated non-choice (DECISION 057's defect class).
So the positive branch is mostly intact, and the caught branch has to carry the whole correction.

**Read `reports/039-misbehaving-stops-paying.md` and `reports/037-does-the-game-count-what-you-do.md`
§2 first.** 039 has the per-option expected values you are trying to move and the method that
produced them.

## What to change

For each off-field temptation card whose selfish option still scores **above** its clean
alternative: **raise the `character` penalty on its `negativeOutcome` branch** until that option's
expected draft stock falls **below** the clean option's.

**This is a derivation, not a search.** The scorer is shipped and deterministic — `optionScore` in
`src/sim/policies.ts`, with `STOCK_WEIGHTS` (overall **1.4**/point, character **0.15**/point) — and
each option's outcome probabilities are authored in the content. **Compute the required penalty
per card from the arithmetic, state the computation in your report, then apply it.** Do not sweep a
range of values looking for one that produces a pleasing aggregate; that is the tuning this project
forbids, and the difference is that a derived number comes with its own justification.

**Round to a number a writer would choose** — these are authored character costs, not float
constants. If the derivation says 12.7, use 13 and say so.

**Expect the penalties to be large on some cards, and do not flinch from that.** `let-him-handle-it`
and `take-the-money` sit at +1.02 and +1.12 with a ~30% caught branch; correcting those needs tens of
character points. **That is the intended fiction** — getting caught in an NIL scandal *should* be
devastating to how the building sees you.

**Use the ladder deliberately.** Character surfaces to the player only as the locker-room band
(*"the staff trusts you"* → *"just a guy in the building"* → *"a problem they are managing"* →
*"the staff has stopped defending you"*). The 036 playtester named that ladder as **the only
mechanism in the game that made them want to change how they were playing.** A caught branch that
visibly drops the player a rung is this change working as intended, and is worth more than the
draft-stock arithmetic it is derived from.

## Then re-measure

Re-run the probe from `src/sim/human-lazy-probe.ts`, same shape as 039 — `good` vs `humanLazy`, per
position, on 037's seeds so the columns stay comparable.

**Report, per position:** undrafted %, round-1 %, median round, overall P50, All-American %,
All-Conference %, and **`good`'s median final character**.

## Acceptance — per position, and one criterion has been deliberately changed

1. **`good` stops cheating.** Its median final character rises out of the *"a problem they are
   managing"* band (41 today, unmoved by wave 19). **This is the criterion the wave exists to meet.**
   Report how many of the 13 cards flipped their pick, by name.
2. **A well-played career stays safe.** `good` undrafted stays **≤1%** at every position. This is the
   hard disqualifier — **if a well-played career starts failing, stop and report.**
3. **Round-1 rate is NOT a disqualifier this wave, and this is a deliberate change from brief 039.**
   `good`'s round-1 rate was partly purchased by misbehaving; removing the exploit is *expected* to
   lower it, and a clean player's number is the honest one. **Report it, per position, and do not
   protect it.** Flag it only if it collapses — a fall past roughly half of today's figure is worth
   stopping for, an ordinary decline is the point.
4. **The locker-room band distribution moves.** Report `good`'s and `humanLazy`'s band shares before
   and after. If `humanLazy` now bottoms out at *"the staff has stopped defending you"*, say so —
   that is the player-visible face of this change.

**If an acceptance test misses, stop and write it up.** Wave 19 missed, reported honestly, and that
report is the reason this brief exists and is correctly aimed. **A reported miss is a successful
outcome.**

## Constraints — HARD, do not violate

- **The freeze is lifted for this work and only this work:** the `negativeOutcome` `character` amounts
  on the off-field temptation cards in `src/content/events/offfield.ts`. **Do not touch the
  `positiveOutcome` branches** — that upside is the user's decision and it is what keeps these cards
  dilemmas. **Do not touch `STOCK_WEIGHTS` or anything in `src/engine/**`.** Repricing character
  globally was considered and rejected (DECISION 062); it re-opens DECISION 058's calibration.
- `overall` **is** shown as a number. `character` is **never** shown as a number, only as a band
  phrase. It swings draft stock ~±7.5 against overall's ~82; an integer would overstate it tenfold.
  **Your change makes character matter more; it does not make it displayable.**
- Never display: school tier or any badge implying it, `draftStock`, event `probability` or `weight`,
  EV, or school trait names.
- `src/ui/session/view-model.ts` is the only module allowed to read `GameState`. Do not bypass it.
- **Do not commit.** Never run `git checkout`, `git restore` or `git stash`. The PM commits.
- Never run a foreground command that does not terminate (`npm run dev` will hang you). If a tool call
  fails 3 times, stop that line of attack and write up what you have.

## Verify before reporting

`npm test` (**671** green at HEAD `2ed2f9c` — keep them green; re-baseline any assertion these
changes legitimately move and say which and why), `npm run typecheck` (both passes exit 0),
`npm run build`.

**Seed baselines move by construction** (DECISION 040 precedent). Record the new md5s with
`npx tsx src/sim/play-headless.ts <seed> random | md5` for seeds **24** and **77** — note that
`npm run play` prints npm's banner on stdout and will corrupt the hash, so use the `npx tsx` form.

**REPORT:** write findings to `docs/superpowers/polish/reports/040-getting-caught-has-to-bite.md`.
Return to the PM **only**: status, ≤5 bullets, and that path. **Never the full findings.**
Lead your bullets with `good`'s median character before and after, how many of the 13 cards flipped,
and any position where acceptance 1 or 2 missed.
