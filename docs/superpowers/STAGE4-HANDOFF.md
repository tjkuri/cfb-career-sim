# CFB Career Sim — Stage 4 Handoff

Read this first when starting **Stage 4 (balance pass)** in a fresh session. Stage 3 (content) is
now complete across all four sub-stages. Stage 4 tunes what 3a–3d built; it does not add content
unless a specific lever below calls for it.

Supersedes `STAGE3D-HANDOFF.md` (deleted — it described 3d, which is now done).

## Where things stand

- **Branch `stage-3d` is at `e0c5392`**, not yet merged to `main`. Merge it (or continue on it —
  your call) before or as part of starting Stage 4; nothing about Stage 4 requires the merge to
  happen first, but don't lose track of the fact that `main` is still at `a136352`, three stages
  behind.
- **264 tests pass (23 files), typecheck clean.** Verified 2026-08-09 on `e0c5392`:
  - `npm test` → 264 passing (23 files).
  - `npm run typecheck` → **two passes** (`tsc -p tsconfig.engine.json && tsc -p tsconfig.json`);
    both exit 0. The engine pass enforces no-Node-globals in `src/engine/**` + `src/content/**`.
  - `npm run play -- demo` → plays a career to a terminal state, prints JSON.
  - `npm run balance -- 500 random` → current baseline (measured, not copied):
    ```json
    {
      "runs": 500, "draftedRate": 0.992, "bustedRate": 0.008, "undraftedRate": 0.044,
      "round1Rate": 0.04, "avgSeasons": 3.108, "avgFinalCharacter": 53.324,
      "minFinalCharacter": 3, "characterP05": 32, "characterP25": 48,
      "charUnder55Rate": 0.456, "charUnder35Rate": 0.072,
      "avgFinalOverall": 73.644, "minFinalOverall": 54
    }
    ```
  - Independently re-derived from the same 500-seed run: **median final character = 56**, mean =
    53.324 (see "Mean vs. median" below — do not conflate them).
- Node is **v22.0.0 (< 22.6)** → CLI scripts run via `tsx`, not `node --experimental-strip-types`.
- **Durable ledger:** `.superpowers/sdd/progress.md` (git-ignored, on-disk) — the authoritative
  record of every stage. Trust it and `git log` over any recollection. The two stage-3d ledgers
  (`.superpowers/sdd/2026-08-08-phase2-stage3d-a-position-pile/progress.md` and
  `.../2026-08-08-phase2-stage3d-b-spiral/progress.md`) hold the full discovery record this
  handoff distills — read them if a backlog item below needs more context than fits here.

## What Stage 3d just shipped

Spec: `docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md`. Two plans, one
branch: **Plan A** (six parallel authors, one position slice each) then **Plan B** (the off-field
character spiral, tuned against the finished pool).

- **~72 new events** (17 → 89, counted directly from the files, not copied from a report):
  `qb.ts` +8, `oskill/ol/dl/dskill/k.ts` +10 each (**+58 position pile**), new `offfield.ts` with
  **10 band-1 events** (8 new + 2 moved in from `universal.ts`: `catfished`, `speeding-georgia`)
  and **5 band-2 events**, `universal.ts` +1 (the long injury).
- **Both of 3d's hard requirements are met, verified on `e0c5392`:**
  - `bustedRate` moved from a lifetime 0 to **0.008** at 500 careers — the `busted` terminal is now
    *naturally* reachable, not merely structurally reachable (it was structurally reachable since
    3c).
  - `bust-mri` now fires (~10/2000 measured mid-stage, up from 0/2000) because `the-knee`
    (`universal.ts`, conference phase, `requiresPlaying`) inflicts an `mcl`
    (`recoveryPhases: 3`) that survives into the offseason where `bust-mri`'s
    `requiresActiveInjury` gate matches. Locked by `src/engine/long-injury.test.ts`.
- **`positions.test.ts`** — a machine-checked content contract six independent authors were held
  to (≥8 events/bucket, own-position gating, phase quota, stat referencing, EV budget, no
  `recoveryPhases: 1` injuries, no `ending`). It has a real blind spot — see below.
- **`BalanceReport`** now reports the character distribution (`avgFinalCharacter`,
  `minFinalCharacter`, `characterP05`/`P25`, `charUnder55Rate`, `charUnder35Rate`,
  `avgFinalOverall`, `minFinalOverall`), not just outcome rates. This is the instrumentation Stage
  4 should read first when tuning anything on the character axis — `bustedRate` alone is a lagging,
  near-binary signal.

### Measurement notes — read before drawing conclusions from the numbers

**`round1Rate` fell across the stage: 0.116 → 0.052 (after Plan A) → 0.040 (after Plan B). This is
not a regression to chase.** The mechanism is pool dilution: exactly one `random` event fires per
phase, and Plan A added ~58 events (mostly on-field, EV-neutral-by-design) competing for that one
draw against the small set of overall-granting events that had been driving `round1Rate` up. The
Plan A gate (originally `round1Rate` within ±0.05 of 0.116) was deliberately relaxed by the human
partner after measurement showed the pile *deflated* the figure rather than inflating it, with no
content changed. Plan B's spiral then applied a second, smaller downward push via
`characterPart` in `deriveDraftStock` (character below 50 costs draft stock). If Stage 4 wants
`round1Rate` back up, the position pile's overall-EV budget (spec §5.3, "EV ≈ 0 to +0.5") is the
honest lever — not a sign something is broken.

**Mean vs. median for character — keep them distinct.** `avgFinalCharacter` is ~53 but the
**median is 56**, above the band-2 gate of 55 (independently re-measured this handoff, matching
the design goal in spec §4: "a typical career brushes the spiral without entering it"). The mean
is dragged down by a left-skewed tail (`minFinalCharacter: 3`). Mid-stage, a controller read the
mean (~53) as if it were the median and briefly concluded the design goal — "median career lands
just above 55" — had failed; measuring the actual median (56) showed it had not. **When judging
whether "a typical career" does something, use the median or `charUnder55Rate`, not
`avgFinalCharacter`.**

## Engine-level traps (not tuning items — latent bugs, fix or guard before content leans on them)

These bit real content during 3d and will bite Stage 4 or any future content author again if
unaddressed:

1. **A `deferred` effect queued from a postseason event can be silently dropped.**
   `state.pendingEffects` has exactly one drain, `tickPhaseStart`, and both declare paths
   (`enterOffseason` forcing `status = "declared"`, and the general career-end path) return before
   `autoProgress` reaches it. Measured at **~38% loss** on `offfield-exit-interview`'s redemption
   option before it was caught and fixed (`deferred` → `permanent`, commit `0ced2c9`) — 673 of 1774
   redemption picks over 3000 probed seeds kept the +9 character grant for zero cost. The fix
   addressed that one event; **the engine gap itself is still open.** Audit every `deferred` effect
   by the phase it's queued from, or drain `pendingEffects` on the declare path.
2. **Offseason `stat` and `snaps` effects write to the previous, already-resolved season.**
   `applyEffect` targets `seasons[seasons.length - 1]`, and during an offseason that's the season
   `enterOffseason` already consumed for development and already ran the washout check against.
   Semantically backwards for any author who doesn't know it. On offseason events, cost `overall`
   instead.
3. **`recoveryPhases: 1` injuries and `phases: 1` suspensions are mechanically inert.** Production
   for a phase runs before that phase's events fire, and the injury/suspension clears at the next
   phase boundary — it never sidelines anyone. `schema.ts` enforces `recoveryPhases >= 1`, one
   below the first value that does anything. Two live instances remain unfixed:
   `bust-drug-test`'s "Suspended two games" and `bust-arrest`'s `lawyer-up`, both `phases: 1` and
   therefore still free.
4. **`timing: "permanent"` and `timing: "immediate"` are applied identically for `overall`
   effects; only `deferred` differs** (`effects.ts:20-28`). All 58 new position-pile events choose
   between two values that behave the same. Either give them distinct behavior or stop
   distinguishing them in the schema/authoring guidance.

## The content contract's blind spot

`positions.test.ts` computes expected value over `overall` effects only — **never `stat`,
`character`, or `snaps`.** A real defect shipped through it: the K slice's `fieldGoals` (its award
stat) was a one-way ratchet — 7 of 8 on-field events offered a guaranteed, cost-free `fieldGoals
+1` at `probability: 1`, with no path where a cautious kicker loses field goals. This mattered
because K's season baseline (~15) sits exactly on the All-Conference threshold (15). Caught only by
human review, partially fixed (`6aecb93`: 5 of 7 free floors converted to character/points, 2 left
as sanctioned exceptions). **The same shape — no outcome ever reduces the bucket's award stat —
survives unaddressed in qb, oskill, dl, and dskill** (20 free `probability: 1` floors across the
pile; DL is worst, 3× `+1 sacks` at 14% of threshold each, and has the highest
`allConfRate` at 0.796). Suggested fix: add a "some outcome reduces the award stat" assertion to
`positions.test.ts` — it would have caught five of six slices at authoring time.

## What is unmeasured

**The balance harness hardcodes `position: "QB"`** (`src/sim/balance.ts:29`). Every number in this
document's baseline — and every number Stage 4 will look at by running `npm run balance` — is QB
only. **The other five position slices (oskill, ol, dl, dskill, k) have no committed aggregate
balance measurement at all.** The only per-position data that exists came from throwaway probe
scripts during Plan A and lives only in that stage's task reports, not in any committed test or
ledger entry. Three different sources feed the table below, none of them committed tooling: the
`Overall-EV mean` column is each slice's own author-reported EV, from
`.superpowers/sdd/2026-08-08-phase2-stage3d-a-position-pile/task-{2..7}-report.md`; `allConfRate`
is from the six-way per-position balance run in `.../task-8-report.md:57-63`; `Injury
exposure/event` and `Character drift/event` are from the whole-branch final review, recorded only
in `.superpowers/sdd/2026-08-08-phase2-stage3d-a-position-pile/progress.md`'s "STAGE-4 BACKLOG"
block, not in any task-N report:

| Bucket | Overall-EV mean (measured) | allConfRate | Injury exposure/event | Character drift/event |
|---|---|---|---|---|
| QB | +0.235 | 0.650 | 0 | +0.070 |
| OSKILL | +0.1925 | 0.512 | 0.053 | — |
| OL | +0.115 (post-fix) | 0.730 | 0 | −0.107 |
| DL | +0.135 | 0.796 | 0 | — |
| DSKILL | +0.1725 | 0.562 | 0.020 | — |
| K | +0.0175 (post-fix) | 0.492 | 0.025 | +0.257 |

Treat this table as directional, not verified — it was not re-derived for this handoff, only
copied from three separate sources in the position-pile ledger, and the brief for this handoff
explicitly does not require re-running it. **Consider parameterizing `runBalance` by position
before trusting any per-position conclusion**, and re-run OSKILL/OL/DL/DSKILL/K through the
harness before tuning any of them — none of the numbers above have a `balance.test.ts` gate behind
them the way QB's do.

## Tuning levers (spec §8.1, ordered — cheapest/safest first)

The knobs to reach for if `bustedRate` or the character distribution needs to move again:

**To increase downward pressure:**
1. **Band-2 gate threshold** — raise `maxCharacter: 55` toward 60–65 so more careers enter the
   band. Single number, largest effect, no content changes.
2. **Band-2 weight** — raise from 4. Increases draw share once inside the band without changing
   who enters.
3. **Band-1 character costs** — currently −4 (not the spec's original −5 to −7; see the doc-drift
   note below). Moves the median directly — use with care, this is the lever most likely to drag
   ordinary players into band 2.
4. **Redemption uptake** — add a fourth option to band-2 events (drops random-policy uptake from
   ~33% to 25%), or raise the redemption's field cost.
5. **Convert `catfished` and `speeding-georgia`** from their luck-shaped form to the band-1
   chosen-cost pattern (they still ship as originally authored in 3c).
6. **Band-1 event count** — currently 10 members; more events means more draw share against the
   position pile.
7. **The deferred `acl` emission** (spec §6) — never shipped, deliberately deferred out of 3d. The
   heaviest lever, and the one that also opens the `washoutSnapFloor` route to `busted`, which
   nothing currently produces. (Spec §6 also motivated this lever by claiming it would be needed to
   make `redshirtOffered`'s injury check fire — that claim is wrong; see "Corrected: the
   medical-redshirt clause is not dead" below. The `acl` is still the right lever for
   `washoutSnapFloor`, just not for that.) An `acl` on a low-probability postseason branch would
   span five phases and reach two offseasons. This is **the first thing to reach for if Stage 4
   needs more punishing content**, not a new mechanism.
8. **Bust-slice gates and weights** (`bust.ts`) — deliberately untouched since 3c; all six weights
   and ending probabilities are still feel-based guesses (3c §11).

**To decrease pressure:** invert levers 1–3. Note `characterPart` in `deriveDraftStock`
(`draft.ts`) is only `(character − 50) × 0.15` — character pressure costs at most ~7.5 draft stock,
so the spiral's effect on draft outcomes is inherently small; its main effect is on `bustedRate`.

**Also independently relevant:** the position pile's overall-EV budget (spec §5.3) is a lever on
`round1Rate` orthogonal to all of the above.

## Full Stage-4 backlog (ordered by value)

### From this stage (3d), highest value first

- **Engine traps** — see the dedicated section above; these are correctness bugs, address before
  more content is authored against these paths.
- **Contract blind spot** — see the dedicated section above; the fix is a `positions.test.ts`
  assertion, not a content change.
- **Award-stat one-way ratchet still live in qb/oskill/dl/dskill** — no outcome in those four
  slices ever reduces the bucket's award stat (20 free `probability: 1` floors total; DL worst,
  highest `allConfRate` at 0.796). Decide once for all six slices, not piecemeal.
- **Five of six position slices have no committed balance measurement** — parameterize
  `runBalance` by position (see "What is unmeasured" above) before trusting anything about them.
- **Injury exposure is uneven across the position pile**: OSKILL 0.053/event, K 0.025, DSKILL
  0.020, QB/OL/DL exactly 0. Shows up as OSKILL `undraftedRate` 0.068 + `bustedRate` 0.022 vs DL
  0.016/0 (measured mid-stage, QB-only harness caveat applies to the aggregate framing, per-slice
  numbers are from the throwaway probe).
- **Character drift by slice**: K +0.257/event vs OL −0.107/event — a 3.3-point spread in final
  character across a career, against the band-2 gate of 55. Plan B tuned only against QB's
  (+0.070/event).
- **`bustedRate` is already non-zero for OSKILL (0.022) and K (0.006) via the soft-washout path**,
  not via bust events — a second mechanism distinct from the character spiral. Worth understanding
  before treating `bustedRate` as a single-cause metric.
- **All-Conference rates run 0.49–0.80 across positions** (DL 0.796, OL 0.73, QB 0.65). Award
  thresholds sit at ~1 season of baseline production and the position pile's stat grants land on
  top — stat-axis inflation that `round1Rate` is blind to (an award is worth only 3 draft stock,
  once).
- **`phases: 1` suspensions are still free**: `bust-drug-test`'s "Suspended two games" and
  `bust-arrest`'s `lawyer-up` cost nothing (same mechanism as the `recoveryPhases: 1` trap above).
- **Agency spread**: DL/DSKILL/K give a real choice in 9 of 10 events; QB/OSKILL in 6 of 10.
- **All six position slices' `tier` gates are `[1,2]`; none is `[3,4]`** — blueblood careers draw a
  smaller conditional pool. Two bowl-game beats are gated to the programs least likely to reach a
  good bowl, which reads as backwards.
- **Near-duplicate beats across slices** (all-star bowl invite ×3, special-teams conscription ×3,
  and all 12 offseason position events share one shape). Position gating means no single player
  sees the duplicates, but a content audit would still find them repetitive.
- **DOC DRIFT**: spec §4 says band-1 character cost is "−5 to −7"; the shipped content (and the
  test enforcing it) uses −4 for 7 of 8 new band-1 events. Reconcile the spec text or accept −4 as
  the real number (Task 5's measurement found −4 is a deliberate, verified-correct setting — not a
  slip — so the likely fix is updating the spec's prose).
- **`charUnder55Rate`'s causal direction**: it understates "ever entered band 2" (not overstates
  "stuck in band 2") because the redemption path pulls players back out. Get this framing right
  before a future stage relies on it — Task 5's own report initially had it backwards.
- Both non-event `busted` paths remain unreached: `minFinalOverall` is 54–55 against
  `washoutOverallFloor: 45`; `washoutSnapFloor: 60` needs two consecutive near-zero-snap seasons,
  which nothing in the current content produces.
- **Corrected: the medical-redshirt clause is not dead.** Spec §13 (carried verbatim from a
  pre-3d ledger note, written before `the-knee`'s `mcl` existed) claims `redshirtOffered`'s injury
  check (`advance.ts:216`) "has never evaluated true." **That claim is false and is superseded by
  this handoff.** A 5,000-seed probe against `createCareer`/`advance` on `e0c5392` found the clause
  fires routinely: 2,192 of 7,646 redshirt offers had an active injury, including several
  (seeds 4950, 4974, 4978, 4994) where `classYear === "SR"` — decisive, since `SR` is not in the
  clause's class-year OR-branch, so only the injury check could have produced `true` there.
  Mechanism: inside `enterOffseason` (`advance.ts:170-208`), `raiseNextHubDecision` — and therefore
  `redshirtOffered` — runs immediately after `advancePhase` sets `phase = "offseason"`, which is
  **before** `tickPhaseStart` next runs (it only runs at the top of `autoProgress`'s loop, which
  `enterOffseason` returns out of first when it raises the redshirt decision). So any injury still
  alive at the *end* of the prior phase is visible to the hub check untouched — not just the
  stage's new conference-phase `mcl` (`recoveryPhases: 3`), but even a `postseason`-inflicted
  `ankle` (`recoveryPhases: 2`) reaches this check, since it only needs to survive one
  `tickPhaseStart` (at postseason entry, not at the offseason check itself) to still be active when
  the hub asks. The pre-3d note was wrong about reachability *and* about the reason. Nothing needs
  fixing here — this is a live path, not a bug — but any future content author should know the hub
  check and the offseason's own `tickPhaseStart` read the injury list at different, sequential
  points, so "does this injury reach the offseason" and "does this injury reach the offseason hub
  check" are different questions with different answers for the same `recoveryPhases` value.
- **Only six stats are read by anything**: `postseason.ts` reads exactly the six award/production
  stats (QB `passYards`, OSKILL `scrimmageYards`, OL `pancakes`, DL `sacks`, DSKILL `tackles`, K
  `fieldGoals`). The other eight — `ints`, `sacksAllowed`, `passTds`, `totalTds`, `receptions`,
  `tfls`, `points`, `gameWinners` — are pure flavor and affect nothing mechanically. Either wire
  them into something (a secondary award? a narrative-only log that's honestly labeled as such?)
  or explicitly accept them as flavor and stop treating "the stat moved" as a balance signal for
  them.
- Small tone/quality items, individually minor, listed for completeness (none block anything):
  phase-quota loop in `positions.test.ts` reports only the first failing phase per run;
  `burn-timeout` (QB) implies cross-event state the engine doesn't track; the QB slice leans
  drier/more on-field than the `catfished`/`speeding-georgia` off-field register, and OL's slice
  tone is drier/more procedural still (both accepted, not fixed); OSKILL has 4 of 10 events in a
  single-option "drama in the roll" shape, and its `weight-room-bet` ties a friendly bet's loss to
  an overall decrement; DSKILL has 8 of 10 events sharing one "risky vs. safe-floor" mechanical
  template (checked against `dl.ts` as precedent and held at Minor — DL shows the same ratio);
  `the-get-off` (DL) is the one "safe" option in its slice with no positive payoff at all
  (`character -1` only, no floor benefit), while `coverage-install`'s (DSKILL) floor option pays
  only `character +1`; `the-chip-shot` (K) is a forced single option whose `fieldGoals` worst case
  is 0, never negative; `offfield-training-table`'s `snaps` cost has no narrative tie to its
  "cutting a food line" framing; band-2 redemption prose across ol/qb/dl/k/offfield implies an
  immediate cost while several of the underlying effects are `deferred`; the long-injury unit test
  ("some content event inflicts an injury lasting >= 3 phases") doesn't check that the inflicting
  branch has `probability < 1` — it would pass even on an unreachable branch, though `the-knee`'s
  isn't one; `cart`'s (the-knee's other option) negative-outcome text signals the missed
  postseason less clearly than `walk-it-off`'s does; `runBalance` with `runs=0` yields
  `Infinity`/`NaN`/`undefined` in the character fields (inherited from the original brief, not
  exercised by any current caller); the OL slice's `the-blindside` and `guard-or-tackle` safe
  options are now EV-dominated by their risky counterparts post-fix — ratified as Minor by both
  controller and final review (better worst-case variance is a legitimate reason to still pick
  them, so no action required, but flag if Stage 4 changes OL's risky-branch variance).

### Still open from 3a/3b/3c (unresolved by 3d)

- **The 57-school ladder is still mechanically inert** — tier is the only load-bearing field, offer
  tier-composition is deterministic, `rngWeightedPick` takes one draw regardless of pool size.
  Ablation confirmed removing milestones reproduces the pre-3c baseline exactly. Don't audit the
  ladder itself; audit the milestones (below) if `round1Rate`/`draftedRate` need attention.
- **Milestone overall-EV vs. the development cap.** Three guaranteed fixed events per season each
  grant `overall: +2 permanent` (plus +2 Senior Day) — up to +6/season of guaranteed-EV overall
  against `devCap: 3`. Because fixed events fire unconditionally, that EV is income, not variance.
  This was the dominant lever behind the 3c-era `round1Rate` jump and is still live — the position
  pile diluted its relative weight in the draw pool but didn't touch the milestones themselves.
- Offer-set tier composition is deterministic; the levers on tier variety are `offerCount` and the
  `eligibleTiers` thresholds in `draft.ts:21-28`. Geography weights only pick *which school within a
  tier*. All 3b geography weights and `offerCount: 3` remain feel-based guesses, never measured.
- The six `bust.ts` events disagree on the survival-gate convention (`coast`/`fight-it`/
  `no-comment` cross their gates by a hair; `sulk` does not). All legal, but inconsistent.
  `bust-mri`'s two survival options (`rehab`, `play-through`) both move `overall` *downward* —
  confirmed still true on `e0c5392`.
- Redshirt roll-isolation test (`advance.test.ts`) depends on
  `sitSnapModifier × maxSnaps × 3 < snapsPerDevPoint` (today 30 < 180) — add a guard comment before
  Stage 4 tunes either constant, or the test can fail for an unrelated reason.
- Confirm SR medical-redshirts (offered when a senior carries an injury) are intended behavior.
  No longer a question of *whether* this happens — the "Corrected: the medical-redshirt clause is
  not dead" finding above confirms it does, empirically, on seeded data. The open question is
  purely whether it's the design's intent, not whether the path is live.
- Validate `positionMultiplier` completeness; range-check win-pct knobs
  (`tierBaseWinPct`/`winPctClamp`/`overallWinShiftPerPoint`).
- **Resolved by 3d, no longer open:** "character is close to a one-way ratchet" (8 of 9 positive
  grants were bust survivals) — band 2's redemption option is now the first positive character
  grant outside `bust.ts`, and "no washout floor on character" is now a live, exercised path
  (`charUnder35Rate` 0.072) rather than a theoretical gap.

## Key file pointers

- **Specs:** `docs/superpowers/specs/2026-08-02-phase2-content-engine-design.md` (master Phase-2),
  plus per-stage specs. `2026-08-08-phase2-stage3d-content-pile-design.md` §8 is the tuning-lever
  inventory this handoff draws from; its §13 is its own carried-forward list.
- **Plans:** `docs/superpowers/plans/` (one per stage/sub-stage).
- **Balance harness:** `src/sim/balance.ts` (`runBalance`, `BalanceReport`) — hardcodes `position:
  "QB"`, see "What is unmeasured" above. `src/sim/balance.test.ts` carries the `bustedRate > 0`
  gate and the round1Rate band.
- **Content:** `src/content/events/{qb,oskill,ol,dl,dskill,k,offfield,universal,bust,
  milestones,recruiting}.ts`. Contract: `src/content/schema.ts` (`validateContent`),
  `src/content/events/positions.test.ts` (position-slice contract — the blind spot lives here),
  `src/content/events/offfield.test.ts` (spiral contract), `src/content/events/index.test.ts`
  (barrel completeness).
- **Draft/development knobs:** `src/engine/draft.ts` (`deriveDraftStock:10`,
  `eligibleTiers:21-28`); `devCap`/`snapsPerDevPoint`/`washoutOverallFloor`/`washoutSnapFloor`
  are configured in `src/content/postseason.ts` and consumed in `src/engine/advance.ts`
  (`developmentDelta:166`, washout check `~186-190`).
- **Engine surfaces content uses:** `src/engine/select-event.ts` (fixed/random selection),
  `src/engine/advance.ts` (loop + hub, including the trap sites `advance.ts:216` and the
  postseason-fires-before-resolver ordering), `src/engine/effects.ts` (effect application,
  including `pendingEffects` and the `permanent`/`immediate` no-op), `src/engine/postseason.ts`
  (the six-stat resolver).
