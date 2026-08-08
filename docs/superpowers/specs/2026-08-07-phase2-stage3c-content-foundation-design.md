# CFB Career Sim — Phase 2 Stage 3c Design Spec (Content Foundation + Mechanical Content)

**Date:** 2026-08-07
**Status:** Approved design, pre-implementation
**Predecessor:** Stage 3b (recruiting & geography engine prelude) — DONE, merged to `main` at `9000a3d`, 162/162 tests green.
**Parent spec:** `docs/superpowers/specs/2026-08-02-phase2-content-engine-design.md`
**Immediate predecessor spec:** `docs/superpowers/specs/2026-08-07-phase2-stage3b-recruiting-geography-design.md` — its §6 carries the content decisions this spec builds on.

---

## 1. Scope and decomposition

The content push was too large for one spec. It splits on the **execution-mode boundary**:

- **Stage 3c (this spec)** — the foundation and the mechanically-loaded content: one engine condition, the ~50-school ladder, the `events/` directory restructure, the bust slice, the milestone slice, and the injury pool. All of this is careful sequential work that needs real review: bust events emit `{kind:"ending"}`, milestones interact with the redshirt sit season and the postseason resolver, and the school ladder changes sampler behavior globally.
- **Stage 3d (separate spec, written after 3c merges)** — the ~70-event flavor pile: 8–12 events per position bucket plus the universal/off-field pool. Append-only slices, parallel-authored, with the content validator as the guardrail.

Splitting here means each stage gets the review depth it needs. A whole-branch review pointed at ~3,000 lines of event data plus a restructure plus a school ladder either skims or takes enormous effort, and a review that cannot be done well still gets trusted.

## 2. Grounded mechanics this design depends on

Verified against the code, because the milestone slice in particular is sensitive to all three:

1. **Every matching fixed event fires, every phase.** `advance.ts:259-264` calls `selectFixedEvent` and returns as long as one matches, firing them one at a time (tracked in `phaseFiredEventIds`); only when none remain does `advance.ts:267-274` draw the single random event. **Milestone count is therefore a pacing decision** — three fixed events gated to `conference` means three decisions every conference phase, every season, on top of the random draw.
2. **The postseason resolver runs after that phase's events.** `advance.ts:277` calls `runPostseasonResolver` only once all fixed and random events for the postseason phase are handled. So a postseason milestone's `stat` or `injury` effects **feed that season's team record and award resolution**. This is deliberate and must be stated for 3d's authors.
3. **Base production accrues before events.** `simulatePhaseProduction` runs at `advance.ts:253`, before any event fires, so event `stat` effects add on top of the phase's simulated baseline rather than replacing it.

## 3. Engine addition — the `requiresPlaying` condition

`EventConditions` has no field reading `redshirtSeasonActive`, so a milestone like "Rivalry Week — do you play through the ankle?" fires at a player sitting out their redshirt year in street clothes. `requiresFinalSeason` (Stage 3b) solves this only for final-season beats.

This is a category-wide mismatch, not one awkward event: milestones are inherently about being on the field, and a redshirt sit season is inherently about not being. Writing around it means authoring every milestone to its weakest case.

```ts
if (c.requiresPlaying && state.redshirtSeasonActive) return false;
```

Added to `EventConditions`, evaluated in `eventMatches` (`src/engine/select-event.ts`), validated as a boolean in `validateContent`. Same shape as `requiresFinalSeason`, which landed cleanly in 3b. Closes the Stage-3a review's open warning that fixed events can fire during a redshirt sit.

## 4. The school ladder (~50 schools)

**Realism-first by program stature**, matching what the current 10 schools already establish:

| Tier | Meaning | Target count |
|---|---|---|
| 4 | National contenders / blue bloods | ~9 |
| 3 | Power-conference programs | ~17 |
| 2 | Group of 5 | ~15 |
| 1 | FCS | ~9 |

Then check the region × tier grid and backfill **only genuinely empty cells**, choosing the most defensible real program available rather than inventing stature. An empty cell makes `sampleSchoolInTier` return `undefined`, which yields no offer at that tier — that is the failure worth preventing. Mild lumpiness is a feature: a recruit from Montana *should* have fewer blue-blood options nearby, and the game modeling that is correct.

**Revision to the "≥2 schools per tier in TX/CA/FL/GA/OH" rule.** That rule was formulated before Stage 3b, when `homeStateBonus` was a flat 6 at every tier and the array-order tiebreak in `bestSchoolInTier` would pin one school permanently for every recruit from a state. Both premises changed: `bestSchoolInTier` is deleted, and the bonus is now tier-scaled — 12 at tier 1, 8 at tier 2, 4 at tier 3, **1 at tier 4 against a base of 1**. At tier 4 geography barely moves the sampler at all.

So the rule now applies where it actually bites: **at least two schools per tier in the high-population football states at tiers 1 and 2.** At tiers 3 and 4 a state having exactly one program is fine and more honest — Ohio really does have one blue blood.

**The rule yields to realism where the programs do not exist.** Tier 1 is FCS, and some high-population states genuinely have only one plausible FCS program (Georgia is the clear case). Where a state cannot reach two at tier 1 or 2 without inventing stature, author one and record why in a comment. Realism-first is the governing principle; this rule exists to prevent a *sampler* artifact, not to force a fabricated ladder. Inventing a school, or promoting a program to a tier it has no business in, is the worse outcome.

Conference and state fields must be factually correct; they are public facts and the tone lock permits them.

## 5. The `events/` restructure

```
src/content/events/
  index.ts      <- barrel: concatenates every slice into EVENTS
  recruiting.ts <- the engine-special fixed event
  qb.ts  oskill.ts  ol.ts  dl.ts  dskill.ts  k.ts
  bust.ts
  milestones.ts
  universal.ts
```

The six existing events move into `recruiting.ts`, `universal.ts` (`catfished`, `speeding-georgia`, `gym-grind`), and `qb.ts` (`film-study`, `signature-win`). **No content changes during the move**, so the diff reviews as a pure refactor.

Slices that 3c does not populate are created **empty but exported and wired into the barrel**, so each 3d author owns a file that already exists and never edits a shared one. This is what makes 3d's parallel authoring collision-free.

**Barrel-completeness test.** Assert that every slice module's exported array is present in `EVENTS`. Without it, a 3d author's file could be silently omitted from the barrel and their whole slice would vanish with every test still green.

## 6. The bust slice (~6 events)

All `kind: "random"` per the 3b decision — weight is the primary rarity knob, per-option probability the secondary one. Each is gated on genuine vulnerability so the ending is telegraphed and earned, and each survival outcome grants enough character or overall to cross back above its own gate.

| Event | Path | Gate |
|---|---|---|
| The MRI comes back | Career-ending injury | `requiresActiveInjury` |
| Academic probation | Academic ineligibility | `maxCharacter: 35` |
| Failed drug test | Off-field | `maxCharacter: 30` |
| The arrest | Off-field expulsion | `maxCharacter: 20` |
| Coach's doghouse | Off-field / quit | `maxCharacter: 25` |
| Lost the love of it | Walk-away | `maxOverall: 55` |

Calibration target from the 3b spec, restated: weight 3 against a ~30-weight pool → ~10% per phase → ~27% per season of exposure → at 0.25 ending probability, ~7% bust risk per season for a vulnerable player, ~20% across three remaining seasons. These are starting points for Stage 4, not final values.

The engine's soft-washout (`washoutOverallFloor: 45`, `washoutConsecutiveSeasons: 2`) already force-busts a genuinely collapsed career, so bust content need not finish players who are already on the clock.

**Required test: an e2e career driven to `busted` via content.** The `busted` terminal is currently unreachable end-to-end — the parent spec has required this test since Decision 3 and no stage has been able to write it until now.

## 7. The milestone slice (5 fixed events)

Capped at **one per phase**, so a season adds at most four fixed decisions.

| Phase | Event | Conditions |
|---|---|---|
| offseason | Fall Camp Battle | `requiresPlaying`, `minClass: "SO"` |
| nonconf | Season Opener | `requiresPlaying` |
| conference | Rivalry Week | `requiresPlaying` |
| postseason | Bowl Season | `requiresPlaying` |
| conference | Senior Day | `requiresFinalSeason`, `requiresPlaying` |

Senior Day is the only phase-sharer, so the final season's conference phase runs three decisions (two fixed plus the random draw). That is the intended peak, not an accident.

Two authoring constraints that follow from §2:

- **Bowl Season fires before the resolver.** Any `stat` effect there lands in the season line the resolver then reads for awards, and any `injury` effect can sideline the player for it. Use this deliberately or not at all.
- **Fall Camp Battle sits in the offseason alongside the hub.** The hub (redshirt → declare → transfer) resolves first; the fixed event fires afterward in `autoProgress`. Since `redshirtSeasonActive` is set at the hub *before* the event fires, `requiresPlaying` correctly excludes a player who just took the redshirt.

## 8. Injuries and moment authoring rules

**Injuries.** Add three to `src/content/injuries.ts` for bust and milestone variety: collarbone, turf toe, MCL sprain. Existing five (hamstring, ankle, shoulder, concussion, acl) are unchanged. Note that "career-ending" is an `{kind:"ending"}` effect, not an injury type — no injury entry is needed for it.

**Moments.** `applyEffect` (`src/engine/effects.ts:76-77`) pushes unconditionally, and each entry carries `seasonIndex` — so `moments` is a **chronological log, not a set**. Duplicate entries are structurally fine ("got catfished" twice says the player got catfished twice). The problem is only strings that *imply* uniqueness.

No engine dedup: string-equality dedup cannot distinguish a legitimate repeat (winning the rivalry game as a junior and again as a senior — two real achievements a trophy case exists to show) from an awkward one, and would silently destroy the former.

Two authoring rules instead, binding on 3c and 3d:

1. A moment implying **first / only / last** may only be emitted by an event gated to fire once — `requiresFinalSeason`, or conditions that cannot recur.
2. A moment on a **repeatable random event** must be phrased so a second occurrence reads as a second occurrence.

## 9. Testing

- **`requiresPlaying`** — matches when not redshirting; does not match during a sit season; validator rejects a non-boolean.
- **e2e bust** — a seeded career reaches `status: "busted"` through a content event's `ending` effect, with `endingReason` set. This is the headline test of the stage.
- **Barrel completeness** — every slice module's export appears in `EVENTS`.
- **School ladder coverage** — no region × tier cell that the sampler can reach is empty. The two-per-state rule at tiers 1 and 2 is asserted for TX/CA/FL/OH; any state exempted under §4's realism clause is named explicitly in the test rather than silently omitted, so the exemption is visible and deliberate.
- **Content validation** — the full bundle still passes `validateContent` at import, which is what makes bulk authoring safe.
- Existing 162 tests stay green.

## 10. What Stage 3d inherits

The empty-but-wired slice files, the barrel and its completeness test, the moment authoring rules, the tone lock, and the mechanics in §2 — particularly that every matching fixed event fires each phase, and that postseason effects feed the resolver.

3d authors 8–12 events per position bucket (QB, OSKILL, OL, DL, DSKILL, K), each referencing its own stats from `POSITIONS`, plus the universal/off-field pool. Single-option events are legitimate: the soccer reference uses them widely (`club_crisis: ["stay_and_fight"]`), and the drama is in the roll rather than the branch.

## 11. Logged for Stage 4 (balance)

Carried forward, plus this stage's additions:

- No washout floor on **character** — a very-low-character player sits under every character-gated bust event indefinitely, diluted only by the random draw. This stage makes that reachable for the first time, so it needs a deliberate look when tuning bust rates.
- All bust weights and ending probabilities in §6 are feel-based starting points.
- The offer set's **tier composition is deterministic** (fixed by `offerCount` × the eligible-tier ladder); geography weights only affect which school within a tier. The levers on tier variety are `offerCount` and the `eligibleTiers` thresholds in `draft.ts:21-28`.
- The ~50-school ladder will move the balance distribution from the first recorded snapshot (`draftedRate 1, bustedRate 0, undraftedRate 0.016, round1Rate 0.022, avgSeasons 3.024` at 500 runs), because the tier mix of offers changes. Re-baseline after this stage.
