# School Identity Traits — Wave 1 (scaffolding + `wideOpen`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the school ladder mechanically load-bearing by shipping the trait scaffolding plus the first trait, `wideOpen`, so that choosing between two same-tier schools changes a career.

**Architecture:** A school carries at most one trait from a closed vocabulary. Wave 1 lands the type, the schema field, the content-side magnitude table, the trait lookup, a snap modifier orthogonal to `state.snapModifier`, a trait-conditional ambient injury roll, the `schoolTrait` event-condition key, `wideOpen`'s authored content, and a per-trait measurement probe. Waves 2 (`factory`) and 3 (`developmental`) reuse all of it.

**Tech Stack:** TypeScript (ESM, strict), vitest, tsx. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-07-school-identity-traits-design.md`

## Global Constraints

- **Two typecheck passes must both exit 0:** `npm run typecheck` runs `tsc -p tsconfig.engine.json && tsc -p tsconfig.json`. The engine pass forbids Node globals in `src/engine/**` and `src/content/**` — no `process`, no `console`, no `Buffer` in those trees.
- **All magnitudes live content-side.** The engine reads `content.schoolTraits`; it never hardcodes a number. House rule: "Engine stays generic; all numbers are tunable in the balance pass."
- **`npm run balance -- 500 random` is too small to judge `bustedRate`** (QB read 0.002 at n=500 against 0.0053 at n=3000). Use n=3000/position for any band judgment.
- **`draftedRate` means "reached the draft", not "was picked."** Actually picked is `draftedRate − undraftedRate`.
- **Only one random event fires per phase.** Adding shared content proportionally reduces position-event draws, lowering award stats and moving `allConfRate`. This is expected coupling — re-place thresholds in `src/content/postseason.ts`, do not reshape the content.
- **Never assert zero-mean from arithmetic on inputs.** `developmentDelta` floors, `productionScore` clamps at `min(15, snaps/200)`, `deriveDraftStock` clamps `[0,100]`, washout is a threshold test. Claims come from measured outputs only.
- **Target bands** (from `docs/superpowers/STAGE4-HANDOFF.md`), all to be re-verified at n=3000/position in Task 9:

  | metric | band |
  |---|---|
  | actually picked (`draftedRate − undraftedRate`) | 0.85–0.95 |
  | `round1Rate`, non-K | 0.01–0.05 |
  | `round1Rate`, K | strictly below the non-K floor |
  | `bustedRate` | 0.005–0.03, never 0 (OL's recorded 0.0043 exception stands) |
  | `allConfRate` | 0.40–0.55, spread ≤ 1.25x |
  | `charUnder55Rate` | 0.35–0.50 |
  | `avgSeasons` | 3.0–3.5 |

- **Out of scope for wave 1:** `factory` and `developmental` get config entries and validator coverage but **no school carries them**, so they stay mechanically inert until waves 2–3. Do not write the "every tier carries two distinct identities" test in this wave — it cannot pass until wave 3.

---

## File Structure

**Create:**
- `src/content/school-traits.ts` — the `SCHOOL_TRAITS` magnitude table. One responsibility: trait numbers.
- `src/engine/school-effects.ts` — trait *mechanics*: `schoolTraitOf`, `schoolSnapModifier`, `rollAmbientInjury`. Deliberately separate from `src/engine/schools.ts`, which stays the geography sampler.
- `src/engine/school-effects.test.ts` — direct mechanical assertions.
- `src/content/events/school-life.ts` — trait-gated content. Follows the `season-life.ts` precedent rather than growing `universal.ts` past its current 330 lines.
- `src/sim/trait-probe.ts` — per-trait outcome measurement.
- `src/content/school-traits.test.ts` — realized trait distribution across home states.

**Modify:**
- `src/engine/types.ts` — `SchoolTrait`, `ALL_SCHOOL_TRAITS`, `EventConditions.schoolTrait`
- `src/content/schema.ts` — `SchoolTraitConfig`, school row `trait`, `ContentBundle.schoolTraits`, validator rules
- `src/content/index.ts` — wire `SCHOOL_TRAITS` into `CONTENT`
- `src/content/schools.ts` — assign `wideOpen`, add offer hints
- `src/engine/simulate.ts` — apply `schoolSnapModifier`
- `src/engine/advance.ts` — call `rollAmbientInjury`
- `src/engine/select-event.ts` — honour `conditions.schoolTrait`
- `src/engine/recruiting.ts` — hint text in offer labels
- `src/content/events/index.ts` + `index.test.ts` — wire and guard the new slice
- `src/sim/balance.ts` — optional `homeState` parameter
- `package.json` — `traits` script

---

### Task 1: Trait vocabulary, schema, and magnitude table

**Files:**
- Modify: `src/engine/types.ts`
- Modify: `src/content/schema.ts`
- Create: `src/content/school-traits.ts`
- Modify: `src/content/index.ts`
- Create: `src/engine/school-effects.ts`
- Test: `src/content/schema.test.ts`, `src/engine/school-effects.test.ts`

**Interfaces:**
- Produces: `type SchoolTrait = "wideOpen" | "factory" | "developmental"`; `ALL_SCHOOL_TRAITS: SchoolTrait[]`; `interface SchoolTraitConfig`; `SCHOOL_TRAITS: SchoolTraitConfig`; `ContentBundle.schoolTraits: SchoolTraitConfig`; school rows gain `trait?: SchoolTrait`; `schoolTraitOf(state: GameState, content: ContentBundle): SchoolTrait | undefined`.

- [ ] **Step 1: Write the failing validator test**

Append to `src/content/schema.test.ts` (inside the existing top-level `describe`; reuse whatever `baseBundle()`/fixture helper the file already defines — read the file first and match its style):

```ts
it("rejects an unknown trait on a school row", () => {
  const bundle = baseBundle();
  // Cast: the point is to catch a bad value arriving from outside the type system.
  bundle.schools = [{ id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL", trait: "nonsense" as never }];
  expect(validateContent(bundle).join("\n")).toContain('unknown trait "nonsense"');
});

it("rejects a wideOpen injury probability outside [0,1]", () => {
  const bundle = baseBundle();
  bundle.schoolTraits = { ...bundle.schoolTraits, wideOpen: { ...bundle.schoolTraits.wideOpen, injuryProbPerPhase: 1.5 } };
  expect(validateContent(bundle).join("\n")).toContain("schoolTraits.wideOpen.injuryProbPerPhase must be in [0,1]");
});

it("rejects a wideOpen injury type that is not in the injury table", () => {
  const bundle = baseBundle();
  bundle.schoolTraits = { ...bundle.schoolTraits, wideOpen: { ...bundle.schoolTraits.wideOpen, injuryTypes: ["papercut"] } };
  expect(validateContent(bundle).join("\n")).toContain('schoolTraits.wideOpen: unknown injury "papercut"');
});

it("rejects a zero snap modifier, which would zero out a season", () => {
  const bundle = baseBundle();
  bundle.schoolTraits = { ...bundle.schoolTraits, wideOpen: { ...bundle.schoolTraits.wideOpen, snapModifier: 0 } };
  expect(validateContent(bundle).join("\n")).toContain("schoolTraits.wideOpen.snapModifier must be > 0");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/content/schema.test.ts`
Expected: FAIL — `schoolTraits` does not exist on the bundle type, and the messages are not produced.

- [ ] **Step 3: Add the type to `src/engine/types.ts`**

Add directly below the existing `export type Tier = 1 | 2 | 3 | 4;` line:

```ts
// A school's mechanical identity. Closed vocabulary: 57 schools x combinations
// is a surface no test can cover, so a school carries at most one, and most
// carry none. "Untraited" is a legitimate identity — the ordinary program.
export type SchoolTrait = "wideOpen" | "factory" | "developmental";
```

And add to the existing const-list block beside `ALL_POSITIONS`:

```ts
export const ALL_SCHOOL_TRAITS: SchoolTrait[] = ["wideOpen", "factory", "developmental"];
```

- [ ] **Step 4: Add the schema types in `src/content/schema.ts`**

Import `SchoolTrait` by adding it to the existing type import from `"../engine/types"`. Add the config interface next to `SchoolSamplerConfig`:

```ts
// Trait magnitudes. Every trait pairs a benefit with a cost of the SAME
// temporal scope, so no transfer pattern can collect one without the other —
// generateTransferOffers emits a lateral offer every offseason unconditionally,
// so a one-shot benefit against an ongoing cost is farmable by hopping.
export interface SchoolTraitConfig {
  // Both sides ongoing while enrolled.
  wideOpen: { snapModifier: number; injuryProbPerPhase: number; injuryTypes: string[] };
  // Cost front-loaded, benefit accrued per season at the school and capped.
  factory: { firstSeasonSnapModifier: number; draftStockBonusPerSeason: number; draftStockBonusCap: number };
  // Cost front-loaded, benefit ongoing while enrolled.
  developmental: { snapsPerDevPointMultiplier: number; earlySnapModifier: number; earlySeasons: number };
}
```

Change the `schools` field on `ContentBundle` to add the optional trait, and add `schoolTraits`:

```ts
  schools: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string; trait?: SchoolTrait }[];
  schoolTraits: SchoolTraitConfig;
```

- [ ] **Step 5: Add the validator rules in `src/content/schema.ts`**

Insert immediately after the existing `redshirt` block (the `rs.sitSnapModifier` line), before `const seen = new Set<string>();`:

```ts
  const knownTraits = new Set<string>(ALL_SCHOOL_TRAITS);
  for (const school of bundle.schools)
    if (school.trait !== undefined && !knownTraits.has(school.trait))
      errors.push(`School ${school.id}: unknown trait "${school.trait}"`);

  const st = bundle.schoolTraits;
  // A snap modifier of 0 would zero a whole season's production, so these are
  // strictly positive — same reasoning as the transfer modifiers above.
  if (st.wideOpen.snapModifier <= 0) errors.push("schoolTraits.wideOpen.snapModifier must be > 0");
  if (st.factory.firstSeasonSnapModifier <= 0) errors.push("schoolTraits.factory.firstSeasonSnapModifier must be > 0");
  if (st.developmental.earlySnapModifier <= 0) errors.push("schoolTraits.developmental.earlySnapModifier must be > 0");
  if (st.developmental.snapsPerDevPointMultiplier <= 0)
    errors.push("schoolTraits.developmental.snapsPerDevPointMultiplier must be > 0");
  if (!inRange(st.wideOpen.injuryProbPerPhase))
    errors.push("schoolTraits.wideOpen.injuryProbPerPhase must be in [0,1]");
  if (st.wideOpen.injuryTypes.length === 0)
    errors.push("schoolTraits.wideOpen.injuryTypes must not be empty");
  for (const t of st.wideOpen.injuryTypes)
    if (!knownInjuries.has(t)) errors.push(`schoolTraits.wideOpen: unknown injury "${t}"`);
  if (st.factory.draftStockBonusPerSeason < 0) errors.push("schoolTraits.factory.draftStockBonusPerSeason must be >= 0");
  if (st.factory.draftStockBonusCap < 0) errors.push("schoolTraits.factory.draftStockBonusCap must be >= 0");
  if (!Number.isInteger(st.developmental.earlySeasons) || st.developmental.earlySeasons < 1)
    errors.push("schoolTraits.developmental.earlySeasons must be an integer >= 1");
```

Add `ALL_SCHOOL_TRAITS` to the value import from `"../engine/types"` (the file already imports `CLASS_ORDER` from there).

- [ ] **Step 6: Create `src/content/school-traits.ts`**

```ts
import type { SchoolTraitConfig } from "./schema";

// Initial values. Wave 1 measures and calibrates wideOpen (see the wave-1 plan,
// Task 6); factory and developmental are carried here so the schema and
// validator are exercised, but NO SCHOOL CARRIES THEM YET — they are inert
// until waves 2 and 3 size them against their own probe runs.
//
// Sizing note for wideOpen's cost, which is easy to get wrong by ~2x: one
// ambient injury costs ~1.67 of the 3 on-field phases in a season, not one.
// applyEffect sets remainingPhases to recoveryPhases (>= 2, schema-enforced),
// isSidelined is `remainingPhases > 0`, and tickPhaseStart decrements THEN
// heals — so the applying phase and the next are both lost. The offseason
// absorbs a tick for free, so a postseason fire costs 1 on-field phase while a
// nonconf or conference fire costs 2; mean 5/3.
//
// At injuryProbPerPhase 0.06 over ~9.3 on-field phases per career, that is
// ~0.56 extra injuries costing ~0.31 seasons of snaps, against an ongoing
// +15% snap bonus. Starting point only — Task 6 replaces these with measured
// values.
export const SCHOOL_TRAITS: SchoolTraitConfig = {
  wideOpen: {
    snapModifier: 1.15,
    injuryProbPerPhase: 0.06,
    // Soft-tissue and lower-body knocks: the injuries of a player taking more
    // snaps than his body is ready for. Deliberately excludes acl — the
    // heavy-lever injury stays reserved (see the handoff's tuning-lever list).
    injuryTypes: ["hamstring", "ankle", "turfToe"],
  },
  factory: { firstSeasonSnapModifier: 0.8, draftStockBonusPerSeason: 1.5, draftStockBonusCap: 5 },
  developmental: { snapsPerDevPointMultiplier: 0.85, earlySnapModifier: 0.9, earlySeasons: 2 },
};
```

- [ ] **Step 7: Wire it into `src/content/index.ts`**

Add `import { SCHOOL_TRAITS } from "./school-traits";` alongside the other content imports, and add `schoolTraits: SCHOOL_TRAITS,` to the `CONTENT` object literal (put it directly after `schoolSampler`).

- [ ] **Step 8: Create `src/engine/school-effects.ts` with the lookup**

```ts
import type { GameState, SchoolTrait } from "./types";
import type { ContentBundle } from "../content/schema";

// The trait of the school the player is CURRENTLY at, or undefined.
//
// Must tolerate an empty schoolId: eligibleTiers -> deriveDraftStock runs at
// Signing Day from createCareer, before the player has a school at all.
export function schoolTraitOf(state: GameState, content: ContentBundle): SchoolTrait | undefined {
  if (!state.school.schoolId) return undefined;
  return content.schools.find((s) => s.id === state.school.schoolId)?.trait;
}
```

- [ ] **Step 9: Write the lookup test**

Create `src/engine/school-effects.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { schoolTraitOf } from "./school-effects";
import { createCareer } from "./create-career";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const SETUP: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("schoolTraitOf", () => {
  it("returns undefined at Signing Day, when the player has no school yet", () => {
    const s = createCareer(SETUP, "trait-lookup");
    expect(s.school.schoolId).toBe("");
    expect(schoolTraitOf(s, CONTENT)).toBeUndefined();
  });

  it("returns undefined for a school id that is not in the ladder", () => {
    const s = createCareer(SETUP, "trait-lookup");
    s.school = { schoolId: "not-a-real-school", tier: 2 };
    expect(schoolTraitOf(s, CONTENT)).toBeUndefined();
  });

  it("returns the trait of the current school", () => {
    const traited = CONTENT.schools.find((x) => x.trait !== undefined);
    expect(traited, "no school carries a trait — Task 4 assigns them").toBeDefined();
    const s = createCareer(SETUP, "trait-lookup");
    s.school = { schoolId: traited!.id, tier: traited!.tier };
    expect(schoolTraitOf(s, CONTENT)).toBe(traited!.trait);
  });
});
```

Note: the third test is expected to fail until Task 4 assigns traits. That is intentional — it is the guard that Task 4 actually happened. If running tasks strictly one at a time, mark it `it.skip` here and un-skip it in Task 4 Step 5.

- [ ] **Step 10: Run the full suite and both typechecks**

Run: `npm test && npm run typecheck`
Expected: schema tests PASS; the two `schoolTraitOf` undefined-cases PASS; the third is failing or skipped pending Task 4. Both typecheck passes exit 0.

- [ ] **Step 11: Commit**

```bash
git add src/engine/types.ts src/content/schema.ts src/content/school-traits.ts src/content/index.ts src/engine/school-effects.ts src/engine/school-effects.test.ts src/content/schema.test.ts
git commit -m "feat(content): add the school-trait vocabulary, schema, and magnitude table

Scaffolding for making the 57-school ladder mechanically load-bearing. No
school carries a trait yet, so behaviour is unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `schoolSnapModifier`, applied in production

**Files:**
- Modify: `src/engine/school-effects.ts`
- Modify: `src/engine/simulate.ts:17-31`
- Modify: `src/engine/advance.ts` (call site, ~line 273)
- Test: `src/engine/school-effects.test.ts`

**Interfaces:**
- Consumes: `schoolTraitOf` (Task 1).
- Produces: `schoolSnapModifier(state: GameState, content: ContentBundle): number`. **Breaking signature change:** `simulatePhaseProduction(state, rng)` becomes `simulatePhaseProduction(state, content, rng)`.

- [ ] **Step 1: Write the failing test**

Append to `src/engine/school-effects.test.ts`:

```ts
import { schoolSnapModifier } from "./school-effects";

describe("schoolSnapModifier", () => {
  it("is 1 for an untraited school", () => {
    const plain = CONTENT.schools.find((x) => x.trait === undefined)!;
    const s = createCareer(SETUP, "snapmod");
    s.school = { schoolId: plain.id, tier: plain.tier };
    expect(schoolSnapModifier(s, CONTENT)).toBe(1);
  });

  it("is 1 at Signing Day, before the player has a school", () => {
    const s = createCareer(SETUP, "snapmod");
    expect(schoolSnapModifier(s, CONTENT)).toBe(1);
  });

  it("applies the wideOpen bonus for as long as the player is enrolled, not just year one", () => {
    // The benefit is deliberately NOT tenure-keyed: it is paired with an
    // ongoing injury cost, and a one-shot benefit against an ongoing cost is
    // farmable by hopping between wideOpen schools (a lateral transfer offer
    // is generated every single offseason).
    const wide = CONTENT.schools.find((x) => x.trait === "wideOpen")!;
    const s = createCareer(SETUP, "snapmod");
    s.school = { schoolId: wide.id, tier: wide.tier };
    const expected = CONTENT.schoolTraits.wideOpen.snapModifier;
    for (const seasonsPlayed of [0, 1, 2, 3]) {
      s.seasons = Array.from({ length: seasonsPlayed }, (_, i) => ({
        seasonIndex: i, schoolId: wide.id, snaps: 400, stats: {}, teamWins: 6, teamLosses: 6,
      }));
      expect(schoolSnapModifier(s, CONTENT), `season ${seasonsPlayed}`).toBe(expected);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/school-effects.test.ts`
Expected: FAIL — `schoolSnapModifier` is not exported.

- [ ] **Step 3: Implement `schoolSnapModifier`**

Append to `src/engine/school-effects.ts`:

```ts
// The school's multiplier on a phase's snap roll.
//
// Deliberately NOT written into state.snapModifier: transfer and redshirt
// already own that field and enterOffseason resets it to 1 every year, so a
// third writer would contend for one mutable and the reset would silently eat
// a multi-season effect. This is a separate, derived multiplier.
//
// wideOpen is not tenure-keyed (its cost is ongoing too). factory and
// developmental land in waves 2 and 3 and ARE tenure-keyed.
export function schoolSnapModifier(state: GameState, content: ContentBundle): number {
  const trait = schoolTraitOf(state, content);
  if (trait === "wideOpen") return content.schoolTraits.wideOpen.snapModifier;
  return 1;
}
```

- [ ] **Step 4: Apply it in `src/engine/simulate.ts`**

Change the signature and the snap line. The function currently reads:

```ts
export function simulatePhaseProduction(state: GameState, rng: Rng): void {
```

Replace with:

```ts
export function simulatePhaseProduction(state: GameState, content: ContentBundle, rng: Rng): void {
```

Add the imports at the top of the file:

```ts
import type { ContentBundle } from "../content/schema";
import { schoolSnapModifier } from "./school-effects";
```

And change the snap computation from:

```ts
  const snaps = Math.max(0, Math.round(rolled * state.snapModifier));
```

to:

```ts
  const snaps = Math.max(0, Math.round(rolled * state.snapModifier * schoolSnapModifier(state, content)));
```

- [ ] **Step 5: Update the call site in `src/engine/advance.ts`**

Change `simulatePhaseProduction(s, rng);` to `simulatePhaseProduction(s, content, rng);`.

- [ ] **Step 6: Fix any other callers**

Run: `grep -rn "simulatePhaseProduction" src/`
Update every call — `src/engine/simulate.test.ts` calls it directly and needs `CONTENT` threaded through. Import `CONTENT` from `"../content/index"` there if it is not already imported.

- [ ] **Step 7: Run the suite and typechecks**

Run: `npm test && npm run typecheck`
Expected: PASS, both typecheck passes exit 0. Existing seeded assertions still hold — no school carries a trait yet, so every multiplier is still 1 and no RNG draw was added.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(engine): let a school's trait scale a phase's snap roll

schoolSnapModifier is derived rather than written into state.snapModifier,
which transfer and redshirt already own and enterOffseason resets yearly.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: The ambient injury roll

**Files:**
- Modify: `src/engine/school-effects.ts`
- Modify: `src/engine/advance.ts` (in `autoProgress`, ~lines 265-273)
- Test: `src/engine/school-effects.test.ts`

**Interfaces:**
- Consumes: `schoolTraitOf` (Task 1); `applyEffect`, `isSidelined`, `InjuryLookup` from `./effects`; `rngChance`, `rngPick` from `./rng`.
- Produces: `rollAmbientInjury(state: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void`.

- [ ] **Step 1: Write the failing tests**

Append to `src/engine/school-effects.test.ts`:

```ts
import { rollAmbientInjury } from "./school-effects";
import { createRng } from "./rng";
import { INJURIES } from "../content/injuries";

const injuryOf = (t: string) => INJURIES[t]!;

describe("rollAmbientInjury", () => {
  it("consumes no RNG at an untraited school, so those careers are bit-for-bit unchanged", () => {
    // The whole point of gating the draw on the trait: a career that never
    // attends a traited school must consume exactly the RNG it consumed before
    // this feature existed.
    const plain = CONTENT.schools.find((x) => x.trait === undefined)!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: plain.id, tier: plain.tier };
    const rng = createRng("ambient");
    rollAmbientInjury(s, CONTENT, rng, injuryOf);
    expect(rng.cursor).toBe(0);
    expect(s.injuries).toHaveLength(0);
  });

  it("never fires when the probability is 0, and consumes no draw", () => {
    const wide = CONTENT.schools.find((x) => x.trait === "wideOpen")!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: wide.id, tier: wide.tier };
    const content = { ...CONTENT, schoolTraits: { ...CONTENT.schoolTraits, wideOpen: { ...CONTENT.schoolTraits.wideOpen, injuryProbPerPhase: 0 } } };
    const rng = createRng("ambient");
    rollAmbientInjury(s, content, rng, injuryOf);
    expect(rng.cursor).toBe(0);
    expect(s.injuries).toHaveLength(0);
  });

  it("always fires at probability 1 and applies a real injury from the configured list", () => {
    const wide = CONTENT.schools.find((x) => x.trait === "wideOpen")!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: wide.id, tier: wide.tier };
    const content = { ...CONTENT, schoolTraits: { ...CONTENT.schoolTraits, wideOpen: { ...CONTENT.schoolTraits.wideOpen, injuryProbPerPhase: 1 } } };
    const before = s.overall;
    rollAmbientInjury(s, content, createRng("ambient"), injuryOf);
    expect(s.injuries).toHaveLength(1);
    expect(content.schoolTraits.wideOpen.injuryTypes).toContain(s.injuries[0]!.injuryType);
    expect(s.careerInjuries).toBe(1);
    expect(s.overall).toBeLessThan(before);
  });

  it("does not stack a second injury on an already-sidelined player", () => {
    const wide = CONTENT.schools.find((x) => x.trait === "wideOpen")!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: wide.id, tier: wide.tier };
    s.injuries.push({ kind: "injury", injuryType: "ankle", remainingPhases: 2, restoreAmount: 5 });
    const content = { ...CONTENT, schoolTraits: { ...CONTENT.schoolTraits, wideOpen: { ...CONTENT.schoolTraits.wideOpen, injuryProbPerPhase: 1 } } };
    rollAmbientInjury(s, content, createRng("ambient"), injuryOf);
    expect(s.injuries).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/school-effects.test.ts`
Expected: FAIL — `rollAmbientInjury` is not exported.

- [ ] **Step 3: Implement `rollAmbientInjury`**

Append to `src/engine/school-effects.ts`, adding the imports it needs:

```ts
import { applyEffect, isSidelined, type InjuryLookup } from "./effects";
import { rngChance, rngPick, type Rng } from "./rng";

// wideOpen's cost: a thin two-deep means you keep playing hurt.
//
// The engine has never had an ambient injury source — injuries have only ever
// come from event effects — so this is scoped tightly to the trait.
//
// The draw happens ONLY when the trait is present, which keeps the change
// surgical: a career that never attends a wideOpen school consumes exactly the
// RNG it consumed before, and its seeded outcome is unchanged. (rngChance also
// short-circuits at probability 0 without consuming a draw.)
//
// Cost calibration note: one fire costs ~1.67 of the 3 on-field phases in a
// season, because recoveryPhases >= 2 is schema-enforced and tickPhaseStart
// decrements then heals — the applying phase AND the next are both lost. The
// offseason absorbs a tick for free, so postseason fires cost 1 on-field phase
// and nonconf/conference fires cost 2.
//
// The DURABLE cost is the lost snaps, not the overall hit: applyEffect stores
// restoreAmount and tickPhaseStart gives the overall back on heal. The overall
// only bites where it straddles a boundary — enterOffseason's development and
// washout checks, or deriveDraftStock if the player declares before healing.
export function rollAmbientInjury(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
  injuryOf: InjuryLookup,
): void {
  if (schoolTraitOf(state, content) !== "wideOpen") return;
  if (isSidelined(state)) return;
  const cfg = content.schoolTraits.wideOpen;
  if (!rngChance(rng, cfg.injuryProbPerPhase)) return;
  applyEffect(state, { kind: "injury", injuryType: rngPick(rng, cfg.injuryTypes) }, injuryOf);
}
```

- [ ] **Step 4: Call it from `src/engine/advance.ts`**

In `autoProgress`, the existing block reads:

```ts
      if (ON_FIELD_PHASES.has(s.phase)) {
        const last = s.seasons[s.seasons.length - 1];
        if (!last || last.seasonIndex !== s.seasonIndex) {
          s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
        }
      }
      simulatePhaseProduction(s, content, rng);
```

Add the roll between them, so a fired injury sidelines the player for the phase it fires in:

```ts
      if (ON_FIELD_PHASES.has(s.phase)) {
        const last = s.seasons[s.seasons.length - 1];
        if (!last || last.seasonIndex !== s.seasonIndex) {
          s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
        }
        // Before production, so a fire costs this phase's snaps too.
        rollAmbientInjury(s, content, rng, injuryOf);
      }
      simulatePhaseProduction(s, content, rng);
```

Import `rollAmbientInjury` from `"./school-effects"`.

- [ ] **Step 5: Run the suite and typechecks**

Run: `npm test && npm run typecheck`
Expected: PASS. No school carries `wideOpen` yet (Task 4 does that), so no seeded outcome moves.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(engine): add a trait-scoped ambient injury roll

wideOpen's cost. Fires only at wideOpen schools, so careers elsewhere consume
identical RNG and their seeded outcomes are unchanged.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Assign `wideOpen` across the ladder, with offer hints

**Files:**
- Modify: `src/content/schools.ts`
- Modify: `src/engine/recruiting.ts:26-42`
- Modify: `src/engine/transfer.ts` (lateral/up/down labels)
- Create: `src/content/school-traits.test.ts`
- Test: `src/engine/school-effects.test.ts` (un-skip Task 1 Step 9's third test)

**Interfaces:**
- Consumes: `SchoolTrait` (Task 1).
- Produces: `TRAIT_HINTS: Record<SchoolTrait, string>` exported from `src/content/school-traits.ts`.

- [ ] **Step 1: Add the hint table to `src/content/school-traits.ts`**

```ts
import type { SchoolTrait } from "../engine/types";

// Shown in offer labels. Hints, never mechanics: the player discovers what a
// trait does by replaying, not by reading a stat block at Signing Day. Each
// suggests the benefit and the cost without naming either.
export const TRAIT_HINTS: Record<SchoolTrait, string> = {
  wideOpen: "the two-deep is thin",
  factory: "sends more guys to Sundays than anywhere else",
  developmental: "takes three-stars and turns them into draft picks",
};
```

- [ ] **Step 2: Assign `wideOpen` in `src/content/schools.ts`**

Add `trait: "wideOpen"` to exactly these eleven rows. Chosen realism-first — programs whose depth is genuinely thin — and spread so that **every region has a `wideOpen` school at both tier 1 and tier 2**, because the sampler weights heavily by home state and region and an uneven spread would make the trait invisible to whole populations.

Tier 2: `unt` (TX/Southwest), `ohiou` (OH/Midwest), `gastate` (GA/South), `fau` (FL/South), `sdsu` (CA/West), `temple` (PA/Northeast).

Tier 1: `uiw` (TX/Southwest), `sacst` (CA/West), `ysu` (OH/Midwest), `bcu` (FL/South), `villanova` (PA/Northeast).

Example of the edit shape:

```ts
  { id: "unt", name: "North Texas", tier: 2, conference: "American", state: "TX", trait: "wideOpen" },
```

Add this comment above the tier-2 block:

```ts
  // wideOpen sits at tiers 1-2 only: a thin two-deep at a national contender is
  // not plausible. That means trait does NOT vary within tiers 3-4 yet — the
  // "every tier carries two distinct identities" requirement is satisfied in
  // wave 3, when developmental lands across all four tiers.
```

- [ ] **Step 3: Show the hint in recruiting offer labels**

In `src/engine/recruiting.ts`, replace the offer-label line:

```ts
        label: `Commit to ${school.name}`,
```

with:

```ts
        label: school.trait ? `Commit to ${school.name} — ${content.traitHints[school.trait]}` : `Commit to ${school.name}`,
```

This requires `traitHints` on the bundle. Add to `ContentBundle` in `src/content/schema.ts`:

```ts
  traitHints: Record<SchoolTrait, string>;
```

and wire `traitHints: TRAIT_HINTS,` into `CONTENT` in `src/content/index.ts`. Add a validator rule beside the other trait rules:

```ts
  for (const t of ALL_SCHOOL_TRAITS)
    if (!bundle.traitHints[t]) errors.push(`traitHints: missing hint for trait "${t}"`);
```

- [ ] **Step 4: Show the hint in transfer offer labels**

In `src/engine/transfer.ts`, add this helper above `generateTransferOffers`:

```ts
function withHint(name: string, trait: string | undefined, content: ContentBundle): string {
  const hint = trait ? content.traitHints[trait as keyof typeof content.traitHints] : undefined;
  return hint ? `${name} — ${hint}` : name;
}
```

and use it in the three transfer labels, e.g.:

```ts
  if (lateral) offers.push({ id: `transfer-${lateral.id}`, label: `Transfer to ${withHint(lateral.name, lateral.trait, content)} (bigger role)`, schoolId: lateral.id, tier: lateral.tier, snapModifier: cfg.lateralSnapModifier });
```

Do the same for the `up` and `down` offers.

- [ ] **Step 5: Un-skip the Task 1 trait-lookup test**

If Task 1 Step 9's third test was marked `it.skip`, change it back to `it`.

- [ ] **Step 6: Write the realized-distribution test**

Create `src/content/school-traits.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { CONTENT } from "./index";
import { createCareer } from "../engine/create-career";
import { REGIONS } from "./regions";
import type { Setup } from "../engine/types";

// Every state that appears in the ladder — the full set of home states a
// player can be created with.
const HOME_STATES = [...new Set(CONTENT.schools.map((s) => s.state))].sort();

function offerTraits(homeState: string, runs: number): (string | undefined)[] {
  const out: (string | undefined)[] = [];
  for (let i = 0; i < runs; i++) {
    const setup: Setup = { lastName: "P", jerseyNumber: 7, homeState, position: "QB" };
    const s = createCareer(setup, `traitdist-${homeState}-${i}`);
    for (const o of s.pendingOptions ?? []) {
      out.push(CONTENT.schools.find((x) => x.id === o.schoolId)?.trait);
    }
  }
  return out;
}

describe("realized trait distribution", () => {
  // This test deliberately does NOT count rows in schools.ts. The sampler
  // weights by home state (homeStateBonus +12/+8/+4/+1 by tier) and region, so
  // players do not land evenly across a tier: zero-mean across the LADDER is
  // not zero-mean across the POPULATION. runBalance compounds this by
  // defaulting to homeState "TX". What matters is the share of offers players
  // actually see.
  it("puts a wideOpen school in front of players from every home state", () => {
    for (const state of HOME_STATES) {
      const traits = offerTraits(state, 60);
      expect(
        traits.filter((t) => t === "wideOpen").length,
        `a recruit from ${state} never sees a wideOpen offer`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps the pooled wideOpen share of offers inside a sane band", () => {
    // Band is wide on purpose: it is a guard against the trait becoming
    // near-universal or near-invisible, not a tuned target. Record the measured
    // value here when this first runs so drift is legible.
    const traits = HOME_STATES.flatMap((s) => offerTraits(s, 40));
    const share = traits.filter((t) => t === "wideOpen").length / traits.length;
    expect(share, `pooled wideOpen share of offers is ${share.toFixed(3)}`).toBeGreaterThan(0.05);
    expect(share, `pooled wideOpen share of offers is ${share.toFixed(3)}`).toBeLessThan(0.45);
  });

  it("covers every region at both tiers wideOpen occupies", () => {
    for (const [region, states] of Object.entries(REGIONS)) {
      for (const tier of [1, 2]) {
        const inCell = CONTENT.schools.filter(
          (s) => s.tier === tier && s.trait === "wideOpen" && states.includes(s.state),
        );
        expect(inCell.length, `region ${region} tier ${tier} has no wideOpen school`).toBeGreaterThan(0);
      }
    }
  });
});
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run src/content/school-traits.test.ts src/engine/school-effects.test.ts`
Expected: PASS. If the region-coverage test fails, **add a `wideOpen` school in the missing cell rather than widening the test** — unless no plausible program exists there, in which case add a named exemption entry with its reason, following the `TWO_PER_STATE_EXEMPTIONS` precedent in `src/content/schools.test.ts`.

- [ ] **Step 8: Record the measured pooled share**

Replace "Record the measured value here when this first runs" in the test comment with the actual number the run printed.

- [ ] **Step 9: Run the full suite and typechecks**

Run: `npm test && npm run typecheck`
Expected: PASS. **Seeded outcomes now move for careers that attend a `wideOpen` school** — that is intended and is the first behavioural change of the wave. If a test pinning a literal seeded outcome fails, check whether its career attends a `wideOpen` school before changing anything; if it does, re-pin the literal and note why in the test.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(content): give eleven schools the wideOpen trait

Assigned realism-first at tiers 1-2 and spread so every region has one at
both tiers -- the sampler weights heavily by home state, so an uneven spread
would leave whole populations unable to see the trait at all.

Offer labels carry a hint, never the mechanic.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: The per-trait measurement probe

**Files:**
- Modify: `src/sim/balance.ts` (add `homeState` parameter)
- Create: `src/sim/trait-probe.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `playCareer`, `randomPolicy`, `BalanceReport`.
- Produces: `runBalance(runs, seedPrefix, policy, position?, homeState?)`; `runTraitProbe(runs, seedPrefix, position, homeState?): TraitProbeReport[]`.

- [ ] **Step 1: Add the `homeState` parameter to `runBalance`**

In `src/sim/balance.ts`, change the signature and the setup line:

```ts
export function runBalance(
  runs: number,
  seedPrefix: string,
  policy: Policy,
  position: Position = "QB",
  // Defaults to TX so every baseline recorded in STAGE4-HANDOFF.md stays
  // directly comparable. Trait measurement sweeps states instead, because the
  // sampler's home-state bonus means a TX-only run measures Texas, not the
  // ladder.
  homeState: string = "TX",
): BalanceReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
```

- [ ] **Step 2: Create `src/sim/trait-probe.ts`**

```ts
import { playCareer } from "./play-headless";
import { randomPolicy } from "./policies";
import { CONTENT } from "../content/index";
import { ALL_POSITIONS, ALL_SCHOOL_TRAITS, type Position, type Setup, type GameState } from "../engine/index";

export interface TraitProbeReport {
  bucket: string;
  position: Position;
  careers: number;
  shareOfPopulation: number;
  draftedRate: number;
  undraftedRate: number;
  actuallyPickedRate: number;
  round1Rate: number;
  allConfRate: number;
  bustedRate: number;
  avgSeasons: number;
  avgInjuries: number;
  injuredRate: number;
  avgFinalOverall: number;
  avgFinalCharacter: number;
  charUnder55Rate: number;
}

// Bucket by whether the career EVER RECEIVED the effect, not by where it spent
// the most seasons. Modal-school bucketing mis-attributes exactly the cases
// these traits are built around: a career that takes season 1 at a wideOpen
// school -- collecting the full effect -- then transfers and plays three
// seasons elsewhere would bucket as untraited, hiding the effect inside the
// control group and biasing BOTH buckets at once.
//
// A career can therefore appear in more than one bucket. That is correct, and
// `careers` + `shareOfPopulation` make the overlap visible rather than silent.
export function traitsExperienced(s: GameState): Set<string> {
  const out = new Set<string>();
  for (const line of s.seasons) {
    const trait = CONTENT.schools.find((x) => x.id === line.schoolId)?.trait;
    if (trait) out.add(trait);
  }
  return out;
}

function summarize(bucket: string, position: Position, careers: GameState[], total: number): TraitProbeReport {
  const n = careers.length;
  const safe = (x: number) => (n === 0 ? 0 : x / n);
  const drafted = careers.filter((s) => s.status === "drafted");
  const undrafted = drafted.filter((s) => s.draftResult?.undrafted);
  return {
    bucket,
    position,
    careers: n,
    shareOfPopulation: total === 0 ? 0 : n / total,
    draftedRate: safe(drafted.length),
    undraftedRate: safe(undrafted.length),
    actuallyPickedRate: safe(drafted.length - undrafted.length),
    round1Rate: safe(drafted.filter((s) => !s.draftResult?.undrafted && s.draftResult?.round === 1).length),
    allConfRate: safe(careers.filter((s) => s.awards.includes("allConference")).length),
    bustedRate: safe(careers.filter((s) => s.status === "busted").length),
    avgSeasons: safe(careers.reduce((a, s) => a + s.seasons.length, 0)),
    avgInjuries: safe(careers.reduce((a, s) => a + s.careerInjuries, 0)),
    injuredRate: safe(careers.filter((s) => s.careerInjuries > 0).length),
    avgFinalOverall: safe(careers.reduce((a, s) => a + s.overall, 0)),
    avgFinalCharacter: safe(careers.reduce((a, s) => a + s.character, 0)),
    charUnder55Rate: safe(careers.filter((s) => s.character <= 55).length),
  };
}

export function runTraitProbe(
  runs: number,
  seedPrefix: string,
  position: Position,
  homeState = "TX",
): TraitProbeReport[] {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const all: GameState[] = [];
  for (let i = 0; i < runs; i++) all.push(playCareer(setup, `${seedPrefix}-${i}`, randomPolicy));
  const rows: TraitProbeReport[] = [summarize("ALL", position, all, all.length)];
  for (const trait of ALL_SCHOOL_TRAITS) {
    rows.push(summarize(trait, position, all.filter((s) => traitsExperienced(s).has(trait)), all.length));
  }
  rows.push(summarize("untraited", position, all.filter((s) => traitsExperienced(s).size === 0), all.length));
  return rows;
}

// CLI: `npm run traits -- 3000 QB`      (one position)
//      `npm run traits -- 3000 all`     (every position)
//      `npm run traits -- 3000 QB CA`   (sweep a different home state)
function main() {
  const runs = Number(process.argv[2] ?? 3000);
  const target = process.argv[3] ?? "QB";
  const homeState = process.argv[4] ?? "TX";
  const positions = target === "all" ? ALL_POSITIONS : [target as Position];
  if (target !== "all" && !ALL_POSITIONS.includes(target as Position)) {
    console.error(`Unknown position "${target}". Expected one of ${ALL_POSITIONS.join(", ")}, or "all".`);
    process.exitCode = 1;
    return;
  }
  const rows = positions.flatMap((p) => runTraitProbe(runs, "traits", p, homeState));
  console.log(JSON.stringify(rows, null, 2));
}
if (process.argv[1] && process.argv[1].endsWith("trait-probe.ts")) main();
```

- [ ] **Step 3: Export what the probe needs from the engine barrel**

`src/engine/index.ts` currently exports `ALL_POSITIONS` and types `GameState, Setup, Position, DraftResult`. Add `ALL_SCHOOL_TRAITS` to the value export and `SchoolTrait` to the type export:

```ts
export { ALL_POSITIONS, ALL_SCHOOL_TRAITS } from "./types";
export type { GameState, Setup, Position, DraftResult, SchoolTrait } from "./types";
```

- [ ] **Step 4: Add the npm script**

In `package.json`, add to `scripts`:

```json
    "traits": "tsx src/sim/trait-probe.ts"
```

- [ ] **Step 5: Smoke-test the probe**

Run: `npm run traits -- 200 QB`
Expected: JSON array with buckets `ALL`, `wideOpen`, `factory`, `developmental`, `untraited`. `factory` and `developmental` must show `careers: 0` — no school carries them in wave 1. `wideOpen` must show a non-zero count.

- [ ] **Step 6: Run the suite and typechecks**

Run: `npm test && npm run typecheck`
Expected: PASS. Note `src/sim/**` is outside the engine typecheck's no-Node-globals tree, so `process`/`console` are fine there.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(sim): add a per-trait outcome probe

Buckets by whether a career ever RECEIVED a trait's effect rather than by
modal school -- modal bucketing would file a one-season wideOpen career as
untraited, biasing the effect and the control at once.

runBalance gains an optional homeState, defaulting to TX so every recorded
baseline stays comparable.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Calibrate `wideOpen`'s magnitudes against measurement

This task produces numbers, not features. It has no unit test — its output is a measured decision recorded in the config comment.

**Files:**
- Modify: `src/content/school-traits.ts` (values only)

- [ ] **Step 1: Measure the baseline at n=3000**

Run: `npm run balance -- 3000 random all > /tmp/wave1-before.json && cat /tmp/wave1-before.json`

Record every headline metric per position. This is the comparison point for Task 9.

- [ ] **Step 2: Measure the trait split**

Run: `npm run traits -- 3000 all > /tmp/wave1-traits.json && cat /tmp/wave1-traits.json`

- [ ] **Step 3: Judge whether `wideOpen` is near-neutral**

Compare the `wideOpen` bucket against the `untraited` bucket, per position. The trait is meant to add **variance, not drift**: careers should diverge without the population mean moving.

Read these specifically:
- `avgInjuries` and `injuredRate` — `wideOpen` should be clearly higher. If it is not, the cost is not landing.
- `avgFinalOverall` and `allConfRate` — should be close between buckets. A large gap means one side is winning.
- `actuallyPickedRate` and `round1Rate` — should be close.
- `shareOfPopulation` for `wideOpen` — sanity-check it is a meaningful slice, not 2% or 60%.

- [ ] **Step 4: Adjust and re-measure if a bucket gap is large**

If `wideOpen` clearly beats `untraited`, raise `injuryProbPerPhase` or lower `snapModifier`. If it clearly loses, do the reverse. **Change one value at a time and re-run Step 2** — with two knobs moving, the next measurement attributes nothing.

Remember the non-linearity: `developmentDelta` is `min(3, floor(snaps / 180))` and a field-player season is ~480 snaps, so a snap-modifier change can move a whole development point or nothing at all. Prefer moving `injuryProbPerPhase`, which is continuous, over `snapModifier`, which is not.

- [ ] **Step 5: Record the measurement in the config**

Replace the "Starting point only — Task 6 replaces these with measured values" comment in `src/content/school-traits.ts` with the actual measured comparison: the `wideOpen` vs `untraited` figures for `avgInjuries`, `avgFinalOverall`, `allConfRate` and `actuallyPickedRate`, at n=3000, and one sentence on why the final values were chosen.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "tune(content): calibrate wideOpen against a measured trait probe

Values chosen from an n=3000 per-position probe comparing the wideOpen bucket
against untraited, not from arithmetic on the inputs -- the pipeline floors,
clamps and threshold-tests, so input symmetry does not imply output symmetry.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: The `schoolTrait` event condition

**Files:**
- Modify: `src/engine/types.ts` (`EventConditions`)
- Modify: `src/engine/select-event.ts:6-32`
- Modify: `src/content/schema.ts` (validator)
- Test: `src/engine/select-event.test.ts`

**Interfaces:**
- Produces: `EventConditions.schoolTrait?: SchoolTrait[]`.

- [ ] **Step 1: Write the failing test**

Append to `src/engine/select-event.test.ts`, matching the file's existing fixture style (read it first — it already builds `GameState` and `GameEvent` fixtures):

```ts
describe("schoolTrait condition", () => {
  const ev = {
    id: "trait-gated", kind: "random" as const, phase: "conference" as const, weight: 1,
    conditions: { schoolTrait: ["wideOpen" as const] },
    title: "T", description: "D",
    options: [{ id: "a", label: "A", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  };

  it("matches a player at a school carrying the trait", () => {
    const wide = CONTENT.schools.find((x) => x.trait === "wideOpen")!;
    const s = baseState();
    s.phase = "conference";
    s.school = { schoolId: wide.id, tier: wide.tier };
    expect(eventMatches(s, ev)).toBe(true);
  });

  it("does not match a player at an untraited school", () => {
    const plain = CONTENT.schools.find((x) => x.trait === undefined)!;
    const s = baseState();
    s.phase = "conference";
    s.school = { schoolId: plain.id, tier: plain.tier };
    expect(eventMatches(s, ev)).toBe(false);
  });

  it("does not match at Signing Day, when there is no school", () => {
    const s = baseState();
    s.phase = "conference";
    s.school = { schoolId: "", tier: 1 };
    expect(eventMatches(s, ev)).toBe(false);
  });
});
```

`eventMatches` will need `CONTENT` to resolve the trait. Thread it through as a third parameter — see Step 3.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/select-event.test.ts`
Expected: FAIL — `schoolTrait` is not a valid condition key.

- [ ] **Step 3: Add the condition and the check**

In `src/engine/types.ts`, add to `EventConditions`:

```ts
  schoolTrait?: SchoolTrait[];
```

In `src/engine/select-event.ts`, `eventMatches` must resolve the player's school trait, which requires the bundle. Change its signature to `eventMatches(state: GameState, ev: GameEvent, content: ContentBundle)` and add the check directly below the existing `tier` line:

```ts
  if (c.schoolTrait) {
    const trait = schoolTraitOf(state, content);
    if (!trait || !c.schoolTrait.includes(trait)) return false;
  }
```

Import `schoolTraitOf` from `"./school-effects"`. Update the two callers in the same file (`selectRandomEvent`, `selectFixedEvent`) — both already receive `content` — and every caller in the test files.

- [ ] **Step 4: Add the validator rule**

In `src/content/schema.ts`, beside the existing `c.tier` and `c.position` condition checks:

```ts
      if (c.schoolTrait) for (const t of c.schoolTrait)
        if (!knownTraits.has(t)) errors.push(`Event ${ev.id}: invalid schoolTrait "${t}"`);
```

- [ ] **Step 5: Run the suite and typechecks**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(engine): let events gate on a school's trait

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Author `wideOpen`'s content signature

A trait expressed only as a rate shift is undiscoverable — a player samples 10–50 careers, and last stage needed n=3000 to detect shipped effects. Content is noticeable in one career; statistics are not.

**Files:**
- Create: `src/content/events/school-life.ts`
- Modify: `src/content/events/index.ts`
- Modify: `src/content/events/index.test.ts`
- Test: `src/content/events/index.test.ts`

**Interfaces:**
- Produces: `SCHOOL_LIFE_EVENTS: GameEvent[]`.

- [ ] **Step 1: Measure the EV of the pool these events will join**

Last stage got this wrong twice. The rule: **match the EV of the events a player will actually draw alongside yours — not the phase's whole roster.** A `wideOpen` player carries no trouble-gate and no tier gate by virtue of the trait, so the alongside-pool is the ordinary ungated shared + position pool for the phase.

Write a throwaway script in the scratchpad (not the repo) that, for `nonconf` and `conference`, filters `CONTENT.events` to `kind === "random"` with no `maxCharacter`, no `maxOverall`, no `requiresInjury`, no `requiresActiveInjury`, no `tier`, and either no `position` or `position` including QB — then computes each event's mean option EV in `overall` and `character`, weighted by `weight`. Record both pool means.

- [ ] **Step 2: Create `src/content/events/school-life.ts`**

```ts
import type { GameEvent } from "../../engine/types";

// Trait-gated content. A mechanical trait that is only a rate shift is
// undiscoverable: a player samples 10-50 careers, and effects shipped last
// stage needed n=3000 to detect. These are the content signature -- noticeable
// in one career, testable on the next.
//
// EV is matched to the pool a player at one of these schools actually draws
// alongside them: the ordinary ungated shared + position pool for the phase.
// (A trait gate is weaker than the maxCharacter subsets that caught us out
// last stage, but the measurement still runs -- that is the lesson.)
export const SCHOOL_LIFE_EVENTS: GameEvent[] = [
  {
    id: "wideopen-next-man-up",
    kind: "random",
    phase: "conference",
    weight: 3,
    conditions: { schoolTrait: ["wideOpen"] },
    title: "Next Man Up",
    description: "The guy in front of you goes down in warmups and there is nobody behind him. The position coach does not so much tell you as look at you.",
    options: [
      {
        id: "play-every-snap",
        label: "Take every snap and do not come off",
        probability: 0.6,
        positiveOutcome: {
          description: "You play the whole game on legs that stopped answering in the third quarter, and the tape is the best thing you have put on film.",
          effects: [
            { kind: "overall", timing: "immediate", amount: 2 },
            { kind: "moment", item: "Played every snap with nobody behind you", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description: "By the fourth quarter you are running on nothing, and the tape shows it as clearly as everyone in the stadium saw it.",
          effects: [
            { kind: "overall", timing: "immediate", amount: -1 },
            { kind: "character", amount: -2 },
          ],
        },
      },
      {
        id: "ask-for-a-series",
        label: "Ask for a series off to get your legs back",
        probability: 0.75,
        positiveOutcome: {
          description: "You come off for one series, get your wind, and finish the game upright.",
          effects: [{ kind: "character", amount: 1 }],
        },
        negativeOutcome: {
          description: "There is nobody to put in. The series happens without you and it does not go well, and everyone knows why.",
          effects: [{ kind: "character", amount: -3 }],
        },
      },
    ],
  },
  {
    id: "wideopen-two-deep",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { schoolTrait: ["wideOpen"] },
    title: "The Two-Deep",
    description: "The depth chart goes up Monday. Your name is on it, and under your name there is a walk-on and a blank line.",
    options: [
      {
        id: "embrace-the-reps",
        label: "Take every rep you can get",
        probability: 0.65,
        positiveOutcome: {
          description: "Nobody is taking reps off you because there is nobody to take them. You get a season of work most players your age never see.",
          effects: [{ kind: "overall", timing: "immediate", amount: 2 }],
        },
        negativeOutcome: {
          description: "You get every rep, including the ones a healthier roster would have spared you. Something in your hamstring tightens by week three.",
          effects: [
            { kind: "injury", injuryType: "hamstring" },
            { kind: "character", amount: -1 },
          ],
        },
      },
      {
        id: "bring-the-walkon-along",
        label: "Spend your reps teaching the walk-on behind you",
        probability: 0.7,
        positiveOutcome: {
          description: "By October he can spell you for a series without the staff flinching, and the room notices who built him.",
          effects: [
            { kind: "character", amount: 3 },
            { kind: "moment", item: "Built a backup out of a walk-on", icon: "star" },
          ],
        },
        negativeOutcome: {
          description: "He is not ready and the reps you gave him were reps off your own tape.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
];
```

- [ ] **Step 3: Check the authored EV against Step 1's measurement**

Compute these two events' weighted mean option EV in `overall` and `character` the same way, and compare against the pool means from Step 1. If either is more than ~0.3 away from its pool mean, adjust the effect amounts here — **not** the pool.

Both events are on-field phases (`nonconf`, `conference`), so `stat` and `snaps` effects would be legal, but neither uses them; if you add one, remember the offseason prohibition does not apply here but the `positions.test.ts` EV budget does not cover this file either, so the discipline has to be manual.

- [ ] **Step 4: Wire into the barrel**

In `src/content/events/index.ts`, add `import { SCHOOL_LIFE_EVENTS } from "./school-life";` and `...SCHOOL_LIFE_EVENTS,` to the `EVENTS` array (place it after `...SEASON_LIFE_EVENTS,`).

In `src/content/events/index.test.ts`, add `SCHOOL_LIFE_EVENTS` to the imports and to the `SLICES` object.

- [ ] **Step 5: Add the content-signature guard**

Append to `src/content/events/index.test.ts`:

```ts
  it("gives every trait that any school carries at least one gated event", () => {
    // A trait that is only a rate shift is undiscoverable: a player samples
    // 10-50 careers, and last stage's shipped effects needed n=3000 to detect.
    // This is the guard that a trait cannot ship mechanically inert -- which is
    // the exact defect the school-trait work exists to fix.
    const carried = new Set(CONTENT.schools.map((s) => s.trait).filter(Boolean));
    for (const trait of carried) {
      const gated = EVENTS.filter((e) => e.conditions?.schoolTrait?.includes(trait as never));
      expect(gated.length, `trait "${trait}" is carried by a school but gates no event`).toBeGreaterThan(0);
    }
  });
```

Import `CONTENT` from `"../index"` in that test file if it is not already imported.

- [ ] **Step 6: Run the suite and typechecks**

Run: `npm test && npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(content): give wideOpen schools beats of their own

Two trait-gated events in a new school-life slice. A mechanical trait that is
only a rate shift is undiscoverable at the sample size a player actually
plays, so every trait ships a content signature or it does not ship.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Re-measure, re-place thresholds, update the handoff

**Files:**
- Modify: `src/content/postseason.ts` (`production` thresholds, if needed)
- Modify: `docs/superpowers/STAGE4-HANDOFF.md`

- [ ] **Step 1: Measure at n=3000 per position**

Run: `npm run balance -- 3000 random all > /tmp/wave1-after.json && cat /tmp/wave1-after.json`

- [ ] **Step 2: Compare against every band**

Check each metric against the Global Constraints table. Expect `allConfRate` to have **dropped** — this is certain, not a risk. Only one random event fires per phase, so two new shared-ish events displace position-event draws for `wideOpen` players, which lowers award stat. It happened on both of last stage's content passes and both needed thresholds re-placed.

- [ ] **Step 3: Re-place the All-Conference thresholds if `allConfRate` left its band**

The band is the goal; the thresholds in `src/content/postseason.ts`'s `production` array are the knob. **Re-place them rather than reshaping the content.**

Current values: QB `passYards` 1240, OSKILL `scrimmageYards` 821, OL `pancakes` 33, DL `sacks` 8, DSKILL `tackles` 57, K `fieldGoals` 15.

Note from last stage: DL (8) and K (15) are low-count stats whose next value down overshoots badly — DL 7 clears 40.7% of seasons against 8's 25.5%. Do not step those by one without measuring; if DL or K needs to move, say so in the handoff rather than forcing it.

Target: `allConfRate` 0.40–0.55 with spread ≤ 1.25x across positions. Re-run Step 1 after any change.

- [ ] **Step 4: Verify the seeded-stability claim**

Run: `npm run play -- demo`
Expected: plays to a terminal state and prints JSON.

To check the claim properly, add a temporary assertion rather than diffing against an old commit — run a career, compute `traitsExperienced(s)` from `src/sim/trait-probe.ts`, and confirm that for a seed whose set is empty the final `overall`, `character`, `seasons.length` and `draftResult` match a run against a trait-stripped bundle (`{ ...CONTENT, schools: CONTENT.schools.map((x) => ({ ...x, trait: undefined })) }`). That is the same comparison as the ambient-roll isolation test in Task 3, extended to a whole career, and it does not depend on commit distance.

If the seed's career does attend a `wideOpen` school, a changed result is correct and expected — pick a different seed to run the check.

- [ ] **Step 5: Update `docs/superpowers/STAGE4-HANDOFF.md`**

Add a "School traits — wave 1 (`wideOpen`)" section covering: what shipped, the measured `wideOpen` vs `untraited` split, any threshold re-placement and its before/after, and the two carried-forward facts for waves 2–3 —

1. **`factory` and `developmental` are configured but inert.** No school carries them. Their magnitudes in `school-traits.ts` are unmeasured placeholders and must be calibrated against their own probe runs.
2. **Waves 2 and 3 will move seeded outcomes even though neither adds an RNG draw.** They change snap counts, and `resolveAwards` skips its draw when a production gate is unmet (`postseason.ts`: "no draw when gate unmet"), so a snap change can shift the downstream stream by changing whether that draw happens at all.

Also mark backlog item 1 ("the 57-school ladder is mechanically inert") as **partially resolved** — the ladder is load-bearing at tiers 1–2 via `wideOpen`; tiers 3–4 stay cosmetic until wave 2.

- [ ] **Step 6: Final verification**

Run: `npm test && npm run typecheck`
Expected: all tests pass, both typecheck passes exit 0. Report the actual test count.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: record wave-1 school-trait measurements and re-place thresholds

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** §3 data model → Task 1. §4.1 snaps → Task 2. §4.4 ambient roll → Task 3. §5 content contract → Tasks 7–8. §6 distribution + §6.1 realized-population test → Task 4. §7 measurement → Tasks 5–6, 9. §8 testing → distributed across tasks (direct mechanical assertions in Tasks 2–3, isolation in Task 3, Signing-Day safety in Task 1, distribution in Task 4, content signature in Task 8). §9 sequencing → this is wave 1.

**Deliberate gaps, each with a reason:**
- §4.2 (development multiplier) and §4.3 (`deriveDraftStock` school term) are **wave 3 and wave 2** respectively. Wave 1 ships neither, so the cliff-straddle test and the Signing-Day `deriveDraftStock` test arrive with them.
- §6's "every tier carries two distinct identities" cannot pass in wave 1, since `wideOpen` is tiers 1–2 only. Stated explicitly in Global Constraints so no executor writes a failing test for it.
