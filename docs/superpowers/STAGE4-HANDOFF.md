# CFB Career Sim — Stage 4 Handoff

Read this first when starting **Stage 4 (balance pass)** in a fresh session. Stage 3 (content) is
now complete across all four sub-stages. Stage 4 tunes what 3a–3d built; it does not add content
unless a specific lever below calls for it.

Supersedes `STAGE3D-HANDOFF.md` (deleted — it described 3d, which is now done).

## Where things stand

- **Branch `stage-3e` is at the tip of `stage-3e`, several commits ahead of `main`** (the handoff
  cannot cite its own commit hash, and a fix wave following the branch's final review adds more
  after this handoff — don't trust an exact count pinned here; run `git log main..stage-3e --oneline`
  for the real one) — not yet merged. `main` already carries Stage 3d's handoff plus Stage 3e's
  design and plan docs (`main` sits at `85dc003`, "docs: Stage 3e implementation plan") — it is no
  longer "three stages behind" the way an earlier version of this handoff said; only this stage's
  implementation/verification/fix-wave commits plus this handoff commit are unmerged. Merge before
  or as part of starting Stage 4;
  nothing about Stage 4 requires the merge first.
- **324 tests pass (24 files), typecheck clean.** (Up from 266/23 at Stage 3d's close — Stage 3e
  added a regression guard for the postseason-flush trap, structural invariants for all six
  position slices in `balance.test.ts`, and the award-stat-downside assertion in
  `positions.test.ts`.) Verified at the tip of `stage-3e`:
  - `npm test` → 324 passing (24 files).
  - `npm run typecheck` → **two passes** (`tsc -p tsconfig.engine.json && tsc -p tsconfig.json`);
    both exit 0. The engine pass enforces no-Node-globals in `src/engine/**` + `src/content/**`.
  - `npm run play -- demo` → plays a career to a terminal state, prints JSON (`status: "drafted"`
    on this run).
  - `npm run balance -- 500 random` → current QB baseline, re-measured after Stage 3e's correctness
    fixes (the `hamstring` `recoveryPhases` fix, the fall-camp `snaps` removal, and the career-end
    `flushPendingEffects` drain all shift the numbers slightly). **This is the new reference point —
    see "Measurement notes" below; don't try to reconcile it against the Stage 3d figure line by
    line:**
    ```json
    {
      "position": "QB", "runs": 500, "draftedRate": 0.99, "bustedRate": 0.01, "washoutRate": 0,
      "undraftedRate": 0.046, "round1Rate": 0.034, "allConfRate": 0.422, "avgSeasons": 3.104,
      "avgInjuries": 0.748, "injuredRate": 0.514, "avgFinalCharacter": 53.27,
      "minFinalCharacter": 0, "characterP05": 32, "characterP25": 48,
      "charUnder55Rate": 0.454, "charUnder35Rate": 0.074,
      "avgFinalOverall": 73.368, "minFinalOverall": 54
    }
    ```
    `bustedRate > 0` — the Stage 3d exit criterion — still holds (0.01, up from 0.008). `position`,
    `washoutRate`, `allConfRate`, `avgInjuries`, and `injuredRate` are new fields from Stage 3e's
    instrumentation work; see "Per-position balance table" below for the same command run across
    all six position slices.
- Node is **v22.0.0 (< 22.6)** → CLI scripts run via `tsx`, not `node --experimental-strip-types`.
- **Durable ledger:** `.superpowers/sdd/progress.md` (git-ignored, on-disk) — the authoritative
  record of every stage. Trust it and `git log` over any recollection. The two stage-3d ledgers
  (`.superpowers/sdd/2026-08-08-phase2-stage3d-a-position-pile/progress.md` and
  `.../2026-08-08-phase2-stage3d-b-spiral/progress.md`), plus this stage's
  `.superpowers/sdd/2026-08-14-stage3e/progress.md`, hold the full discovery record this handoff
  distills — read them if a backlog item below needs more context than fits here.

## What Stage 3d just shipped

Spec: `docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md`. Two plans, one
branch: **Plan A** (six parallel authors, one position slice each) then **Plan B** (the off-field
character spiral, tuned against the finished pool).

- **~72 new events** (17 → 89, counted directly from the files, not copied from a report):
  `qb.ts` +8, `oskill/ol/dl/dskill/k.ts` +10 each (**+58 position pile**), new `offfield.ts` with
  **10 band-1 events** (8 new + 2 moved in from `universal.ts`: `catfished`, `speeding-georgia`)
  and **5 band-2 events**, `universal.ts` +1 (the long injury).
- **Both of 3d's hard requirements are met** — but attribute this correctly; a whole-branch review
  disproved the obvious story by ablation:
  - `bustedRate` moved from a lifetime 0 to **0.008** at 500 careers — the `busted` terminal is now
    *naturally* reachable, not merely structurally reachable (it was structurally reachable since
    3c).
  - **`bustedRate` is NOT mainly a character-spiral effect. It is mainly `the-knee`.** At the
    gate's own seed prefix (`balance`, random policy, QB, n=500), 4 of the 500 careers bust, and
    **3 of those 4 are `Career-ending injury`** — i.e. `bust-mri`, which gates on
    `requiresActiveInjury` and has **no character gate at all**. `the-knee` (`universal.ts`,
    conference phase, `requiresPlaying`) inflicts an `mcl` (`recoveryPhases: 3`) that survives into
    the offseason where `bust-mri`'s gate matches — that's the whole mechanism, and it doesn't
    touch character. Locked by `src/engine/long-injury.test.ts`.
  - The character spiral is real and independently clears the exit criterion, just at a much
    smaller share. Ablation at n=2000, same seed prefix:

    | Content | bustedRate (n=2000) | Ending reasons |
    |---|---|---|
    | Full (this handoff's commit) | 0.008 | 14× `Career-ending injury`, 1× `Dismissed from the team`, 1× `Removed from the program` |
    | All 15 off-field events removed | 0.0115 | 23× `Career-ending injury` only |
    | `the-knee` removed, spiral intact | **0.001** | 1× dismissed, 1× ran out of rope |

    Both facts are true at once: the spiral alone clears the exit criterion (one career in 500
    with `the-knee` ablated), **and** `the-knee` carries roughly seven-eighths of the measured
    rate. Removing the spiral *raises* `bustedRate`, because the spiral dilutes `the-knee`'s
    conference-phase draw share — so don't read "spiral removed, rate went up" as the spiral being
    net-harmful either; it's pool dilution, the same mechanism as the `round1Rate` note below.
  - **Consequently: if you're tuning the spiral (levers 1–6 below), watch `charUnder35Rate`
    (0.072) and band-3 draw counts, not `bustedRate`.** `bustedRate` is dominated by a path — the
    long-injury → `bust-mri` chain — that none of those levers touch. This is also why Task 5's
    "flat across band-1 costs −3 to −4" result reads as a spiral property but is really this: the
    spiral was never bustedRate's main driver to begin with. And this generalizes beyond QB —
    `bustedRate` is already non-zero for OSKILL (0.022) and K (0.006) via a *third*, unrelated
    mechanism, the soft-washout path, not via bust events at all. Treat `bustedRate` as a
    multi-cause metric everywhere, not just here.
- **`positions.test.ts`** — a machine-checked content contract six independent authors were held
  to (≥8 events/bucket, own-position gating, phase quota, stat referencing, EV budget, no
  `recoveryPhases: 1` injuries, no `ending`). It has a real blind spot — see below.
- **`BalanceReport`** now reports the character distribution (`avgFinalCharacter`,
  `minFinalCharacter`, `characterP05`/`P25`, `charUnder55Rate`, `charUnder35Rate`,
  `avgFinalOverall`, `minFinalOverall`), not just outcome rates. This is the instrumentation Stage
  4 should read first when tuning anything on the character axis — `bustedRate` alone is a lagging,
  near-binary signal.

### Measurement notes — read before drawing conclusions from the numbers

**`round1Rate` fell across the stage: 0.116 → 0.052 (after Plan A) → 0.040 (after Plan B) → 0.034
(Stage 3e's re-measurement). This is not a regression to chase.** The mechanism is pool dilution:
exactly one `random` event fires per phase, and Plan A added ~58 events (mostly on-field,
EV-neutral-by-design) competing for that one draw against the small set of overall-granting events
that had been driving `round1Rate` up. The Plan A gate (originally `round1Rate` within ±0.05 of
0.116) was deliberately relaxed by the human partner after measurement showed the pile *deflated*
the figure rather than inflating it, with no content changed. Plan B's spiral then applied a
second, smaller downward push via `characterPart` in `deriveDraftStock` (character below 50 costs
draft stock). Stage 3e's small further drop (0.040 → 0.034) is consistent with the same mechanism,
not a new one — no content was added or removed on the round1Rate path this stage. If Stage 4 wants
`round1Rate` back up, the position pile's overall-EV budget (spec §5.3, "EV ≈ 0 to +0.5") is the
honest lever — not a sign something is broken.

**Mean vs. median for character — keep them distinct.** `avgFinalCharacter` is ~53 (53.27 at Stage
3e's close, next to Stage 3d's 53.32 — barely moved) but Stage 3d's independent re-derivation put
the **median at 56**, above the band-2 gate of 55, matching the design goal in spec §4: "a typical
career brushes the spiral without entering it." The median was not independently re-derived this
stage — the near-unchanged mean gives no reason to think the relationship flipped, but treat that
as inference, not a fresh measurement. The mean is dragged down by a left-skewed tail
(`minFinalCharacter: 0` at n=500 this run; 3 in Stage 3d's). Mid-stage in Stage 3d, a controller
read the mean (~53) as if it were the median and briefly concluded the design goal — "median
career lands just above 55" — had failed; measuring the actual median (56) showed it had not.
**When judging whether "a typical career" does something, use the median or `charUnder55Rate`, not
`avgFinalCharacter`.** This warning still applies at Stage 3e's numbers and is not superseded by
anything in this handoff.

## Engine-level traps (Stage 3e closed all four — kept here as history; the guards below are what
now prevent regressions)

These bit real content during 3d and would have bitten Stage 4 or any future content author again
if left unaddressed. All four are now closed:

1. **A `deferred` effect queued from a postseason event can be silently dropped.**
   `state.pendingEffects` has exactly one drain, `tickPhaseStart`, and both declare paths
   (`enterOffseason` forcing `status = "declared"`, and the general career-end path) return before
   `autoProgress` reaches it. Measured at **~38% loss** on `offfield-exit-interview`'s redemption
   option before it was caught and fixed (`deferred` → `permanent`, commit `0ced2c9`) — 673 of 1774
   redemption picks over 3000 probed seeds kept the +9 character grant for zero cost. The fix
   addressed that one event; **the engine gap itself is still open.** Audit every `deferred` effect
   by the phase it's queued from, or drain `pendingEffects` on the declare path.
   **CLOSED (Stage 3e, Task 1).** `flushPendingEffects` (`src/engine/effects.ts`) is called from
   `finalizeIfEnded` in `src/engine/advance.ts` on *every* terminal status, before
   `computeDraftResult` — so a career can no longer end with unresolved `pendingEffects`. The drain
   also covers a second orphan path the original write-up above didn't anticipate: an
   offseason-queued `deferred` effect that `enterOffseason` would otherwise drop when it forces
   `status = "declared"`. Regression guard: `src/engine/pending-flush.test.ts`.
2. **Offseason `stat` and `snaps` effects write to the previous, already-resolved season.**
   `applyEffect` targets `seasons[seasons.length - 1]`, and during an offseason that's the season
   `enterOffseason` already consumed for development and already ran the washout check against.
   Semantically backwards for any author who doesn't know it. On offseason events, cost `overall`
   instead.
   **CLOSED (Stage 3e, Task 5).** `validateContent` now rejects offseason-phase `stat`/`snaps`
   effects for *all* content, not just the six position slices `positions.test.ts` used to police.
   One live violation existed and was fixed: `milestone-fall-camp`'s `{ kind: "snaps", amount: 40 }`
   was removed.
3. **`recoveryPhases: 1` injuries and `phases: 1` suspensions are mechanically inert.** Production
   for a phase runs before that phase's events fire, and the injury/suspension clears at the next
   phase boundary — it never sidelines anyone. `schema.ts` enforces `recoveryPhases >= 1`, one
   below the first value that does anything. Three live instances remain unfixed:
   `bust-drug-test`'s "Suspended two games" (`bust.ts:108`), `bust-arrest`'s `lawyer-up`
   (`bust.ts:149`), and `speeding-georgia`'s one-game suspension (`offfield.ts`, moved into its
   own new file by this branch), all `phases: 1` and therefore still free.
   **CLOSED (Stage 3e, Task 5).** `validateContent` now rejects `recoveryPhases: 1` and `phases: 1`
   outright (`>= 2` required). Six live instances were fixed: three injuries (`hamstring`,
   `concussion`, `turfToe`) and three suspensions (`bust.ts` ×2 — `bust-drug-test` and
   `bust-arrest`'s `lawyer-up` — and `speeding-georgia` in `offfield.ts`, whose description was
   reworded from "One-game" to "Two-game" to match the corrected `phases: 2`).
4. **`timing: "permanent"` and `timing: "immediate"` are applied identically for `overall`
   effects; only `deferred` differs** (`effects.ts:20-28`). All 58 new position-pile events choose
   between two values that behave the same. Either give them distinct behavior or stop
   distinguishing them in the schema/authoring guidance.
   **CLOSED (Stage 3e, Task 2) — decided deliberately: collapsed.** `EffectTiming` is now
   `"immediate" | "deferred"`; `"permanent"` no longer exists anywhere in the codebase (66 sites
   rewritten to `"immediate"`, which is what `"permanent"` already behaved as).

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

**Stage 3e (Task 6): the assertion now exists.** `positions.test.ts` asserts, for all six slices,
that some reachable outcome reduces the bucket's award stat. It's gated by a named, shrink-only
allowlist: `KNOWN_NO_AWARD_STAT_DOWNSIDE = { QB, OSKILL, DL, DSKILL }`. A slice named in that list
asserts the property is **absent** (documenting the known gap rather than silently tolerating it);
an unlisted slice asserts the property is **present**. OL and K already carried downside content
before this branch (`cadence-trouble`/`guard-or-tackle` for OL; `kickoff-duties-too`/`iced` for K —
this branch authors no content, only the `permanent` → `immediate` rename touched either file) and
pass without change — that is why only four of the original six names remain on the list. The list
can only shrink: removing a
still-listed slice from `KNOWN_NO_AWARD_STAT_DOWNSIDE` without giving it real downside content is
what the test is designed to catch. **Stage 4 must, for each of QB, OSKILL, DL, and DSKILL, either
add downside content and drop it from the list, or explicitly ratify the gap and leave it named** —
this handoff does not decide that for you.

## Per-position balance table

**Stage 3d's version of this section was titled "What is unmeasured"** and carried a table
assembled from three separate throwaway-probe sources (author self-reports, a one-off six-way
run, and progress-log notes), none of them committed tooling, because **the balance harness
hardcoded `position: "QB"`** (`src/sim/balance.ts:35` at the time). **Stage 3e closed that gap
(Tasks 7-8): `runBalance(runs, seedPrefix, policy, position = "QB")` now takes a position, and
`balance.test.ts` asserts structural invariants for all six slices.** The table below replaces the
old one entirely and is the first per-position balance data this project has ever had behind a
single committed command.

Measured by `npm run balance -- 500 random all` at Stage 3e close. Reproducible — the seed prefix
is fixed at `balance`, so this command reproduces these rows exactly. The Stage 3d per-position
figures this replaces came from throwaway probe scripts.

| position | draftedRate | bustedRate | washoutRate | round1Rate | allConfRate | avgSeasons | avgInjuries | injuredRate | avgFinalCharacter | charUnder55Rate | avgFinalOverall |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QB | 0.990 | 0.010 | 0 | 0.034 | 0.422 | 3.104 | 0.748 | 0.514 | 53.27 | 0.454 | 73.368 |
| OSKILL | 0.984 | 0.016 | 0.004 | 0.014 | 0.388 | 3.090 | 1.044 | 0.632 | 53.416 | 0.450 | 72.234 |
| OL | 0.988 | 0.012 | 0 | 0.010 | 0.586 | 3.082 | 0.790 | 0.524 | 52.358 | 0.490 | 73.280 |
| DL | 0.990 | 0.010 | 0 | 0.010 | 0.628 | 3.098 | 0.770 | 0.518 | 53.482 | 0.446 | 72.928 |
| DSKILL | 0.988 | 0.012 | 0 | 0.014 | 0.376 | 3.106 | 0.892 | 0.570 | 53.014 | 0.470 | 72.702 |
| K | 0.976 | 0.024 | 0.010 | 0 | 0.392 | 3.090 | 0.932 | 0.594 | 54.282 | 0.444 | 68.242 |

At n=500 this is a starting read, not a verdict — re-run at higher n (the controller has separately
measured 1500/position) before leaning hard on any single cell, especially the rarer-event columns
like `washoutRate` and `bustedRate`. Two things stand out even at n=500: `washoutRate` is non-zero
only for OSKILL (0.004) and K (0.010) — the other four slices show zero, consistent with the
soft-washout path being a K/OSKILL-specific mechanism, not a general one — and K is the only slice
with `round1Rate = 0`, paired with its lowest `avgFinalOverall` (68.242) and highest `bustedRate`
(0.024). OL and DL carry the highest `allConfRate` (0.586, 0.628) against QB/OSKILL/DSKILL/K
clustered in the 0.376–0.422 range, echoing the backlog item below about award-threshold
placement.

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
so the spiral's effect on draft outcomes is inherently small. **Its main effect is on
`charUnder35Rate` and band-3 draw counts, not on `bustedRate`** — see the attribution split in
"What Stage 3d just shipped" above; the spiral is a minority contributor to the measured
`bustedRate` (`the-knee` → `bust-mri` carries most of it).

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
  highest `allConfRate` at 0.796). Decide once for all six slices, not piecemeal. (That `allConfRate`
  figure is the Stage 3d probe value; the current measured `allConfRate` for every slice is in the
  "Per-position balance table" above.)
- **Resolved by 3e, no longer open:** "five of six position slices have no committed balance
  measurement" — `runBalance` now takes a position and all six slices are measured; see
  "Per-position balance table" above. Re-run at higher n before leaning hard on the rarer-event
  columns (`washoutRate`, `bustedRate`).
- **Injury exposure is uneven across the position pile**: OSKILL 0.053/event, K 0.025, DSKILL
  0.020, QB/OL/DL exactly 0. Shows up as OSKILL `undraftedRate` 0.068 + `bustedRate` 0.022 vs DL
  0.016/0 (measured mid-stage, QB-only harness caveat applies to the aggregate framing, per-slice
  numbers are from the throwaway probe; the current measured `injuredRate`, `undraftedRate`, and
  `bustedRate` for every slice are in the "Per-position balance table" above).
- **Character drift by slice**: K +0.257/event vs OL −0.107/event — a 3.3-point spread in final
  character across a career, against the band-2 gate of 55. Plan B tuned only against QB's
  (+0.070/event). (These per-event drift figures are the Stage 3d probe values; the current measured
  `avgFinalCharacter` and `charUnder55Rate` per slice are in the "Per-position balance table" above.)
- **`bustedRate` is already non-zero for OSKILL (0.022) and K (0.006) via the soft-washout path**,
  not via bust events — a second mechanism distinct from the character spiral. Worth understanding
  before treating `bustedRate` as a single-cause metric. (These two figures are the Stage 3d probe
  values; the current measured `bustedRate` for every slice, including OSKILL and K, is in the
  "Per-position balance table" above.)
- **All-Conference rates run 0.49–0.80 across positions** (DL 0.796, OL 0.73, QB 0.65). Award
  thresholds sit at ~1 season of baseline production and the position pile's stat grants land on
  top — stat-axis inflation that `round1Rate` is blind to (an award is worth only 3 draft stock,
  once). (These are the Stage 3d probe values; the current measured `allConfRate` per slice is in
  the "Per-position balance table" above.)
- **Resolved by 3e, no longer open:** "`phases: 1` suspensions are still free" — `bust-drug-test`'s
  "Suspended two games", `bust-arrest`'s `lawyer-up`, and `speeding-georgia`'s one-game suspension
  all cost nothing (same mechanism as the `recoveryPhases: 1` trap above). All three are now fixed
  and `schema.ts` rejects `phases: 1` suspensions outright — see the parallel entry in the "Engine
  traps" section above (item 3, CLOSED).
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
  `collarbone` (the only postseason injury-inflicting event is `oskill.ts`'s `bowl-opt-out`)
  reaches this check, since an injury inflicted *during* postseason survives **zero**
  `tickPhaseStart` calls before the offseason hub check — there is no phase boundary between
  postseason and the offseason hub asking. The pre-3d note was wrong about reachability *and* about
  the reason. Nothing needs
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
  grant `overall: +2 immediate` (was `timing: "permanent"` before Stage 3e's collapse; same
  behavior) (plus +2 Senior Day) — up to +6/season of guaranteed-EV overall
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
- **Balance harness:** `src/sim/balance.ts` (`runBalance(runs, seedPrefix, policy, position =
  "QB")`, `BalanceReport`) — takes a position as of Stage 3e; see "Per-position balance table"
  above. `src/sim/balance.test.ts` carries the QB-only `bustedRate > 0` gate (still QB-only,
  unchanged by Stage 3e) plus structural invariants for all six position slices. (`round1Rate` has
  only a near-vacuous `< 1` assertion — no band. That gate was deliberately relaxed to nothing
  during Plan A; adding a real band is Stage 4's call.) CLI: `npm run balance -- <runs> <policy>
  [position|all]`.
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
  including `pendingEffects`, now flushed by `flushPendingEffects` at every terminal status — the
  `permanent`/`immediate` no-op it used to describe is gone; `timing` is `"immediate" | "deferred"`
  only as of Stage 3e), `src/engine/postseason.ts` (the six-stat resolver).
