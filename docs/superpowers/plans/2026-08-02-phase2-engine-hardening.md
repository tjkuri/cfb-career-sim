# Phase 2 — Engine Hardening & Schema Groundwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear the accumulated Phase-1 engine-review backlog and make the small schema/condition additions Phase-2 content needs, so the content contract is frozen and guard-railed before any content or systemic-engine work.

**Architecture:** Seven small, independent, TDD'd changes to the existing pure engine + content-validator. No new subsystems. Every task keeps the full suite green (currently 64 tests) and leaves `npm run typecheck` clean. This is Stage 1 of 4 for Phase 2 (hardening → systemic engine additions → content push → balance); it is the prerequisite for the systemic-additions plan because it freezes `EventConditions` and the validator.

**Tech Stack:** TypeScript (strict), Vitest, tsx CLIs. Node v22.0.0 (< 22.6) — CLIs run via `tsx`, never `node --experimental-strip-types`.

## Global Constraints

- **Engine purity:** no `Math.random`, `Date.now`, or IO anywhere in `src/engine/**` or `src/content/**`. All randomness flows through the seeded `Rng` in `GameState.rngCursor`. (Task 1 restores the compile-time guardrail for this.)
- **Zero runtime dependencies** in engine/content beyond the in-repo seeded PRNG.
- **Determinism:** `seed` + choice sequence → byte-identical `GameState`. Do not reorder or add RNG draws in these tasks; none of these changes should consume RNG.
- **Conventional commits** with a scope, e.g. `fix(engine): …`. End every commit message body with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- **Real facts only:** school/conference names are public facts; **no real player names** anywhere.
- Run the whole suite with `npm test` and types with `npm run typecheck`.

---

### Task 1: Restore the engine no-Node-globals compile guardrail

Phase 1 lost the guardrail that made referencing `process`/`Buffer`/etc. in engine code a compile error, because `@types/node` (needed by the sim CLIs) leaks Node globals program-wide. Fix by type-checking the engine+content in an isolated tsconfig with `types: []`, separately from the tests/sim. No formal project `references`/`composite` — just multiple configs, which sidesteps the composite/declaration complications Phase 1 hit.

**Files:**
- Create: `tsconfig.base.json`
- Create: `tsconfig.engine.json`
- Modify: `tsconfig.json` (rewrite to extend the base)
- Modify: `package.json` (the `typecheck` script)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run typecheck` now runs two passes; the engine pass forbids Node globals in `src/engine/**` and `src/content/**`.

- [ ] **Step 1: Create the shared base config**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

- [ ] **Step 2: Create the isolated engine config**

Create `tsconfig.engine.json`. `types: []` disables automatic inclusion of every `@types/*` package (including `@types/node`), and excluding tests means no file here pulls in vitest/vite's `/// <reference types="node" />`:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": []
  },
  "include": ["src/engine/**/*.ts", "src/content/**/*.ts"],
  "exclude": ["**/*.test.ts"]
}
```

- [ ] **Step 3: Rewrite the main config to extend the base**

Replace the entire contents of `tsconfig.json` with:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Update the typecheck script**

In `package.json`, change the `typecheck` script from `"tsc --noEmit"` to run both passes (engine isolation first, then the full program):

```json
    "typecheck": "tsc -p tsconfig.engine.json && tsc -p tsconfig.json",
```

- [ ] **Step 5: Verify both passes are clean**

Run: `npm run typecheck`
Expected: exits 0, no output. (Both `tsc` invocations succeed.)

- [ ] **Step 6: Verify the guardrail actually catches a Node global**

Temporarily add this line at the top of `src/engine/rng.ts` (after the imports/`export interface Rng` block — anywhere at module scope):

```ts
const _leakProbe: number = process.pid;
```

Run: `tsc -p tsconfig.engine.json`
Expected: FAIL with `error TS2580: Cannot find name 'process'. Do you need to install type definitions for node?` (or `TS2304: Cannot find name 'process'`).

Then **remove** the `_leakProbe` line and re-run `npm run typecheck`.
Expected: exits 0. (This confirms the guardrail is live, then restores a clean tree.)

- [ ] **Step 7: Verify tests still pass and commit**

Run: `npm test`
Expected: 64 passed.

```bash
git add tsconfig.base.json tsconfig.engine.json tsconfig.json package.json
git commit -m "build(tsconfig): isolate engine typecheck to restore no-Node-globals guardrail

Splits tsconfig into a shared base plus an engine-only config with types:[]
that type-checks src/engine + src/content in isolation, so referencing
process/Buffer/etc. in engine code fails to compile again. typecheck now runs
both passes. Verified: a process.pid probe in engine code fails the engine pass.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Harden the RNG (readonly cursor + rngInt range guard)

`Rng.cursor` has an inert `set` (external `rng.cursor = n` would desync the generator silently), and `rngInt` produces a silently-wrong result if `min > max`. Make `cursor` read-only and guard `rngInt`.

**Files:**
- Modify: `src/engine/rng.ts`
- Test: `src/engine/rng.test.ts`

**Interfaces:**
- Consumes: existing `createRng(seed, cursor?) → Rng`, `rngInt(rng, min, max) → number`.
- Produces: `Rng.cursor` is now `readonly`; `rngInt` throws `RangeError` when `maxInclusive < minInclusive`. `advance.ts` only *reads* `rng.cursor` (line 61), so no caller breaks.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/rng.test.ts` (inside the existing top-level `describe`, or a new one — match the file's style):

```ts
it("rngInt throws when max < min instead of returning a wrong result", () => {
  const rng = createRng("guard");
  expect(() => rngInt(rng, 5, 1)).toThrow(RangeError);
});

it("rngInt still works when min === max (single-value span)", () => {
  const rng = createRng("guard");
  expect(rngInt(rng, 3, 3)).toBe(3);
});
```

Ensure `createRng` and `rngInt` are imported at the top of the test file (they are used elsewhere in it; add to the import if missing).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/rng.test.ts -t "throws when max"`
Expected: FAIL — `rngInt(rng, 5, 1)` returns a number (e.g. a value ≤ 5) instead of throwing.

- [ ] **Step 3: Add the guard and make cursor readonly**

In `src/engine/rng.ts`, change the interface:

```ts
export interface Rng {
  next(): number;
  readonly cursor: number;
}
```

Remove the `set cursor(v: number)` block from the object returned by `createRng` (keep the `get cursor()`), so it reads:

```ts
  return {
    get cursor() {
      return c;
    },
    next() {
      c += 1;
      return gen();
    },
  };
```

Add the guard at the top of `rngInt`:

```ts
export function rngInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  if (maxInclusive < minInclusive) {
    throw new RangeError(`rngInt: max (${maxInclusive}) < min (${minInclusive})`);
  }
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rng.next() * span);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 66 passed (64 + 2 new). No RNG-sequence/determinism test regresses (the guard and readonly change consume no RNG).

- [ ] **Step 5: Verify types and commit**

Run: `npm run typecheck`
Expected: exits 0.

```bash
git add src/engine/rng.ts src/engine/rng.test.ts
git commit -m "fix(engine): readonly Rng.cursor + rngInt range guard

Removes the inert cursor setter (external assignment would silently desync the
generator) and throws RangeError when rngInt is called with max < min instead
of returning a wrong value.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Effect-switch exhaustiveness guard + discriminated suspension

Two hygiene fixes in `src/engine/effects.ts`: (a) a `never`-typed default so a future `Effect` kind fails compile instead of silently no-opping; (b) tag suspension entries with a `kind` discriminator so the `injuryType: "suspension"` magic string can't collide with a future real injury id, and so Task 7's `requiresActiveInjury` can exclude suspensions.

**Files:**
- Modify: `src/engine/types.ts` (`ActiveInjury`)
- Modify: `src/engine/effects.ts`
- Test: `src/engine/effects.test.ts`

**Interfaces:**
- Consumes: existing `applyEffect(state, effect, injuryOf)`, `isSidelined(state)`, `tickPhaseStart(state, injuryOf)`.
- Produces: `ActiveInjury` gains `kind: "injury" | "suspension"`. Both injury and suspension effects still sideline the player and tick down identically; only the discriminator is new. Consumers must branch on `kind`, not on `injuryType === "suspension"`.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/effects.test.ts`:

```ts
it("tags injury vs suspension entries with a kind discriminator", () => {
  const injuryOf: InjuryLookup = () => ({ overallDelta: 4, recoveryPhases: 2 });

  const hurt = baseState();
  applyEffect(hurt, { kind: "injury", injuryType: "ankle" }, injuryOf);
  expect(hurt.injuries[0]!.kind).toBe("injury");

  const banned = baseState();
  applyEffect(banned, { kind: "suspension", phases: 1 }, injuryOf);
  expect(banned.injuries[0]!.kind).toBe("suspension");
  expect(banned.injuries[0]!.restoreAmount).toBe(0);
  expect(isSidelined(banned)).toBe(true);
});
```

Use the file's existing state-factory helper for `baseState()` (match whatever `effects.test.ts` already uses to build a `GameState`; reuse it rather than adding a new one). Ensure `InjuryLookup`, `applyEffect`, and `isSidelined` are imported (they are already used in this file).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/effects.test.ts -t "kind discriminator"`
Expected: FAIL — `hurt.injuries[0].kind` is `undefined` (property doesn't exist), and a TS error that `kind` is not on `ActiveInjury`.

- [ ] **Step 3: Add the discriminator to the type**

In `src/engine/types.ts`, update `ActiveInjury`:

```ts
export interface ActiveInjury {
  kind: "injury" | "suspension";
  injuryType: string;
  remainingPhases: number;
  restoreAmount: number; // overall points restored when the injury heals
}
```

- [ ] **Step 4: Set `kind` in both effect cases and add the exhaustiveness guard**

In `src/engine/effects.ts`, in the `injury` case, add `kind: "injury"` to the pushed object:

```ts
    case "injury": {
      const info = injuryOf(effect.injuryType);
      state.overall = clampOverall(state.overall - info.overallDelta);
      state.injuries.push({
        kind: "injury",
        injuryType: effect.injuryType,
        remainingPhases: info.recoveryPhases,
        restoreAmount: info.overallDelta,
      });
      return;
    }
```

In the `suspension` case, add `kind: "suspension"`:

```ts
    case "suspension": {
      // Modeled as an injury-like block with no overall penalty: it zeroes snaps
      // while active. Discriminated by kind so it never collides with a real injury id.
      state.injuries.push({
        kind: "suspension",
        injuryType: "suspension",
        remainingPhases: effect.phases,
        restoreAmount: 0,
      });
      return;
    }
```

Add a default case at the end of the `switch` (after the `ending` case), giving compile-time exhaustiveness:

```ts
    default: {
      const _exhaustive: never = effect;
      throw new Error(`Unhandled effect kind: ${JSON.stringify(_exhaustive)}`);
    }
```

- [ ] **Step 5: Run tests and types to verify they pass**

Run: `npm test`
Expected: 67 passed (66 + 1 new).
Run: `npm run typecheck`
Expected: exits 0 (the `never` assignment compiles because every current `Effect` kind is handled).

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/effects.ts src/engine/effects.test.ts
git commit -m "refactor(engine): never-exhaustive effect switch + discriminated suspension

Adds a never-typed default so an unhandled future Effect kind fails compile
instead of silently no-opping, and tags ActiveInjury entries with kind
('injury'|'suspension') so the suspension magic string can't collide with a
real injury id (and Task 7's requiresActiveInjury can exclude suspensions).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Harden the content validator (type-predicate filter, recruiting kind, condition values)

Tighten `validateContent`: replace the non-null-assertion outcome filter with a type predicate, require the `recruiting` event to be `kind: "fixed"`, and validate the *values* of existing event conditions (`position`, `minClass`, `tier`) — currently only effect ids are checked.

**Files:**
- Modify: `src/content/schema.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Consumes: existing `validateContent(bundle) → string[]` and `ContentBundle`.
- Produces: `validateContent` returns additional error strings for: a non-fixed `recruiting` event, an event whose `conditions.minClass` is not a valid `ClassYear`, `conditions.tier` contains a value outside 1–4, or `conditions.position` contains an unknown `Position`. Behavior for valid bundles is unchanged (still `[]`).

- [ ] **Step 1: Write the failing tests**

Add to `src/content/schema.test.ts`. Build on whatever minimal-bundle helper the file already uses; if it constructs bundles inline, follow that pattern. These assume a helper `validBundle()` returning a known-good `ContentBundle` — if the file names it differently, use that name:

```ts
it("rejects a recruiting event that is not kind 'fixed'", () => {
  const bundle = validBundle();
  const rec = bundle.events.find((e) => e.id === "recruiting")!;
  rec.kind = "random";
  const errors = validateContent(bundle);
  expect(errors.some((e) => e.includes("recruiting") && e.includes("fixed"))).toBe(true);
});

it("rejects an unknown minClass condition value", () => {
  const bundle = validBundle();
  bundle.events.push({
    id: "bad-minclass", kind: "random", phase: "nonconf", weight: 1,
    conditions: { minClass: "XX" as never },
    title: "t", description: "d",
    options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  });
  const errors = validateContent(bundle);
  expect(errors.some((e) => e.includes("bad-minclass") && e.toLowerCase().includes("minclass"))).toBe(true);
});

it("rejects an out-of-range tier condition value", () => {
  const bundle = validBundle();
  bundle.events.push({
    id: "bad-tier", kind: "random", phase: "nonconf", weight: 1,
    conditions: { tier: [5 as never] },
    title: "t", description: "d",
    options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  });
  const errors = validateContent(bundle);
  expect(errors.some((e) => e.includes("bad-tier") && e.toLowerCase().includes("tier"))).toBe(true);
});
```

If `schema.test.ts` has no `validBundle()` helper, add one at the top of the file that returns a structurally-valid bundle (reuse the real `CONTENT` shape): import `CONTENT` from `./index` and deep-clone it — `const validBundle = (): ContentBundle => JSON.parse(JSON.stringify(CONTENT));` — importing `ContentBundle` from `./schema` and `CONTENT` from `./index`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/content/schema.test.ts -t "recruiting event that is not"`
Expected: FAIL — no error is produced for a `random` recruiting event.
Run: `npx vitest run src/content/schema.test.ts -t "minClass"`
Expected: FAIL — no error produced for the bad minClass.

- [ ] **Step 3: Implement the validator hardening**

In `src/content/schema.ts`, update the imports to include the enums/type you need:

```ts
import type { Effect, GameEvent, Outcome, Position } from "../engine/types";
import { CLASS_ORDER } from "../engine/types";
```

Replace the outcome-filter line inside the option loop:

```ts
      const outcomes = [opt.positiveOutcome, opt.negativeOutcome].filter(
        (o): o is Outcome => o !== undefined,
      );
      for (const oc of outcomes) for (const eff of oc.effects) checkEffect(ev.id, opt.id, eff, errors);
```

Inside the `for (const ev of bundle.events)` loop, after the options loop, add a condition-value check (define `KNOWN_POSITIONS` once, near the top of the function):

```ts
  const KNOWN_POSITIONS = new Set<Position>(["QB", "OSKILL", "OL", "DL", "DSKILL", "K"]);
```

and per-event:

```ts
    const c = ev.conditions;
    if (c) {
      if (c.minClass && !CLASS_ORDER.includes(c.minClass))
        errors.push(`Event ${ev.id}: invalid minClass "${c.minClass}"`);
      if (c.tier) for (const t of c.tier)
        if (t < 1 || t > 4) errors.push(`Event ${ev.id}: invalid tier "${t}"`);
      if (c.position) for (const p of c.position)
        if (!KNOWN_POSITIONS.has(p)) errors.push(`Event ${ev.id}: invalid position "${p}"`);
    }
```

Replace the recruiting existence check at the end:

```ts
  const recruiting = bundle.events.find((e) => e.id === "recruiting");
  if (!recruiting) errors.push('Missing required fixed event "recruiting"');
  else if (recruiting.kind !== "fixed") errors.push('Event recruiting: must be kind "fixed"');
  return errors;
```

(Remove the old `if (!seen.has("recruiting")) …` line; keep `seen` for the duplicate-id check.) Update the `checkEffect` signature's `oc!` usage is already gone since `oc` is now non-nullable.

- [ ] **Step 4: Run tests and types to verify they pass**

Run: `npm test`
Expected: 70 passed (67 + 3 new). The real `CONTENT` bundle still validates clean (its import in `content/index.ts` does not throw).
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/content/schema.ts src/content/schema.test.ts
git commit -m "fix(content): harden validator (type-predicate filter, recruiting kind, condition values)

Replaces the non-null-assertion outcome filter with a type predicate, requires
the recruiting event to be kind 'fixed', and validates event condition VALUES
(minClass, tier range, position) in addition to effect ids.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Draft boundary tests (undrafted floor + tier cutoffs)

Add regression tests pinning the exact thresholds in `draft.ts`: the undrafted floor (stock 35) and the tier cutoffs (25/45/70). No production change — these lock in behavior before the balance pass retunes around it.

**Files:**
- Test: `src/engine/draft.test.ts`

**Interfaces:**
- Consumes: `deriveDraftStock(state)`, `eligibleTiers(state)`, `computeDraftResult(state, rng)`, `createCareer(setup, seed)`, `createRng(seed)`.
- Produces: nothing (tests only).

- [ ] **Step 1: Write the tests**

Add to `src/engine/draft.test.ts`. The helper builds a state whose `deriveDraftStock` equals a target exactly by zeroing every contribution except overall: `character = 50` (so `characterPart = 0`), no snaps/trophies/awards, FR class. Then `stock = round((overall - 40) * 1.4)`, so `overall = 40 + target/1.4` yields the target:

```ts
describe("draft thresholds (boundaries)", () => {
  // character 50 => characterPart 0; no snaps/trophies/awards; FR => classPart 0.
  // deriveDraftStock then reduces to round((overall - 40) * 1.4).
  const stockState = (target: number): GameState => {
    const s = base();
    s.character = 50;
    s.overall = 40 + target / 1.4;
    return s;
  };

  it("the helper produces the requested stock exactly", () => {
    expect(deriveDraftStock(stockState(24))).toBe(24);
    expect(deriveDraftStock(stockState(25))).toBe(25);
    expect(deriveDraftStock(stockState(34))).toBe(34);
    expect(deriveDraftStock(stockState(35))).toBe(35);
  });

  it("undrafted floor: stock 34 is undrafted, 35 is drafted in round 7", () => {
    const under = computeDraftResult(stockState(34), createRng("d"));
    expect(under.undrafted).toBe(true);

    const at = computeDraftResult(stockState(35), createRng("d"));
    expect(at.undrafted).toBe(false);
    expect(at.round).toBe(7);
  });

  it("tier cutoffs: 24|25 gate tier 2, 44|45 gate tier 3, 69|70 gate tier 4", () => {
    expect(eligibleTiers(stockState(24))).not.toContain(2);
    expect(eligibleTiers(stockState(25))).toContain(2);
    expect(eligibleTiers(stockState(44))).not.toContain(3);
    expect(eligibleTiers(stockState(45))).toContain(3);
    expect(eligibleTiers(stockState(69))).not.toContain(4);
    expect(eligibleTiers(stockState(70))).toContain(4);
  });
});
```

`GameState` is already imported in `draft.test.ts`; `base()`, `deriveDraftStock`, `eligibleTiers`, `computeDraftResult`, and `createRng` are all already imported/defined there.

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run src/engine/draft.test.ts`
Expected: PASS — all boundary assertions hold (this task adds no production code, so the tests should pass immediately against current `draft.ts`). If "the helper produces the requested stock exactly" fails, the floating-point rounding assumption is off — adjust by asserting `toBeCloseTo` is NOT appropriate here (stock is integer); instead nudge with `s.overall = 40 + target / 1.4 + 1e-9`.

- [ ] **Step 3: Run the whole suite and commit**

Run: `npm test`
Expected: 73 passed (70 + 3 new).

```bash
git add src/engine/draft.test.ts
git commit -m "test(engine): pin draft undrafted floor (35) and tier cutoffs (25/45/70)

Locks in the exact draft-stock thresholds before the Phase-2 balance pass
retunes around them.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Validate the declare choiceId + fix the stale test comment

`applyChoice`'s declare branch treats any non-`"declare"` choiceId as an implicit `return`. Make it reject anything other than `declare`/`return`, and fix the stale comment in `advance.test.ts` (the first-option policy *declares*, it does not return).

**Files:**
- Modify: `src/engine/advance.ts`
- Modify: `src/engine/advance.test.ts` (new test + comment fix)

**Interfaces:**
- Consumes: `advance(state, choiceId)`, `getDecision(state)`.
- Produces: `advance` throws `Error("Invalid declare choice: <id>")` when the pending decision is `declare` and the choiceId is neither `declare` nor `return`. Valid `declare`/`return` behavior is unchanged.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/advance.test.ts`, inside the top-level `describe`. It plays until the declare decision surfaces, then feeds a bogus choiceId:

```ts
it("rejects a bogus choiceId at the declare decision", () => {
  let s = createCareer(setup, "declare-guard");
  let guard = 0;
  while (s.status === "active" && guard++ < 500) {
    const d = getDecision(s)!;
    if (d.eventId === "declare") {
      expect(() => advance(s, "banana")).toThrow(/declare/i);
      return;
    }
    s = advance(s, d.options[0]!.id);
  }
  throw new Error("never reached the declare decision");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/advance.test.ts -t "bogus choiceId"`
Expected: FAIL — `advance(s, "banana")` does not throw (it silently treats "banana" as `return`), so the `toThrow` assertion fails.

- [ ] **Step 3: Add the validation**

In `src/engine/advance.ts`, replace the declare branch inside `applyChoice`:

```ts
  if (s.currentEventId === DECLARE_EVENT_ID) {
    if (choiceId !== "declare" && choiceId !== "return") {
      throw new Error(`Invalid declare choice: ${choiceId}`);
    }
    if (choiceId === "declare") s.status = "declared";
    s.currentEventId = null;
    return;
  }
```

- [ ] **Step 4: Fix the stale comment**

In `src/engine/advance.test.ts`, replace the comment on the line that currently reads `// A first-option policy returns to school when able, so it should progress past FR.` with:

```ts
    // The declare decision lists "declare" first, so a first-option policy declares
    // as soon as it becomes draft-eligible (JR), i.e. after yearsUsed reaches 2.
```

- [ ] **Step 5: Run tests and types to verify they pass**

Run: `npm test`
Expected: 74 passed (73 + 1 new).
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/engine/advance.ts src/engine/advance.test.ts
git commit -m "fix(engine): validate declare choiceId; fix stale test comment

advance now throws on any declare-decision choiceId other than declare/return
instead of silently treating it as return. Also corrects the eligibility test
comment (a first-option policy declares, it does not return).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Enrich EventConditions for Phase-2 content

Add the three new gates Phase-2 content needs (bust events especially): `maxCharacter`, `maxOverall`, and `requiresActiveInjury`. This freezes the Phase-2 content contract. `requiresActiveInjury` counts only entries with `kind === "injury"` (from Task 3), so a suspended-but-healthy player is not treated as injured.

**Files:**
- Modify: `src/engine/types.ts` (`EventConditions`)
- Modify: `src/engine/select-event.ts` (`eventMatches`)
- Modify: `src/content/schema.ts` (validate the new numeric condition values)
- Test: `src/engine/select-event.test.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Consumes: `eventMatches(state, ev) → boolean`; `validateContent(bundle) → string[]`; `ActiveInjury.kind` (Task 3).
- Produces: `EventConditions` gains `maxCharacter?: number`, `maxOverall?: number`, `requiresActiveInjury?: boolean`. `eventMatches` returns false when `state.character > maxCharacter`, when `state.overall > maxOverall`, or when `requiresActiveInjury` is set and no `kind: "injury"` entry is active. `validateContent` flags `maxCharacter` outside 0–100 and `maxOverall` outside 0–99.

- [ ] **Step 1: Write the failing tests (eventMatches)**

Add to `src/engine/select-event.test.ts`, following the file's existing pattern for building a state and an event (reuse its helpers; the sketch below shows the assertions and the minimal event/state shape):

```ts
it("maxCharacter gates on low character", () => {
  const ev = makeEvent({ conditions: { maxCharacter: 30 } }); // phase must match state.phase
  const lowChar = makeState({ character: 20 });
  const highChar = makeState({ character: 50 });
  expect(eventMatches(lowChar, ev)).toBe(true);
  expect(eventMatches(highChar, ev)).toBe(false);
});

it("maxOverall gates on low overall", () => {
  const ev = makeEvent({ conditions: { maxOverall: 55 } });
  expect(eventMatches(makeState({ overall: 50 }), ev)).toBe(true);
  expect(eventMatches(makeState({ overall: 70 }), ev)).toBe(false);
});

it("requiresActiveInjury counts injuries but not suspensions", () => {
  const ev = makeEvent({ conditions: { requiresActiveInjury: true } });
  const healthy = makeState({});
  const injured = makeState({ injuries: [{ kind: "injury", injuryType: "acl", remainingPhases: 3, restoreAmount: 14 }] });
  const suspended = makeState({ injuries: [{ kind: "suspension", injuryType: "suspension", remainingPhases: 1, restoreAmount: 0 }] });
  expect(eventMatches(healthy, ev)).toBe(false);
  expect(eventMatches(injured, ev)).toBe(true);
  expect(eventMatches(suspended, ev)).toBe(false);
});
```

If `select-event.test.ts` lacks `makeEvent`/`makeState` helpers, add minimal ones: `makeState` deep-clones `createCareer(setup, "s")` and applies overrides (set `phase` to match the event's phase — default events to `phase: "offseason"` and states to `phase: "offseason"` so the phase check passes); `makeEvent` returns a `GameEvent` with `id/kind:"random"/phase:"offseason"/weight:1/title/description/options:[…]` plus the passed `conditions`. Match the existing test's `Setup`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/select-event.test.ts -t "maxCharacter"`
Expected: FAIL — first a TS error that `maxCharacter` is not a valid `EventConditions` key; once the type is added, the runtime assertion fails because `eventMatches` ignores it.

- [ ] **Step 3: Add the new condition fields to the type**

In `src/engine/types.ts`, extend `EventConditions`:

```ts
export interface EventConditions {
  position?: Position[];
  minClass?: ClassYear;
  tier?: Tier[];
  requiresInjury?: boolean;
  requiresActiveInjury?: boolean;
  maxCharacter?: number;
  maxOverall?: number;
}
```

- [ ] **Step 4: Implement the checks in eventMatches**

In `src/engine/select-event.ts`, inside `eventMatches`, add these before the final `return true;` (keep the existing `requiresInjury` check as-is):

```ts
  if (c.requiresActiveInjury && !state.injuries.some((i) => i.kind === "injury")) return false;
  if (c.maxCharacter !== undefined && state.character > c.maxCharacter) return false;
  if (c.maxOverall !== undefined && state.overall > c.maxOverall) return false;
```

- [ ] **Step 5: Run the eventMatches tests to verify they pass**

Run: `npx vitest run src/engine/select-event.test.ts`
Expected: PASS (all new + existing select-event tests).

- [ ] **Step 6: Write the failing validator test for the new values**

Add to `src/content/schema.test.ts` (reusing the `validBundle()` helper from Task 4):

```ts
it("rejects out-of-range maxCharacter / maxOverall condition values", () => {
  const bundle = validBundle();
  bundle.events.push({
    id: "bad-maxchar", kind: "random", phase: "nonconf", weight: 1,
    conditions: { maxCharacter: 150 },
    title: "t", description: "d",
    options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  });
  bundle.events.push({
    id: "bad-maxovr", kind: "random", phase: "nonconf", weight: 1,
    conditions: { maxOverall: -5 },
    title: "t", description: "d",
    options: [{ id: "o", label: "o", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  });
  const errors = validateContent(bundle);
  expect(errors.some((e) => e.includes("bad-maxchar") && e.toLowerCase().includes("maxcharacter"))).toBe(true);
  expect(errors.some((e) => e.includes("bad-maxovr") && e.toLowerCase().includes("maxoverall"))).toBe(true);
});
```

- [ ] **Step 7: Run to verify it fails, then add the validation**

Run: `npx vitest run src/content/schema.test.ts -t "out-of-range max"`
Expected: FAIL — no errors produced for the out-of-range values.

In `src/content/schema.ts`, extend the per-event condition check (added in Task 4) with:

```ts
      if (c.maxCharacter !== undefined && (c.maxCharacter < 0 || c.maxCharacter > 100))
        errors.push(`Event ${ev.id}: invalid maxCharacter "${c.maxCharacter}"`);
      if (c.maxOverall !== undefined && (c.maxOverall < 0 || c.maxOverall > 99))
        errors.push(`Event ${ev.id}: invalid maxOverall "${c.maxOverall}"`);
```

- [ ] **Step 8: Run everything to verify it passes**

Run: `npm test`
Expected: all green — 74 (from Task 6) + 3 eventMatches + 1 validator = 78 passed. (Exact count may differ if the file already had helpers; the key check is 0 failures.)
Run: `npm run typecheck`
Expected: exits 0 (both passes — the engine isolation pass now also covers the new `EventConditions` fields).

- [ ] **Step 9: Commit**

```bash
git add src/engine/types.ts src/engine/select-event.ts src/content/schema.ts src/engine/select-event.test.ts src/content/schema.test.ts
git commit -m "feat(engine): enrich EventConditions (maxCharacter/maxOverall/requiresActiveInjury)

Adds the vulnerability gates Phase-2 bust content needs. requiresActiveInjury
counts only kind:'injury' entries (not suspensions). Validator enforces the new
numeric ranges. This freezes the Phase-2 content contract.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Decision 5c + the enriched-conditions half of Decision 3):**
- Project-references / no-Node-globals guardrail → Task 1. ✓
- rng cursor setter + rngInt guard → Task 2. ✓
- effects `never` exhaustiveness + suspension discriminated field → Task 3. ✓
- schema type-predicate + recruiting.kind assert + condition-value validation → Task 4. ✓
- draft boundary tests (floor 35, cutoffs 25/45/70) → Task 5. ✓
- advance declare choiceId validation → Task 6. ✓
- stale advance.test.ts comment → Task 6. ✓
- Enriched `EventConditions` (`maxCharacter`/`maxOverall`/`requiresActiveInjury`) + validator → Task 7. ✓
- The npm-audit dev-only advisories item is intentionally deferred (transitive via tsx/@types/node; not addressable without upstream bumps and out of scope for hardening).
- The e2e `busted` test is NOT here — it requires the soft-washout hub check + bust content, which land in Stage 2 (systemic engine additions) and Stage 3 (content). Correctly out of this plan.

**Placeholder scan:** No TBD/TODO. Every code step shows complete code; every run step shows the exact command and expected result. Test helper reuse is described concretely with fallbacks. ✓

**Type consistency:** `ActiveInjury.kind` introduced in Task 3 is consumed by Task 7's `requiresActiveInjury` check and its test fixtures. `EventConditions` fields added in Task 7 match between `types.ts`, `eventMatches`, the validator, and the tests. `Outcome`/`Position`/`CLASS_ORDER` imports in Task 4 exist in `types.ts`. `stockState` math in Task 5 matches the actual `deriveDraftStock` formula (character 50 → `characterPart` 0). ✓

**Test-count note:** running totals (64→66→67→70→73→74→78) assume each listed test is net-new; if a shared helper already exists the absolute number may shift, but each task's deliverable is "0 failures + the new assertions pass."
