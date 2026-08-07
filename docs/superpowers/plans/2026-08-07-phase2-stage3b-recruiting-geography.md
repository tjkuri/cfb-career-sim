# Stage 3b — Recruiting & Geography Engine Prelude Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make geographic pull scale with school tier and make recruiting offers a sampled, generated-once set, so the school ladder authored in Stage 3c can be designed against real selection behavior.

**Architecture:** Three independent engine changes. (1) `SchoolSamplerConfig`'s flat `homeStateBonus`/`regionBonus` scalars become per-tier tables, read by the existing `schoolWeight` without a signature change. (2) Recruiting offers move from `bestSchoolInTier` (deterministic, one per tier) to a seeded round-robin sampler stored in `state.pendingOptions`, following the pattern `generateTransferOffers` already uses. (3) A new `requiresFinalSeason` event condition distinguishes the two `SR` seasons a redshirted player gets.

**Tech Stack:** TypeScript (strict), Vitest, `tsx` for CLI scripts. No runtime dependencies in `src/engine/**` or `src/content/**`.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-08-07-phase2-stage3b-recruiting-geography-design.md`. Read it before Task 1.
- **Purity is sacrosanct:** no `Math.random`, `Date.now`, or IO anywhere in `src/engine/**` or `src/content/**`. All randomness flows through the seeded `Rng` from `src/engine/rng.ts`.
- **`getDecision` must stay pure.** It reads state and returns a decision. It must never mutate state or consume rng. This is a verified Stage-2b property recorded in the ledger.
- **Determinism:** identical `(seed, cursor)` must produce identical results. Any new rng consumption must have a fixed, documented draw order.
- **Two typecheck passes must both exit 0:** `npm run typecheck` runs `tsc -p tsconfig.engine.json && tsc -p tsconfig.json`. The engine pass enforces no-Node-globals in `src/engine/**` and `src/content/**`.
- **Baseline:** 141 tests pass at `main` (`016ef6f`). No task may reduce that count except where this plan explicitly says a test is replaced.
- **All numeric values in this plan are initial, balance-tunable starting points** tuned in Stage 4. Do not treat them as final.
- **Commit after every task.** Use `feat(engine):` / `refactor(engine):` / `feat(content):` prefixes matching existing history.

---

### Task 1: Tier-scaled geography weights

Geographic pull currently applies identically to an FCS program and to Alabama. This makes it a per-tier table so small schools recruit their backyard and blue bloods recruit nationally.

**Files:**
- Modify: `src/content/schema.ts` (the `SchoolSamplerConfig` interface, and the sampler branch of `validateContent`)
- Modify: `src/content/regions.ts:13` (the `SCHOOL_SAMPLER` constant)
- Modify: `src/engine/schools.ts:15-21` (`schoolWeight`)
- Test: `src/engine/schools.test.ts`, `src/content/schema.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SchoolSamplerConfig` with `homeStateBonus: Record<Tier, number>` and `regionBonus: Record<Tier, number>`. `schoolWeight(school: SchoolRow, homeState: string, content: ContentBundle): number` — signature unchanged.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/schools.test.ts`, inside the existing `describe("schoolWeight", ...)` block:

```ts
  it("scales the home-state bonus down as tier rises", () => {
    const mk = (id: string, tier: 1 | 2 | 3 | 4) => ({ id, name: id, tier, conference: "X", state: "TX" });
    const content = { ...CONTENT, schools: [mk("t1", 1), mk("t2", 2), mk("t3", 3), mk("t4", 4)] };
    const w = (id: string) => schoolWeight(content.schools.find((s) => s.id === id)!, "TX", content);
    expect(w("t1")).toBeGreaterThan(w("t2"));
    expect(w("t2")).toBeGreaterThan(w("t3"));
    expect(w("t3")).toBeGreaterThan(w("t4"));
  });

  it("gives an out-of-region school only the base weight at every tier", () => {
    // OH is Midwest; homeState TX is Southwest -> neither home-state nor same-region.
    const mk = (id: string, tier: 1 | 2 | 3 | 4) => ({ id, name: id, tier, conference: "X", state: "OH" });
    const content = { ...CONTENT, schools: [mk("f1", 1), mk("f4", 4)] };
    const w = (id: string) => schoolWeight(content.schools.find((s) => s.id === id)!, "TX", content);
    expect(w("f1")).toBe(CONTENT.schoolSampler.base);
    expect(w("f4")).toBe(CONTENT.schoolSampler.base);
  });
```

Add to `src/content/schema.test.ts`:

```ts
describe("schoolSampler validation", () => {
  it("rejects a bonus table missing a tier", () => {
    const bad = {
      ...CONTENT,
      schoolSampler: { ...CONTENT.schoolSampler, homeStateBonus: { 1: 5, 2: 4, 3: 3 } as never },
    };
    expect(validateContent(bad).some((e) => e.includes("missing entry for tier 4"))).toBe(true);
  });

  it("rejects a negative tier bonus", () => {
    const bad = {
      ...CONTENT,
      schoolSampler: { ...CONTENT.schoolSampler, regionBonus: { 1: -1, 2: 3, 3: 2, 4: 1 } },
    };
    expect(validateContent(bad).some((e) => e.includes("regionBonus"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/engine/schools.test.ts src/content/schema.test.ts`
Expected: FAIL. The `schoolWeight` tests fail because every tier currently gets the same flat bonus (`toBeGreaterThan` gets equal values). The schema tests fail because no per-tier validation exists yet.

- [ ] **Step 3: Change the config interface and validation**

In `src/content/schema.ts`, replace the `SchoolSamplerConfig` interface:

```ts
export interface SchoolSamplerConfig {
  base: number;
  homeStateBonus: Record<Tier, number>;
  regionBonus: Record<Tier, number>;
}
```

In `validateContent`, replace this existing block:

```ts
  const sampler = bundle.schoolSampler;
  if (sampler.base < 0 || sampler.homeStateBonus < 0 || sampler.regionBonus < 0)
    errors.push("schoolSampler: weights must be >= 0");
```

with:

```ts
  const sampler = bundle.schoolSampler;
  if (sampler.base < 0) errors.push("schoolSampler.base must be >= 0");
  const ALL_TIERS: Tier[] = [1, 2, 3, 4];
  for (const field of ["homeStateBonus", "regionBonus"] as const) {
    const table = sampler[field];
    for (const t of ALL_TIERS) {
      const v = table?.[t];
      if (v === undefined) errors.push(`schoolSampler.${field}: missing entry for tier ${t}`);
      else if (v < 0) errors.push(`schoolSampler.${field}: tier ${t} must be >= 0`);
    }
  }
```

`Tier` is already imported at the top of `schema.ts` — no new import needed.

- [ ] **Step 4: Update the config values**

In `src/content/regions.ts`, replace the `SCHOOL_SAMPLER` constant:

```ts
// Geographic pull scales with tier: a small school recruits its backyard, a
// blue blood recruits nationally. Initial values, tuned in Stage 4.
export const SCHOOL_SAMPLER: SchoolSamplerConfig = {
  base: 1,
  homeStateBonus: { 1: 12, 2: 8, 3: 4, 4: 1 },
  regionBonus: { 1: 5, 2: 3, 3: 2, 4: 0.5 },
};
```

- [ ] **Step 5: Update `schoolWeight`**

In `src/engine/schools.ts`, replace the body of `schoolWeight`:

```ts
export function schoolWeight(school: SchoolRow, homeState: string, content: ContentBundle): number {
  const cfg = content.schoolSampler;
  let w = cfg.base;
  if (school.state === homeState) w += cfg.homeStateBonus[school.tier];
  else if (sameRegion(school.state, homeState, content.regions)) w += cfg.regionBonus[school.tier];
  return w;
}
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, 145 tests (141 baseline + 4 new).

If the pre-existing `schoolWeight` ordering test ("weights a home-state school above a same-region school above an out-of-region school") fails, that is a real regression — it uses tier-3 schools, where the new values are `homeStateBonus 4` / `regionBonus 2` / `base 1`, so the ordering must still hold. Fix the implementation, not the test.

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/content/schema.ts src/content/regions.ts src/engine/schools.ts src/engine/schools.test.ts src/content/schema.test.ts
git commit -m "feat(engine): tier-scaled geography weights in the school sampler"
```

---

### Task 2: Generalize `sampleSchoolInTier` exclusion to a set

An offer set draws several schools and must not repeat one. The current `excludeId?: string` can only exclude a single school.

**Files:**
- Modify: `src/engine/schools.ts:39-49` (`sampleSchoolInTier`)
- Modify: `src/engine/transfer.ts:21` (the one call site passing an exclusion)
- Test: `src/engine/schools.test.ts`

**Interfaces:**
- Consumes: `schoolWeight` from Task 1 (unchanged signature).
- Produces: `sampleSchoolInTier(content: ContentBundle, tier: Tier, homeState: string, rng: Rng, excludeIds?: ReadonlySet<string>): SchoolRow | undefined`.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/schools.test.ts`, inside the existing `describe("sampleSchoolInTier", ...)` block:

```ts
  it("excludes every id in the exclusion set", () => {
    const content = { ...CONTENT, schools: [
      { id: "a", name: "A", tier: 2 as const, conference: "X", state: "TX" },
      { id: "b", name: "B", tier: 2 as const, conference: "X", state: "TX" },
      { id: "c", name: "C", tier: 2 as const, conference: "X", state: "TX" },
    ]};
    for (let i = 0; i < 20; i++) {
      const pick = sampleSchoolInTier(content, 2, "TX", createRng(`ex-${i}`), new Set(["a", "b"]));
      expect(pick!.id).toBe("c");
    }
  });

  it("returns undefined when the exclusion set covers the whole tier", () => {
    const content = { ...CONTENT, schools: [
      { id: "a", name: "A", tier: 2 as const, conference: "X", state: "TX" },
    ]};
    expect(sampleSchoolInTier(content, 2, "TX", createRng("x"), new Set(["a"]))).toBeUndefined();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/schools.test.ts`
Expected: FAIL — a `Set` is not a `string`, so the filter never excludes anything and the first test picks `a` or `b`. TypeScript will also flag the argument type.

- [ ] **Step 3: Change the signature**

In `src/engine/schools.ts`, replace `sampleSchoolInTier`:

```ts
export function sampleSchoolInTier(
  content: ContentBundle,
  tier: Tier,
  homeState: string,
  rng: Rng,
  excludeIds?: ReadonlySet<string>,
): SchoolRow | undefined {
  const pool = content.schools.filter((s) => s.tier === tier && !excludeIds?.has(s.id));
  if (pool.length === 0) return undefined;
  return rngWeightedPick(rng, pool, (s) => schoolWeight(s, homeState, content));
}
```

- [ ] **Step 4: Update the transfer call site**

In `src/engine/transfer.ts`, line 21 currently reads:

```ts
  const lateral = sampleSchoolInTier(content, currentTier, homeState, rng, state.school.schoolId);
```

Replace with:

```ts
  const lateral = sampleSchoolInTier(content, currentTier, homeState, rng, new Set([state.school.schoolId]));
```

The two other calls in `transfer.ts` (lines 28 and 36) pass no exclusion and need no change.

**Do not change the existing test** that reads `sampleSchoolInTier(content, 2, "TX", createRng(...), "a")` — update it to `new Set(["a"])` so it still compiles. Its assertions stay the same.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, 147 tests. Both typecheck passes exit 0. In particular the 5 tests in `transfer.test.ts` must still pass — the lateral offer must still exclude the current school.

- [ ] **Step 6: Commit**

```bash
git add src/engine/schools.ts src/engine/transfer.ts src/engine/schools.test.ts
git commit -m "refactor(engine): sampleSchoolInTier accepts an exclusion set"
```

---

### Task 3: `generateRecruitingOffers` in a new `recruiting.ts`

Recruiting logic currently lives in `simulate.ts`, which is otherwise about per-phase stat production. This task gives recruiting its own module mirroring `transfer.ts`, and replaces deterministic best-pick with seeded sampling.

**Files:**
- Create: `src/engine/recruiting.ts`
- Create: `src/engine/recruiting.test.ts`
- Modify: `src/content/schema.ts` (add `offerCount` to `SchoolSamplerConfig` + validate it)
- Modify: `src/content/regions.ts` (add `offerCount: 3`)
- Modify: `src/engine/simulate.ts` (remove `recruitingOptions` and `applyRecruitingChoice`; they move to `recruiting.ts`)

**Interfaces:**
- Consumes: `sampleSchoolInTier(..., excludeIds?: ReadonlySet<string>)` from Task 2; `eligibleTiers(state): Tier[]` from `src/engine/draft.ts`.
- Produces:
  - `generateRecruitingOffers(state: GameState, content: ContentBundle, rng: Rng): SchoolOffer[]`
  - `applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void` (moved verbatim from `simulate.ts`)
  - `SchoolSamplerConfig.offerCount: number`

- [ ] **Step 1: Write the failing tests**

Create `src/engine/recruiting.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateRecruitingOffers } from "./recruiting";
import { createRng } from "./rng";
import { createCareer } from "./create-career";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Smith", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("generateRecruitingOffers", () => {
  it("returns offerCount offers for a fresh recruit", () => {
    const s = createCareer(setup, "offers-1");
    const offers = generateRecruitingOffers(s, CONTENT, createRng("offers-1"));
    expect(offers).toHaveLength(CONTENT.schoolSampler.offerCount);
  });

  it("never repeats a school in one offer set", () => {
    for (let i = 0; i < 25; i++) {
      const s = createCareer(setup, `dup-${i}`);
      const offers = generateRecruitingOffers(s, CONTENT, createRng(`dup-${i}`));
      const ids = offers.map((o) => o.schoolId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("only offers schools in tiers the player is eligible for", () => {
    // A fresh recruit (overall 60, character 70) has draft stock 31 -> tiers [1, 2].
    for (let i = 0; i < 25; i++) {
      const s = createCareer(setup, `tier-${i}`);
      const offers = generateRecruitingOffers(s, CONTENT, createRng(`tier-${i}`));
      for (const o of offers) expect([1, 2]).toContain(o.tier);
    }
  });

  it("is deterministic for a given seed", () => {
    const s = createCareer(setup, "det");
    const a = generateRecruitingOffers(s, CONTENT, createRng("det"));
    const b = generateRecruitingOffers(s, CONTENT, createRng("det"));
    expect(a).toEqual(b);
  });

  it("returns a short set rather than throwing when the pool is exhausted", () => {
    const content = { ...CONTENT, schools: [
      { id: "only", name: "Only U", tier: 1 as const, conference: "X", state: "TX" },
    ]};
    const s = createCareer(setup, "short");
    const offers = generateRecruitingOffers(s, content, createRng("short"));
    expect(offers).toHaveLength(1);
    expect(offers[0]!.schoolId).toBe("only");
  });

  it("gives every offer a snapModifier of 1", () => {
    const s = createCareer(setup, "mod");
    for (const o of generateRecruitingOffers(s, CONTENT, createRng("mod"))) {
      expect(o.snapModifier).toBe(1);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/engine/recruiting.test.ts`
Expected: FAIL — `Cannot find module './recruiting'`.

- [ ] **Step 3: Add `offerCount` to the config**

In `src/content/schema.ts`, add the field to `SchoolSamplerConfig`:

```ts
export interface SchoolSamplerConfig {
  base: number;
  homeStateBonus: Record<Tier, number>;
  regionBonus: Record<Tier, number>;
  offerCount: number;
}
```

In `validateContent`, immediately after the `base` check added in Task 1, add:

```ts
  if (!Number.isInteger(sampler.offerCount) || sampler.offerCount < 1)
    errors.push("schoolSampler.offerCount must be an integer >= 1");
```

In `src/content/regions.ts`, add `offerCount: 3` to `SCHOOL_SAMPLER`:

```ts
export const SCHOOL_SAMPLER: SchoolSamplerConfig = {
  base: 1,
  homeStateBonus: { 1: 12, 2: 8, 3: 4, 4: 1 },
  regionBonus: { 1: 5, 2: 3, 3: 2, 4: 0.5 },
  // How many schools a recruit chooses between on Signing Day.
  offerCount: 3,
};
```

- [ ] **Step 4: Create `src/engine/recruiting.ts`**

```ts
import type { GameState, SchoolOffer, SeasonLine } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { eligibleTiers } from "./draft";
import { sampleSchoolInTier } from "./schools";

// Signing Day offers. Round-robins across the tiers the player is eligible for,
// highest first, sampling one distinct school per pass until offerCount is met.
// The tier iteration order is fixed, so the only nondeterminism is the seeded
// sampler — identical (seed, cursor) yields an identical offer set.
export function generateRecruitingOffers(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
): SchoolOffer[] {
  const tiers = eligibleTiers(state).slice().sort((a, b) => b - a); // high -> low
  const target = content.schoolSampler.offerCount;
  const offers: SchoolOffer[] = [];
  const taken = new Set<string>();
  while (offers.length < target) {
    let added = false;
    for (const tier of tiers) {
      if (offers.length >= target) break;
      const school = sampleSchoolInTier(content, tier, state.setup.homeState, rng, taken);
      if (!school) continue;
      taken.add(school.id);
      offers.push({
        id: `commit-${school.id}`,
        label: `Commit to ${school.name}`,
        schoolId: school.id,
        tier: school.tier,
        snapModifier: 1,
      });
      added = true;
    }
    if (!added) break; // pool exhausted — a short offer set is legal
  }
  return offers;
}

function newSeasonLine(state: GameState): SeasonLine {
  return {
    seasonIndex: state.seasonIndex,
    schoolId: state.school.schoolId,
    snaps: 0,
    stats: {},
    teamWins: 0,
    teamLosses: 0,
  };
}

export function applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void {
  const school = content.schools.find((s) => s.id === schoolId);
  if (!school) throw new Error(`Unknown school: ${schoolId}`);
  state.school = { schoolId: school.id, tier: school.tier };
  if (state.seasons.length === 0) state.seasons.push(newSeasonLine(state));
}
```

- [ ] **Step 5: Remove the moved code from `simulate.ts`**

Delete from `src/engine/simulate.ts`: the `recruitingOptions` function (lines 8-20), the `newSeasonLine` function (lines 22-24), and the `applyRecruitingChoice` function (lines 26-31). Then prune the now-unused imports — `eligibleTiers` from `./draft`, `bestSchoolInTier` from `./schools`, and `SeasonLine` / `Tier` from `./types` if nothing else in the file uses them.

After this, `simulate.ts` contains only `STAT_MODEL`, `ON_FIELD`, and `simulatePhaseProduction`.

This will break `src/engine/advance.ts`, which still imports `recruitingOptions` and `applyRecruitingChoice` from `./simulate`. **That is expected and Task 4 fixes it** — the build will not be green at the end of this step.

- [ ] **Step 6: Run the new tests only**

Run: `npx vitest run src/engine/recruiting.test.ts`
Expected: PASS, 6 tests. `advance.ts` is broken at this point, so do not run the full suite yet.

- [ ] **Step 7: Commit**

```bash
git add src/engine/recruiting.ts src/engine/recruiting.test.ts src/engine/simulate.ts src/content/schema.ts src/content/regions.ts
git commit -m "feat(engine): generateRecruitingOffers + recruiting module split from simulate"
```

---

### Task 4: Wire recruiting through `pendingOptions`

`recruitingOptions` is called twice per recruiting decision — once by `getDecision` to display options, once by `applyChoice` to resolve one. That is safe only while it is pure. Now that offers are sampled, they must be generated **once** and stored, exactly as transfer offers already are.

**Files:**
- Modify: `src/engine/create-career.ts` (generate offers into `pendingOptions`)
- Modify: `src/engine/advance.ts:37-42` (`getDecision` recruiting branch), `:92-99` (`applyChoice` recruiting branch), and the import on line 7
- Modify: `src/engine/schools.ts` (delete the now-unused `bestSchoolInTier`)
- Modify: `src/engine/schools.test.ts` (delete the `bestSchoolInTier` describe block)
- Test: `src/engine/create-career.test.ts`, `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: `generateRecruitingOffers` and `applyRecruitingChoice` from Task 3.
- Produces: `createCareer(setup: Setup, seed: string, content?: ContentBundle): GameState` — third parameter defaults to `CONTENT`; returned state has `pendingOptions` populated and `rngCursor` advanced.

- [ ] **Step 1: Write the failing tests**

In `src/engine/create-career.test.ts`, **replace** the existing test `"carries the seed and starts the rng cursor at 0"` with:

```ts
  it("carries the seed and advances the rng cursor past recruiting-offer generation", () => {
    const s = createCareer(setup, "abc");
    expect(s.seed).toBe("abc");
    expect(s.rngCursor).toBeGreaterThan(0);
  });

  it("populates recruiting offers deterministically", () => {
    const a = createCareer(setup, "abc");
    const b = createCareer(setup, "abc");
    expect(a.pendingOptions).toBeDefined();
    expect(a.pendingOptions!.length).toBeGreaterThan(0);
    expect(a.pendingOptions).toEqual(b.pendingOptions);
  });
```

Add to `src/engine/advance.test.ts`:

```ts
describe("recruiting offers are generated once", () => {
  const rSetup: Setup = { lastName: "Smith", jerseyNumber: 7, homeState: "TX", position: "QB" };

  it("resolves the choice against the same offer set that was displayed", () => {
    const s = createCareer(rSetup, "same-set");
    const decision = getDecision(s)!;
    expect(decision.eventId).toBe("recruiting");
    const chosenId = decision.options[0]!.id;
    const expectedSchoolId = s.pendingOptions!.find((o) => o.id === chosenId)!.schoolId;
    const next = advance(s, chosenId);
    expect(next.school.schoolId).toBe(expectedSchoolId);
  });

  it("accepts every displayed option", () => {
    for (let i = 0; i < 10; i++) {
      const s = createCareer(rSetup, `accept-${i}`);
      for (const opt of getDecision(s)!.options) {
        expect(() => advance(s, opt.id)).not.toThrow();
      }
    }
  });

  it("rejects an option that was not offered", () => {
    const s = createCareer(rSetup, "reject");
    expect(() => advance(s, "commit-not-a-real-school")).toThrow();
  });

  it("clears pendingOptions once the commitment is made", () => {
    const s = createCareer(rSetup, "clear");
    const next = advance(s, getDecision(s)!.options[0]!.id);
    expect(next.pendingOptions).toBeUndefined();
  });
});
```

Make sure `createCareer`, `getDecision`, `advance`, and the `Setup` type are imported in `advance.test.ts` — most already are; add whatever is missing.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/engine/create-career.test.ts src/engine/advance.test.ts`
Expected: FAIL. `advance.ts` does not yet compile (Task 3 removed its imports), and `createCareer` does not populate `pendingOptions`.

- [ ] **Step 3: Update `createCareer`**

Replace the whole of `src/engine/create-career.ts`:

```ts
import type { GameState, Setup } from "./types";
import type { ContentBundle } from "../content/schema";
import { CONTENT } from "../content/index";
import { createRng } from "./rng";
import { generateRecruitingOffers } from "./recruiting";

export const STARTING_OVERALL = 60;
export const STARTING_CHARACTER = 70;
export const RECRUITING_EVENT_ID = "recruiting";

export function createCareer(setup: Setup, seed: string, content: ContentBundle = CONTENT): GameState {
  const state: GameState = {
    seed,
    rngCursor: 0,
    setup,
    overall: STARTING_OVERALL,
    character: STARTING_CHARACTER,
    snapModifier: 1,
    redshirtSeasonActive: false,
    phaseFiredEventIds: [],
    phaseRandomDrawn: false,
    eligibility: { classYear: "FR", yearsUsed: 0, redshirtUsed: false, draftEligible: false },
    school: { schoolId: "", tier: 1 },
    seasonIndex: 0,
    phase: "offseason",
    phaseAbs: 0,
    phaseSimulated: false,
    currentEventId: RECRUITING_EVENT_ID,
    seasons: [],
    trophies: {},
    awards: [],
    moments: [],
    pendingEffects: [],
    injuries: [],
    status: "active",
  };

  // Signing Day offers are sampled, so they must be generated exactly once and
  // stored — getDecision stays pure and never regenerates them.
  const rng = createRng(seed, 0);
  state.pendingOptions = generateRecruitingOffers(state, content, rng);
  state.rngCursor = rng.cursor;
  return state;
}
```

- [ ] **Step 4: Update `advance.ts`**

Change the import on line 7 from:

```ts
import { recruitingOptions, applyRecruitingChoice, simulatePhaseProduction } from "./simulate";
```

to:

```ts
import { simulatePhaseProduction } from "./simulate";
import { applyRecruitingChoice } from "./recruiting";
```

In `getDecision`, replace the recruiting branch:

```ts
  if (state.currentEventId === "recruiting") {
    const opts = state.pendingOptions ?? [];
    return {
      eventId: "recruiting",
      title: "Signing Day",
      description: "Where do you commit?",
      options: opts.map((o) => ({ id: o.id, label: o.label })),
    };
  }
```

In `applyChoice`, replace the recruiting branch:

```ts
  if (s.currentEventId === "recruiting") {
    const offer = (s.pendingOptions ?? []).find((o) => o.id === choiceId);
    if (!offer) throw new Error(`Invalid recruiting choice: ${choiceId}`);
    applyRecruitingChoice(s, offer.schoolId, content);
    s.pendingOptions = undefined;
    s.currentEventId = null;
    return;
  }
```

- [ ] **Step 5: Delete the now-dead `bestSchoolInTier`**

`generateRecruitingOffers` was its last production caller. In `src/engine/schools.ts`, delete the entire `bestSchoolInTier` function (lines 23-37). In `src/engine/schools.test.ts`, delete the whole `describe("bestSchoolInTier", ...)` block (its 2 tests).

If `npm run typecheck` reports `bestSchoolInTier` still imported anywhere, remove that import too.

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, **156 tests**. The arithmetic: 153 after Task 3, plus 4 new in `advance.test.ts`, plus a net +1 in `create-career.test.ts` (1 test replaced by 2), minus the 2 deleted `bestSchoolInTier` tests. If the count differs, reconcile it explicitly before continuing rather than assuming it is fine.

Pay attention to any pre-existing test that asserted a specific recruiting school. Recruiting is now sampled, so such a test is legitimately obsolete — but confirm the change is the sampling and not a real defect before editing it.

- [ ] **Step 7: Typecheck and smoke-test the CLI**

Run: `npm run typecheck && npm run play -- demo`
Expected: both typecheck passes exit 0; the demo plays a QB career to a terminal state and prints JSON.

- [ ] **Step 8: Commit**

```bash
git add src/engine/create-career.ts src/engine/advance.ts src/engine/schools.ts src/engine/schools.test.ts src/engine/create-career.test.ts src/engine/advance.test.ts
git commit -m "feat(engine): generate recruiting offers once into pendingOptions"
```

---

### Task 5: `requiresFinalSeason` event condition

`enterOffseason` stops advancing `classYear` at `SR` while `yearsUsed` keeps climbing, so a redshirted player spends **two** seasons as `SR`. No existing condition can tell them apart, which would make a `minClass: "SR"` milestone fire twice. Stage 3c needs a real once-per-career gate.

**Files:**
- Modify: `src/engine/types.ts:53-61` (`EventConditions`)
- Modify: `src/engine/select-event.ts:6-22` (`eventMatches`)
- Modify: `src/content/schema.ts` (validate the new condition)
- Test: `src/engine/select-event.test.ts`

**Interfaces:**
- Consumes: nothing from Tasks 1-4 — this task is independent of them.
- Produces: `EventConditions.requiresFinalSeason?: boolean`.

**The rule:** the final playable season is `yearsUsed === eligibilityCap - 1`, where `eligibilityCap = CLASS_ORDER.length + (redshirtUsed ? 1 : 0)`. Traced from `enterOffseason`: a non-redshirt career plays seasons at `yearsUsed` 0/1/2/3 against a cap of 4; a redshirted career plays 0/1/2/3/4 against a cap of 5.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/select-event.test.ts`:

```ts
describe("requiresFinalSeason", () => {
  const ev: GameEvent = {
    id: "senior-day",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    conditions: { requiresFinalSeason: true },
    title: "Senior Day",
    description: "The last time you run out of this tunnel.",
    options: [{ id: "go", label: "Go", probability: 1, positiveOutcome: { description: "ok", effects: [] } }],
  };

  const stateWith = (yearsUsed: number, redshirtUsed: boolean): GameState => {
    const base = createCareer({ lastName: "S", jerseyNumber: 7, homeState: "TX", position: "QB" }, "fs");
    return {
      ...base,
      phase: "offseason",
      eligibility: { ...base.eligibility, classYear: "SR", yearsUsed, redshirtUsed },
    };
  };

  it("matches the final season of a career with no redshirt (cap 4)", () => {
    expect(eventMatches(stateWith(3, false), ev)).toBe(true);
  });

  it("does not match earlier seasons of a career with no redshirt", () => {
    expect(eventMatches(stateWith(2, false), ev)).toBe(false);
  });

  it("matches only the fifth season of a redshirted career (cap 5)", () => {
    expect(eventMatches(stateWith(4, true), ev)).toBe(true);
    expect(eventMatches(stateWith(3, true), ev)).toBe(false);
  });

  it("does not match during a redshirt sit season", () => {
    // Taking a redshirt raises the cap by exactly the year it consumes, so the
    // sit season can never be the final season. The latest possible sit is an
    // injured SR at yearsUsed 3 against a cap of 5.
    const sitting = { ...stateWith(3, true), redshirtSeasonActive: true };
    expect(eventMatches(sitting, ev)).toBe(false);
  });

  it("ignores the condition when it is absent", () => {
    const plain: GameEvent = { ...ev, conditions: {} };
    expect(eventMatches(stateWith(1, false), plain)).toBe(true);
  });
});
```

Ensure `GameEvent`, `GameState`, `createCareer`, and `eventMatches` are imported in that file.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/engine/select-event.test.ts`
Expected: FAIL — TypeScript rejects `requiresFinalSeason` as an unknown property of `EventConditions`.

- [ ] **Step 3: Add the condition to the type**

In `src/engine/types.ts`, add the field to `EventConditions`:

```ts
export interface EventConditions {
  position?: Position[];
  minClass?: ClassYear;
  tier?: Tier[];
  requiresInjury?: boolean;
  requiresActiveInjury?: boolean;
  requiresFinalSeason?: boolean;
  maxCharacter?: number;
  maxOverall?: number;
}
```

- [ ] **Step 4: Evaluate it in `eventMatches`**

In `src/engine/select-event.ts`, add this check inside `eventMatches`, after the `requiresActiveInjury` line and before the `maxCharacter` line:

```ts
  if (c.requiresFinalSeason) {
    // Final playable season == yearsUsed one short of the eligibility cap.
    // A redshirt raises the cap by exactly the year it consumes, so a sit
    // season can never satisfy this.
    const cap = CLASS_ORDER.length + (state.eligibility.redshirtUsed ? 1 : 0);
    if (state.eligibility.yearsUsed !== cap - 1) return false;
  }
```

`CLASS_ORDER` is already imported at the top of `select-event.ts`.

- [ ] **Step 5: Validate it**

In `src/content/schema.ts`, inside the `const c = ev.conditions; if (c) { ... }` block, add:

```ts
      if (c.requiresFinalSeason !== undefined && typeof c.requiresFinalSeason !== "boolean")
        errors.push(`Event ${ev.id}: requiresFinalSeason must be a boolean`);
```

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, **161 tests** (156 + 5 new). Both typecheck passes exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/engine/types.ts src/engine/select-event.ts src/content/schema.ts src/engine/select-event.test.ts
git commit -m "feat(engine): requiresFinalSeason condition for once-per-career milestones"
```

---

### Task 6: Whole-stage verification

The prior tasks each verified locally. This confirms the stage holds together and that the balance distribution has not silently shifted.

**Files:**
- Modify: `docs/superpowers/plans/2026-08-07-phase2-stage3b-recruiting-geography.md` (tick the checkboxes)
- Modify: `.superpowers/sdd/progress.md` (ledger entry)

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Full green check**

Run: `npm test && npm run typecheck`
Expected: 161 tests pass; both typecheck passes exit 0.

- [ ] **Step 2: Play a career end-to-end**

Run: `npm run play -- demo`
Expected: a QB career reaches a terminal state and prints JSON. Confirm by eye that the Signing Day options now show **three** schools rather than two, and that they are not all the same state.

- [ ] **Step 3: Balance smoke check**

Run: `npm run balance -- 500 random`
Expected: a distribution summary prints without error.

Compare against the pre-stage baseline. Drafted/undrafted/busted rates should be **broadly similar** — this stage changed which schools get offered, not the progression or draft math. A large shift means the tier mix of offers moved substantially, which is plausible given the 10-school ladder has only 2-3 schools per tier. Record the numbers in the ledger either way; do not treat a shift as a failure, but do note it, because Stage 3c's ladder will change it again.

- [ ] **Step 4: Confirm no purity regressions**

Run: `grep -rn "Math.random\|Date.now\|process\.\|require(" src/engine src/content --include="*.ts" | grep -v "\.test\.ts"`
Expected: no output.

- [ ] **Step 5: Update the ledger**

Append a Stage 3b entry to `.superpowers/sdd/progress.md` following the format of the existing Stage 2a/2b/2c/3a entries: the branch, the commit range, the final test count, per-task commit hashes with review status, the balance numbers from Step 3, and any minors logged for Stage 4.

Add these Stage-4 items, which came out of the Stage-3b design:

- No washout floor on **character** — a very-low-character player sits under every character gate indefinitely, diluted only by the random draw. Intentional for now; revisit when tuning bust rates.
- All Task-1 weights (`homeStateBonus`, `regionBonus`) and `offerCount: 3` are feel-based guesses, not measured. Tune against `npm run balance` once Stage 3c's full ladder exists.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-08-07-phase2-stage3b-recruiting-geography.md .superpowers/sdd/progress.md
git commit -m "docs: Stage 3b complete — plan checked off, ledger updated"
```

---

## Notes for the reviewer

- **The single highest-risk change is Task 4.** The defect it exists to prevent — `getDecision` displaying one offer set while `applyChoice` resolves against a different one — is silent and only reachable once offers are sampled. The test `"resolves the choice against the same offer set that was displayed"` is the direct guard; verify it actually exercises both functions rather than reading `pendingOptions` twice.
- **`createCareer` now consumes rng.** Any test asserting `rngCursor === 0` on a fresh career is now wrong by design. Any test asserting a *specific* recruiting school is also obsolete. Both are legitimate updates; a test asserting a specific *draft outcome* from a fixed seed changing is **not** — that would mean the rng stream shifted under existing careers, which is expected here (career seeds now consume draws earlier) but should be consciously acknowledged rather than silently re-baselined.
- **Task 5 is independent of Tasks 1-4** and can be reviewed on its own.
