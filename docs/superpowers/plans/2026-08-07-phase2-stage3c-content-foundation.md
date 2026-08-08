# Stage 3c — Content Foundation + Mechanical Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the content foundation — a `requiresPlaying` condition, a ~57-school ladder, the `events/` directory split — and author the mechanically-loaded content (bust and milestone slices) that finally makes the `busted` terminal reachable.

**Architecture:** One small engine condition, then content. The `events/` restructure creates empty-but-wired slice files so Stage 3d's parallel authors each own a file that already exists. Bust events are `kind: "random"` gated on vulnerability; milestones are `kind: "fixed"`, capped at one per phase, gated with `requiresPlaying`.

**Tech Stack:** TypeScript (strict), Vitest, `tsx` for CLI scripts. No runtime dependencies in `src/engine/**` or `src/content/**`.

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-08-07-phase2-stage3c-content-foundation-design.md`. Read it before Task 1.
- **Purity is sacrosanct:** no `Math.random`, `Date.now`, or IO anywhere in `src/engine/**` or `src/content/**`. All randomness flows through the seeded `Rng` in `src/engine/rng.ts`.
- **Two typecheck passes must both exit 0:** `npm run typecheck` runs `tsc -p tsconfig.engine.json && tsc -p tsconfig.json`. The engine pass forbids Node globals in `src/engine/**` and `src/content/**`.
- **Baseline:** 162 tests pass at `main` (`4451f2a`). No task may reduce the count.
- **Content is validated at import.** `validateContent` runs in `src/content/index.ts` and throws on any bad reference — unknown injury id, unknown stat, unknown trophy/award, invalid condition. A mistake fails the whole suite loudly.
- **Tone lock:** light, "silly + real-seeming." No mean-spirited or genuinely offensive content. **No real player names.** School and conference names are public facts and are fine.
- **Moment authoring rules:** (1) a moment implying *first / only / last* may only come from an event gated to fire once; (2) a moment on a repeatable random event must read sensibly if it happens twice.
- **All numeric values are initial, balance-tunable starting points** tuned in Stage 4. Use them verbatim.
- **Commit after every task**, prefixes `feat(engine):` / `feat(content):` / `refactor(content):`.

---

### Task 1: The `requiresPlaying` condition

Milestones assume the player is on the field; a redshirt sit season assumes they are not. No condition currently reads `redshirtSeasonActive`.

**Files:**
- Modify: `src/engine/types.ts` (`EventConditions`)
- Modify: `src/engine/select-event.ts` (`eventMatches`)
- Modify: `src/content/schema.ts` (`validateContent`, inside the existing `const c = ev.conditions; if (c) { ... }` block)
- Test: `src/engine/select-event.test.ts`, `src/content/schema.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `EventConditions.requiresPlaying?: boolean`.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/select-event.test.ts`:

```ts
describe("requiresPlaying", () => {
  const ev: GameEvent = {
    id: "rivalry-week-test",
    kind: "fixed",
    phase: "conference",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Rivalry Week",
    description: "Hate week.",
    options: [{ id: "go", label: "Go", probability: 1, positiveOutcome: { description: "ok", effects: [] } }],
  };

  const stateIn = (redshirtSeasonActive: boolean): GameState => {
    const base = createCareer({ lastName: "S", jerseyNumber: 7, homeState: "TX", position: "QB" }, "rp");
    return { ...base, phase: "conference", redshirtSeasonActive };
  };

  it("matches when the player is not redshirting", () => {
    expect(eventMatches(stateIn(false), ev)).toBe(true);
  });

  it("does not match during a redshirt sit season", () => {
    expect(eventMatches(stateIn(true), ev)).toBe(false);
  });

  it("ignores redshirtSeasonActive when the condition is absent", () => {
    const plain: GameEvent = { ...ev, conditions: {} };
    expect(eventMatches(stateIn(true), plain)).toBe(true);
  });
});
```

Add to `src/content/schema.test.ts`, alongside the existing event-condition validator tests:

```ts
  it("rejects a non-boolean requiresPlaying", () => {
    const bad = {
      ...CONTENT,
      events: [
        ...CONTENT.events,
        {
          id: "bad-requires-playing",
          kind: "random" as const,
          phase: "conference" as const,
          weight: 1,
          conditions: { requiresPlaying: "yes" as never },
          title: "T",
          description: "D",
          options: [{ id: "o", label: "L", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
        },
      ],
    };
    expect(validateContent(bad).some((e) => e.includes("requiresPlaying"))).toBe(true);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/engine/select-event.test.ts src/content/schema.test.ts`
Expected: FAIL — TypeScript rejects `requiresPlaying` as an unknown property of `EventConditions`.

- [ ] **Step 3: Add the field**

In `src/engine/types.ts`, add to `EventConditions`, immediately after `requiresFinalSeason`:

```ts
  requiresPlaying?: boolean;
```

- [ ] **Step 4: Evaluate it**

In `src/engine/select-event.ts`, inside `eventMatches`, immediately after the `requiresFinalSeason` block:

```ts
  // Milestones assume the player is on the field. A redshirt sit season is
  // exactly the case where they are not, so gate those beats out of it.
  if (c.requiresPlaying && state.redshirtSeasonActive) return false;
```

- [ ] **Step 5: Validate it**

In `src/content/schema.ts`, inside the `const c = ev.conditions; if (c) { ... }` block, next to the `requiresFinalSeason` check:

```ts
      if (c.requiresPlaying !== undefined && typeof c.requiresPlaying !== "boolean")
        errors.push(`Event ${ev.id}: requiresPlaying must be a boolean`);
```

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, **166 tests** (162 + 4 new). Both typecheck passes exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/engine/types.ts src/engine/select-event.ts src/content/schema.ts src/engine/select-event.test.ts src/content/schema.test.ts
git commit -m "feat(engine): requiresPlaying condition gates beats out of redshirt sit seasons"
```

---

### Task 2: The `events/` restructure

Split the single `events.ts` into a directory with one file per slice, so Stage 3d's parallel authors each own a file and never touch a shared one.

**Files:**
- Create: `src/content/events/index.ts`, `recruiting.ts`, `universal.ts`, `qb.ts`, `oskill.ts`, `ol.ts`, `dl.ts`, `dskill.ts`, `k.ts`, `bust.ts`, `milestones.ts`
- Delete: `src/content/events.ts`
- Modify: `src/content/index.ts` (import path only)
- Test: `src/content/events/index.test.ts` (new)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `EVENTS: GameEvent[]` exported from `src/content/events/index.ts`. Each slice exports a named array: `RECRUITING_EVENTS`, `UNIVERSAL_EVENTS`, `QB_EVENTS`, `OSKILL_EVENTS`, `OL_EVENTS`, `DL_EVENTS`, `DSKILL_EVENTS`, `K_EVENTS`, `BUST_EVENTS`, `MILESTONE_EVENTS`.

**This is a pure move. No event content changes.** The six existing events keep their exact ids, weights, conditions, text, and effects.

- [ ] **Step 1: Write the failing test**

Create `src/content/events/index.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { EVENTS } from "./index";
import { RECRUITING_EVENTS } from "./recruiting";
import { UNIVERSAL_EVENTS } from "./universal";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { BUST_EVENTS } from "./bust";
import { MILESTONE_EVENTS } from "./milestones";

// Guards against a slice file being authored but never wired into the barrel —
// its whole slice would vanish with every other test still green.
const SLICES = {
  RECRUITING_EVENTS, UNIVERSAL_EVENTS, QB_EVENTS, OSKILL_EVENTS, OL_EVENTS,
  DL_EVENTS, DSKILL_EVENTS, K_EVENTS, BUST_EVENTS, MILESTONE_EVENTS,
};

describe("events barrel", () => {
  it("includes every event from every slice", () => {
    const barrelIds = new Set(EVENTS.map((e) => e.id));
    for (const [name, slice] of Object.entries(SLICES)) {
      for (const ev of slice) {
        expect(barrelIds.has(ev.id), `${name} event "${ev.id}" is missing from EVENTS`).toBe(true);
      }
    }
  });

  it("contains nothing that is not in a slice", () => {
    const sliceIds = new Set(Object.values(SLICES).flatMap((s) => s.map((e) => e.id)));
    for (const ev of EVENTS) {
      expect(sliceIds.has(ev.id), `EVENTS event "${ev.id}" belongs to no slice`).toBe(true);
    }
  });

  it("has no duplicate event ids across slices", () => {
    const ids = Object.values(SLICES).flatMap((s) => s.map((e) => e.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/events/index.test.ts`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 3: Create the eight empty slices**

Each of `oskill.ts`, `ol.ts`, `dl.ts`, `dskill.ts`, `k.ts` gets a stub. Use this shape, substituting the name and label — Stage 3d fills them:

```ts
import type { GameEvent } from "../../engine/types";

// Offensive-skill events (RB/WR/TE). Authored in Stage 3d.
export const OSKILL_EVENTS: GameEvent[] = [];
```

The five files and their exports:

| File | Export | Comment |
|---|---|---|
| `oskill.ts` | `OSKILL_EVENTS` | `// Offensive-skill events (RB/WR/TE). Authored in Stage 3d.` |
| `ol.ts` | `OL_EVENTS` | `// Offensive-line events. Authored in Stage 3d.` |
| `dl.ts` | `DL_EVENTS` | `// Defensive-line events. Authored in Stage 3d.` |
| `dskill.ts` | `DSKILL_EVENTS` | `// Defensive-skill events (LB/DB). Authored in Stage 3d.` |
| `k.ts` | `K_EVENTS` | `// Kicker events. Authored in Stage 3d.` |

Also create `bust.ts` and `milestones.ts` as empty stubs for now — Tasks 4 and 5 fill them:

```ts
import type { GameEvent } from "../../engine/types";

// Career-ending events, gated on genuine vulnerability. Authored in Task 4.
export const BUST_EVENTS: GameEvent[] = [];
```

```ts
import type { GameEvent } from "../../engine/types";

// Fixed milestone beats, one per phase. Authored in Task 5.
export const MILESTONE_EVENTS: GameEvent[] = [];
```

- [ ] **Step 4: Move the six existing events**

Read `src/content/events.ts`. Move each event **verbatim** — same id, kind, phase, weight, conditions, title, description, options, effects — into:

- `recruiting.ts` → `RECRUITING_EVENTS`: the `recruiting` event, **including its existing comment** explaining that the engine overrides its options at runtime.
- `universal.ts` → `UNIVERSAL_EVENTS`: `gym-grind`, `catfished`, `speeding-georgia`.
- `qb.ts` → `QB_EVENTS`: `film-study`, `signature-win`.

Each file imports `import type { GameEvent } from "../../engine/types";` (note the extra `../` — these files are one level deeper than the old `events.ts`).

- [ ] **Step 5: Write the barrel**

Create `src/content/events/index.ts`:

```ts
import type { GameEvent } from "../../engine/types";
import { RECRUITING_EVENTS } from "./recruiting";
import { UNIVERSAL_EVENTS } from "./universal";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { BUST_EVENTS } from "./bust";
import { MILESTONE_EVENTS } from "./milestones";

// Every slice must appear here. events/index.test.ts fails if one is missing.
export const EVENTS: GameEvent[] = [
  ...RECRUITING_EVENTS,
  ...UNIVERSAL_EVENTS,
  ...QB_EVENTS,
  ...OSKILL_EVENTS,
  ...OL_EVENTS,
  ...DL_EVENTS,
  ...DSKILL_EVENTS,
  ...K_EVENTS,
  ...BUST_EVENTS,
  ...MILESTONE_EVENTS,
];
```

- [ ] **Step 6: Repoint the consumer and delete the old file**

In `src/content/index.ts`, change `import { EVENTS } from "./events";` to `import { EVENTS } from "./events/index";`.

Then delete `src/content/events.ts`.

Run `grep -rn "from \"./events\"\|from \"../content/events\"" src/` and repoint anything else that surfaces.

- [ ] **Step 7: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, **169 tests** (166 + 3 new). Both typecheck passes exit 0.

Every pre-existing test must still pass unchanged — this task moved code, it did not change behavior. If a test that asserts event behavior fails, an event was altered during the move. Fix the move, not the test.

- [ ] **Step 8: Commit**

```bash
git add src/content/events src/content/index.ts
git rm src/content/events.ts
git commit -m "refactor(content): split events.ts into per-slice files behind a barrel"
```

---

### Task 3: The school ladder

Grow the ladder from 10 to 57 schools so the Stage-3b sampler has a real pool to work with.

**Files:**
- Modify: `src/content/schools.ts` (replace the array)
- Modify: `src/content/regions.ts` (add `KY` and `VA` to `REGIONS.South`)
- Test: `src/content/schools.test.ts` (new)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a `SCHOOLS` array of 57 rows, same row shape as today (`{ id, name, tier, conference, state }`).

**Why `regions.ts` changes:** `KY` (Louisville) and `VA` (Liberty, James Madison) appear in the new ladder but are in no region, so those schools would never receive a region bonus. Adding them to `South` is one line and keeps the sampler's geography meaningful.

- [ ] **Step 1: Write the failing test**

Create `src/content/schools.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { SCHOOLS } from "./schools";
import { REGIONS } from "./regions";
import type { Tier } from "../engine/types";

const TIERS: Tier[] = [1, 2, 3, 4];

// Tier 1 in Georgia is deliberately a single program: Mercer is the only
// plausible FCS school there, and inventing a second would break realism-first.
const TWO_PER_STATE_EXEMPTIONS = [{ state: "GA", tier: 1 as Tier }];

describe("school ladder", () => {
  it("has a usable pool at every tier", () => {
    for (const t of TIERS) {
      expect(SCHOOLS.filter((s) => s.tier === t).length).toBeGreaterThanOrEqual(9);
    }
  });

  it("has unique ids", () => {
    const ids = SCHOOLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fills every region x tier cell the sampler can reach", () => {
    for (const [region, states] of Object.entries(REGIONS)) {
      for (const t of TIERS) {
        const inCell = SCHOOLS.filter((s) => s.tier === t && states.includes(s.state));
        expect(inCell.length, `region ${region} tier ${t} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("has two schools per tier at tiers 1-2 in the high-population states", () => {
    for (const state of ["TX", "CA", "FL", "OH", "GA"]) {
      for (const t of [1, 2] as Tier[]) {
        const exempt = TWO_PER_STATE_EXEMPTIONS.some((e) => e.state === state && e.tier === t);
        const n = SCHOOLS.filter((s) => s.state === state && s.tier === t).length;
        if (exempt) expect(n).toBeGreaterThanOrEqual(1);
        else expect(n, `${state} tier ${t} has ${n}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("places every school in a region", () => {
    const regioned = new Set(Object.values(REGIONS).flat());
    for (const s of SCHOOLS) {
      expect(regioned.has(s.state), `${s.name} (${s.state}) is in no region`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/schools.test.ts`
Expected: FAIL — the 10-school ladder has only 2 schools at tier 1, empty region × tier cells, and no two-per-state coverage.

- [ ] **Step 3: Add the two missing states to `REGIONS`**

In `src/content/regions.ts`, change the `South` line to:

```ts
  South: ["AL", "GA", "FL", "MS", "LA", "SC", "TN", "NC", "KY", "VA"],
```

- [ ] **Step 4: Write the ladder**

Replace the whole array in `src/content/schools.ts`:

```ts
// Tier 4 = national contenders, 3 = power conference, 2 = Group of 5, 1 = FCS.
// Tiers are assigned by real program stature; empty region x tier cells are then
// backfilled with the most defensible real program available. Conferences and
// states are factual. Balance-tunable in Stage 4.
export const SCHOOLS: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string }[] = [
  // Tier 4 — national contenders
  { id: "bama", name: "Alabama", tier: 4, conference: "SEC", state: "AL" },
  { id: "uga", name: "Georgia", tier: 4, conference: "SEC", state: "GA" },
  { id: "osu", name: "Ohio State", tier: 4, conference: "Big Ten", state: "OH" },
  { id: "texas", name: "Texas", tier: 4, conference: "SEC", state: "TX" },
  { id: "michigan", name: "Michigan", tier: 4, conference: "Big Ten", state: "MI" },
  { id: "oregon", name: "Oregon", tier: 4, conference: "Big Ten", state: "OR" },
  { id: "notredame", name: "Notre Dame", tier: 4, conference: "Independent", state: "IN" },
  { id: "lsu", name: "LSU", tier: 4, conference: "SEC", state: "LA" },
  { id: "pennstate", name: "Penn State", tier: 4, conference: "Big Ten", state: "PA" },

  // Tier 3 — power conference
  { id: "smu", name: "SMU", tier: 3, conference: "ACC", state: "TX" },
  { id: "tcu", name: "TCU", tier: 3, conference: "Big 12", state: "TX" },
  { id: "baylor", name: "Baylor", tier: 3, conference: "Big 12", state: "TX" },
  { id: "ksu", name: "Kansas State", tier: 3, conference: "Big 12", state: "KS" },
  { id: "iowastate", name: "Iowa State", tier: 3, conference: "Big 12", state: "IA" },
  { id: "mizzou", name: "Missouri", tier: 3, conference: "SEC", state: "MO" },
  { id: "wisconsin", name: "Wisconsin", tier: 3, conference: "Big Ten", state: "WI" },
  { id: "olemiss", name: "Ole Miss", tier: 3, conference: "SEC", state: "MS" },
  { id: "florida", name: "Florida", tier: 3, conference: "SEC", state: "FL" },
  { id: "miami", name: "Miami", tier: 3, conference: "ACC", state: "FL" },
  { id: "ncstate", name: "NC State", tier: 3, conference: "ACC", state: "NC" },
  { id: "louisville", name: "Louisville", tier: 3, conference: "ACC", state: "KY" },
  { id: "vatech", name: "Virginia Tech", tier: 3, conference: "ACC", state: "VA" },
  { id: "pitt", name: "Pittsburgh", tier: 3, conference: "ACC", state: "PA" },
  { id: "washington", name: "Washington", tier: 3, conference: "Big Ten", state: "WA" },
  { id: "arizona", name: "Arizona", tier: 3, conference: "Big 12", state: "AZ" },
  { id: "ucla", name: "UCLA", tier: 3, conference: "Big Ten", state: "CA" },

  // Tier 2 — Group of 5
  { id: "boise", name: "Boise State", tier: 2, conference: "Mountain West", state: "ID" },
  { id: "fresno", name: "Fresno State", tier: 2, conference: "Mountain West", state: "CA" },
  { id: "sdsu", name: "San Diego State", tier: 2, conference: "Mountain West", state: "CA" },
  { id: "unt", name: "North Texas", tier: 2, conference: "American", state: "TX" },
  { id: "utsa", name: "UTSA", tier: 2, conference: "American", state: "TX" },
  { id: "memphis", name: "Memphis", tier: 2, conference: "American", state: "TN" },
  { id: "tulane", name: "Tulane", tier: 2, conference: "American", state: "LA" },
  { id: "usf", name: "South Florida", tier: 2, conference: "American", state: "FL" },
  { id: "fau", name: "Florida Atlantic", tier: 2, conference: "American", state: "FL" },
  { id: "temple", name: "Temple", tier: 2, conference: "American", state: "PA" },
  { id: "app", name: "App State", tier: 2, conference: "Sun Belt", state: "NC" },
  { id: "coastal", name: "Coastal Carolina", tier: 2, conference: "Sun Belt", state: "SC" },
  { id: "gasouthern", name: "Georgia Southern", tier: 2, conference: "Sun Belt", state: "GA" },
  { id: "gastate", name: "Georgia State", tier: 2, conference: "Sun Belt", state: "GA" },
  { id: "jmu", name: "James Madison", tier: 2, conference: "Sun Belt", state: "VA" },
  { id: "toledo", name: "Toledo", tier: 2, conference: "MAC", state: "OH" },
  { id: "ohiou", name: "Ohio", tier: 2, conference: "MAC", state: "OH" },
  { id: "liberty", name: "Liberty", tier: 2, conference: "Conference USA", state: "VA" },

  // Tier 1 — FCS
  { id: "mont", name: "Montana", tier: 1, conference: "Big Sky", state: "MT" },
  { id: "ewu", name: "Eastern Washington", tier: 1, conference: "Big Sky", state: "WA" },
  { id: "sacst", name: "Sacramento State", tier: 1, conference: "Big Sky", state: "CA" },
  { id: "ucdavis", name: "UC Davis", tier: 1, conference: "Big Sky", state: "CA" },
  { id: "ndsu", name: "North Dakota State", tier: 1, conference: "MVFC", state: "ND" },
  { id: "ysu", name: "Youngstown State", tier: 1, conference: "MVFC", state: "OH" },
  { id: "dayton", name: "Dayton", tier: 1, conference: "Pioneer", state: "OH" },
  { id: "villanova", name: "Villanova", tier: 1, conference: "CAA", state: "PA" },
  { id: "uiw", name: "Incarnate Word", tier: 1, conference: "Southland", state: "TX" },
  { id: "sfa", name: "Stephen F. Austin", tier: 1, conference: "Southland", state: "TX" },
  { id: "famu", name: "Florida A&M", tier: 1, conference: "SWAC", state: "FL" },
  { id: "bcu", name: "Bethune-Cookman", tier: 1, conference: "SWAC", state: "FL" },
  // Georgia's only plausible FCS program — the two-per-state rule yields to
  // realism here rather than inventing a second (see the spec's §4).
  { id: "mercer", name: "Mercer", tier: 1, conference: "SoCon", state: "GA" },
];
```

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, **174 tests** (169 + 5 new). Both typecheck passes exit 0.

Watch for pre-existing tests that hard-code a school id or assume a small pool. `src/engine/simulate.test.ts` and `src/engine/advance.test.ts` reference `"mont"`, which still exists. If a test asserts a *specific* school is offered, that is now legitimately obsolete — recruiting samples from a much larger pool. Confirm the cause is the pool size before editing any test, and never weaken an assertion.

- [ ] **Step 6: Sanity-check the geography by hand**

Run: `npm run play -- demo`
Expected: a career plays to a terminal state. The Signing Day offers should now look regionally plausible for the demo's home state rather than drawing from ten schools nationwide.

- [ ] **Step 7: Commit**

```bash
git add src/content/schools.ts src/content/regions.ts src/content/schools.test.ts
git commit -m "feat(content): 57-school ladder with region x tier coverage"
```

---

### Task 4: The bust slice

Six `kind: "random"` events gated on genuine vulnerability. **This is what finally makes the `busted` terminal reachable in real play.**

**Files:**
- Modify: `src/content/events/bust.ts` (fill the stub from Task 2)
- Test: `src/engine/bust.test.ts` (new — the e2e test)

**Interfaces:**
- Consumes: `BUST_EVENTS` stub and the barrel from Task 2.
- Produces: `BUST_EVENTS` populated with 6 events.

**Design rules, from the spec:** every event is `random` (weight is the rarity knob); every gate is a real vulnerability; **every survival outcome grants enough character or overall to cross back above that event's own gate**, so surviving genuinely reduces repeat exposure.

- [ ] **Step 1: Write the failing e2e test**

Create `src/engine/bust.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { getDecision, advance } from "./advance";
import { CONTENT } from "../content/index";
import { BUST_EVENTS } from "../content/events/bust";
import type { Setup, GameState } from "./types";

const setup: Setup = { lastName: "Doe", jerseyNumber: 3, homeState: "TX", position: "QB" };

describe("bust content", () => {
  it("authors at least one event per bust path", () => {
    expect(BUST_EVENTS.length).toBeGreaterThanOrEqual(6);
    for (const ev of BUST_EVENTS) {
      expect(ev.kind).toBe("random");
      expect(ev.conditions).toBeDefined();
      const gated =
        ev.conditions!.maxCharacter !== undefined ||
        ev.conditions!.maxOverall !== undefined ||
        ev.conditions!.requiresActiveInjury === true;
      expect(gated, `bust event "${ev.id}" has no vulnerability gate`).toBe(true);
    }
  });

  it("every bust event can actually end a career", () => {
    for (const ev of BUST_EVENTS) {
      const endings = ev.options.flatMap((o) =>
        [o.positiveOutcome, o.negativeOutcome].filter(Boolean).flatMap((oc) => oc!.effects),
      ).filter((e) => e.kind === "ending");
      expect(endings.length, `bust event "${ev.id}" emits no ending effect`).toBeGreaterThan(0);
    }
  });

  it("drives a vulnerable career to busted through a content event", () => {
    // Pool contains exactly one bust event, so the draw is forced. The career
    // starts deeply vulnerable, so its gate matches.
    const only = BUST_EVENTS.find((e) => e.id === "bust-arrest")!;
    const content = { ...CONTENT, events: [...CONTENT.events.filter((e) => e.kind === "fixed"), only] };

    let s: GameState = createCareer(setup, "bust-e2e", content);
    s = advance(s, getDecision(s, content)!.options[0]!.id, content); // commit to a school
    s = { ...s, character: 5 };

    // Drive until the bust event surfaces, then take the riskiest option. That
    // option is not deterministically fatal (its negative outcome is a roll), so
    // the seed is hand-picked below to make this test deterministic — see Step 4.
    for (let i = 0; i < 40 && s.status === "active"; i++) {
      const d = getDecision(s, content);
      if (!d) break;
      const choice = d.eventId === only.id ? d.options[d.options.length - 1]!.id : d.options[0]!.id;
      s = advance(s, choice, content);
    }

    expect(s.status, `career ended as "${s.status}" instead of busted`).toBe("busted");
    expect(s.endingReason).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/engine/bust.test.ts`
Expected: FAIL — `BUST_EVENTS` is empty, so `length >= 6` fails and `find("bust-arrest")` is undefined.

- [ ] **Step 3: Author the bust events**

Replace `src/content/events/bust.ts`:

```ts
import type { GameEvent } from "../../engine/types";

// Career-ending events. All `random`, so weight is the rarity knob and a
// vulnerable player is exposed sometimes, not every season. Every gate is a
// real vulnerability, so the ending is telegraphed and earned rather than a
// bolt from the blue. Every survival outcome pushes the player back above the
// gate that surfaced the event, so surviving genuinely reduces re-exposure.
// Weights and probabilities are initial values, tuned in Stage 4.
export const BUST_EVENTS: GameEvent[] = [
  {
    id: "bust-mri",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { requiresActiveInjury: true },
    title: "The MRI Comes Back",
    description: "The team doctor closes the door before he starts talking. That is never the good version.",
    options: [
      {
        id: "rehab",
        label: "Attack the rehab",
        probability: 0.7,
        positiveOutcome: {
          description: "Eight months of misery, and you run again.",
          effects: [
            { kind: "overall", timing: "permanent", amount: -2 },
            { kind: "moment", item: "Rehabbed all the way back", icon: "medical" },
          ],
        },
        negativeOutcome: {
          description: "The knee never comes back. Neither do you.",
          effects: [{ kind: "ending", reason: "Career-ending injury" }],
        },
      },
      {
        id: "play-through",
        label: "Tape it up and play",
        probability: 0.4,
        positiveOutcome: {
          description: "You get away with it. Mostly.",
          effects: [{ kind: "overall", timing: "permanent", amount: -4 }],
        },
        negativeOutcome: {
          description: "It goes on the first cut of camp, and it goes for good.",
          effects: [{ kind: "ending", reason: "Career-ending injury" }],
        },
      },
    ],
  },
  {
    id: "bust-academics",
    kind: "random",
    phase: "offseason",
    weight: 3,
    conditions: { maxCharacter: 35, minClass: "SO" },
    title: "Academic Probation",
    description: "The registrar's letter says you are one failed class from ineligible. It is not a long letter.",
    options: [
      {
        id: "tutors",
        label: "Move into the tutoring center",
        probability: 0.78,
        positiveOutcome: {
          description: "You claw the GPA back and the hold comes off your registration.",
          effects: [
            { kind: "character", amount: 12 },
            { kind: "moment", item: "Fought off academic probation", icon: "book" },
          ],
        },
        negativeOutcome: {
          description: "Ruled ineligible. Your name comes off the roster in a Tuesday email.",
          effects: [{ kind: "ending", reason: "Academically ineligible" }],
        },
      },
      {
        id: "coast",
        label: "Ride it out — the professor likes football",
        probability: 0.5,
        positiveOutcome: {
          description: "He curves the final. You exhale for a week.",
          effects: [{ kind: "character", amount: 2 }],
        },
        negativeOutcome: {
          description: "He does not curve the final.",
          effects: [{ kind: "ending", reason: "Academically ineligible" }],
        },
      },
    ],
  },
  {
    id: "bust-drug-test",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { maxCharacter: 30 },
    title: "Failed Drug Test",
    description: "Compliance wants a word. They have a folder, and your name is on the tab.",
    options: [
      {
        id: "own-it",
        label: "Own it and enter the program",
        probability: 0.8,
        positiveOutcome: {
          description: "Suspended two games, but the staff respects how you handled it.",
          effects: [
            { kind: "suspension", phases: 1 },
            { kind: "character", amount: 10 },
            { kind: "moment", item: "Owned a failed test and came back clean", icon: "shield" },
          ],
        },
        negativeOutcome: {
          description: "The second sample comes back the same way. That is the rule about second samples.",
          effects: [{ kind: "ending", reason: "Removed from the program" }],
        },
      },
      {
        id: "fight-it",
        label: "Fight the result",
        probability: 0.35,
        positiveOutcome: {
          description: "The lab's chain of custody was a mess. It goes away.",
          effects: [{ kind: "character", amount: 4 }],
        },
        negativeOutcome: {
          description: "The appeal makes it a story, and the story makes it a decision.",
          effects: [{ kind: "ending", reason: "Removed from the program" }],
        },
      },
    ],
  },
  {
    id: "bust-arrest",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { maxCharacter: 20 },
    title: "Booked at 3 A.M.",
    description: "A parking lot, a bad decision, and a police report with your jersey number in it.",
    options: [
      {
        id: "lawyer-up",
        label: "Get a lawyer and say nothing",
        probability: 0.6,
        positiveOutcome: {
          description: "Charges dropped. The staff is not thrilled, but you are still on the roster.",
          effects: [
            { kind: "suspension", phases: 1 },
            { kind: "character", amount: 8 },
          ],
        },
        negativeOutcome: {
          description: "The athletic director does not wait for the courts.",
          effects: [{ kind: "ending", reason: "Dismissed from the team" }],
        },
      },
      {
        id: "no-comment",
        label: "Post about it before your agent wakes up",
        probability: 0.2,
        positiveOutcome: {
          description: "Somehow the internet decides you are the sympathetic one.",
          effects: [{ kind: "character", amount: 6 }],
        },
        negativeOutcome: {
          description: "The screenshot outlives the charge. You are done here.",
          effects: [{ kind: "ending", reason: "Dismissed from the team" }],
        },
      },
    ],
  },
  {
    id: "bust-doghouse",
    kind: "random",
    phase: "nonconf",
    weight: 2,
    conditions: { maxCharacter: 25 },
    title: "The Doghouse",
    description: "You have been running with the twos for three weeks and nobody will tell you why.",
    options: [
      {
        id: "ask",
        label: "Ask the coordinator what it takes",
        probability: 0.75,
        positiveOutcome: {
          description: "He tells you, plainly, and you do it. The reps come back.",
          effects: [
            { kind: "character", amount: 10 },
            { kind: "snaps", amount: 60 },
          ],
        },
        negativeOutcome: {
          description: "He tells you plainly, and you argue. That was the last conversation.",
          effects: [{ kind: "ending", reason: "Ran out of rope with the staff" }],
        },
      },
      {
        id: "sulk",
        label: "Say nothing and wait it out",
        probability: 0.45,
        positiveOutcome: {
          description: "Injuries ahead of you settle it. Not how you wanted it.",
          effects: [{ kind: "snaps", amount: 30 }],
        },
        negativeOutcome: {
          description: "The staff stops planning around you entirely.",
          effects: [{ kind: "ending", reason: "Ran out of rope with the staff" }],
        },
      },
    ],
  },
  {
    id: "bust-lost-love",
    kind: "random",
    phase: "offseason",
    weight: 2,
    conditions: { maxOverall: 55, minClass: "JR" },
    title: "6 A.M. Lifts",
    description: "The alarm goes off and for the first time you genuinely consider not going.",
    options: [
      {
        id: "keep-going",
        label: "Get up. Go.",
        probability: 0.8,
        positiveOutcome: {
          description: "It is not fun again yet, but it is yours again.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 3 },
            { kind: "character", amount: 5 },
          ],
        },
        negativeOutcome: {
          description: "You go, and you realize on the drive home that you are finished.",
          effects: [{ kind: "ending", reason: "Walked away from the game" }],
        },
      },
      {
        id: "sleep-in",
        label: "Roll over",
        probability: 0.35,
        positiveOutcome: {
          description: "One missed lift. You are back Thursday.",
          effects: [{ kind: "character", amount: -3 }],
        },
        negativeOutcome: {
          description: "One becomes five. You clean out your locker in June.",
          effects: [{ kind: "ending", reason: "Walked away from the game" }],
        },
      },
    ],
  },
];
```

- [ ] **Step 4: Run the bust tests and hand-pick the e2e seed**

Run: `npx vitest run src/engine/bust.test.ts`
Expected: PASS, 3 tests. In particular the e2e test must reach `status: "busted"`.

**The e2e test's seed almost certainly needs tuning, and that is expected work, not a failure.** `bust-arrest`'s riskiest option (`no-comment`) has `probability: 0.2`, so each firing has a ~20% chance of the *survival* outcome. The event re-draws each conference phase, so across a full career the odds of never busting are small (~0.2⁴) — but they are not zero, and a career that reaches the draft first exits the loop as `drafted`, failing the assertion.

If `"bust-e2e"` does not bust, try successive seeds (`"bust-e2e-1"`, `"bust-e2e-2"`, …) until one does, and leave a comment naming why the seed is hand-picked. This mirrors how the redshirt bump/sink tests pick seeds.

Do **not** weaken the assertion to `toBeOneOf(["busted", "drafted"])` or similar — the whole point is proving the terminal is reachable. If no seed in a dozen tries busts, that is a real finding: it means the gates or weights are wrong, and you should report it rather than working around it.

Also confirm the pool filter leaves `bust-arrest` as the only `random` event and that `character: 5` satisfies its `maxCharacter: 20` gate.

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, **177 tests** (174 + 3 new). Both typecheck passes exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/content/events/bust.ts src/engine/bust.test.ts
git commit -m "feat(content): bust slice makes the busted terminal reachable"
```

---

### Task 5: The milestone slice and the injury pool

Five `kind: "fixed"` beats, capped at one per phase, plus three injuries for variety.

**Files:**
- Modify: `src/content/events/milestones.ts` (fill the stub from Task 2)
- Modify: `src/content/injuries.ts` (add three)
- Test: `src/content/events/milestones.test.ts` (new)

**Interfaces:**
- Consumes: `requiresPlaying` from Task 1; `MILESTONE_EVENTS` stub and the barrel from Task 2.
- Produces: `MILESTONE_EVENTS` populated with 5 events; `INJURIES` gains `collarbone`, `turfToe`, `mcl`.

**Two mechanics that constrain this task** (verified in `src/engine/advance.ts`):

- Every matching fixed event fires each phase (`advance.ts:259-264`) *before* the single random draw. One per phase keeps the pacing sane; Senior Day is the deliberate exception in the final season.
- `runPostseasonResolver` runs at `advance.ts:277`, **after** the postseason phase's events — so `Bowl Season`'s stat effects land in the season line the resolver then reads for awards.

- [ ] **Step 1: Write the failing test**

Create `src/content/events/milestones.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { MILESTONE_EVENTS } from "./milestones";
import type { Phase } from "../../engine/types";

describe("milestone slice", () => {
  it("is all fixed events", () => {
    expect(MILESTONE_EVENTS).toHaveLength(5);
    for (const ev of MILESTONE_EVENTS) expect(ev.kind).toBe("fixed");
  });

  it("gates every milestone on the player actually playing", () => {
    for (const ev of MILESTONE_EVENTS) {
      expect(ev.conditions?.requiresPlaying, `"${ev.id}" is not gated on requiresPlaying`).toBe(true);
    }
  });

  it("runs at most one per phase, except the final-season beat", () => {
    const byPhase = new Map<Phase, string[]>();
    for (const ev of MILESTONE_EVENTS) {
      byPhase.set(ev.phase, [...(byPhase.get(ev.phase) ?? []), ev.id]);
    }
    for (const [phase, ids] of byPhase) {
      const unconditional = ids.filter(
        (id) => !MILESTONE_EVENTS.find((e) => e.id === id)!.conditions?.requiresFinalSeason,
      );
      expect(unconditional.length, `phase ${phase} has ${unconditional.length} ungated milestones`).toBe(1);
    }
  });

  it("covers all four phases", () => {
    const phases = new Set(MILESTONE_EVENTS.map((e) => e.phase));
    expect([...phases].sort()).toEqual(["conference", "nonconf", "offseason", "postseason"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/events/milestones.test.ts`
Expected: FAIL — `MILESTONE_EVENTS` is empty, so `toHaveLength(5)` fails.

- [ ] **Step 3: Add the three injuries**

In `src/content/injuries.ts`, add to the `INJURIES` record:

```ts
  collarbone: { label: "Broken collarbone", overallDelta: 7, recoveryPhases: 2 },
  turfToe: { label: "Turf toe", overallDelta: 2, recoveryPhases: 1 },
  mcl: { label: "MCL sprain", overallDelta: 8, recoveryPhases: 3 },
```

- [ ] **Step 4: Author the milestones**

Replace `src/content/events/milestones.ts`:

```ts
import type { GameEvent } from "../../engine/types";

// Fixed milestone beats. Every matching fixed event fires each phase before the
// random draw, so this slice is capped at one per phase — Senior Day is the
// deliberate exception, and only in the final season. All are gated on
// requiresPlaying so they never fire at a player sitting out a redshirt.
export const MILESTONE_EVENTS: GameEvent[] = [
  {
    id: "milestone-fall-camp",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    conditions: { requiresPlaying: true, minClass: "SO" },
    title: "Fall Camp Battle",
    description: "The depth chart goes up Monday. Right now your name is written in pencil.",
    options: [
      {
        id: "compete",
        label: "Win the job",
        probability: 0.65,
        positiveOutcome: {
          description: "You take every rep like it is the last one and the pencil becomes ink.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "snaps", amount: 40 },
          ],
        },
        negativeOutcome: {
          description: "You press, and pressing looks exactly like panicking on film.",
          effects: [{ kind: "overall", timing: "immediate", amount: -1 }],
        },
      },
    ],
  },
  {
    id: "milestone-opener",
    kind: "fixed",
    phase: "nonconf",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Season Opener",
    description: "Ninety thousand people, a noon kickoff, and a cupcake opponent nobody will forgive you for losing to.",
    options: [
      {
        id: "handle-it",
        label: "Take care of business",
        probability: 0.75,
        positiveOutcome: {
          description: "Comfortable win. You are out by the fourth quarter.",
          effects: [{ kind: "snaps", amount: 25 }],
        },
        negativeOutcome: {
          description: "It is 17-14 in the fourth and the boo birds are warming up.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-rivalry",
    kind: "fixed",
    phase: "conference",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Rivalry Week",
    description: "Nobody on campus has talked about anything else since Sunday. Your ankle has been barking since Tuesday.",
    options: [
      {
        id: "play-through",
        label: "Play through it",
        probability: 0.6,
        positiveOutcome: {
          description: "You go the whole way and they storm the field.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Won the rivalry game", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "The ankle goes on the second series and you watch the rest in a boot.",
          effects: [{ kind: "injury", injuryType: "turfToe" }],
        },
      },
      {
        id: "sit",
        label: "Sit and get right",
        probability: 1,
        positiveOutcome: {
          description: "You are healthy for November. It does not feel like enough on Saturday.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
    ],
  },
  {
    id: "milestone-senior-day",
    kind: "fixed",
    phase: "conference",
    weight: 1,
    conditions: { requiresPlaying: true, requiresFinalSeason: true },
    title: "Senior Day",
    description: "They call your name and you walk out to midfield. Last time you run out of this tunnel.",
    options: [
      {
        id: "walk",
        label: "Soak it in",
        probability: 0.8,
        positiveOutcome: {
          description: "You hug everyone twice and play the cleanest game of your life.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Went out a winner on Senior Day", icon: "star" },
          ],
        },
        negativeOutcome: {
          description: "You are crying before kickoff and never find the game.",
          effects: [{ kind: "moment", item: "Senior Day did not go to script", icon: "star" }],
        },
      },
    ],
  },
  {
    id: "milestone-bowl-season",
    kind: "fixed",
    phase: "postseason",
    weight: 1,
    conditions: { requiresPlaying: true },
    title: "Bowl Season",
    description: "Three weeks off, a gift suitcase, and a game in a city you have never been to.",
    options: [
      {
        id: "prepare",
        label: "Treat it like a playoff game",
        probability: 0.7,
        positiveOutcome: {
          description: "You are the only one who practiced like that, and it shows.",
          effects: [
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Carried the team through bowl season", icon: "trophy" },
          ],
        },
        negativeOutcome: {
          description: "Everyone else treated it like a vacation, and you could not drag them.",
          effects: [{ kind: "character", amount: -2 }],
        },
      },
      {
        id: "enjoy",
        label: "Enjoy the trip",
        probability: 1,
        positiveOutcome: {
          description: "Best three weeks of the year. The game is a blur.",
          effects: [{ kind: "moment", item: "Had the time of his life at a bowl game", icon: "sun" }],
        },
      },
    ],
  },
];
```

- [ ] **Step 5: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, **181 tests** (177 + 4 new). Both typecheck passes exit 0.

Milestones now fire every season, so pre-existing tests that count decisions or advance a fixed number of times may need adjusting. **Confirm the cause is the new milestones before touching any test**, and never weaken an assertion — if a test asserted "a season takes N advances," the correct fix is updating N, not deleting the assertion.

- [ ] **Step 6: Commit**

```bash
git add src/content/events/milestones.ts src/content/injuries.ts src/content/events/milestones.test.ts
git commit -m "feat(content): milestone slice + three injuries"
```

---

### Task 6: Whole-stage verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-07-phase2-stage3c-content-foundation.md` (tick the checkboxes)
- Modify: `.superpowers/sdd/progress.md` (project ledger entry — **git-ignored, edit on disk, do not `git add` it**)

**Interfaces:**
- Consumes: everything from Tasks 1-5.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Full green check**

Run: `npm test && npm run typecheck`
Expected: 181 tests pass; both typecheck passes exit 0.

- [ ] **Step 2: Play a career end-to-end**

Run: `npm run play -- demo`
Expected: a career reaches a terminal state. Confirm by eye that milestone beats appear in the decision stream and that Signing Day offers look regionally plausible.

- [ ] **Step 3: Balance check and re-baseline**

Run: `npm run balance -- 500 random`

Compare against the Stage-3b baseline recorded in the project ledger: `draftedRate 1, bustedRate 0, undraftedRate 0.016, round1Rate 0.022, avgSeasons 3.024`.

**`bustedRate` should now be above 0** — that is the headline result of this stage, since bust content is the only real path to the terminal. If it is still exactly 0, that is a finding worth reporting, not a number to shrug at: it would mean the gates are too tight or the weights too low for any career in 500 to reach one. Record the full distribution either way.

- [ ] **Step 4: Confirm no purity regressions**

Run: `grep -rn "Math.random\|Date.now\|process\.\|require(" src/engine src/content --include="*.ts" | grep -v "\.test\.ts"`
Expected: no output.

- [ ] **Step 5: Update the project ledger**

Append a Stage 3c entry to `.superpowers/sdd/progress.md`, matching the format of the existing Stage 2a/2b/2c/3a/3b entries: branch, commit range, final test count, per-task commits with review status, the balance numbers from Step 3 including the new `bustedRate`, and the Stage-4 minors.

**This file is git-ignored** (`.superpowers/sdd/.gitignore` contains `*`) and has never been tracked. Edit it on disk; do not `git add` it — that command errors on an ignored path.

Stage-4 items to include:

- No washout floor on **character** — a very-low-character player sits under every character-gated bust event indefinitely, diluted only by the random draw. This stage makes that reachable for the first time; tune deliberately.
- All bust weights and ending probabilities are feel-based starting points.
- The ~57-school ladder changes the tier mix of offers, so this stage's balance run is the new baseline.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-08-07-phase2-stage3c-content-foundation.md
git commit -m "docs: Stage 3c complete — plan checked off"
```

---

## Notes for the reviewer

- **Task 4's e2e bust test is the headline deliverable.** The `busted` terminal has been structurally unreachable end-to-end since Phase 1, and the parent spec has required this test since Decision 3. Verify it genuinely drives a career to `busted` through a content event's `ending` effect rather than asserting something weaker.
- **Task 2 is a pure move.** Any behavior change in that diff is a defect — the six existing events must keep their exact ids, weights, conditions, text, and effects.
- **Task 5 changes season pacing.** Milestones fire every season in every phase, which is a real increase in decisions per career. Tests that counted advances will shift; that is expected, but each adjustment should be justified rather than re-baselined silently.
- **The two-per-state school rule has one documented exemption** (Georgia at tier 1, where Mercer is the only plausible FCS program). It is encoded in the test as data, not omitted — if a reviewer thinks the exemption is wrong, the fix is a different school, not deleting the assertion.
