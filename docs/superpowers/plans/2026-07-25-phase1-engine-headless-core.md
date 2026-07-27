# CFB Career Sim — Phase 1: Engine + Playable Headless Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure, seeded, fully-tested TypeScript game engine plus a thin content slice that can play a complete CFB career from recruiting to draft night entirely headlessly (in tests / terminal), with no UI.

**Architecture:** A pure-function engine (`src/engine/`) that takes `(GameState, choiceId)` and returns a new `GameState`, driving all randomness through a seeded PRNG passed as state (`rngCursor`). Content (`src/content/`) is typed data validated by a schema checker. A headless sim runner (`src/sim/`) auto-plays careers for integration testing and Monte-Carlo balance tuning.

**Tech Stack:** TypeScript (strict), Vitest for tests, npm. The engine has **zero runtime dependencies** (hand-rolled PRNG + hand-rolled content validation). React/Vite are deliberately NOT introduced in Phase 1.

## Global Constraints

- **Language/runtime:** TypeScript strict mode; ES2022; Node ≥ 18. All engine code is pure — **no `Math.random`, no `Date.now`, no I/O, no DOM** anywhere under `src/engine/` or `src/content/`.
- **Determinism:** every random draw goes through the seeded RNG carried in `GameState.rngCursor`. Given a `seed` + an identical sequence of `choiceId`s, the resulting `GameState` must be byte-identical.
- **Zero engine dependencies:** `src/engine/` and `src/content/` import only from within `src/`. No npm runtime deps.
- **Position buckets (v1):** `QB`, `OSKILL`, `OL`, `DL`, `DSKILL`, `K`. Phase 1 authors content for **QB only**; the schema and engine must support all six.
- **Tiers:** `1`=FCS, `2`=G5, `3`=P4, `4`=blue-blood.
- **Starting talent is a fixed baseline:** every player starts `overall = 60`, `character = 70`, `classYear = 'FR'`. No starting-stat randomization.
- **No real player names** anywhere in content. Real school/conference names are fine.
- **Commit after every task.** Use conventional-commit messages.

---

### Task 1: Project scaffold + seeded PRNG

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/engine/rng.ts`
- Test: `src/engine/rng.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Rng { next(): number; cursor: number }` — `next()` returns a float in `[0,1)` and advances `cursor`.
  - `function createRng(seed: string, cursor?: number): Rng`
  - `function rngInt(rng: Rng, minInclusive: number, maxInclusive: number): number`
  - `function rngPick<T>(rng: Rng, items: readonly T[]): T`
  - `function rngWeightedPick<T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): T`
  - `function rngChance(rng: Rng, probability: number): boolean` — `true` with the given probability.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cfb-career-sim",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

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
    "types": ["vitest/globals"],
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { globals: true, include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Install deps**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Write the failing test** — `src/engine/rng.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { createRng, rngInt, rngPick, rngWeightedPick, rngChance } from "./rng";

describe("rng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-1");
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-2");
    expect(a.next()).not.toEqual(b.next());
  });

  it("returns floats in [0,1) and advances the cursor", () => {
    const r = createRng("x");
    expect(r.cursor).toBe(0);
    const v = r.next();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(r.cursor).toBe(1);
  });

  it("can resume from a cursor to reproduce a sequence", () => {
    const a = createRng("resume");
    a.next(); a.next();
    const resumed = createRng("resume", a.cursor);
    const fresh = createRng("resume");
    fresh.next(); fresh.next();
    expect(resumed.next()).toEqual(fresh.next());
  });

  it("rngInt stays within inclusive bounds", () => {
    const r = createRng("ints");
    for (let i = 0; i < 200; i++) {
      const n = rngInt(r, 3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("rngPick returns an element of the array", () => {
    const r = createRng("pick");
    const items = ["a", "b", "c"] as const;
    expect(items).toContain(rngPick(r, items));
  });

  it("rngWeightedPick favors heavier items", () => {
    const r = createRng("weighted");
    const items = ["rare", "common"] as const;
    const weightOf = (x: string) => (x === "common" ? 9 : 1);
    let common = 0;
    for (let i = 0; i < 1000; i++) if (rngWeightedPick(r, items, weightOf) === "common") common++;
    expect(common).toBeGreaterThan(800);
  });

  it("rngChance respects probability extremes", () => {
    const r = createRng("chance");
    expect(rngChance(r, 1)).toBe(true);
    expect(rngChance(r, 0)).toBe(false);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- rng`
Expected: FAIL — cannot find module `./rng`.

- [ ] **Step 7: Write `src/engine/rng.ts`**

```ts
export interface Rng {
  next(): number;
  cursor: number;
}

// Deterministic string -> 32-bit seed (xfnv1a).
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 — small, fast, deterministic PRNG.
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string, cursor = 0): Rng {
  const base = hashSeed(seed);
  const gen = mulberry32(base);
  // Fast-forward to the requested cursor so a career can resume mid-stream.
  for (let i = 0; i < cursor; i++) gen();
  let c = cursor;
  return {
    get cursor() {
      return c;
    },
    set cursor(v: number) {
      c = v;
    },
    next() {
      c += 1;
      return gen();
    },
  };
}

export function rngInt(rng: Rng, minInclusive: number, maxInclusive: number): number {
  const span = maxInclusive - minInclusive + 1;
  return minInclusive + Math.floor(rng.next() * span);
}

export function rngPick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("rngPick: empty array");
  return items[rngInt(rng, 0, items.length - 1)]!;
}

export function rngWeightedPick<T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): T {
  if (items.length === 0) throw new Error("rngWeightedPick: empty array");
  const weights = items.map((i) => Math.max(0, weightOf(i)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[0]!;
  let roll = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

export function rngChance(rng: Rng, probability: number): boolean {
  if (probability <= 0) return false;
  if (probability >= 1) return true;
  return rng.next() < probability;
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- rng`
Expected: PASS (all cases).

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/engine/rng.ts src/engine/rng.test.ts package-lock.json
git commit -m "feat(engine): project scaffold + seeded PRNG"
```

---

### Task 2: Core types + initial-state factory

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/create-career.ts`
- Test: `src/engine/create-career.test.ts`

**Interfaces:**
- Consumes: nothing (pure type + factory module).
- Produces (exported from `types.ts`):
  - `type Position = 'QB' | 'OSKILL' | 'OL' | 'DL' | 'DSKILL' | 'K'`
  - `type Tier = 1 | 2 | 3 | 4`
  - `type ClassYear = 'FR' | 'SO' | 'JR' | 'SR'`
  - `type Phase = 'offseason' | 'nonconf' | 'conference' | 'postseason'`
  - `type Status = 'active' | 'declared' | 'drafted' | 'busted'`
  - `interface Setup { lastName: string; jerseyNumber: number; homeState: string; position: Position }`
  - `interface SeasonLine { seasonIndex: number; schoolId: string; snaps: number; stats: Record<string, number>; teamWins: number; teamLosses: number }`
  - `type EffectTiming = 'immediate' | 'permanent' | 'deferred'`
  - `type Effect` (discriminated union — see code)
  - `interface Outcome { description: string; effects: Effect[] }`
  - `interface EventOption { id: string; label: string; probability: number; positiveOutcome: Outcome; negativeOutcome?: Outcome }`
  - `interface EventConditions { position?: Position[]; minClass?: ClassYear; tier?: Tier[]; requiresInjury?: boolean }`
  - `interface GameEvent { id: string; kind: 'fixed' | 'random'; phase: Phase; weight: number; conditions?: EventConditions; title: string; description: string; options: EventOption[] }`
  - `interface ActiveInjury { injuryType: string; remainingPhases: number; restoreAmount: number }`
  - `interface DeferredEffect { effect: Effect; firePhaseAbs: number }`
  - `interface DraftResult { undrafted: boolean; round: number; pick: number; overallPick: number; draftStock: number }`
  - `interface GameState { ... }` (see code)
- Produces (from `create-career.ts`): `function createCareer(setup: Setup, seed: string): GameState`

- [ ] **Step 1: Write `src/engine/types.ts`**

```ts
export type Position = "QB" | "OSKILL" | "OL" | "DL" | "DSKILL" | "K";
export type Tier = 1 | 2 | 3 | 4;
export type ClassYear = "FR" | "SO" | "JR" | "SR";
export type Phase = "offseason" | "nonconf" | "conference" | "postseason";
export type Status = "active" | "declared" | "drafted" | "busted";

export const PHASE_ORDER: Phase[] = ["offseason", "nonconf", "conference", "postseason"];
export const CLASS_ORDER: ClassYear[] = ["FR", "SO", "JR", "SR"];

export interface Setup {
  lastName: string;
  jerseyNumber: number;
  homeState: string;
  position: Position;
}

export interface SeasonLine {
  seasonIndex: number;
  schoolId: string;
  snaps: number;
  stats: Record<string, number>;
  teamWins: number;
  teamLosses: number;
}

export type EffectTiming = "immediate" | "permanent" | "deferred";

export type Effect =
  | { kind: "overall"; timing: EffectTiming; amount: number; delayPhases?: number }
  | { kind: "character"; amount: number }
  | { kind: "stat"; stat: string; amount: number }
  | { kind: "snaps"; amount: number }
  | { kind: "injury"; injuryType: string }
  | { kind: "suspension"; phases: number }
  | { kind: "trophy"; id: string }
  | { kind: "award"; id: string }
  | { kind: "moment"; item: string; icon: string }
  | { kind: "ending"; reason: string };

export interface Outcome {
  description: string;
  effects: Effect[];
}

export interface EventOption {
  id: string;
  label: string;
  probability: number; // 1 = deterministic (always positiveOutcome)
  positiveOutcome: Outcome;
  negativeOutcome?: Outcome;
}

export interface EventConditions {
  position?: Position[];
  minClass?: ClassYear;
  tier?: Tier[];
  requiresInjury?: boolean;
}

export interface GameEvent {
  id: string;
  kind: "fixed" | "random";
  phase: Phase;
  weight: number;
  conditions?: EventConditions;
  title: string;
  description: string;
  options: EventOption[];
}

export interface ActiveInjury {
  injuryType: string;
  remainingPhases: number;
  restoreAmount: number; // overall points restored when the injury heals
}

export interface DeferredEffect {
  effect: Effect;
  firePhaseAbs: number;
}

export interface DraftResult {
  undrafted: boolean;
  round: number; // 1-7, or 0 if undrafted
  pick: number; // pick within round, or 0
  overallPick: number; // 1-based overall, or 0
  draftStock: number;
}

export interface GameState {
  seed: string;
  rngCursor: number;
  setup: Setup;

  overall: number;
  character: number;

  eligibility: {
    classYear: ClassYear;
    yearsUsed: number;
    redshirtUsed: boolean;
    draftEligible: boolean;
  };
  school: { schoolId: string; tier: Tier };

  seasonIndex: number;
  phase: Phase;
  phaseAbs: number; // absolute count of phases elapsed (drives deferred timing)
  phaseSimulated: boolean; // has the current phase already been ticked+produced this cycle?

  currentEventId: string | null; // event awaiting a decision; null between decisions

  seasons: SeasonLine[];
  trophies: Record<string, number>;
  awards: string[];
  moments: { seasonIndex: number; item: string; icon: string }[];

  pendingEffects: DeferredEffect[];
  injuries: ActiveInjury[];

  status: Status;
  endingReason?: string;
  draftResult?: DraftResult;
}
```

- [ ] **Step 2: Write the failing test** — `src/engine/create-career.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Smith", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("createCareer", () => {
  it("starts every player at the fixed baseline", () => {
    const s = createCareer(setup, "seed");
    expect(s.overall).toBe(60);
    expect(s.character).toBe(70);
    expect(s.eligibility.classYear).toBe("FR");
    expect(s.eligibility.draftEligible).toBe(false);
  });

  it("starts in the offseason with no school and awaiting the recruiting event", () => {
    const s = createCareer(setup, "seed");
    expect(s.phase).toBe("offseason");
    expect(s.seasonIndex).toBe(0);
    expect(s.phaseAbs).toBe(0);
    expect(s.school.schoolId).toBe("");
    expect(s.currentEventId).toBe("recruiting");
    expect(s.status).toBe("active");
  });

  it("carries the seed and starts the rng cursor at 0", () => {
    const s = createCareer(setup, "abc");
    expect(s.seed).toBe("abc");
    expect(s.rngCursor).toBe(0);
  });

  it("initializes empty records", () => {
    const s = createCareer(setup, "seed");
    expect(s.seasons).toEqual([]);
    expect(s.awards).toEqual([]);
    expect(s.moments).toEqual([]);
    expect(s.trophies).toEqual({});
    expect(s.pendingEffects).toEqual([]);
    expect(s.injuries).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- create-career`
Expected: FAIL — cannot find module `./create-career`.

- [ ] **Step 4: Write `src/engine/create-career.ts`**

```ts
import type { GameState, Setup } from "./types";

export const STARTING_OVERALL = 60;
export const STARTING_CHARACTER = 70;
export const RECRUITING_EVENT_ID = "recruiting";

export function createCareer(setup: Setup, seed: string): GameState {
  return {
    seed,
    rngCursor: 0,
    setup,
    overall: STARTING_OVERALL,
    character: STARTING_CHARACTER,
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
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- create-career`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/types.ts src/engine/create-career.ts src/engine/create-career.test.ts
git commit -m "feat(engine): core types + initial-state factory"
```

---

### Task 3: Effect application (immediate effects)

**Files:**
- Create: `src/engine/effects.ts`
- Test: `src/engine/effects.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Effect` from `./types`; injury table lookup is injected as a parameter to avoid a content dependency.
- Produces:
  - `type InjuryInfo = { overallDelta: number; recoveryPhases: number }`
  - `type InjuryLookup = (injuryType: string) => InjuryInfo`
  - `function applyEffect(state: GameState, effect: Effect, injuryOf: InjuryLookup): void` — **mutates `state` in place** (callers pass a cloned draft).
  - `function clampOverall(n: number): number` (0-99), `function clampCharacter(n: number): number` (0-100).

- [ ] **Step 1: Write the failing test** — `src/engine/effects.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { applyEffect, type InjuryLookup } from "./effects";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };
const injuryOf: InjuryLookup = (t) =>
  t === "acl" ? { overallDelta: 12, recoveryPhases: 4 } : { overallDelta: 3, recoveryPhases: 1 };
const fresh = () => createCareer(setup, "s");

describe("applyEffect (immediate)", () => {
  it("applies an immediate overall delta and clamps to 0-99", () => {
    const s = fresh();
    applyEffect(s, { kind: "overall", timing: "immediate", amount: 5 }, injuryOf);
    expect(s.overall).toBe(65);
    applyEffect(s, { kind: "overall", timing: "immediate", amount: 100 }, injuryOf);
    expect(s.overall).toBe(99);
  });

  it("queues a deferred overall delta instead of applying now", () => {
    const s = fresh();
    s.phaseAbs = 2;
    applyEffect(s, { kind: "overall", timing: "deferred", amount: -4, delayPhases: 3 }, injuryOf);
    expect(s.overall).toBe(60);
    expect(s.pendingEffects).toEqual([
      { effect: { kind: "overall", timing: "deferred", amount: -4, delayPhases: 3 }, firePhaseAbs: 5 },
    ]);
  });

  it("clamps character to 0-100", () => {
    const s = fresh();
    applyEffect(s, { kind: "character", amount: -100 }, injuryOf);
    expect(s.character).toBe(0);
  });

  it("adds stat and snap totals to the current season line, creating it if absent", () => {
    const s = fresh();
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
    applyEffect(s, { kind: "stat", stat: "passYards", amount: 250 }, injuryOf);
    applyEffect(s, { kind: "snaps", amount: 40 }, injuryOf);
    expect(s.seasons[0]!.stats.passYards).toBe(250);
    expect(s.seasons[0]!.snaps).toBe(40);
  });

  it("registers an injury with recovery phases and an immediate overall penalty", () => {
    const s = fresh();
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf);
    expect(s.overall).toBe(48);
    expect(s.injuries).toEqual([{ injuryType: "acl", remainingPhases: 4, restoreAmount: 12 }]);
  });

  it("records trophies, awards, and moments", () => {
    const s = fresh();
    applyEffect(s, { kind: "trophy", id: "confTitle" }, injuryOf);
    applyEffect(s, { kind: "trophy", id: "confTitle" }, injuryOf);
    applyEffect(s, { kind: "award", id: "heisman" }, injuryOf);
    applyEffect(s, { kind: "moment", item: "Got catfished", icon: "phone" }, injuryOf);
    expect(s.trophies.confTitle).toBe(2);
    expect(s.awards).toEqual(["heisman"]);
    expect(s.moments).toEqual([{ seasonIndex: 0, item: "Got catfished", icon: "phone" }]);
  });

  it("an ending effect sets busted status and reason", () => {
    const s = fresh();
    applyEffect(s, { kind: "ending", reason: "Academic ineligibility" }, injuryOf);
    expect(s.status).toBe("busted");
    expect(s.endingReason).toBe("Academic ineligibility");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- effects`
Expected: FAIL — cannot find module `./effects`.

- [ ] **Step 3: Write `src/engine/effects.ts`**

```ts
import type { Effect, GameState } from "./types";

export type InjuryInfo = { overallDelta: number; recoveryPhases: number };
export type InjuryLookup = (injuryType: string) => InjuryInfo;

export function clampOverall(n: number): number {
  return Math.max(0, Math.min(99, Math.round(n)));
}
export function clampCharacter(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function currentSeason(state: GameState) {
  return state.seasons[state.seasons.length - 1];
}

export function applyEffect(state: GameState, effect: Effect, injuryOf: InjuryLookup): void {
  switch (effect.kind) {
    case "overall": {
      if (effect.timing === "deferred") {
        state.pendingEffects.push({
          effect,
          firePhaseAbs: state.phaseAbs + (effect.delayPhases ?? 1),
        });
      } else {
        // immediate and permanent both apply to overall now; the distinction
        // matters only for injury recovery (which never restores permanent loss).
        state.overall = clampOverall(state.overall + effect.amount);
      }
      return;
    }
    case "character": {
      state.character = clampCharacter(state.character + effect.amount);
      return;
    }
    case "stat": {
      const s = currentSeason(state);
      if (s) s.stats[effect.stat] = (s.stats[effect.stat] ?? 0) + effect.amount;
      return;
    }
    case "snaps": {
      const s = currentSeason(state);
      if (s) s.snaps += effect.amount;
      return;
    }
    case "injury": {
      const info = injuryOf(effect.injuryType);
      state.overall = clampOverall(state.overall - info.overallDelta);
      state.injuries.push({
        injuryType: effect.injuryType,
        remainingPhases: info.recoveryPhases,
        restoreAmount: info.overallDelta,
      });
      return;
    }
    case "suspension": {
      // Modeled as an injury-like block with no overall penalty: it zeroes snaps
      // while active. Reuse the injuries list with restoreAmount 0.
      state.injuries.push({
        injuryType: "suspension",
        remainingPhases: effect.phases,
        restoreAmount: 0,
      });
      return;
    }
    case "trophy": {
      state.trophies[effect.id] = (state.trophies[effect.id] ?? 0) + 1;
      return;
    }
    case "award": {
      if (!state.awards.includes(effect.id)) state.awards.push(effect.id);
      return;
    }
    case "moment": {
      state.moments.push({ seasonIndex: state.seasonIndex, item: effect.item, icon: effect.icon });
      return;
    }
    case "ending": {
      state.status = "busted";
      state.endingReason = effect.reason;
      return;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- effects`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/effects.ts src/engine/effects.test.ts
git commit -m "feat(engine): immediate effect application"
```

---

### Task 4: Phase ticking — deferred effects + injury recovery

**Files:**
- Modify: `src/engine/effects.ts` (add `tickPhaseStart`)
- Test: `src/engine/tick.test.ts`

**Interfaces:**
- Consumes: `GameState`, `applyEffect`, `InjuryLookup` from `./effects`.
- Produces: `function tickPhaseStart(state: GameState, injuryOf: InjuryLookup): void` — call at the start of each phase: fires due deferred effects, decrements active injuries, restores overall when an injury heals, and drops expired injuries/suspensions. Returns nothing (mutates).
  - Also produces helper `function isSidelined(state: GameState): boolean` — true if any injury/suspension is currently active (blocks snaps this phase).

- [ ] **Step 1: Write the failing test** — `src/engine/tick.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { tickPhaseStart, isSidelined, applyEffect, type InjuryLookup } from "./effects";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };
const injuryOf: InjuryLookup = () => ({ overallDelta: 10, recoveryPhases: 2 });

describe("tickPhaseStart", () => {
  it("fires deferred effects whose firePhaseAbs has arrived, once", () => {
    const s = createCareer(setup, "s");
    s.phaseAbs = 5;
    s.pendingEffects.push({ effect: { kind: "overall", timing: "deferred", amount: -6 }, firePhaseAbs: 5 });
    s.pendingEffects.push({ effect: { kind: "overall", timing: "deferred", amount: -2 }, firePhaseAbs: 9 });
    tickPhaseStart(s, injuryOf);
    expect(s.overall).toBe(54); // 60 - 6; the +9 one has not fired
    expect(s.pendingEffects).toEqual([
      { effect: { kind: "overall", timing: "deferred", amount: -2 }, firePhaseAbs: 9 },
    ]);
    // ticking again does not re-apply
    tickPhaseStart(s, injuryOf);
    expect(s.overall).toBe(54);
  });

  it("decrements injuries, heals (restores overall) and clears them when done", () => {
    const s = createCareer(setup, "s");
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf); // overall 50, remaining 2
    expect(s.overall).toBe(50);
    expect(isSidelined(s)).toBe(true);
    tickPhaseStart(s, injuryOf); // remaining -> 1, still injured, no restore yet
    expect(s.injuries[0]!.remainingPhases).toBe(1);
    expect(s.overall).toBe(50);
    tickPhaseStart(s, injuryOf); // remaining -> 0, heal now, restore +10, clear
    expect(s.injuries).toEqual([]);
    expect(s.overall).toBe(60);
    expect(isSidelined(s)).toBe(false);
  });

  it("suspensions expire without restoring overall", () => {
    const s = createCareer(setup, "s");
    applyEffect(s, { kind: "suspension", phases: 1 }, injuryOf);
    expect(isSidelined(s)).toBe(true);
    tickPhaseStart(s, injuryOf);
    expect(s.injuries).toEqual([]);
    expect(s.overall).toBe(60);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tick`
Expected: FAIL — `tickPhaseStart` / `isSidelined` not exported.

- [ ] **Step 3: Add to `src/engine/effects.ts`**

```ts
export function isSidelined(state: GameState): boolean {
  return state.injuries.some((i) => i.remainingPhases > 0);
}

export function tickPhaseStart(state: GameState, injuryOf: InjuryLookup): void {
  // 1) Fire deferred effects that are due, then drop them.
  const due = state.pendingEffects.filter((p) => p.firePhaseAbs <= state.phaseAbs);
  state.pendingEffects = state.pendingEffects.filter((p) => p.firePhaseAbs > state.phaseAbs);
  for (const p of due) applyEffect(state, p.effect, injuryOf);

  // 2) Decrement injuries; heal (restore overall) when they reach 0.
  const stillInjured: typeof state.injuries = [];
  for (const inj of state.injuries) {
    const remaining = inj.remainingPhases - 1;
    if (remaining <= 0) {
      state.overall = clampOverall(state.overall + inj.restoreAmount);
    } else {
      stillInjured.push({ ...inj, remainingPhases: remaining });
    }
  }
  state.injuries = stillInjured;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tick`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/effects.ts src/engine/tick.test.ts
git commit -m "feat(engine): phase ticking for deferred effects and injury recovery"
```

---

### Task 5: Outcome resolution

**Files:**
- Create: `src/engine/outcomes.ts`
- Test: `src/engine/outcomes.test.ts`

**Interfaces:**
- Consumes: `EventOption`, `Outcome` from `./types`; `Rng`, `rngChance` from `./rng`.
- Produces: `function resolveOutcome(option: EventOption, rng: Rng): Outcome` — rolls `probability`; returns `positiveOutcome` on success, else `negativeOutcome` (falling back to `positiveOutcome` if none defined).

- [ ] **Step 1: Write the failing test** — `src/engine/outcomes.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { resolveOutcome } from "./outcomes";
import { createRng } from "./rng";
import type { EventOption } from "./types";

const opt: EventOption = {
  id: "gym",
  label: "New workout regimen",
  probability: 0.5,
  positiveOutcome: { description: "gains", effects: [{ kind: "overall", timing: "permanent", amount: 3 }] },
  negativeOutcome: { description: "hurt", effects: [{ kind: "injury", injuryType: "hamstring" }] },
};

describe("resolveOutcome", () => {
  it("returns positiveOutcome when probability is 1", () => {
    const o = resolveOutcome({ ...opt, probability: 1 }, createRng("a"));
    expect(o.description).toBe("gains");
  });

  it("returns negativeOutcome when probability is 0", () => {
    const o = resolveOutcome({ ...opt, probability: 0 }, createRng("a"));
    expect(o.description).toBe("hurt");
  });

  it("falls back to positiveOutcome when no negativeOutcome is defined", () => {
    const deterministic: EventOption = { ...opt, probability: 0, negativeOutcome: undefined };
    expect(resolveOutcome(deterministic, createRng("a")).description).toBe("gains");
  });

  it("is deterministic for a given rng seed/cursor", () => {
    const a = resolveOutcome(opt, createRng("same"));
    const b = resolveOutcome(opt, createRng("same"));
    expect(a.description).toBe(b.description);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- outcomes`
Expected: FAIL — cannot find module `./outcomes`.

- [ ] **Step 3: Write `src/engine/outcomes.ts`**

```ts
import type { EventOption, Outcome } from "./types";
import { rngChance, type Rng } from "./rng";

export function resolveOutcome(option: EventOption, rng: Rng): Outcome {
  const success = rngChance(rng, option.probability);
  if (success) return option.positiveOutcome;
  return option.negativeOutcome ?? option.positiveOutcome;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- outcomes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/outcomes.ts src/engine/outcomes.test.ts
git commit -m "feat(engine): probabilistic outcome resolution"
```

---

### Task 6: Draft stock derivation + draft mapping

**Files:**
- Create: `src/engine/draft.ts`
- Test: `src/engine/draft.test.ts`

**Interfaces:**
- Consumes: `GameState`, `DraftResult`, `Tier` from `./types`; `Rng`, `rngInt` from `./rng`.
- Produces:
  - `function deriveDraftStock(state: GameState): number` — 0-100. Weights: overall (dominant), career production score, character, trophies/awards bonuses, class-year maturity.
  - `function eligibleTiers(state: GameState): Tier[]` — which school tiers realistically offer given `overall`/stock.
  - `function computeDraftResult(state: GameState, rng: Rng): DraftResult` — maps stock → round/pick (undrafted below a floor).

- [ ] **Step 1: Write the failing test** — `src/engine/draft.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { deriveDraftStock, eligibleTiers, computeDraftResult } from "./draft";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { GameState, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };
const base = (): GameState => createCareer(setup, "s");

describe("deriveDraftStock", () => {
  it("rises with overall", () => {
    const low = base(); low.overall = 55;
    const high = base(); high.overall = 90;
    expect(deriveDraftStock(high)).toBeGreaterThan(deriveDraftStock(low));
  });

  it("rises with trophies/awards and falls with poor character", () => {
    const plain = base(); plain.overall = 80;
    const decorated = base(); decorated.overall = 80;
    decorated.awards = ["heisman"]; decorated.trophies = { cfpTitle: 1 };
    expect(deriveDraftStock(decorated)).toBeGreaterThan(deriveDraftStock(plain));

    const redFlag = base(); redFlag.overall = 80; redFlag.character = 10;
    const clean = base(); clean.overall = 80; clean.character = 90;
    expect(deriveDraftStock(clean)).toBeGreaterThan(deriveDraftStock(redFlag));
  });

  it("is clamped to 0-100", () => {
    const s = base(); s.overall = 99; s.character = 100; s.awards = ["heisman", "allAmerican"];
    s.trophies = { cfpTitle: 3 };
    const stock = deriveDraftStock(s);
    expect(stock).toBeLessThanOrEqual(100);
    expect(stock).toBeGreaterThanOrEqual(0);
  });
});

describe("eligibleTiers", () => {
  it("only offers low tiers to weak players and unlocks blue-bloods for elite ones", () => {
    const weak = base(); weak.overall = 55;
    const elite = base(); elite.overall = 95; elite.awards = ["heisman"];
    expect(eligibleTiers(weak)).not.toContain(4);
    expect(eligibleTiers(elite)).toContain(4);
    expect(eligibleTiers(weak)).toContain(1);
  });
});

describe("computeDraftResult", () => {
  it("marks very low stock as undrafted", () => {
    const s = base(); s.overall = 45; s.character = 40;
    const r = computeDraftResult(s, createRng("d"));
    expect(r.undrafted).toBe(true);
    expect(r.round).toBe(0);
    expect(r.overallPick).toBe(0);
  });

  it("maps elite stock to round 1 with a valid overall pick", () => {
    const s = base(); s.overall = 97; s.character = 90; s.awards = ["heisman"]; s.trophies = { cfpTitle: 1 };
    const r = computeDraftResult(s, createRng("d"));
    expect(r.undrafted).toBe(false);
    expect(r.round).toBe(1);
    expect(r.overallPick).toBeGreaterThanOrEqual(1);
    expect(r.overallPick).toBeLessThanOrEqual(32);
  });

  it("is deterministic for a seed", () => {
    const s = base(); s.overall = 80;
    const a = computeDraftResult(s, createRng("same"));
    const b = computeDraftResult(s, createRng("same"));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- draft`
Expected: FAIL — cannot find module `./draft`.

- [ ] **Step 3: Write `src/engine/draft.ts`**

```ts
import type { DraftResult, GameState, Tier } from "./types";
import { rngInt, type Rng } from "./rng";

function productionScore(state: GameState): number {
  // Normalize total snaps across seasons into a 0-15 contribution.
  const totalSnaps = state.seasons.reduce((a, s) => a + s.snaps, 0);
  return Math.min(15, totalSnaps / 200);
}

export function deriveDraftStock(state: GameState): number {
  const overallPart = (state.overall - 40) * 1.4; // 40 -> 0, 99 -> ~82
  const production = productionScore(state);
  const characterPart = (state.character - 50) * 0.15; // +/- ~7.5
  const trophyPart = Object.values(state.trophies).reduce((a, n) => a + n, 0) * 2.5;
  const awardPart = state.awards.length * 3;
  const classPart = state.eligibility.classYear === "SR" ? 2 : 0;
  const raw = overallPart + production + characterPart + trophyPart + awardPart + classPart;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function eligibleTiers(state: GameState): Tier[] {
  const stock = deriveDraftStock(state);
  const tiers: Tier[] = [1];
  if (stock >= 25) tiers.push(2);
  if (stock >= 45) tiers.push(3);
  if (stock >= 70) tiers.push(4);
  return tiers;
}

const UNDRAFTED_FLOOR = 35;

export function computeDraftResult(state: GameState, rng: Rng): DraftResult {
  const stock = deriveDraftStock(state);
  if (stock < UNDRAFTED_FLOOR) {
    return { undrafted: true, round: 0, pick: 0, overallPick: 0, draftStock: stock };
  }
  // Higher stock -> earlier round. Bands chosen so 100 -> round 1, 35 -> round 7.
  const round = Math.max(1, Math.min(7, 8 - Math.ceil((stock - UNDRAFTED_FLOOR) / 9.3)));
  const pick = rngInt(rng, 1, 32);
  const overallPick = (round - 1) * 32 + pick;
  return { undrafted: false, round, pick, overallPick, draftStock: stock };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- draft`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/draft.ts src/engine/draft.test.ts
git commit -m "feat(engine): draft stock derivation and draft mapping"
```

---

### Task 7: Content schema validator

**Files:**
- Create: `src/content/schema.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Consumes: `GameEvent`, `Effect`, `Position` from `../engine/types`.
- Produces:
  - `interface ContentBundle { events: GameEvent[]; injuries: Record<string, { label: string; overallDelta: number; recoveryPhases: number }>; schools: { id: string; name: string; tier: 1|2|3|4; conference: string; state: string }[]; positions: Record<Position, { label: string; stats: string[] }>; trophyIds: string[]; awardIds: string[] }`
  - `function validateContent(bundle: ContentBundle): string[]` — returns a list of human-readable error strings (empty = valid). Checks: unique event ids; `probability∈[0,1]`; `weight≥0`; every `stat` effect names a stat that exists for at least one position; every `injury` effect references a known injury; every `trophy`/`award` effect references a known id; each event has ≥1 option; fixed events referenced by the engine exist (`recruiting`).

- [ ] **Step 1: Write the failing test** — `src/content/schema.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { validateContent, type ContentBundle } from "./schema";

function goodBundle(): ContentBundle {
  return {
    positions: {
      QB: { label: "Quarterback", stats: ["passYards", "passTds", "ints"] },
      OSKILL: { label: "Offensive skill", stats: ["scrimmageYards", "totalTds", "receptions"] },
      OL: { label: "Offensive line", stats: ["pancakes", "sacksAllowed"] },
      DL: { label: "Defensive line", stats: ["sacks", "tfls", "tackles"] },
      DSKILL: { label: "Defensive skill", stats: ["tackles", "ints", "passBreakups"] },
      K: { label: "Kicker", stats: ["fgPct", "longFg", "gameWinners"] },
    },
    injuries: { acl: { label: "Torn ACL", overallDelta: 12, recoveryPhases: 4 } },
    schools: [{ id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL" }],
    trophyIds: ["confTitle", "cfpTitle"],
    awardIds: ["heisman"],
    events: [
      {
        id: "recruiting",
        kind: "fixed",
        phase: "offseason",
        weight: 1,
        title: "Signing day",
        description: "Pick a school.",
        options: [
          { id: "commit", label: "Commit", probability: 1, positiveOutcome: { description: "ok", effects: [] } },
        ],
      },
      {
        id: "gym",
        kind: "random",
        phase: "offseason",
        weight: 3,
        title: "Workout",
        description: "Extra hours?",
        options: [
          {
            id: "grind",
            label: "Grind",
            probability: 0.7,
            positiveOutcome: { description: "+", effects: [{ kind: "overall", timing: "permanent", amount: 2 }] },
            negativeOutcome: { description: "-", effects: [{ kind: "injury", injuryType: "acl" }] },
          },
        ],
      },
    ],
  };
}

describe("validateContent", () => {
  it("accepts a well-formed bundle", () => {
    expect(validateContent(goodBundle())).toEqual([]);
  });

  it("flags duplicate event ids", () => {
    const b = goodBundle();
    b.events.push({ ...b.events[1]!, id: "gym" });
    expect(validateContent(b).join()).toContain("Duplicate event id");
  });

  it("flags out-of-range probability and negative weight", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.probability = 1.5;
    b.events[1]!.weight = -1;
    const errs = validateContent(b).join();
    expect(errs).toContain("probability");
    expect(errs).toContain("weight");
  });

  it("flags unknown injury/trophy/award/stat references", () => {
    const b = goodBundle();
    b.events[1]!.options[0]!.negativeOutcome!.effects = [
      { kind: "injury", injuryType: "nope" },
      { kind: "trophy", id: "ghost" },
      { kind: "award", id: "ghost" },
      { kind: "stat", stat: "notAStat", amount: 1 },
    ];
    const errs = validateContent(b).join();
    expect(errs).toContain("unknown injury");
    expect(errs).toContain("unknown trophy");
    expect(errs).toContain("unknown award");
    expect(errs).toContain("unknown stat");
  });

  it("flags events with no options and a missing recruiting event", () => {
    const b = goodBundle();
    b.events[1]!.options = [];
    b.events = b.events.filter((e) => e.id !== "recruiting");
    const errs = validateContent(b).join();
    expect(errs).toContain("no options");
    expect(errs).toContain("recruiting");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- schema`
Expected: FAIL — cannot find module `./schema`.

- [ ] **Step 3: Write `src/content/schema.ts`**

```ts
import type { Effect, GameEvent, Position } from "../engine/types";

export interface ContentBundle {
  events: GameEvent[];
  injuries: Record<string, { label: string; overallDelta: number; recoveryPhases: number }>;
  schools: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string }[];
  positions: Record<Position, { label: string; stats: string[] }>;
  trophyIds: string[];
  awardIds: string[];
}

export function validateContent(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const knownStats = new Set<string>();
  for (const p of Object.values(bundle.positions)) for (const s of p.stats) knownStats.add(s);
  const knownInjuries = new Set(Object.keys(bundle.injuries));
  const knownTrophies = new Set(bundle.trophyIds);
  const knownAwards = new Set(bundle.awardIds);

  const seen = new Set<string>();
  for (const ev of bundle.events) {
    if (seen.has(ev.id)) errors.push(`Duplicate event id: ${ev.id}`);
    seen.add(ev.id);
    if (ev.weight < 0) errors.push(`Event ${ev.id}: weight must be >= 0`);
    if (ev.options.length === 0) errors.push(`Event ${ev.id}: has no options`);
    for (const opt of ev.options) {
      if (opt.probability < 0 || opt.probability > 1)
        errors.push(`Event ${ev.id} option ${opt.id}: probability must be in [0,1]`);
      const outcomes = [opt.positiveOutcome, opt.negativeOutcome].filter(Boolean);
      for (const oc of outcomes) for (const eff of oc!.effects) checkEffect(ev.id, opt.id, eff, errors);
    }
  }
  if (!seen.has("recruiting")) errors.push('Missing required fixed event "recruiting"');
  return errors;

  function checkEffect(evId: string, optId: string, eff: Effect, out: string[]) {
    const where = `Event ${evId} option ${optId}`;
    if (eff.kind === "injury" && !knownInjuries.has(eff.injuryType))
      out.push(`${where}: unknown injury "${eff.injuryType}"`);
    if (eff.kind === "trophy" && !knownTrophies.has(eff.id)) out.push(`${where}: unknown trophy "${eff.id}"`);
    if (eff.kind === "award" && !knownAwards.has(eff.id)) out.push(`${where}: unknown award "${eff.id}"`);
    if (eff.kind === "stat" && !knownStats.has(eff.stat)) out.push(`${where}: unknown stat "${eff.stat}"`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- schema`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/schema.ts src/content/schema.test.ts
git commit -m "feat(content): content schema validator"
```

---

### Task 8: Thin content slice (QB) + validated bundle

**Files:**
- Create: `src/content/positions.ts`
- Create: `src/content/injuries.ts`
- Create: `src/content/schools.ts`
- Create: `src/content/events.ts`
- Create: `src/content/index.ts`
- Test: `src/content/index.test.ts`

**Interfaces:**
- Consumes: `ContentBundle`, `validateContent` from `./schema`; types from `../engine/types`.
- Produces: `export const CONTENT: ContentBundle` (assembled + guaranteed valid). This slice covers **QB only** but defines all six position stat sets so the schema is complete.

- [ ] **Step 1: Write `src/content/positions.ts`**

```ts
import type { Position } from "../engine/types";

export const POSITIONS: Record<Position, { label: string; stats: string[] }> = {
  QB: { label: "Quarterback", stats: ["passYards", "passTds", "ints"] },
  OSKILL: { label: "Offensive skill", stats: ["scrimmageYards", "totalTds", "receptions"] },
  OL: { label: "Offensive line", stats: ["pancakes", "sacksAllowed"] },
  DL: { label: "Defensive line", stats: ["sacks", "tfls", "tackles"] },
  DSKILL: { label: "Defensive skill", stats: ["tackles", "ints", "passBreakups"] },
  K: { label: "Kicker", stats: ["fgPct", "longFg", "gameWinners"] },
};
```

- [ ] **Step 2: Write `src/content/injuries.ts`**

```ts
export const INJURIES: Record<string, { label: string; overallDelta: number; recoveryPhases: number }> = {
  hamstring: { label: "Hamstring strain", overallDelta: 3, recoveryPhases: 1 },
  ankle: { label: "High-ankle sprain", overallDelta: 5, recoveryPhases: 2 },
  shoulder: { label: "Shoulder sprain", overallDelta: 6, recoveryPhases: 2 },
  concussion: { label: "Concussion", overallDelta: 4, recoveryPhases: 1 },
  acl: { label: "Torn ACL", overallDelta: 14, recoveryPhases: 5 },
};
```

- [ ] **Step 3: Write `src/content/schools.ts`**

```ts
export const SCHOOLS: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string }[] = [
  { id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL" },
  { id: "uga", name: "Georgia", tier: 4, conference: "SEC", state: "GA" },
  { id: "osu", name: "Ohio State", tier: 4, conference: "Big Ten", state: "OH" },
  { id: "smu", name: "SMU", tier: 3, conference: "ACC", state: "TX" },
  { id: "ksu", name: "Kansas State", tier: 3, conference: "Big 12", state: "KS" },
  { id: "boise", name: "Boise State", tier: 2, conference: "Mountain West", state: "ID" },
  { id: "app", name: "App State", tier: 2, conference: "Sun Belt", state: "NC" },
  { id: "unt", name: "North Texas", tier: 2, conference: "American", state: "TX" },
  { id: "mont", name: "Montana", tier: 1, conference: "Big Sky", state: "MT" },
  { id: "ndsu", name: "North Dakota State", tier: 1, conference: "MVFC", state: "ND" },
];
```

- [ ] **Step 4: Write `src/content/events.ts`** (thin but complete-enough slice for a QB career)

```ts
import type { GameEvent } from "../engine/types";

// Phase 1 slice: a recruiting fixed event, a handful of random on-field and
// off-field events, an injury gamble, and a fixed declare-for-draft milestone.
// The declare event is injected by the engine at the offseason hub (Task 11),
// so it is NOT listed here; these are the pooled + recruiting events.
export const EVENTS: GameEvent[] = [
  {
    id: "recruiting",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    title: "Signing Day",
    description: "The offers are in. Where do you commit?",
    // Options are generated dynamically by the engine from eligibleTiers (Task 10);
    // this single placeholder option keeps the event schema-valid. The engine
    // overrides recruiting options at runtime.
    options: [
      { id: "commit", label: "Commit", probability: 1, positiveOutcome: { description: "Committed.", effects: [] } },
    ],
  },
  {
    id: "gym-grind",
    kind: "random",
    phase: "offseason",
    weight: 4,
    title: "New Workout Regimen",
    description: "Your trainer wants you putting in extra hours. Risky, but it could pay off.",
    options: [
      {
        id: "grind",
        label: "Put in the extra hours",
        probability: 0.72,
        positiveOutcome: {
          description: "You come back noticeably stronger.",
          effects: [{ kind: "overall", timing: "permanent", amount: 3 }],
        },
        negativeOutcome: {
          description: "You tweak a hamstring pushing too hard.",
          effects: [{ kind: "injury", injuryType: "hamstring" }],
        },
      },
      {
        id: "rest",
        label: "Play it safe and rest",
        probability: 1,
        positiveOutcome: { description: "You stay fresh, no change.", effects: [] },
      },
    ],
  },
  {
    id: "film-study",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    conditions: { position: ["QB"] },
    title: "Extra Film Study",
    description: "The QB room is open late. Grind the tape?",
    options: [
      {
        id: "study",
        label: "Study the tape",
        probability: 0.9,
        positiveOutcome: {
          description: "The game slows down for you.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 1 },
            { kind: "stat", stat: "passYards", amount: 120 },
          ],
        },
        negativeOutcome: { description: "You're gassed for practice.", effects: [{ kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 } ] },
      },
    ],
  },
  {
    id: "catfished",
    kind: "random",
    phase: "conference",
    weight: 2,
    title: "You Got Catfished",
    description: "That 'booster's daughter' in your DMs was a rival fan running a bit. It's all over social media.",
    options: [
      {
        id: "laugh",
        label: "Laugh it off publicly",
        probability: 0.8,
        positiveOutcome: {
          description: "Fans love the good sport. Character intact.",
          effects: [{ kind: "moment", item: "Got catfished, handled it like a champ", icon: "phone" }, { kind: "character", amount: 2 }],
        },
        negativeOutcome: {
          description: "Your clapback makes it worse.",
          effects: [{ kind: "character", amount: -6 }, { kind: "moment", item: "Catfishing meltdown went viral", icon: "phone" }],
        },
      },
      {
        id: "ignore",
        label: "Go dark and ignore it",
        probability: 1,
        positiveOutcome: { description: "It blows over in a week.", effects: [{ kind: "moment", item: "Weathered a catfishing saga", icon: "phone" }] },
      },
    ],
  },
  {
    id: "speeding-georgia",
    kind: "random",
    phase: "conference",
    weight: 2,
    title: "Speeding Ticket in Georgia",
    description: "Blue lights on a two-lane road outside Athens. You were doing 96.",
    options: [
      {
        id: "cooperate",
        label: "Yes sir, no sir",
        probability: 0.85,
        positiveOutcome: { description: "A warning and a story.", effects: [{ kind: "moment", item: "Talked his way out of a speeding ticket", icon: "car" }] },
        negativeOutcome: { description: "Coach finds out. One-game suspension.", effects: [{ kind: "suspension", phases: 1 }, { kind: "character", amount: -4 }] },
      },
    ],
  },
  {
    id: "signature-win",
    kind: "random",
    phase: "postseason",
    weight: 3,
    conditions: { position: ["QB"] },
    title: "Bowl Spotlight",
    description: "National TV, prime time. Do you rise to it?",
    options: [
      {
        id: "ball-out",
        label: "Leave it all on the field",
        probability: 0.6,
        positiveOutcome: {
          description: "You put on a show and win MVP buzz.",
          effects: [
            { kind: "stat", stat: "passYards", amount: 320 },
            { kind: "stat", stat: "passTds", amount: 3 },
            { kind: "overall", timing: "permanent", amount: 2 },
          ],
        },
        negativeOutcome: {
          description: "Nerves. Two picks and a rough night.",
          effects: [{ kind: "stat", stat: "ints", amount: 2 }, { kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
];
```

- [ ] **Step 5: Write `src/content/index.ts`**

```ts
import { validateContent, type ContentBundle } from "./schema";
import { POSITIONS } from "./positions";
import { INJURIES } from "./injuries";
import { SCHOOLS } from "./schools";
import { EVENTS } from "./events";

export const CONTENT: ContentBundle = {
  positions: POSITIONS,
  injuries: INJURIES,
  schools: SCHOOLS,
  trophyIds: ["confTitle", "cfpTitle", "bowlWin"],
  awardIds: ["heisman", "allAmerican", "allConference"],
  events: EVENTS,
};

// Fail fast at module load if content is malformed.
const _errors = validateContent(CONTENT);
if (_errors.length > 0) {
  throw new Error("Invalid CONTENT bundle:\n" + _errors.join("\n"));
}
```

- [ ] **Step 6: Write the failing test** — `src/content/index.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { CONTENT } from "./index";
import { validateContent } from "./schema";

describe("CONTENT bundle", () => {
  it("passes its own validator", () => {
    expect(validateContent(CONTENT)).toEqual([]);
  });
  it("includes the required recruiting event and QB events", () => {
    const ids = CONTENT.events.map((e) => e.id);
    expect(ids).toContain("recruiting");
    expect(ids).toContain("gym-grind");
  });
  it("defines stats for all six position buckets", () => {
    expect(Object.keys(CONTENT.positions).sort()).toEqual(["DL", "DSKILL", "K", "OL", "OSKILL", "QB"]);
  });
});
```

- [ ] **Step 7: Run tests**

Run: `npm test -- content/index`
Expected: PASS (and no throw at import).

- [ ] **Step 8: Commit**

```bash
git add src/content/positions.ts src/content/injuries.ts src/content/schools.ts src/content/events.ts src/content/index.ts src/content/index.test.ts
git commit -m "feat(content): thin QB content slice + validated bundle"
```

---

### Task 9: Event selection for a phase

**Files:**
- Create: `src/engine/select-event.ts`
- Test: `src/engine/select-event.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameEvent` from `./types`; `Rng`, `rngWeightedPick` from `./rng`; `ContentBundle` from `../content/schema`.
- Produces:
  - `function eventMatches(state: GameState, ev: GameEvent): boolean` — checks phase + conditions (position, minClass, tier, requiresInjury).
  - `function selectRandomEvent(state: GameState, content: ContentBundle, rng: Rng): GameEvent | null` — from `kind:'random'` events matching the current phase/conditions, weighted-pick one (or null if none).

- [ ] **Step 1: Write the failing test** — `src/engine/select-event.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { eventMatches, selectRandomEvent } from "./select-event";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { ContentBundle } from "../content/schema";
import type { GameEvent, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

const qbEvent: GameEvent = {
  id: "qb-only", kind: "random", phase: "nonconf", weight: 5, conditions: { position: ["QB"] },
  title: "t", description: "d",
  options: [{ id: "o", label: "l", probability: 1, positiveOutcome: { description: "x", effects: [] } }],
};
const dlEvent: GameEvent = { ...qbEvent, id: "dl-only", conditions: { position: ["DL"] } };
const bundle = (events: GameEvent[]): ContentBundle => ({
  events, injuries: {}, schools: [], positions: {} as any, trophyIds: [], awardIds: [],
});

describe("eventMatches", () => {
  it("requires the current phase", () => {
    const s = createCareer(setup, "s"); s.phase = "offseason";
    expect(eventMatches(s, qbEvent)).toBe(false);
    s.phase = "nonconf";
    expect(eventMatches(s, qbEvent)).toBe(true);
  });
  it("respects position conditions", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    expect(eventMatches(s, dlEvent)).toBe(false);
  });
  it("respects minClass and tier and requiresInjury", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    const srOnly: GameEvent = { ...qbEvent, conditions: { minClass: "SR" } };
    expect(eventMatches(s, srOnly)).toBe(false);
    s.eligibility.classYear = "SR";
    expect(eventMatches(s, srOnly)).toBe(true);
    const injuredOnly: GameEvent = { ...qbEvent, conditions: { requiresInjury: true } };
    expect(eventMatches(s, injuredOnly)).toBe(false);
    s.injuries.push({ injuryType: "acl", remainingPhases: 2, restoreAmount: 10 });
    expect(eventMatches(s, injuredOnly)).toBe(true);
  });
});

describe("selectRandomEvent", () => {
  it("returns null when nothing matches", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    expect(selectRandomEvent(s, bundle([dlEvent]), createRng("s"))).toBeNull();
  });
  it("returns a matching event", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    const ev = selectRandomEvent(s, bundle([qbEvent, dlEvent]), createRng("s"));
    expect(ev?.id).toBe("qb-only");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- select-event`
Expected: FAIL — cannot find module `./select-event`.

- [ ] **Step 3: Write `src/engine/select-event.ts`**

```ts
import type { GameEvent, GameState } from "./types";
import { CLASS_ORDER } from "./types";
import { rngWeightedPick, type Rng } from "./rng";
import type { ContentBundle } from "../content/schema";

export function eventMatches(state: GameState, ev: GameEvent): boolean {
  if (ev.phase !== state.phase) return false;
  const c = ev.conditions;
  if (!c) return true;
  if (c.position && !c.position.includes(state.setup.position)) return false;
  if (c.tier && !c.tier.includes(state.school.tier)) return false;
  if (c.minClass) {
    const need = CLASS_ORDER.indexOf(c.minClass);
    const have = CLASS_ORDER.indexOf(state.eligibility.classYear);
    if (have < need) return false;
  }
  if (c.requiresInjury && state.injuries.length === 0) return false;
  return true;
}

export function selectRandomEvent(state: GameState, content: ContentBundle, rng: Rng): GameEvent | null {
  const pool = content.events.filter((e) => e.kind === "random" && eventMatches(state, e));
  if (pool.length === 0) return null;
  return rngWeightedPick(rng, pool, (e) => e.weight);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- select-event`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/select-event.ts src/engine/select-event.test.ts
git commit -m "feat(engine): phase event selection with condition matching"
```

---

### Task 10: Season simulation + recruiting resolution

**Files:**
- Create: `src/engine/simulate.ts`
- Test: `src/engine/simulate.test.ts`

**Interfaces:**
- Consumes: `GameState`, `SeasonLine`, `Position` from `./types`; `Rng`, `rngInt` from `./rng`; `isSidelined` from `./effects`; `eligibleTiers` from `./draft`; `ContentBundle` from `../content/schema`.
- Produces:
  - `function recruitingOptions(state: GameState, content: ContentBundle): { id: string; label: string; schoolId: string; tier: Tier }[]` — one option per eligible tier, choosing a representative school from `content.schools`.
  - `function applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void` — sets `state.school`, starts season 0's `SeasonLine`.
  - `function simulatePhaseProduction(state: GameState, rng: Rng): void` — for on-field phases (`nonconf`/`conference`/`postseason`), if not sidelined, accrue snaps + position stats into the current season line.

- [ ] **Step 1: Write the failing test** — `src/engine/simulate.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { recruitingOptions, applyRecruitingChoice, simulatePhaseProduction } from "./simulate";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("recruiting", () => {
  it("offers only tiers the player is eligible for at baseline (no blue-bloods)", () => {
    const s = createCareer(setup, "s");
    const opts = recruitingOptions(s, CONTENT);
    const tiers = opts.map((o) => o.tier);
    expect(tiers).toContain(1);
    expect(tiers).not.toContain(4);
  });

  it("applying a choice sets the school and opens season 0", () => {
    const s = createCareer(setup, "s");
    const opts = recruitingOptions(s, CONTENT);
    applyRecruitingChoice(s, opts[0]!.schoolId, CONTENT);
    expect(s.school.schoolId).toBe(opts[0]!.schoolId);
    expect(s.seasons).toHaveLength(1);
    expect(s.seasons[0]!.seasonIndex).toBe(0);
  });
});

describe("simulatePhaseProduction", () => {
  it("accrues snaps and QB stats during on-field phases", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "conference";
    simulatePhaseProduction(s, createRng("p"));
    expect(s.seasons[0]!.snaps).toBeGreaterThan(0);
    expect(s.seasons[0]!.stats.passYards).toBeGreaterThan(0);
  });

  it("accrues nothing while sidelined", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "conference";
    s.injuries.push({ injuryType: "acl", remainingPhases: 2, restoreAmount: 10 });
    simulatePhaseProduction(s, createRng("p"));
    expect(s.seasons[0]!.snaps).toBe(0);
  });

  it("accrues nothing during the offseason", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "offseason";
    simulatePhaseProduction(s, createRng("p"));
    expect(s.seasons[0]!.snaps).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- simulate`
Expected: FAIL — cannot find module `./simulate`.

- [ ] **Step 3: Write `src/engine/simulate.ts`**

```ts
import type { GameState, Position, SeasonLine, Tier } from "./types";
import { rngInt, type Rng } from "./rng";
import { isSidelined } from "./effects";
import { eligibleTiers } from "./draft";
import type { ContentBundle } from "../content/schema";

export function recruitingOptions(
  state: GameState,
  content: ContentBundle,
): { id: string; label: string; schoolId: string; tier: Tier }[] {
  const tiers = eligibleTiers(state);
  const opts: { id: string; label: string; schoolId: string; tier: Tier }[] = [];
  for (const tier of tiers) {
    // Prefer a school in the player's home state, else the first of that tier.
    const inTier = content.schools.filter((s) => s.tier === tier);
    if (inTier.length === 0) continue;
    const home = inTier.find((s) => s.state === state.setup.homeState);
    const school = home ?? inTier[0]!;
    opts.push({ id: `commit-${school.id}`, label: `Commit to ${school.name}`, schoolId: school.id, tier });
  }
  return opts;
}

function newSeasonLine(state: GameState): SeasonLine {
  return { seasonIndex: state.seasonIndex, schoolId: state.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 };
}

export function applyRecruitingChoice(state: GameState, schoolId: string, content: ContentBundle): void {
  const school = content.schools.find((s) => s.id === schoolId);
  if (!school) throw new Error(`Unknown school: ${schoolId}`);
  state.school = { schoolId: school.id, tier: school.tier };
  if (state.seasons.length === 0) state.seasons.push(newSeasonLine(state));
}

const ON_FIELD = new Set(["nonconf", "conference", "postseason"]);

// Per-position stat yields per 100 snaps at overall 70, scaled by overall.
const STAT_MODEL: Record<Position, { snapsMin: number; snapsMax: number; per100: Record<string, number> }> = {
  QB: { snapsMin: 120, snapsMax: 200, per100: { passYards: 260, passTds: 2, ints: 1 } },
  OSKILL: { snapsMin: 120, snapsMax: 200, per100: { scrimmageYards: 180, totalTds: 2, receptions: 8 } },
  OL: { snapsMin: 150, snapsMax: 220, per100: { pancakes: 6, sacksAllowed: 2 } },
  DL: { snapsMin: 130, snapsMax: 200, per100: { sacks: 1.5, tfls: 3, tackles: 10 } },
  DSKILL: { snapsMin: 130, snapsMax: 200, per100: { tackles: 12, ints: 1, passBreakups: 3 } },
  K: { snapsMin: 40, snapsMax: 70, per100: { fgPct: 0, longFg: 0, gameWinners: 0 } },
};

export function simulatePhaseProduction(state: GameState, rng: Rng): void {
  if (!ON_FIELD.has(state.phase)) return;
  if (isSidelined(state)) return;
  const season = state.seasons[state.seasons.length - 1];
  if (!season) return;
  const model = STAT_MODEL[state.setup.position];
  const snaps = rngInt(rng, model.snapsMin, model.snapsMax);
  season.snaps += snaps;
  const skill = state.overall / 70;
  for (const [stat, per100] of Object.entries(model.per100)) {
    const jitter = 0.85 + rng.next() * 0.3; // 0.85–1.15
    const yield_ = (per100 * snaps) / 100 * skill * jitter;
    season.stats[stat] = (season.stats[stat] ?? 0) + Math.round(yield_);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- simulate`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/simulate.ts src/engine/simulate.test.ts
git commit -m "feat(engine): season production model + recruiting resolution"
```

---

### Task 11: The `advance` orchestrator

**Files:**
- Create: `src/engine/advance.ts`
- Create: `src/engine/index.ts` (public barrel)
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: everything above + `CONTENT`.
- Produces:
  - `interface PendingDecision { eventId: string; title: string; description: string; options: { id: string; label: string }[] }`
  - `function getDecision(state: GameState, content?: ContentBundle): PendingDecision | null` — describes the choice the player currently faces (recruiting options are generated; declare options are generated; otherwise the event's own options).
  - `function advance(state: GameState, choiceId: string, content?: ContentBundle): GameState` — pure: clones state, applies the choice, runs auto-progression (production, phase/season advance, offseason hub) until the next decision or an ending, returns the new state.
  - Re-exports from `./index.ts`: `createCareer`, `advance`, `getDecision`, `deriveDraftStock`, and key types.

**Progression rules (implement exactly):**
- The four phases cycle `offseason → nonconf → conference → postseason → (next season) offseason`.
- **Recruiting** (`currentEventId==='recruiting'`, season 0 offseason): `getDecision` returns generated `recruitingOptions`; `advance` calls `applyRecruitingChoice`, clears `currentEventId`, then auto-progresses.
- **Offseason hub** each offseason after season 0's play: advance eligibility (`FR→SO→JR→SR`, `yearsUsed++`); set `draftEligible=true` once `classYear` is `JR` or `SR`; if `draftEligible`, present the **declare** decision (a synthetic event id `declare`) with options `declare` (→ status `declared`) and `return` (keep playing). `SR` who chooses `return` is force-declared after the following season (no eligibility left).
- **Auto-progression loop:** at each phase, `tickPhaseStart`; if an on-field phase, `simulatePhaseProduction`; then try `selectRandomEvent` — if one is found, set `currentEventId` and **stop** (a decision is pending); if none, advance to the next phase. At each new offseason (after season 0) run the hub. Increment `phaseAbs` on every phase advance and `seasonIndex` + push a new `SeasonLine` at each season rollover.
- **Endings:** if `status==='declared'`, compute `computeDraftResult`, set `status='drafted'` (or leave `busted` if an ending effect fired), store `draftResult`, stop. If `status==='busted'`, stop.
- **RNG discipline:** create the rng once via `createRng(state.seed, state.rngCursor)`, and at the end write `state.rngCursor = rng.cursor` so the next `advance` resumes the stream.

- [ ] **Step 1: Write the failing test** — `src/engine/advance.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { advance, getDecision } from "./advance";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Allen", jerseyNumber: 7, homeState: "MT", position: "QB" };

function autoplay(seed: string) {
  let s = createCareer(setup, seed);
  let guard = 0;
  while (s.status === "active" && guard++ < 500) {
    const decision = getDecision(s);
    if (!decision) throw new Error("active career with no decision");
    // Policy: always take the first option.
    s = advance(s, decision.options[0]!.id);
  }
  return s;
}

describe("advance / getDecision", () => {
  it("first decision is recruiting with tier options", () => {
    const s = createCareer(setup, "seed");
    const d = getDecision(s);
    expect(d?.eventId).toBe("recruiting");
    expect(d!.options.length).toBeGreaterThan(0);
    expect(d!.options[0]!.id).toContain("commit-");
  });

  it("plays a full career to a terminal state", () => {
    const s = autoplay("career-1");
    expect(["drafted", "busted"]).toContain(s.status);
    if (s.status === "drafted") expect(s.draftResult).toBeDefined();
  });

  it("is deterministic: same seed + same policy => identical final state", () => {
    const a = autoplay("determinism");
    const b = autoplay("determinism");
    expect(a).toEqual(b);
  });

  it("advances eligibility across seasons (reaches at least JR before ending)", () => {
    const s = autoplay("eligibility");
    // A first-option policy returns to school when able, so it should progress past FR.
    const reachedUpperclass = s.eligibility.yearsUsed >= 2;
    expect(reachedUpperclass).toBe(true);
  });

  it("does not mutate the input state (purity)", () => {
    const s0 = createCareer(setup, "pure");
    const d = getDecision(s0)!;
    const snapshot = JSON.parse(JSON.stringify(s0));
    advance(s0, d.options[0]!.id);
    expect(s0).toEqual(snapshot);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- advance`
Expected: FAIL — cannot find module `./advance`.

- [ ] **Step 3: Write `src/engine/advance.ts`**

```ts
import type { GameEvent, GameState } from "./types";
import { PHASE_ORDER, CLASS_ORDER } from "./types";
import { createRng, type Rng } from "./rng";
import { applyEffect, tickPhaseStart, type InjuryLookup } from "./effects";
import { resolveOutcome } from "./outcomes";
import { selectRandomEvent } from "./select-event";
import { recruitingOptions, applyRecruitingChoice, simulatePhaseProduction } from "./simulate";
import { computeDraftResult } from "./draft";
import { CONTENT } from "../content/index";
import type { ContentBundle } from "../content/schema";

const DECLARE_EVENT_ID = "declare";

export interface PendingDecision {
  eventId: string;
  title: string;
  description: string;
  options: { id: string; label: string }[];
}

function injuryLookup(content: ContentBundle): InjuryLookup {
  return (t) => content.injuries[t] ?? { overallDelta: 3, recoveryPhases: 1 };
}

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export function getDecision(state: GameState, content: ContentBundle = CONTENT): PendingDecision | null {
  if (state.status !== "active" || state.currentEventId === null) return null;
  if (state.currentEventId === "recruiting") {
    const opts = recruitingOptions(state, content);
    return { eventId: "recruiting", title: "Signing Day", description: "Where do you commit?", options: opts.map((o) => ({ id: o.id, label: o.label })) };
  }
  if (state.currentEventId === DECLARE_EVENT_ID) {
    return {
      eventId: DECLARE_EVENT_ID,
      title: "Declare for the Draft?",
      description: "You're draft-eligible. Cash in now, or return for another season?",
      options: [
        { id: "declare", label: "Declare for the NFL Draft" },
        { id: "return", label: "Return to school" },
      ],
    };
  }
  const ev = content.events.find((e) => e.id === state.currentEventId);
  if (!ev) return null;
  return { eventId: ev.id, title: ev.title, description: ev.description, options: ev.options.map((o) => ({ id: o.id, label: o.label })) };
}

export function advance(state: GameState, choiceId: string, content: ContentBundle = CONTENT): GameState {
  const s = clone(state);
  const rng = createRng(s.seed, s.rngCursor);
  const injuryOf = injuryLookup(content);

  applyChoice(s, choiceId, content, rng, injuryOf);
  if (s.status === "active") autoProgress(s, content, rng, injuryOf);
  finalizeIfEnded(s, rng);

  s.rngCursor = rng.cursor;
  return s;
}

function applyChoice(s: GameState, choiceId: string, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  if (s.currentEventId === "recruiting") {
    const opt = recruitingOptions(s, content).find((o) => o.id === choiceId);
    if (!opt) throw new Error(`Invalid recruiting choice: ${choiceId}`);
    applyRecruitingChoice(s, opt.schoolId, content);
    s.currentEventId = null;
    return;
  }
  if (s.currentEventId === DECLARE_EVENT_ID) {
    if (choiceId === "declare") s.status = "declared";
    s.currentEventId = null;
    return;
  }
  const ev = content.events.find((e) => e.id === s.currentEventId);
  if (!ev) throw new Error(`No current event: ${s.currentEventId}`);
  const opt = ev.options.find((o) => o.id === choiceId);
  if (!opt) throw new Error(`Invalid choice ${choiceId} for event ${ev.id}`);
  const outcome = resolveOutcome(opt, rng);
  for (const eff of outcome.effects) applyEffect(s, eff, injuryOf);
  s.currentEventId = null;
}

function advancePhase(s: GameState): void {
  const idx = PHASE_ORDER.indexOf(s.phase);
  if (idx === PHASE_ORDER.length - 1) {
    // postseason -> next season offseason
    s.seasonIndex += 1;
    s.phase = "offseason";
    s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
  } else {
    s.phase = PHASE_ORDER[idx + 1]!;
  }
  s.phaseAbs += 1;
}

function runOffseasonHub(s: GameState): void {
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
  if (s.eligibility.draftEligible) s.currentEventId = DECLARE_EVENT_ID;
}

function autoProgress(s: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  let guard = 0;
  while (s.status === "active" && s.currentEventId === null && guard++ < 1000) {
    if (!s.phaseSimulated) {
      // First time entering this phase: tick + produce exactly once.
      tickPhaseStart(s, injuryOf);
      if (s.status !== "active") return;
      simulatePhaseProduction(s, rng);
      s.phaseSimulated = true;

      // At most one random event per phase. If one fires, stop for a decision.
      const ev: GameEvent | null = selectRandomEvent(s, content, rng);
      if (ev) {
        s.currentEventId = ev.id;
        return;
      }
    }
    // Phase fully handled (no event, or the event was just resolved): move on.
    advancePhase(s);
    s.phaseSimulated = false;
    if (s.phase === "offseason") {
      runOffseasonHub(s);
      // Hub may set a declare decision (stop) or force-declare (ending).
      if (s.currentEventId !== null || s.status !== "active") return;
    }
  }
}

function finalizeIfEnded(s: GameState, rng: Rng): void {
  if (s.status === "declared") {
    s.draftResult = computeDraftResult(s, rng);
    s.status = "drafted";
  }
}
```

- [ ] **Step 4: Write `src/engine/index.ts`**

```ts
export { createCareer } from "./create-career";
export { advance, getDecision, type PendingDecision } from "./advance";
export { deriveDraftStock, computeDraftResult, eligibleTiers } from "./draft";
export type { GameState, Setup, Position, DraftResult } from "./types";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- advance`
Expected: PASS (all cases, including determinism and purity).

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/engine/advance.ts src/engine/index.ts src/engine/advance.test.ts
git commit -m "feat(engine): advance orchestrator + public engine API"
```

---

### Task 12: Headless play CLI + Monte-Carlo balance harness

**Files:**
- Create: `src/sim/policies.ts`
- Create: `src/sim/play-headless.ts`
- Create: `src/sim/balance.ts`
- Test: `src/sim/balance.test.ts`
- Modify: `package.json` (add `play` and `balance` scripts)

**Interfaces:**
- Consumes: `createCareer`, `advance`, `getDecision`, `GameState`, `Setup` from `../engine/index`; `createRng` from `../engine/rng`.
- Produces:
  - `type Policy = (state: GameState, options: { id: string; label: string }[], rng: Rng) => string` (returns a chosen option id).
  - `firstOptionPolicy`, `randomPolicy` implementations.
  - `function playCareer(setup: Setup, seed: string, policy: Policy): GameState` — drives a full career to terminal.
  - `interface BalanceReport { runs: number; draftedRate: number; bustedRate: number; round1Rate: number; avgSeasons: number; undraftedRate: number }`
  - `function runBalance(runs: number, seedPrefix: string, policy: Policy): BalanceReport`

- [ ] **Step 1: Write `src/sim/policies.ts`**

```ts
import type { GameState } from "../engine/index";
import { rngInt, type Rng } from "../engine/rng";

export type Policy = (state: GameState, options: { id: string; label: string }[], rng: Rng) => string;

export const firstOptionPolicy: Policy = (_s, options) => options[0]!.id;

export const randomPolicy: Policy = (_s, options, rng) => options[rngInt(rng, 0, options.length - 1)]!.id;
```

- [ ] **Step 2: Write `src/sim/play-headless.ts`**

```ts
import { createCareer, advance, getDecision, type GameState, type Setup } from "../engine/index";
import { createRng } from "../engine/rng";
import { firstOptionPolicy, randomPolicy, type Policy } from "./policies";

export function playCareer(setup: Setup, seed: string, policy: Policy): GameState {
  let s = createCareer(setup, seed);
  // A dedicated policy rng, seeded separately so policy choices don't disturb engine determinism.
  const policyRng = createRng(seed + ":policy");
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    s = advance(s, choice);
  }
  return s;
}

// Simple CLI entry: `npm run play -- <seed>`
function main() {
  const seed = process.argv[2] ?? "demo";
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };
  const policy: Policy = process.argv[3] === "random" ? randomPolicy : firstOptionPolicy;
  const s = playCareer(setup, seed, policy);
  const summary = {
    status: s.status,
    endingReason: s.endingReason,
    seasons: s.seasons.length,
    overall: s.overall,
    character: s.character,
    awards: s.awards,
    trophies: s.trophies,
    draft: s.draftResult,
    moments: s.moments.map((m) => m.item),
  };
  console.log(JSON.stringify(summary, null, 2));
}

// Run only when invoked directly.
if (process.argv[1] && process.argv[1].endsWith("play-headless.ts")) main();
```

- [ ] **Step 3: Write `src/sim/balance.ts`**

```ts
import { playCareer } from "./play-headless";
import { firstOptionPolicy, randomPolicy, type Policy } from "./policies";
import type { Setup } from "../engine/index";

export interface BalanceReport {
  runs: number;
  draftedRate: number;
  bustedRate: number;
  undraftedRate: number;
  round1Rate: number;
  avgSeasons: number;
}

export function runBalance(runs: number, seedPrefix: string, policy: Policy): BalanceReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };
  let drafted = 0, busted = 0, undrafted = 0, round1 = 0, seasons = 0;
  for (let i = 0; i < runs; i++) {
    const s = playCareer(setup, `${seedPrefix}-${i}`, policy);
    seasons += s.seasons.length;
    if (s.status === "busted") busted++;
    if (s.status === "drafted") {
      drafted++;
      if (s.draftResult?.undrafted) undrafted++;
      else if (s.draftResult?.round === 1) round1++;
    }
  }
  return {
    runs,
    draftedRate: drafted / runs,
    bustedRate: busted / runs,
    undraftedRate: undrafted / runs,
    round1Rate: round1 / runs,
    avgSeasons: seasons / runs,
  };
}

// CLI: `npm run balance -- 2000 random`
function main() {
  const runs = Number(process.argv[2] ?? 2000);
  const policy: Policy = process.argv[3] === "first" ? firstOptionPolicy : randomPolicy;
  console.log(JSON.stringify(runBalance(runs, "balance", policy), null, 2));
}
if (process.argv[1] && process.argv[1].endsWith("balance.ts")) main();
```

- [ ] **Step 4: Write the failing test** — `src/sim/balance.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { runBalance } from "./balance";
import { playCareer } from "./play-headless";
import { firstOptionPolicy, randomPolicy } from "./policies";
import type { Setup } from "../engine/index";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("headless balance harness", () => {
  it("every career reaches a terminal state", () => {
    for (let i = 0; i < 50; i++) {
      const s = playCareer(setup, `t-${i}`, randomPolicy);
      expect(["drafted", "busted"]).toContain(s.status);
    }
  });

  it("produces sane aggregate rates over many runs", () => {
    const r = runBalance(500, "seedA", randomPolicy);
    expect(r.runs).toBe(500);
    // Rates are valid probabilities.
    for (const v of [r.draftedRate, r.bustedRate, r.undraftedRate, r.round1Rate]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // Careers last multiple seasons on average.
    expect(r.avgSeasons).toBeGreaterThan(1);
    // Not everyone should be a round-1 pick under a random policy.
    expect(r.round1Rate).toBeLessThan(1);
  });

  it("is reproducible for a fixed seed prefix and policy", () => {
    expect(runBalance(200, "fixed", firstOptionPolicy)).toEqual(runBalance(200, "fixed", firstOptionPolicy));
  });
});
```

- [ ] **Step 5: Add scripts to `package.json`**

Add to the `"scripts"` block:

```json
    "play": "node --experimental-strip-types src/sim/play-headless.ts",
    "balance": "node --experimental-strip-types src/sim/balance.ts"
```

(Node ≥ 22.6 runs TS directly via `--experimental-strip-types`. If on older Node, run with `npx tsx` instead — document whichever the environment supports.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- sim/balance`
Expected: PASS.

- [ ] **Step 7: Smoke-test the CLI**

Run: `npm run play -- demo`
Expected: prints a JSON career summary with `status` of `drafted` or `busted`.

Run: `npm run balance -- 500 random`
Expected: prints a `BalanceReport` JSON with rates in [0,1].

- [ ] **Step 8: Full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add src/sim/policies.ts src/sim/play-headless.ts src/sim/balance.ts src/sim/balance.test.ts package.json
git commit -m "feat(sim): headless play CLI + Monte-Carlo balance harness"
```

---

## Definition of Done (Phase 1)

- `npm test` and `npm run typecheck` both pass.
- `npm run play -- <seed>` plays a full QB career start-to-draft and prints a summary.
- `npm run balance -- 2000 random` reports aggregate distributions.
- Determinism holds: identical `seed` + identical choice sequence ⇒ identical `GameState`.
- The engine has zero runtime dependencies and contains no `Math.random`/`Date.now`/I/O.
- Content is validated at load; the validator has test coverage for each failure class.

## Deferred to later phases (NOT in this plan)

- Phase 2: full event library, all six position buckets' events, richer school ladder, transfer-portal offers between schools, awards/trophies driven by thresholds and team simulation, redshirt choice, home-state recruiter weighting.
- Phase 3: React/Vite UI, localStorage persistence, shareable summary card (per the spec's aesthetic direction).

## Notes for the implementer

- **Read-order independence:** each task's "Interfaces" block lists the exact signatures neighbors rely on. Do not rename exported symbols without updating consumers.
- **Purity discipline:** `advance` clones its input and returns a new state; never mutate the argument. All randomness flows through the single `rng` created from `state.seed`/`state.rngCursor`.
- **Balance is data, not code:** the harness exists so weights/probabilities/formulas in `content/` and `draft.ts` can be tuned against measured distributions. Expect to revisit constants (draft bands, stat model) once Phase 2 content lands — that's intended.
