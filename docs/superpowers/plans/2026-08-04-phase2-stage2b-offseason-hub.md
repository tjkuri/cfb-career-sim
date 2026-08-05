# Phase 2 — Stage 2b: Offseason Decision Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the currently-automatic offseason into the branch-heavy heart of the game — a chained sequence of decisions (declare → transfer) plus a soft-washout bust path — with a shared home-state/region-weighted school sampler feeding both recruiting and transfer.

**Architecture:** `runOffseasonHub` is refactored into an automatic `enterOffseason` step (development, eligibility, snap-modifier reset, soft-washout check) plus a `raiseNextHubDecision(from)` state machine that presents the offseason decisions one at a time across `advance()` calls. Transfer offers are rng-sampled once when the decision is raised and stored on `GameState.pendingOptions` (so `getDecision` — which has no rng — shows a stable set that `applyChoice` resolves against). A one-season `snapModifier` models the depth-chart consequence of moving up/down. This is Stage 2b of Phase 2 (2a season/postseason systems ✅ → **2b offseason hub** → 2c redshirt → Stage 3 content → Stage 4 balance).

**Tech Stack:** TypeScript (strict), Vitest, tsx CLIs. Node v22.0.0 (< 22.6).

## Global Constraints

- **Engine purity:** no `Math.random`, `Date.now`, or IO in `src/engine/**` or `src/content/**`. All randomness flows through the seeded `Rng` (`GameState.rngCursor`). New engine/content files must type-check under the engine-isolation pass (`tsconfig.engine.json`, `types: []`): import only engine-internal modules and `../content/schema` types.
- **`getDecision` is a pure read with NO rng.** Any decision whose options require rng to generate (transfer) MUST have those options generated when the decision is raised (in `autoProgress`/`applyChoice`/`enterOffseason`, where rng is available) and stored on `state.pendingOptions`. `getDecision` and `applyChoice` both read `pendingOptions` — never regenerate. Recruiting stays deterministic (no rng), so it continues to compute options in `getDecision`.
- **Determinism:** `seed` + choice sequence → byte-identical `GameState`. New rng draws (transfer sampling) are fine; the determinism test (same seed+policy → identical state) must still pass. Balance-harness distribution tests assert loose ranges — re-run and, if a bound drifts, confirm it's sane drift (not a regression) and widen the specific bound with a note, per the Stage-2a precedent. Do NOT mask a structural regression.
- **Content validator is the safety net:** new config (regions, sampler weights, transfer knobs, washout knobs) must be validated (numeric sanity; referenced ids valid). Real `CONTENT` must validate clean at import.
- **Terminal-state discipline:** a `busted` career is terminal — `getDecision` returns null, `advance` makes no further progress, no `draftResult` is set. `finalizeIfEnded` only handles `declared` (unchanged).
- **All numeric config values are initial, balance-tunable starting points** (tuned in Stage 4). Ground them in the existing model; do not treat as final.
- **Redshirt is intentionally OUT of this stage** (deferred to Stage 2c — it needs a design pass on its value under snap-gated development). The hub sequence must leave a clean insertion slot for it (a `"redshirt"` entry in the sequence order that is currently skipped).
- **Real facts only; no real player names.**
- **Conventional commits** with a scope; end every commit body with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Run the whole suite with `npm test` and types with `npm run typecheck` (BOTH passes must be clean).

## File Structure

- `src/content/regions.ts` — **new.** `REGIONS` (region → states) + `SCHOOL_SAMPLER` weights + `TRANSFER` config. Data only.
- `src/content/schema.ts` — **modify.** Add `RegionsConfig`/`SchoolSamplerConfig`/`TransferConfig` types + fields on `ContentBundle`; extend `ProgressionConfig` with washout knobs; validate the new config.
- `src/content/index.ts` — **modify.** Wire new config into `CONTENT`; extend `PROGRESSION` with washout knobs (in `src/content/postseason.ts`).
- `src/content/postseason.ts` — **modify.** Add the washout fields to `PROGRESSION`.
- `src/engine/types.ts` — **modify.** Add `snapModifier` + `pendingOptions?: SchoolOffer[]` to `GameState`; add the `SchoolOffer` type.
- `src/engine/schools.ts` — **new.** `schoolWeight` (shared home-state/region weighting), `bestSchoolInTier` (deterministic argmax, for recruiting), `sampleSchoolInTier` (rng-weighted, for transfer).
- `src/engine/simulate.ts` — **modify.** Refactor `recruitingOptions` onto `bestSchoolInTier`; apply `snapModifier` in `simulatePhaseProduction`.
- `src/engine/transfer.ts` — **new.** `generateTransferOffers(state, content, rng) → SchoolOffer[]`.
- `src/engine/advance.ts` — **modify.** Refactor `runOffseasonHub` → `enterOffseason` + `raiseNextHubDecision`; add soft-washout; add `getDecision`/`applyChoice` transfer branches; thread rng to the hub; reset `snapModifier` at offseason entry.
- `src/engine/create-career.ts` — **modify.** Initialize `snapModifier: 1`.

---

### Task 1: Shared school weighting + region config (5a)

Introduce a home-state/region weighting shared by recruiting and (later) transfer, and refactor recruiting onto it. Recruiting stays deterministic (argmax weight — no rng), so `getDecision` remains a pure read.

**Files:**
- Create: `src/content/regions.ts`
- Create: `src/engine/schools.ts`
- Modify: `src/content/schema.ts`
- Modify: `src/content/index.ts`
- Modify: `src/engine/simulate.ts`
- Test: `src/engine/schools.test.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Produces:
  - In `schema.ts`: `interface RegionsConfig { [region: string]: string[] }`; `interface SchoolSamplerConfig { base: number; homeStateBonus: number; regionBonus: number }`. `ContentBundle` gains `regions: RegionsConfig` and `schoolSampler: SchoolSamplerConfig`.
  - `REGIONS: RegionsConfig`, `SCHOOL_SAMPLER: SchoolSamplerConfig` exported from `content/regions.ts`.
  - In `engine/schools.ts`:
    - `type SchoolRow = ContentBundle["schools"][number]` (re-derived locally; do not import the array).
    - `export function schoolWeight(school: SchoolRow, homeState: string, content: ContentBundle): number` — `base + (school.state === homeState ? homeStateBonus : 0) + (sameRegion(school.state, homeState) ? regionBonus : 0)`.
    - `export function bestSchoolInTier(content: ContentBundle, tier: Tier, homeState: string, excludeId?: string): SchoolRow | undefined` — the highest-weight school in the tier (ties broken by array order), excluding `excludeId`. Deterministic, no rng.
- Consumes (later tasks): `schoolWeight` (Task 5's `sampleSchoolInTier`), `bestSchoolInTier` (recruiting here).

- [ ] **Step 1: Create the region/sampler config**

Create `src/content/regions.ts`:

```ts
import type { RegionsConfig, SchoolSamplerConfig, TransferConfig } from "./schema";

// Region groupings (initial, balance/coverage-tunable). States not listed get no
// region bonus. Only states present in the school ladder need appear.
export const REGIONS: RegionsConfig = {
  South: ["AL", "GA", "FL", "MS", "LA", "SC", "TN", "NC"],
  Midwest: ["OH", "MI", "IN", "IL", "WI", "IA", "MN", "ND", "KS", "MO"],
  West: ["CA", "OR", "WA", "ID", "MT", "CO", "AZ", "UT", "NV"],
  Southwest: ["TX", "OK", "NM"],
  Northeast: ["NY", "NJ", "PA", "MA", "CT"],
};

export const SCHOOL_SAMPLER: SchoolSamplerConfig = { base: 1, homeStateBonus: 6, regionBonus: 2 };

// Transfer knobs (used in Stage-2b Tasks 5-6). One-season snap multipliers by
// move direction, and the "buried" snap threshold that surfaces a move-down offer.
export const TRANSFER: TransferConfig = {
  lateralSnapModifier: 1.1,
  moveUpSnapModifier: 0.6,
  moveDownSnapModifier: 1.3,
  buriedSnapThreshold: 250,
};
```

- [ ] **Step 2: Add config types + bundle fields in schema.ts**

In `src/content/schema.ts`, add these interfaces (near the other config interfaces):

```ts
export interface RegionsConfig { [region: string]: string[] }
export interface SchoolSamplerConfig { base: number; homeStateBonus: number; regionBonus: number }
export interface TransferConfig {
  lateralSnapModifier: number;
  moveUpSnapModifier: number;
  moveDownSnapModifier: number;
  buriedSnapThreshold: number;
}
```

Add to `ContentBundle` (after `progression`):

```ts
  regions: RegionsConfig;
  schoolSampler: SchoolSamplerConfig;
  transfer: TransferConfig;
```

- [ ] **Step 3: Write the failing schools tests**

Create `src/engine/schools.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { schoolWeight, bestSchoolInTier } from "./schools";
import { CONTENT } from "../content/index";

describe("schoolWeight", () => {
  it("weights a home-state school above a same-region school above an out-of-region school", () => {
    // Build three tier-3 schools with known states relative to homeState "TX" (Southwest).
    const content = { ...CONTENT, schools: [
      { id: "home", name: "Home U", tier: 3 as const, conference: "X", state: "TX" },     // home state
      { id: "region", name: "Region U", tier: 3 as const, conference: "X", state: "OK" },  // same region (Southwest)
      { id: "far", name: "Far U", tier: 3 as const, conference: "X", state: "OH" },        // other region
    ]};
    const w = (id: string) => schoolWeight(content.schools.find((s) => s.id === id)!, "TX", content);
    expect(w("home")).toBeGreaterThan(w("region"));
    expect(w("region")).toBeGreaterThan(w("far"));
  });
});

describe("bestSchoolInTier", () => {
  it("returns the highest-weight school in a tier and can exclude one", () => {
    const content = { ...CONTENT, schools: [
      { id: "home", name: "Home U", tier: 3 as const, conference: "X", state: "TX" },
      { id: "far", name: "Far U", tier: 3 as const, conference: "X", state: "OH" },
    ]};
    expect(bestSchoolInTier(content, 3, "TX")!.id).toBe("home");
    expect(bestSchoolInTier(content, 3, "TX", "home")!.id).toBe("far"); // excluded -> next best
  });

  it("returns undefined when a tier has no schools", () => {
    const content = { ...CONTENT, schools: [] };
    expect(bestSchoolInTier(content, 2, "TX")).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `npx vitest run src/engine/schools.test.ts`
Expected: FAIL — `./schools` module / functions not defined.

- [ ] **Step 5: Implement `src/engine/schools.ts`**

```ts
import type { Tier } from "./types";
import type { ContentBundle } from "../content/schema";

type SchoolRow = ContentBundle["schools"][number];

function sameRegion(a: string, b: string, regions: ContentBundle["regions"]): boolean {
  if (a === b) return true;
  for (const states of Object.values(regions)) {
    if (states.includes(a) && states.includes(b)) return true;
  }
  return false;
}

export function schoolWeight(school: SchoolRow, homeState: string, content: ContentBundle): number {
  const cfg = content.schoolSampler;
  let w = cfg.base;
  if (school.state === homeState) w += cfg.homeStateBonus;
  else if (sameRegion(school.state, homeState, content.regions)) w += cfg.regionBonus;
  return w;
}

export function bestSchoolInTier(
  content: ContentBundle,
  tier: Tier,
  homeState: string,
  excludeId?: string,
): SchoolRow | undefined {
  let best: SchoolRow | undefined;
  let bestW = -Infinity;
  for (const s of content.schools) {
    if (s.tier !== tier || s.id === excludeId) continue;
    const w = schoolWeight(s, homeState, content);
    if (w > bestW) { best = s; bestW = w; } // strict > keeps first-in-array on ties
  }
  return best;
}
```

- [ ] **Step 6: Refactor `recruitingOptions` onto `bestSchoolInTier`**

In `src/engine/simulate.ts`, replace the body of `recruitingOptions` (keep its signature and return shape). Add the import `import { bestSchoolInTier } from "./schools";` at the top:

```ts
export function recruitingOptions(
  state: GameState,
  content: ContentBundle,
): { id: string; label: string; schoolId: string; tier: Tier }[] {
  const tiers = eligibleTiers(state);
  const opts: { id: string; label: string; schoolId: string; tier: Tier }[] = [];
  for (const tier of tiers) {
    const school = bestSchoolInTier(content, tier, state.setup.homeState);
    if (!school) continue;
    opts.push({ id: `commit-${school.id}`, label: `Commit to ${school.name}`, schoolId: school.id, tier });
  }
  return opts;
}
```

- [ ] **Step 7: Add validator coverage + wire into CONTENT**

In `src/content/schema.ts`, inside `validateContent`, after the postseason config block, add light validation:

```ts
  for (const [region, states] of Object.entries(bundle.regions))
    if (!Array.isArray(states)) errors.push(`Region ${region}: states must be an array`);
  const sampler = bundle.schoolSampler;
  if (sampler.base < 0 || sampler.homeStateBonus < 0 || sampler.regionBonus < 0)
    errors.push("schoolSampler: weights must be >= 0");
  const tr = bundle.transfer;
  for (const [k, v] of Object.entries(tr))
    if (typeof v === "number" && v < 0) errors.push(`transfer.${k} must be >= 0`);
```

In `src/content/index.ts`, import and wire:

```ts
import { REGIONS, SCHOOL_SAMPLER, TRANSFER } from "./regions";
```

Add to the `CONTENT` object (after `progression`):

```ts
  regions: REGIONS,
  schoolSampler: SCHOOL_SAMPLER,
  transfer: TRANSFER,
```

In `src/content/schema.test.ts`'s `goodBundle()`, add valid fields so it still constructs a complete bundle (import the real config at top: `import { REGIONS, SCHOOL_SAMPLER, TRANSFER } from "./regions";`):

```ts
    regions: REGIONS,
    schoolSampler: SCHOOL_SAMPLER,
    transfer: TRANSFER,
```

Also add a validator test:

```ts
it("rejects negative school-sampler weights", () => {
  const b = goodBundle();
  b.schoolSampler = { base: 1, homeStateBonus: -1, regionBonus: 2 };
  expect(validateContent(b).join()).toContain("schoolSampler");
});
```

- [ ] **Step 8: Run tests and types**

Run: `npm test`
Expected: all green (schools tests + validator test + real CONTENT validates clean; existing recruiting behavior preserved — the recruiting test in advance.test.ts still passes because bestSchoolInTier prefers the home-state school, matching the old "home preferred" behavior).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/content/regions.ts src/engine/schools.ts src/content/schema.ts src/content/index.ts src/engine/simulate.ts src/engine/schools.test.ts src/content/schema.test.ts
git commit -m "feat(engine): shared home-state/region school weighting + region config

Adds schoolWeight/bestSchoolInTier (deterministic argmax) shared by recruiting
now and transfer next, plus REGIONS/SCHOOL_SAMPLER/TRANSFER config. Recruiting
refactored onto the weighting (home-state still preferred; region as tiebreak).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Refactor the hub into `enterOffseason` + `raiseNextHubDecision` (behavior-preserving)

Restructure the offseason hub into an automatic entry step plus a decision state machine, WITHOUT changing behavior yet (declare is still the only decision offered). This de-risks the sequencing machinery before transfer is added.

**Files:**
- Modify: `src/engine/advance.ts`
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Produces:
  - `export function enterOffseason(s: GameState, content: ContentBundle, rng: Rng): void` — the automatic offseason work: development (as today), advance eligibility, force-declare when out of eligibility, then `raiseNextHubDecision(s, content, rng, "entry")`.
  - `raiseNextHubDecision(s: GameState, content: ContentBundle, rng: Rng, from: HubStep): void` where `type HubStep = "entry" | "redshirt" | "declare" | "transfer"`. Sets `s.currentEventId` to the next applicable decision after `from` in the fixed order `["redshirt","declare","transfer"]`, or `null` if none. In this task only `declare` is wired (redshirt is skipped/deferred; transfer is added in Task 6 — leave a `// transfer: added in Stage-2b Task 6` placeholder branch that currently does nothing).
- Consumes: replaces `runOffseasonHub`. The call site in `autoProgress` becomes `enterOffseason(s, content, rng)`.
- Behavior contract (must be identical to pre-refactor): a draft-eligible player is offered `declare`; an out-of-eligibility player is force-declared; otherwise the offseason proceeds with no decision. `applyChoice`'s declare branch, on `"return"`, calls `raiseNextHubDecision(s, content, rng, "declare")` (which currently sets `null` since transfer isn't wired) — behaviorally identical to today's "return clears the decision and proceeds."

- [ ] **Step 1: Write the behavior-preserving tests**

These assert the EXISTING behavior still holds after the refactor (they should already pass today via `runOffseasonHub`; keep them green through the change). Add to `src/engine/advance.test.ts`:

```ts
it("still offers declare at JR and force-declares when out of eligibility (post-refactor)", () => {
  // First-option policy declares at JR (declare is option 0).
  const s = autoplay("refactor-declare");
  expect(["drafted", "busted"]).toContain(s.status);

  // Always-return plays all 4 years then force-declares (no phantom season).
  const r = autoplayAlwaysReturn("refactor-force");
  expect(r.status).toBe("drafted");
  expect(r.eligibility.yearsUsed).toBe(4);
  expect(r.seasons.length).toBe(4);
});
```

- [ ] **Step 2: Run to confirm they pass on current code**

Run: `npx vitest run src/engine/advance.test.ts -t "post-refactor"`
Expected: PASS (this is a characterization test of current behavior — it should pass before the refactor and must stay green through it).

- [ ] **Step 3: Refactor `runOffseasonHub` → `enterOffseason` + `raiseNextHubDecision`**

In `src/engine/advance.ts`, add the `HubStep` type near the top:

```ts
type HubStep = "entry" | "redshirt" | "declare" | "transfer";
const HUB_ORDER: Exclude<HubStep, "entry">[] = ["redshirt", "declare", "transfer"];
```

Replace `runOffseasonHub` with:

```ts
export function enterOffseason(s: GameState, content: ContentBundle, rng: Rng): void {
  // Reset the one-season snap modifier from any prior transfer (Task 4 uses this).
  s.snapModifier = 1;

  // Develop from last season's playing time before advancing eligibility.
  const lastSeason = s.seasons[s.seasons.length - 1];
  if (lastSeason) {
    s.overall = clampOverall(s.overall + developmentDelta(lastSeason.snaps, content.progression));
  }

  // Advance eligibility one class year.
  const ci = CLASS_ORDER.indexOf(s.eligibility.classYear);
  if (ci < CLASS_ORDER.length - 1) s.eligibility.classYear = CLASS_ORDER[ci + 1]!;
  s.eligibility.yearsUsed += 1;
  s.eligibility.draftEligible = s.eligibility.classYear === "JR" || s.eligibility.classYear === "SR";

  if (s.eligibility.yearsUsed >= CLASS_ORDER.length) {
    // Out of eligibility -> forced to declare.
    s.status = "declared";
    return;
  }

  raiseNextHubDecision(s, content, rng, "entry");
}

function raiseNextHubDecision(s: GameState, content: ContentBundle, rng: Rng, from: HubStep): void {
  const startIdx = from === "entry" ? 0 : HUB_ORDER.indexOf(from) + 1;
  for (let i = startIdx; i < HUB_ORDER.length; i++) {
    const step = HUB_ORDER[i]!;
    if (step === "redshirt") continue; // deferred to Stage 2c
    if (step === "declare") {
      if (s.eligibility.draftEligible) { s.currentEventId = DECLARE_EVENT_ID; return; }
    }
    // transfer: added in Stage-2b Task 6.
  }
  s.currentEventId = null;
}
```

Note: `s.snapModifier` is referenced here but the field is added in Task 4. To keep this task compiling standalone, add the field in Task 4 BEFORE this line executes — OR, since tasks are applied in order and this line only assigns, add `snapModifier` to `GameState` + `create-career.ts` now as part of this task's Step 3 (a 2-line addition) so `enterOffseason` compiles. **Do this:** in `src/engine/types.ts` add `snapModifier: number;` to `GameState` (after `character`), and in `src/engine/create-career.ts` add `snapModifier: 1,` to the returned object. (Task 4 then adds the production-scaling logic that USES it.)

- [ ] **Step 4: Update the call site in `autoProgress`**

Replace `runOffseasonHub(s, content);` with `enterOffseason(s, content, rng);` (the `if (s.phase === "offseason")` block, and its follow-up `if (s.currentEventId !== null || s.status !== "active") return;`, are unchanged).

- [ ] **Step 5: Wire declare's return path through the state machine**

In `applyChoice`'s declare branch, on `"return"`, call the state machine so the next hub step (currently none until Task 6) is raised. Change:

```ts
  if (s.currentEventId === DECLARE_EVENT_ID) {
    if (choiceId !== "declare" && choiceId !== "return") {
      throw new Error(`Invalid declare choice: ${choiceId}`);
    }
    if (choiceId === "declare") { s.status = "declared"; s.currentEventId = null; return; }
    // return to school: proceed to the next hub decision (transfer, once wired).
    raiseNextHubDecision(s, content, rng, "declare");
    return;
  }
```

(`raiseNextHubDecision` sets `currentEventId` to null when no further step applies — identical to the old behavior of clearing the decision on return.)

- [ ] **Step 6: Run tests and types**

Run: `npm test`
Expected: all green. Determinism and the always-return / eligibility tests must still pass byte-for-byte (this refactor changes no rng draws: `enterOffseason` consumes rng only via `raiseNextHubDecision`, which in this task makes no rng calls).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/engine/advance.ts src/engine/types.ts src/engine/create-career.ts src/engine/advance.test.ts
git commit -m "refactor(engine): offseason hub into enterOffseason + decision state machine

Splits runOffseasonHub into the automatic enterOffseason step plus a
raiseNextHubDecision(from) sequencer over [redshirt, declare, transfer].
Behavior-preserving (only declare is wired; redshirt deferred, transfer next).
Adds the snapModifier state field (default 1) used by later tasks.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Soft-washout bust in `enterOffseason` (+ e2e busted test)

Add the engine safety-net bust: a career whose overall has collapsed, or who has been buried (near-zero snaps) for consecutive seasons, washes out. This makes the `busted` terminal reachable end-to-end.

**Files:**
- Modify: `src/content/postseason.ts` (extend `PROGRESSION`)
- Modify: `src/content/schema.ts` (`ProgressionConfig` fields + validation)
- Modify: `src/engine/advance.ts` (washout check in `enterOffseason`)
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Produces: `ProgressionConfig` gains `washoutOverallFloor: number`, `washoutSnapFloor: number`, `washoutConsecutiveSeasons: number`. `enterOffseason` sets `s.status = "busted"` + `s.endingReason` when, after development, `s.overall < washoutOverallFloor` OR the last `washoutConsecutiveSeasons` completed seasons all had `snaps < washoutSnapFloor`; it returns immediately without advancing eligibility further or raising a decision.
- Consumes: `s.seasons` (to read recent snaps).

- [ ] **Step 1: Extend the config**

In `src/content/postseason.ts`, extend `PROGRESSION`:

```ts
export const PROGRESSION: ProgressionConfig = {
  snapsPerDevPoint: 180,
  devCap: 3,
  washoutOverallFloor: 45,
  washoutSnapFloor: 60,
  washoutConsecutiveSeasons: 2,
};
```

In `src/content/schema.ts`, extend `ProgressionConfig`:

```ts
export interface ProgressionConfig {
  snapsPerDevPoint: number;
  devCap: number;
  washoutOverallFloor: number;
  washoutSnapFloor: number;
  washoutConsecutiveSeasons: number;
}
```

Add validation in `validateContent` (after the sampler/transfer block):

```ts
  const prog = bundle.progression;
  if (prog.snapsPerDevPoint < 1) errors.push("progression.snapsPerDevPoint must be >= 1");
  if (prog.devCap < 0) errors.push("progression.devCap must be >= 0");
  if (prog.washoutConsecutiveSeasons < 1) errors.push("progression.washoutConsecutiveSeasons must be >= 1");
```

(This also closes the deferred Stage-2a minor about `ProgressionConfig` being unvalidated.)

- [ ] **Step 2: Write the failing tests**

Add to `src/engine/advance.test.ts` (import `enterOffseason` and `CONTENT` — add to existing imports; `enterOffseason` from `./advance`, `CONTENT` from `../content/index`; `createRng` from `./rng`):

```ts
describe("soft-washout bust", () => {
  it("busts a career whose overall has collapsed below the floor", () => {
    const s = createCareer(setup, "washout-ovr");
    s.overall = 40; // below washoutOverallFloor (45)
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
    enterOffseason(s, CONTENT, createRng("washout-ovr"));
    expect(s.status).toBe("busted");
    expect(s.endingReason).toBeTruthy();
    expect(s.currentEventId).toBeNull();
  });

  it("does not bust a healthy, playing career", () => {
    const s = createCareer(setup, "healthy");
    s.overall = 75;
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
    enterOffseason(s, CONTENT, createRng("healthy"));
    expect(s.status).toBe("active");
  });

  it("drives a full career to the busted terminal via advance()", () => {
    // Play one season, then force overall low and advance to the next offseason;
    // the engine must transition to busted and stop (no decision, no draft).
    let s = createCareer(setup, "e2e-bust");
    // advance through recruiting + season 0 up to the first offseason decision or terminal
    let guard = 0;
    while (s.status === "active" && s.seasonIndex === 0 && guard++ < 200) {
      const d = getDecision(s)!;
      s = advance(s, d.options[0]!.id);
    }
    // Now at/after the first offseason. Force a collapse and push to the next offseason.
    s = JSON.parse(JSON.stringify(s));
    s.overall = 38;
    guard = 0;
    while (s.status === "active" && guard++ < 200) {
      const d = getDecision(s);
      if (!d) break;
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
      if (s.status === "busted") break;
    }
    expect(s.status).toBe("busted");
    expect(getDecision(s)).toBeNull();
    expect(s.draftResult).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run src/engine/advance.test.ts -t "washout"`
Expected: FAIL — no washout logic yet (overall-40 career stays `active`).

- [ ] **Step 4: Implement the washout check**

In `src/engine/advance.ts` `enterOffseason`, after the development block and BEFORE advancing eligibility (a collapsed player washes out regardless of class), add:

```ts
  // Soft-washout: collapsed overall, or buried (near-zero snaps) for consecutive seasons.
  const prog = content.progression;
  const recent = s.seasons.slice(-prog.washoutConsecutiveSeasons);
  const buried =
    recent.length >= prog.washoutConsecutiveSeasons &&
    recent.every((line) => line.snaps < prog.washoutSnapFloor);
  if (s.overall < prog.washoutOverallFloor || buried) {
    s.status = "busted";
    s.endingReason =
      s.overall < prog.washoutOverallFloor ? "Lost a step and washed out" : "Buried on the depth chart";
    s.currentEventId = null;
    return;
  }
```

- [ ] **Step 5: Run tests and types**

Run: `npm test`
Expected: all green including the three washout tests. If `balance.test.ts` now reports a non-zero `bustedRate`, that is the intended effect (busts became reachable) — if a bound asserted `bustedRate === 0` it must be updated to a range (e.g. `>= 0`); note any bound change in the report/commit. (With overall developing upward and no bust content yet, natural washouts remain rare, so `bustedRate` will be small.)
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/content/postseason.ts src/content/schema.ts src/engine/advance.ts src/engine/advance.test.ts
git commit -m "feat(engine): soft-washout bust path + progression validation

enterOffseason busts a career whose overall collapsed below the floor or who
was buried (near-zero snaps) for consecutive seasons, making the busted
terminal reachable end-to-end. Also validates ProgressionConfig (closes a
deferred Stage-2a minor).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Apply `snapModifier` in production

Wire the one-season snap modifier (reset at offseason entry in Task 2) into stat production, so a transfer's depth-chart consequence actually affects playing time.

**Files:**
- Modify: `src/engine/simulate.ts`
- Test: `src/engine/simulate.test.ts`

**Interfaces:**
- Consumes: `GameState.snapModifier` (added in Task 2), reset to 1 each `enterOffseason`.
- Produces: `simulatePhaseProduction` multiplies the rolled per-phase snaps by `state.snapModifier` (rounded, floored at 0) before accruing snaps and computing stats. Default modifier 1 → unchanged behavior.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/simulate.test.ts` (match the file's existing helpers for building a state + rng; the sketch shows the assertion):

```ts
it("scales rolled snaps by state.snapModifier", () => {
  // Two identical states + same seed; one with a 0.5 modifier should accrue
  // roughly half the snaps of the 1.0 baseline for the same phase.
  const mk = () => {
    const s = createCareer(setup, "snapmod");
    s.phase = "nonconf";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
    return s;
  };
  const full = mk();
  simulatePhaseProduction(full, createRng("same"));
  const half = mk();
  half.snapModifier = 0.5;
  simulatePhaseProduction(half, createRng("same"));
  expect(half.seasons[0]!.snaps).toBe(Math.round(full.seasons[0]!.snaps * 0.5));
});
```

(If `simulate.test.ts` lacks a `createCareer`/`setup`/`createRng` import, add them — `createCareer` from `./create-career`, `createRng` from `./rng`, and a `Setup` const matching the file's style.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/simulate.test.ts -t "snapModifier"`
Expected: FAIL — snaps are identical regardless of modifier (not yet applied).

- [ ] **Step 3: Apply the modifier**

In `src/engine/simulate.ts` `simulatePhaseProduction`, change the snaps roll to scale by the modifier:

```ts
  const model = STAT_MODEL[state.setup.position];
  const rolled = rngInt(rng, model.snapsMin, model.snapsMax);
  const snaps = Math.max(0, Math.round(rolled * state.snapModifier));
  season.snaps += snaps;
```

(The rest of the function — `skill`, the per-stat jitter loop — is unchanged; it already uses `snaps`.)

- [ ] **Step 4: Run tests and types**

Run: `npm test`
Expected: all green. Determinism holds (the extra multiply consumes no rng; the `rngInt` draw is unchanged, so the same seed yields the same `rolled`).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/simulate.test.ts
git commit -m "feat(engine): apply snapModifier to per-phase snap production

Rolled snaps are scaled by state.snapModifier (default 1, reset each offseason)
so a transfer's depth-chart consequence affects playing time next season.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Transfer offer generation

Pure function generating the transfer offer set (stay + lateral + conditional move-up/move-down) via the shared weighting, rng-sampled.

**Files:**
- Create: `src/engine/transfer.ts`
- Modify: `src/engine/schools.ts` (add `sampleSchoolInTier`)
- Modify: `src/engine/types.ts` (add `SchoolOffer`)
- Test: `src/engine/transfer.test.ts`
- Test: `src/engine/schools.test.ts`

**Interfaces:**
- Produces:
  - In `types.ts`: `export interface SchoolOffer { id: string; label: string; schoolId: string; tier: Tier; snapModifier: number }`. Add `pendingOptions?: SchoolOffer[]` to `GameState`.
  - In `schools.ts`: `export function sampleSchoolInTier(content, tier, homeState, rng, excludeId?): SchoolRow | undefined` — rng-weighted pick by `schoolWeight` (uses `rngWeightedPick`).
  - In `transfer.ts`: `export function generateTransferOffers(state: GameState, content: ContentBundle, rng: Rng): SchoolOffer[]`. Always includes a `stay` offer first (`{ id: "stay", schoolId: <current>, tier: <current>, snapModifier: 1 }`). Adds a lateral offer (a different school in the current tier, `snapModifier = transfer.lateralSnapModifier`) if one exists. Adds a move-up offer (a school in the next tier up) if `Math.max(...eligibleTiers(state)) > current.tier`, `snapModifier = transfer.moveUpSnapModifier`. Adds a move-down offer (a school one tier down) if `current.tier > 1` AND the last completed season's snaps `< transfer.buriedSnapThreshold`, `snapModifier = transfer.moveDownSnapModifier`. Draw order: lateral, then up (if applicable), then down (if applicable) — each consumes rng only when it is generated.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/schools.test.ts`:

```ts
import { sampleSchoolInTier } from "./schools";
import { createRng } from "./rng";

describe("sampleSchoolInTier", () => {
  it("only returns schools in the requested tier and respects exclude", () => {
    const content = { ...CONTENT, schools: [
      { id: "a", name: "A", tier: 2 as const, conference: "X", state: "TX" },
      { id: "b", name: "B", tier: 2 as const, conference: "X", state: "OK" },
      { id: "c", name: "C", tier: 3 as const, conference: "X", state: "TX" },
    ]};
    for (let i = 0; i < 20; i++) {
      const pick = sampleSchoolInTier(content, 2, "TX", createRng(`s-${i}`), "a");
      expect(pick).toBeDefined();
      expect(pick!.tier).toBe(2);
      expect(pick!.id).not.toBe("a");
    }
  });

  it("returns undefined when no school matches", () => {
    const content = { ...CONTENT, schools: [{ id: "c", name: "C", tier: 3 as const, conference: "X", state: "TX" }] };
    expect(sampleSchoolInTier(content, 2, "TX", createRng("x"))).toBeUndefined();
  });
});
```

Create `src/engine/transfer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateTransferOffers } from "./transfer";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "T", jerseyNumber: 1, homeState: "TX", position: "QB" };

function stateAt(tier: 1 | 2 | 3 | 4, overall: number, lastSnaps: number) {
  const s = createCareer(setup, "xfer");
  s.overall = overall;
  s.school = { schoolId: "unt", tier }; // North Texas is tier 2 in the base ladder
  s.seasons.push({ seasonIndex: 0, schoolId: "unt", snaps: lastSnaps, stats: {}, teamWins: 0, teamLosses: 0 });
  return s;
}

describe("generateTransferOffers", () => {
  it("always includes a stay offer first with modifier 1", () => {
    const offers = generateTransferOffers(stateAt(2, 70, 400), CONTENT, createRng("a"));
    expect(offers[0]!.id).toBe("stay");
    expect(offers[0]!.snapModifier).toBe(1);
  });

  it("offers a move-up when the player has outgrown the tier", () => {
    // High overall -> eligibleTiers includes a tier above current (tier 2).
    const offers = generateTransferOffers(stateAt(2, 92, 500), CONTENT, createRng("up"));
    expect(offers.some((o) => o.snapModifier === CONTENT.transfer.moveUpSnapModifier)).toBe(true);
  });

  it("offers a move-down when buried (low snaps) above tier 1", () => {
    const offers = generateTransferOffers(stateAt(3, 70, 100), CONTENT, createRng("down"));
    expect(offers.some((o) => o.snapModifier === CONTENT.transfer.moveDownSnapModifier)).toBe(true);
  });

  it("does not offer move-down when the player is playing plenty", () => {
    const offers = generateTransferOffers(stateAt(3, 70, 500), CONTENT, createRng("nodown"));
    expect(offers.some((o) => o.snapModifier === CONTENT.transfer.moveDownSnapModifier)).toBe(false);
  });

  it("is deterministic for a seed", () => {
    const a = generateTransferOffers(stateAt(2, 80, 400), CONTENT, createRng("same"));
    const b = generateTransferOffers(stateAt(2, 80, 400), CONTENT, createRng("same"));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/engine/transfer.test.ts`
Expected: FAIL — `./transfer` / `generateTransferOffers` not defined (and `sampleSchoolInTier` missing).

- [ ] **Step 3: Add `SchoolOffer` + `pendingOptions`**

In `src/engine/types.ts`, add:

```ts
export interface SchoolOffer {
  id: string;
  label: string;
  schoolId: string;
  tier: Tier;
  snapModifier: number;
}
```

Add to `GameState` (after `currentEventId`):

```ts
  pendingOptions?: SchoolOffer[];
```

- [ ] **Step 4: Add `sampleSchoolInTier`**

In `src/engine/schools.ts`, add the import `import { rngWeightedPick, type Rng } from "./rng";` and:

```ts
export function sampleSchoolInTier(
  content: ContentBundle,
  tier: Tier,
  homeState: string,
  rng: Rng,
  excludeId?: string,
): SchoolRow | undefined {
  const pool = content.schools.filter((s) => s.tier === tier && s.id !== excludeId);
  if (pool.length === 0) return undefined;
  return rngWeightedPick(rng, pool, (s) => schoolWeight(s, homeState, content));
}
```

- [ ] **Step 5: Implement `generateTransferOffers`**

Create `src/engine/transfer.ts`:

```ts
import type { GameState, SchoolOffer, Tier } from "./types";
import type { Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { eligibleTiers } from "./draft";
import { sampleSchoolInTier } from "./schools";

export function generateTransferOffers(state: GameState, content: ContentBundle, rng: Rng): SchoolOffer[] {
  const cfg = content.transfer;
  const homeState = state.setup.homeState;
  const currentTier = state.school.tier;
  const currentSchool = content.schools.find((s) => s.id === state.school.schoolId);

  const offers: SchoolOffer[] = [{
    id: "stay",
    label: currentSchool ? `Stay at ${currentSchool.name}` : "Stay",
    schoolId: state.school.schoolId,
    tier: currentTier,
    snapModifier: 1,
  }];

  const lateral = sampleSchoolInTier(content, currentTier, homeState, rng, state.school.schoolId);
  if (lateral) offers.push({ id: `transfer-${lateral.id}`, label: `Transfer to ${lateral.name} (bigger role)`, schoolId: lateral.id, tier: lateral.tier, snapModifier: cfg.lateralSnapModifier });

  const tiers = eligibleTiers(state);
  const maxTier = Math.max(...tiers) as Tier;
  if (maxTier > currentTier) {
    const upTier = (currentTier + 1) as Tier;
    const up = sampleSchoolInTier(content, upTier, homeState, rng);
    if (up) offers.push({ id: `transfer-${up.id}`, label: `Transfer up to ${up.name} (tougher competition)`, schoolId: up.id, tier: up.tier, snapModifier: cfg.moveUpSnapModifier });
  }

  const lastSeason = state.seasons[state.seasons.length - 1];
  const buried = currentTier > 1 && !!lastSeason && lastSeason.snaps < cfg.buriedSnapThreshold;
  if (buried) {
    const downTier = (currentTier - 1) as Tier;
    const down = sampleSchoolInTier(content, downTier, homeState, rng);
    if (down) offers.push({ id: `transfer-${down.id}`, label: `Transfer down to ${down.name} (guaranteed reps)`, schoolId: down.id, tier: down.tier, snapModifier: cfg.moveDownSnapModifier });
  }

  return offers;
}
```

- [ ] **Step 6: Run tests and types**

Run: `npx vitest run src/engine/transfer.test.ts src/engine/schools.test.ts`
Expected: PASS. (Note: the move-up test relies on `eligibleTiers` returning a tier > 2 for overall 92 — verify against `draft.ts` thresholds; overall 92 gives high draft stock so tier 3/4 unlock. If the base ladder lacks a tier-3 school in/near TX, the sampler still returns some tier-3 school, so the offer is generated.)
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/engine/transfer.ts src/engine/schools.ts src/engine/types.ts src/engine/transfer.test.ts src/engine/schools.test.ts
git commit -m "feat(engine): transfer offer generation (stay/lateral/up/down)

generateTransferOffers builds the offer set via the shared home-state/region
weighting: always a stay offer, a lateral (bigger role), a move-up when the
player has outgrown the tier, and a move-down for reps when buried. Adds
SchoolOffer + GameState.pendingOptions and the rng-weighted sampleSchoolInTier.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wire transfer into the hub sequence

Insert transfer as the final hub decision after declare, with stored offers, `getDecision`/`applyChoice` branches, and consequence application (tier change + snap modifier).

**Files:**
- Modify: `src/engine/advance.ts`
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: `generateTransferOffers` (Task 5), `SchoolOffer`, `GameState.pendingOptions`, `snapModifier`.
- Produces:
  - `raiseNextHubDecision`'s `transfer` branch: sets `s.pendingOptions = generateTransferOffers(s, content, rng)` and `s.currentEventId = TRANSFER_EVENT_ID`.
  - `getDecision` transfer branch: returns `{ eventId: "transfer", title, description, options: s.pendingOptions.map(o => ({ id: o.id, label: o.label })) }`.
  - `applyChoice` transfer branch: finds the chosen `SchoolOffer` in `s.pendingOptions` (throw on unknown/absent), applies it (if not `stay`: set `s.school = { schoolId, tier }`; always set `s.snapModifier = offer.snapModifier`), clears `pendingOptions` + `currentEventId`, and calls `raiseNextHubDecision(s, content, rng, "transfer")` (→ null, offseason proceeds).
- Behavior: after the FR season, every offseason offers transfer (a draft-eligible player is asked declare first; on return, transfer is offered). A declared/washed-out career is never offered transfer.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/advance.test.ts`:

```ts
describe("transfer portal", () => {
  it("offers a transfer decision in the offseason after the first season", () => {
    // Play recruiting + season 0; a first-option policy will hit either a
    // transfer or declare decision. Drive until a transfer decision appears.
    let s = createCareer(setup, "xfer-offered");
    let guard = 0;
    let sawTransfer = false;
    while (s.status === "active" && guard++ < 300) {
      const d = getDecision(s);
      if (!d) break;
      if (d.eventId === "transfer") { sawTransfer = true; break; }
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
    }
    expect(sawTransfer).toBe(true);
  });

  it("staying leaves school unchanged and modifier at 1; moving changes tier and sets the modifier", () => {
    // Build a state parked on a transfer decision by generating offers directly,
    // then exercise applyChoice via advance for a concrete non-stay offer.
    let s = createCareer(setup, "xfer-apply");
    let guard = 0;
    while (s.status === "active" && guard++ < 300) {
      const d = getDecision(s);
      if (!d) throw new Error("no decision");
      if (d.eventId === "transfer") {
        const move = d.options.find((o) => o.id !== "stay");
        const beforeTier = s.school.tier;
        if (move) {
          const after = advance(s, move.id);
          // A non-stay offer sets a non-1 modifier (up<1 or down/lateral>1).
          expect(after.snapModifier).not.toBe(1);
          // tier may change (up/down) or stay (lateral) — but school-or-modifier changed.
          expect(after.school.tier !== beforeTier || after.snapModifier !== 1).toBe(true);
        } else {
          const after = advance(s, "stay");
          expect(after.snapModifier).toBe(1);
        }
        break;
      }
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
    }
    expect(guard).toBeLessThan(300);
  });

  it("rejects an unknown transfer choice id", () => {
    let s = createCareer(setup, "xfer-bad");
    let guard = 0;
    while (s.status === "active" && guard++ < 300) {
      const d = getDecision(s);
      if (!d) throw new Error("no decision");
      if (d.eventId === "transfer") {
        expect(() => advance(s, "not-an-offer")).toThrow();
        break;
      }
      s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
    }
  });

  it("still reaches a terminal state and stays deterministic with transfers in play", () => {
    const a = autoplay("xfer-term");
    const b = autoplay("xfer-term");
    expect(["drafted", "busted"]).toContain(a.status);
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/engine/advance.test.ts -t "transfer portal"`
Expected: FAIL — no transfer decision is ever offered (the `transfer` branch in `raiseNextHubDecision` is still a placeholder), so `sawTransfer` stays false.

- [ ] **Step 3: Wire the transfer branch + decision surface + resolution**

In `src/engine/advance.ts`:

Add the constant and import near the top:

```ts
import { generateTransferOffers } from "./transfer";
const TRANSFER_EVENT_ID = "transfer";
```

In `raiseNextHubDecision`, replace the `// transfer: added in Stage-2b Task 6.` placeholder with:

```ts
    if (step === "transfer") {
      s.pendingOptions = generateTransferOffers(s, content, rng);
      s.currentEventId = TRANSFER_EVENT_ID;
      return;
    }
```

In `getDecision`, add a branch before the generic-event lookup:

```ts
  if (state.currentEventId === TRANSFER_EVENT_ID) {
    const opts = state.pendingOptions ?? [];
    return {
      eventId: TRANSFER_EVENT_ID,
      title: "Transfer Portal",
      description: "The portal is open. Stay, or take an offer?",
      options: opts.map((o) => ({ id: o.id, label: o.label })),
    };
  }
```

In `applyChoice`, add a branch (before the generic-event lookup):

```ts
  if (s.currentEventId === TRANSFER_EVENT_ID) {
    const offer = (s.pendingOptions ?? []).find((o) => o.id === choiceId);
    if (!offer) throw new Error(`Invalid transfer choice: ${choiceId}`);
    if (offer.id !== "stay") s.school = { schoolId: offer.schoolId, tier: offer.tier };
    s.snapModifier = offer.snapModifier;
    s.pendingOptions = undefined;
    s.currentEventId = null;
    raiseNextHubDecision(s, content, rng, "transfer");
    return;
  }
```

- [ ] **Step 4: Run tests and types**

Run: `npm test`
Expected: all green including the transfer-portal tests. The determinism test must still pass. If a `balance.test.ts` bound drifts (transfers change career trajectories / draft-slot spread), confirm sane drift and widen the specific bound with a note (per Global Constraints); do not mask a structural regression.
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/advance.ts src/engine/advance.test.ts
git commit -m "feat(engine): wire transfer portal into the offseason hub sequence

Transfer is raised as the final hub step (after declare-return), with offers
generated once and stored on pendingOptions so getDecision (no rng) shows a
stable set. Resolution applies tier change + one-season snapModifier. The
offseason is now stay/declare/transfer end to end.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Decision 2 transfer, Decision 5a sampler, Decision 3 soft-washout engine part):**
- Shared home-state/region-weighted school sampler, used by recruiting (argmax) and transfer (rng-sample) → Tasks 1 + 5. ✓
- Transfer portal: "tiered offers, always something" (stay + lateral always; move-up when outgrown; move-down-for-reps when buried), consequences = tier change + one-season snap modifier → Tasks 4, 5, 6. ✓
- Hub sequencing (declare → transfer), chained across `advance()` calls via `raiseNextHubDecision(from)`; getDecision purity preserved via stored `pendingOptions` → Tasks 2, 6. ✓
- Soft-washout bust (engine safety net), busted distinct from undrafted, e2e busted test → Task 3. ✓
- Also closes a deferred Stage-2a minor (ProgressionConfig validation) → Task 3. ✓
- **Deliberately deferred (noted, not gaps):** redshirt (Decision 4c) → Stage 2c, with a design pass on its value under snap-gated development; the hub `HUB_ORDER` reserves the `"redshirt"` slot. Bust *content* events (career-ending injury / academic / expulsion) → Stage 3. Balance re-tuning of all initial config values → Stage 4. Richer/randomized recruiting variety → later (recruiting stays deterministic-weighted here).

**Placeholder scan:** No TBD/TODO. Every code step shows complete code; run steps give exact commands + expected results. The `// transfer: added in Stage-2b Task 6` marker in Task 2 is an intentional, explicitly-replaced placeholder (Task 6 Step 3 replaces it), not an unfinished spec.

**Type/interface consistency:** `SchoolOffer` (Task 5) is used by `pendingOptions` (Task 5), `generateTransferOffers` (Task 5), and the getDecision/applyChoice branches (Task 6). `snapModifier` is added to `GameState`+`create-career` in Task 2 (so `enterOffseason` compiles), reset in `enterOffseason` (Task 2), applied in production (Task 4), and set on transfer (Task 6). `raiseNextHubDecision(s, content, rng, from)` signature is identical across its definition (Task 2), its declare-return caller (Task 2), its transfer caller (Task 6), and `enterOffseason`. `HubStep`/`HUB_ORDER` reserve `"redshirt"`. `schoolWeight` is shared by `bestSchoolInTier` (Task 1) and `sampleSchoolInTier` (Task 5). Config types (`RegionsConfig`/`SchoolSamplerConfig`/`TransferConfig`, extended `ProgressionConfig`) are defined in `schema.ts` and consumed identically in `content/regions.ts`, `content/postseason.ts`, and the engine.

**getDecision purity (the subtle architectural point):** transfer options require rng, but `getDecision` has none — resolved by generating offers when the decision is *raised* (Task 6, in `raiseNextHubDecision`, which has rng) and storing them on `pendingOptions`; `getDecision` and `applyChoice` both read that stored set. Recruiting stays deterministic so it needs no storage. ✓

**Determinism/RNG-shift:** transfer sampling adds rng draws inside the offseason; determinism (same seed+policy → identical state) is asserted in Task 6. Balance distribution drift is handled with the Stage-2a discipline (confirm sane drift, widen the specific bound with a note; never mask a structural regression) in Tasks 3 and 6. ✓
