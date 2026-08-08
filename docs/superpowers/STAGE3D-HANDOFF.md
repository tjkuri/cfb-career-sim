# CFB Career Sim — Stage 3d Handoff

Read this first when starting **Stage 3d (the parallel flavor pile)** in a fresh session. It orients you and captures everything already locked, so you can go straight to designing the content.

Supersedes `STAGE3B-HANDOFF.md` (deleted — it described a scope that was re-cut mid-stream).

## Where things stand

- **`main` is at `04475f4`**, all merged, nothing in flight, working tree clean.
- **181 tests pass, typecheck clean.** Verify quickly:
  - `npm test` → 181 passing (20 files).
  - `npm run typecheck` → **two passes** (`tsc -p tsconfig.engine.json && tsc -p tsconfig.json`); both must exit 0. The engine pass enforces no-Node-globals in `src/engine/**` + `src/content/**`.
  - `npm run play -- demo` → plays a career to a terminal state, prints JSON.
  - `npm run balance -- 500 random` → Monte-Carlo summary. Current baseline: `draftedRate 1, bustedRate 0, undraftedRate 0.008, round1Rate 0.116, avgSeasons 3.11`.
- Node is **v22.0.0 (< 22.6)** → CLI scripts run via `tsx`, not `node --experimental-strip-types`.
- **Durable ledger:** `.superpowers/sdd/progress.md` (git-ignored, on-disk) — the authoritative record of every stage. Trust it and `git log` over any recollection.

## What just shipped (Stages 3b and 3c, both merged)

**Stage 3b — recruiting & geography engine prelude.** Spec: `specs/2026-08-07-phase2-stage3b-recruiting-geography-design.md`.
- Geographic pull now scales with tier (`homeStateBonus` 12/8/4/1, `regionBonus` 5/3/2/0.5 against `base: 1`) — small schools recruit their backyard, blue bloods recruit nationally.
- Recruiting offers are **generated once** into `state.pendingOptions` and sampled, mirroring transfers. Previously `recruitingOptions` was called twice per decision and would have resolved a choice against schools the player never saw once offers became sampled. `createCareer` now consumes rng and takes a defaulted `content` param. `bestSchoolInTier` is deleted.
- **`requiresFinalSeason`** condition — a redshirted player spends two seasons as `SR`, and no condition could tell them apart. Rule: `yearsUsed === eligibilityCap - 1`.

**Stage 3c — content foundation + mechanical content.** Spec: `specs/2026-08-07-phase2-stage3c-content-foundation-design.md`. **Read its §10 before designing 3d — it contains 3d's hard requirements.**
- **`requiresPlaying`** condition — gates a beat out of a redshirt sit season.
- **`events/` restructure** — `src/content/events/` with one slice per category behind a barrel, plus empty-but-wired stubs for every position. This is the infrastructure 3d consumes.
- **School ladder 10 → 57** (9 national contenders / 17 power conference / 18 Group of 5 / 13 FCS), full region × tier coverage.
- **The bust slice** — six vulnerability-gated `random` events. **The `busted` terminal is reachable end-to-end for the first time**, proven by `src/engine/bust.test.ts`.
- **Five `fixed` milestones** (Fall Camp, Season Opener, Rivalry Week, Senior Day, Bowl Season) + three injuries.

## What Stage 3d is

**The parallel flavor pile** — the large, genuinely parallelizable authoring push the whole architecture was built to make safe.

- **8–12 events per position bucket** — QB, OSKILL, OL, DL, DSKILL, K — each referencing its own stats from `POSITIONS`.
- **Plus the universal / off-field pool.**
- Target: **~70 events**, bringing the game to ~85 total.

The infrastructure is already waiting: each slice file exists, is exported, and is wired into the barrel, so **each author owns exactly one file and cannot collide with another**. `src/content/events/index.test.ts` fails if a slice goes missing from the barrel.

### 3d's hard requirements (not optional, from 3c spec §10)

1. **The off-field pool must make the bust spiral enterable.** `bustedRate` is currently **0** across 500 careers. The terminal is *structurally* reachable but not *naturally*: character starts at 70, the loosest bust gate is `maxCharacter: 35`, and total downward pressure in the game is one −6 (20% branch), one −4 (15% branch), and three milestone −2s — while **8 of the 9 positive character grants are bust survivals**. You need a realistic accumulation path from 70 down into the 30s across a career of bad choices, not one token event.
2. **Exit criterion: re-run `npm run balance -- 500 random` and confirm `bustedRate > 0`.** If it is still 0 when 3d completes, that is a blocking finding for 3d — not a Stage-4 tuning note.
3. **Emit at least one injury with `recoveryPhases >= 3`,** or `bust-mri` stays permanently dead. Its gate is `requiresActiveInjury` at `phase: "offseason"`, and every current injury has `recoveryPhases: 1`, so none survives into an offseason. This is a *different axis* from requirement 1 — fixing character pressure does nothing for it.

## The content contract (author against this; the validator catches mistakes)

Content is typed data validated at import (`validateContent` in `src/content/schema.ts`, run from `src/content/index.ts`, throws on any bad reference). **This is what makes bulk parallel authoring safe.**

- **`Event { id, kind:'fixed'|'random', phase, weight, conditions?, title, description, options[] }`**
  - `kind:'random'` → drawn by weight, **at most one per phase**. `kind:'fixed'` → **every matching one fires, every phase**, before the random draw.
  - `phase`: `'offseason'|'nonconf'|'conference'|'postseason'`.
  - `conditions?`: `position[]`, `minClass`, `tier[]`, `requiresInjury`, `requiresActiveInjury`, `requiresFinalSeason`, `requiresPlaying`, `maxCharacter`, `maxOverall`.
- **`Option { id, label, probability, positiveOutcome, negativeOutcome? }`** — `probability` splits the roll (`1` = deterministic, so the negative branch is unreachable).
- **`Effect`** union: `overall`(immediate/permanent/deferred), `character`, `stat`, `snaps`, `injury`, `suspension`, `trophy`, `award`, `moment`, `ending`.
- **Determinism/purity is sacrosanct:** no `Math.random`/`Date.now`/IO in `src/content/**` or `src/engine/**`.

### Mechanical traps that have already bitten

- **`recoveryPhases: 1` injuries and `phases: 1` suspensions are mechanically inert.** Production for a phase runs *before* that phase's events fire, and the injury clears at the next phase boundary — so it never sidelines anyone. 3c shipped this bug in Rivalry Week and fixing it moved `round1Rate` 0.154 → 0.116. Note `schema.ts` enforces `recoveryPhases >= 1`, one below the first value that does anything.
- **Postseason events fire before the resolver** (`advance.ts:277`), so a postseason `stat` effect feeds that season's record and awards, and an `injury` there can sideline the player for it.
- **Base production accrues before events** (`advance.ts:253`), so `stat` effects add on top rather than replacing.
- **Fixed events fire during a redshirt sit unless gated** with `requiresPlaying`.

### Authoring rules

- **Tone:** light, "silly + real-seeming" — the register of `catfished`, `speeding-georgia`, and the soccer reference's own pool (`giant_tattoo`, `tax_trouble`, `mysterious_substance`). **No mean-spirited or genuinely offensive content. No real player names.** School and conference names are public facts and fine.
- **Moments:** (1) a moment implying *first / only / last* may only come from an event gated to fire once; (2) a moment on a repeatable random event must read sensibly if it happens twice. `moments` is a chronological log, not a set — duplicates are structurally fine.
- **Single-option events are legitimate.** The soccer reference uses them widely (`club_crisis: ["stay_and_fight"]`); the drama is in the roll, not the branch.
- **Bust-style gating** (if you author anything with an `ending`): every event must offer at least one survival path that crosses its own gate; low-effort survivals may deliberately leave the player under it. **A survival grant must act on the axis its event is gated on.**

## Current content inventory

- **~17 events** across `src/content/events/`: `recruiting.ts` (1), `universal.ts` (3), `qb.ts` (2), `bust.ts` (6), `milestones.ts` (5). **`oskill.ts`, `ol.ts`, `dl.ts`, `dskill.ts`, `k.ts` are empty stubs awaiting 3d.**
- **57 schools** (`schools.ts`), **8 injuries** (`injuries.ts`), trophies `confTitle`/`cfpTitle`/`bowlWin`, awards `heisman`/`allAmerican`/`allConference`.
- **Positions** (`positions.ts`): QB `passYards`/`passTds`/`ints`; OSKILL `scrimmageYards`/`totalTds`/`receptions`; OL `pancakes`/`sacksAllowed`; DL `sacks`/`tfls`/`tackles`; DSKILL `tackles`/`ints`/`passBreakups`; K `fieldGoals`/`points`/`gameWinners`.

## Recommended flow

1. Verify green (`npm test`, `npm run typecheck`).
2. **`superpowers:brainstorming`** on the 3d content design. Much is locked (above); the open questions are per-bucket event shape, how the off-field pool delivers the character pressure requirement 1 demands, and whether ~70 events wants one plan or two.
3. **`superpowers:writing-plans`** → the 3d plan. Consider one task per slice so parallel dispatch maps cleanly onto tasks.
4. **`superpowers:subagent-driven-development`** to execute — this is the stage where parallel authoring finally pays off. Slices are append-only and collision-free by construction.
5. Then **Stage 4 (balance)** — the accumulated list below.

## Logged for Stage 4 (accumulated across 3a/3b/3c)

**Highest-value first:**

- **Milestone overall-EV vs the development cap.** Three guaranteed fixed events per season each grant `overall: +2 permanent` (plus +2 Senior Day) — up to **+6/season of guaranteed-EV overall against `devCap: 3`**. Because fixed events fire unconditionally, that EV is income, not variance. Round-1 rate went 7× when milestones landed. **This is the real lever.**
- **The 57-school ladder is mechanically inert** — school *tier* is the only load-bearing field, offer tier-composition is deterministic, and `rngWeightedPick` takes one draw regardless of pool size. Ablation confirmed removing milestones reproduces the pre-3c baseline exactly. Don't audit the ladder; audit the milestones.
- **Character is close to a one-way ratchet** — 8 of 9 positive grants are bust survivals. The *ratio* of upward to downward pressure decides whether the bust spiral is enterable. Measure it.
- **`phases: 1` suspensions are still free** — `bust-drug-test`'s "Suspended two games" and `bust-arrest`'s `lawyer-up` both cost nothing.
- **No washout floor on character** — a very-low-character player sits under every character gate indefinitely, diluted only by the random draw. Becomes live once 3d adds downward pressure.
- The six bust events disagree on the survival-gate convention (`coast`/`fight-it`/`no-comment` cross their gates by a hair; `sulk` does not). All legal, but inconsistent.
- `bust-mri`'s survivals move overall *downward*, toward the washout floor.
- Offer-set **tier composition is deterministic**; the levers on tier variety are `offerCount` and the `eligibleTiers` thresholds in `draft.ts:21-28`. Geography weights only pick *which school within a tier*.
- All 3b geography weights and `offerCount: 3` are feel-based guesses, never measured.
- K production threshold (15) borderline at baseline overall (~13–17 fieldGoals).
- `washoutSnapFloor` (60) likely unreachable given 3-phase snap accrual (~360–600/season) — consider a per-season fraction.
- Redshirt roll-isolation test (`advance.test.ts`) depends on `sitSnapModifier × maxSnaps × 3 < snapsPerDevPoint` (today 30 < 180) — add a guard before tuning those constants.
- Confirm SR medical-redshirts (offered when a senior carries an injury) are intended.
- Validate `positionMultiplier` completeness; range-check win-pct knobs.

## Key file pointers

- **Specs:** `specs/2026-08-02-phase2-content-engine-design.md` (master Phase-2), plus the per-stage specs. **3c's §10 is 3d's requirements.**
- **Plans:** `plans/` (one per stage).
- **Content to author into:** `src/content/events/{oskill,ol,dl,dskill,k,universal}.ts`.
- **The guardrail:** `src/content/schema.ts` (`validateContent`); `src/content/events/index.test.ts` (barrel completeness).
- **Engine surfaces content uses:** `src/engine/select-event.ts` (fixed/random selection), `src/engine/advance.ts` (loop + hub), `src/engine/effects.ts` (effect application), `src/engine/postseason.ts` (resolver).
