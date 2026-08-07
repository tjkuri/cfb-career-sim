# CFB Career Sim — Phase 2 Stage 3b Design Spec (Recruiting & Geography Engine Prelude)

**Date:** 2026-08-07
**Status:** Approved design, pre-implementation
**Predecessor:** Stage 3a (content enablers) — DONE, merged to `main` at `b8aa1b1`, 141/141 tests green.
**Parent spec:** `docs/superpowers/specs/2026-08-02-phase2-content-engine-design.md`
**Handoff read first:** `docs/superpowers/STAGE3B-HANDOFF.md`

---

## 1. Why this stage exists

The handoff scoped Stage 3b as a pure content push: ~40–60 schools, ~50–70 events, no engine work. Brainstorming surfaced a design goal that content alone cannot deliver, so the stage was deliberately re-scoped.

**The goal, in the user's framing:** a new recruit from Iowa should see a first offer set weighted toward nearby, lower-tier schools — two Midwest options and one further afield — and as the player climbs, geography should matter progressively less, until a blue-blood offer is plausible from anywhere.

**Why content cannot deliver it.** Three facts from the Phase-1/2 code:

1. `SCHOOL_SAMPLER` applies `homeStateBonus: 6` / `regionBonus: 2` uniformly, so an FCS program and Alabama exert identical geographic pull.
2. `recruitingOptions` (`src/engine/simulate.ts:8`) emits **exactly one offer per eligible tier**, each chosen by `bestSchoolInTier` — the *highest-weighted* school, not a sampled one. With `homeStateBonus` at 6, the home-state school always wins its tier, ties broken by array order. **Recruiting offers are therefore deterministic given home state.**
3. A fresh recruit has overall 60 / character 70 → draft stock 31 → `eligibleTiers` returns `[1, 2]`. Today's first recruiting screen is **two offers, both the home-state school** where one exists.

Expanding the school ladder alone would improve transfer variety (transfers already use the weighted `sampleSchoolInTier`) but would leave recruiting showing the same two schools every run.

**Ordering rationale.** The engine changes land *before* the ladder is authored. The whole point of a 40–60 school ladder is that tier and geography interact; authoring ~50 rows against selection behavior that is about to change means re-checking every row afterward. Doing the engine first lets the ladder be designed against real behavior.

**Decomposition.** Stage 3b = these three engine changes. **Stage 3c** = the content authoring push, with its own spec written once 3b is green on `main`. The split follows the 2a/2b/2c rhythm the ledger records as producing clean reviews, and keeps three changes to validated config, the recruiting path, and the eligibility boundary from being reviewed inside a diff containing 60 authored events.

## 2. Change 1 — tier-scaled geography weights

Geographic pull becomes a per-tier table rather than a scalar.

```ts
export interface SchoolSamplerConfig {
  base: number;
  homeStateBonus: Record<Tier, number>;
  regionBonus: Record<Tier, number>;
  offerCount: number;
}

export const SCHOOL_SAMPLER: SchoolSamplerConfig = {
  base: 1,
  homeStateBonus: { 1: 12, 2: 8, 3: 4, 4: 1 },
  regionBonus:    { 1: 5,  2: 3, 3: 2, 4: 0.5 },
  offerCount: 3,
};
```

`schoolWeight` (`src/engine/schools.ts:15`) already receives the school row, and the row carries `.tier`, so **no signature change is required** — only the config shape and the two lookups:

```ts
if (school.state === homeState) w += cfg.homeStateBonus[school.tier];
else if (sameRegion(school.state, homeState, content.regions)) w += cfg.regionBonus[school.tier];
```

**Effect.** At tier 1 a home-state school sits at weight 13 against a base of 1 — an overwhelming local pull. At tier 4 it is 2 against 1 — mild. "Small schools recruit their backyard, blue bloods recruit nationally" falls out of one table, and it feeds both recruiting and transfers because both route through `schoolWeight`.

**Validation additions** (`validateContent`): both records must have an entry for every tier 1–4, all values `>= 0`; `offerCount` must be `>= 1`. All values are initial, balance-tunable starting points for Stage 4.

## 3. Change 2 — recruiting offers generated once and sampled

### The defect this must not introduce

`recruitingOptions` is called **twice** per recruiting decision: `advance.ts:40` (to present options via `getDecision`) and `advance.ts:94` (to resolve the chosen option in `applyChoice`). This is safe today only because the function is pure and deterministic. Making it rng-driven naively would generate a **different offer set at resolution than the one displayed** — the player's choice would resolve against schools they never saw.

### The fix: the pattern transfers already use

`generateTransferOffers` is called once (`advance.ts:225`), stored in `state.pendingOptions`, read by `getDecision` (`advance.ts:55`), and read back and cleared in `applyChoice` (`advance.ts:110-114`). Recruiting adopts the same flow.

```ts
export function generateRecruitingOffers(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
): SchoolOffer[] {
  const tiers = eligibleTiers(state).slice().sort((a, b) => b - a); // high → low
  const target = content.schoolSampler.offerCount;
  const offers: SchoolOffer[] = [];
  const taken = new Set<string>();
  while (offers.length < target) {
    let added = false;
    for (const tier of tiers) {
      if (offers.length >= target) break;
      const s = sampleSchoolInTier(content, tier, state.setup.homeState, rng, taken);
      if (!s) continue;
      taken.add(s.id);
      offers.push({
        id: `commit-${s.id}`,
        label: `Commit to ${s.name}`,
        schoolId: s.id,
        tier,
        snapModifier: 1,
      });
      added = true;
    }
    if (!added) break; // pool exhausted — fewer than offerCount offers is legal
  }
  return offers;
}
```

Round-robin across eligible tiers, highest first, until the target is met. The iteration order is fixed, so the only nondeterminism is the seeded sampler — determinism is preserved.

**Resulting first offer set** for a fresh recruit (`eligibleTiers` = `[1, 2]`, `offerCount` 3): two tier-2 offers and one tier-1. Under the Change-1 weights the tier-1 pick is near-certainly home-state; the tier-2 picks lean regional with a real chance of distant. This is the target scenario.

### Two required consequences

**`sampleSchoolInTier`'s exclusion parameter generalizes.** `excludeId?: string` becomes `excludeIds?: ReadonlySet<string>` so an offer set cannot contain the same school twice. The single transfer call site updates with it.

**`createCareer` must populate `pendingOptions`.** Recruiting is the first decision of a career, raised before any `advance` call, so there is no existing rng-bearing path to generate it. `getDecision` must not generate it either: the ledger records "getDecision purity airtight" as a verified Stage-2b property, and making it mutate state would spend that. So `createCareer` builds its rng from the seed at cursor 0, generates the offer set, and stores the advanced `rngCursor`.

This requires **a backward-compatible signature change**: offer generation needs the school pool, so `createCareer(setup, seed)` becomes `createCareer(setup, seed, content: ContentBundle = CONTENT)`. The defaulted parameter keeps every existing call site working, and it matches the convention `advance` and `getDecision` already use. It does couple `create-career.ts` to the content bundle, which it currently avoids — acceptable, since it is the same coupling those two functions already carry.

Test impact is narrow: of the 4 existing `create-career` tests, **one** asserts the cursor ("carries the seed and starts the rng cursor at 0") and needs updating. The other three assert baselines, phase/status, and empty records, all unaffected.

**`recruitingOptions` is retired** in favor of `generateRecruitingOffers` + `pendingOptions`, unifying the recruiting and transfer paths on one pattern.

## 4. Change 3 — `requiresFinalSeason` condition

### The problem

`enterOffseason` (`advance.ts:189-190`) advances class year with `if (ci < CLASS_ORDER.length - 1)`. Once a player reaches `SR` the index stops advancing while `yearsUsed` keeps incrementing. **A redshirted player therefore spends two seasons as `SR`,** and `EventConditions` has no field distinguishing them. A `minClass: "SR"` fixed event fires **twice** for any redshirted career — and redshirt is a routine hub offer, not a rare edge case.

This blocks the once-per-career milestone beats Stage 3c wants (senior day, last home game), because the engine has no once-per-career mechanism at all — fixed events fire once *per phase per season*, gated only by conditions.

### The boundary

Tracing `enterOffseason`, seasons are played at these values:

| Career | Played seasons (`yearsUsed`) | `eligibilityCap` | Final played season |
|---|---|---|---|
| No redshirt | 0, 1, 2, 3 | 4 | `yearsUsed === 3` |
| Redshirted | 0, 1, 2, 3, 4 | 5 | `yearsUsed === 4` |

Uniformly: **final playable season ⟺ `yearsUsed === eligibilityCap - 1`.**

```ts
if (c.requiresFinalSeason) {
  const cap = CLASS_ORDER.length + (state.eligibility.redshirtUsed ? 1 : 0);
  if (state.eligibility.yearsUsed !== cap - 1) return false;
}
```

Two properties make this safe, both verified against the code:

- **The cap is stable across a played season.** `redshirtUsed` is set at the offseason hub, before the season is played, so it cannot flip mid-season.
- **A redshirt sit season can never satisfy it.** Taking the redshirt raises the cap by exactly the year it consumes. The latest a redshirt can be taken is a medical redshirt as an injured `SR` at `yearsUsed` 3, against a new cap of 5 — so `3 !== 4`. This addresses the Stage-3a review note that fixed events can fire during a redshirt sit.

Added to `EventConditions`, evaluated in `eventMatches` (`src/engine/select-event.ts`), validated as a boolean.

## 5. Testing

All 141 existing tests must stay green. New coverage:

- **`schoolWeight` tier scaling** — home-state and same-region bonuses resolve per tier; a tier-1 home-state school outweighs a tier-4 home-state school; out-of-region falls back to `base`.
- **Validator** — missing tier key in either bonus record, negative bonus, `offerCount < 1`, and a non-boolean `requiresFinalSeason` each produce an error.
- **Offer generation** — respects `offerCount`; never repeats a school; composes tiers as expected for `eligibleTiers` `[1,2]`; returns a short set rather than throwing when the pool is exhausted; identical for identical seeds.
- **The double-call defect specifically** — `getDecision` and the subsequent `applyChoice` resolve against the *same* offer set. This is the regression the change exists to prevent and must be asserted directly.
- **`requiresFinalSeason`** — matches at `yearsUsed` 3 with no redshirt; at 4 with a redshirt; does **not** match at 3 with a redshirt; does not match during a redshirt sit season.
- **`createCareer`** — populates `pendingOptions`, advances `rngCursor`, is seed-deterministic, and still works when called without an explicit `content` argument.

## 6. Carried forward to Stage 3c

These content decisions were settled during this brainstorm and are recorded here so Stage 3c's spec can start from them rather than re-deriving them.

**Bust model.** Bust events are `kind: "random"`, not `fixed` — weight is the primary rarity knob, per-option probability the secondary one. They are gated on vulnerability (`maxCharacter` / `maxOverall` / `requiresActiveInjury`) so the ending is telegraphed and earned. Survival outcomes nudge the player back above their own gate (a soft protection against repeat exposure, not a guarantee). The engine's soft-washout (`washoutOverallFloor: 45`, `washoutConsecutiveSeasons: 2`) already catches the deep-collapse case, so bust content need not finish genuinely dead careers.

A rough calibration for a vulnerable player: weight 3 against a ~30-weight pool → ~10% per phase → ~27% per season of seeing the event → at 0.25 ending probability, ~7% bust risk per season, ~20% across three remaining seasons.

**Event file layout.** `src/content/events/` with `index.ts` (barrel), `recruiting.ts`, one file per position (`qb`, `oskill`, `ol`, `dl`, `dskill`, `k`), plus `bust.ts`, `milestones.ts`, `universal.ts`. The barrel is written **first**, importing all slices before any has content, so parallel authors each own exactly one file and never touch a shared one.

**School ladder.** Realism-first: assign tiers by actual program stature (tier 4 blue bloods, tier 3 power-conference, tier 2 Group of 5, tier 1 FCS, as the current 10 schools already establish), then check the region × tier grid and backfill only genuinely **empty** cells, since an empty cell makes the sampler return `undefined` and yields no offer at that tier. Mild lumpiness is a feature — a recruit from Montana *should* have fewer blue-blood options nearby. Authoring rule: **at least two schools per tier in TX, CA, FL, GA, OH**, because the array-order tiebreak would otherwise make a single school a permanent fixture for every recruit from that state.

**Tone.** Unchanged from the handoff: light, "silly + real-seeming." Validated against the soccer reference's own career-event pool (`giant_tattoo`, `tax_trouble`, `mysterious_substance`, `foreign_grandfather`, `controversial_statement`), which sits in the same register as the existing `catfished` / `speeding-georgia`. No mean-spirited content, no real player names; school and conference names are public facts and fine.

**Single-option events are legitimate.** The soccer reference uses them widely (`club_crisis: ["stay_and_fight"]`, `controversial_statement: ["apologize"]`) — the drama is in the roll, not the branch. Our schema already supports this via one option with `probability < 1`.

## 7. Logged for Stage 4 (balance)

New items from this brainstorm, in addition to those already in the handoff:

- **No washout floor on character.** A player at very low character sits under every character gate indefinitely, with only the random draw diluting exposure. Intentional for now — a character-8 player *should* be in constant jeopardy — but it needs a deliberate look during tuning.
- **All Change-1 weights are guesses.** The `homeStateBonus` / `regionBonus` tables and `offerCount: 3` are initial values chosen for feel, not measured. Tune against `npm run balance` once the full ladder exists.
