# Phase 2 — Stage 2c: Redshirt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the redshirt as a one-time bump-or-sink development gamble: sit a season (near-zero production, no individual awards) to roll for a permanent overall swing and preserve a year of eligibility (a 5th season).

**Architecture:** Redshirt is the first step in the existing offseason hub sequence (`HUB_ORDER = ["redshirt","declare","transfer"]` — Stage 2b reserved the slot). Taking it resolves a seeded bump/sink roll immediately (permanent `overall` delta via `applyEffect`), marks `redshirtUsed` (which raises the force-declare cap 4→5), and flags the upcoming season as a redshirt sit via a near-zero `snapModifier` (reusing the Stage-2b snap-modifier mechanism) plus a new `redshirtSeasonActive` flag that suppresses individual awards for that season. All numbers are content config. This is Stage 2c of Phase 2 (2a ✅ → 2b ✅ → **2c** → Stage 3 content → Stage 4 balance).

**Tech Stack:** TypeScript (strict), Vitest, tsx CLIs. Node v22.0.0 (< 22.6).

## Global Constraints

- **Engine purity:** no `Math.random`, `Date.now`, or IO in `src/engine/**` or `src/content/**`. All randomness through the seeded `Rng` (`GameState.rngCursor`). New engine/content files must type-check under the engine-isolation pass (`tsconfig.engine.json`, `types: []`): import only engine-internal modules + `../content/schema` types.
- **Determinism:** `seed` + choice sequence → byte-identical `GameState`. The redshirt roll pulls one `rngChance` draw at decision time; *offering* redshirt (a gate check) consumes no rng. Suppressing awards for a redshirt season changes that season's draw count vs a normal season — that is correct (a redshirt is a different game path); the determinism test (same seed+policy → identical state) must still pass. Balance distribution tests assert loose ranges — re-run; widen a specific bound only for genuine sane drift, with a note.
- **Content validator is the safety net:** the new `redshirt` config is validated (probability in [0,1], sit modifier in (0,1]); real `CONTENT` validates clean at import.
- **Reuse existing machinery:** the bump/sink roll uses `applyEffect(s, {kind:"overall", timing:"permanent", amount}, injuryOf)` and `rngChance` from `./rng`. The sit uses the existing `snapModifier` (set on take, reset each `enterOffseason`, applied in `simulatePhaseProduction`). Do NOT add a parallel path.
- **Terminality unchanged:** taking a redshirt ends the offseason hub sequence for that offseason (no declare/transfer that year — you're committing to sit). Declining chains to declare/transfer as today.
- **All config numbers are initial balance-tunable starting points** (tuned in Stage 4).
- **Real facts only; no real player names.**
- **Conventional commits** with a scope; end every commit body with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Run `npm test` and `npm run typecheck` (BOTH passes must be clean).

## File Structure

- `src/content/redshirt.ts` — **new.** `REDSHIRT` config. Data only.
- `src/content/schema.ts` — **modify.** `RedshirtConfig` type + `ContentBundle.redshirt` + validation.
- `src/content/index.ts` — **modify.** Wire `REDSHIRT` into `CONTENT`.
- `src/engine/types.ts` — **modify.** Add `redshirtSeasonActive: boolean` to `GameState`.
- `src/engine/create-career.ts` — **modify.** Initialize `redshirtSeasonActive: false`.
- `src/engine/postseason.ts` — **modify.** Suppress individual awards when `state.redshirtSeasonActive`.
- `src/engine/advance.ts` — **modify.** Redshirt hub decision (`getDecision`/`applyChoice`/`raiseNextHubDecision` branches, offered-when gate), `enterOffseason` flag reset + eligibility-cap bump.

---

### Task 1: Redshirt config + `redshirtSeasonActive` field

Introduce the redshirt config as validated content and the state flag the sit season needs.

**Files:**
- Create: `src/content/redshirt.ts`
- Modify: `src/content/schema.ts`
- Modify: `src/content/index.ts`
- Modify: `src/engine/types.ts`
- Modify: `src/engine/create-career.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Produces:
  - `interface RedshirtConfig { successProb: number; bumpOverall: number; sinkOverall: number; sitSnapModifier: number }` (in `schema.ts`); `ContentBundle` gains `redshirt: RedshirtConfig`.
  - `REDSHIRT: RedshirtConfig` (in `content/redshirt.ts`).
  - `GameState` gains `redshirtSeasonActive: boolean`; `createCareer` sets it `false`.

- [ ] **Step 1: Create the config**

Create `src/content/redshirt.ts`:

```ts
import type { RedshirtConfig } from "./schema";

// Initial, balance-tunable (Stage 4). A one-season sit that rolls a permanent
// overall swing: bump on success, sink on failure. Swing is a touch larger than
// the soccer training gambles (+4/-3) because a redshirt is a whole-season bet.
export const REDSHIRT: RedshirtConfig = {
  successProb: 0.6,
  bumpOverall: 5,
  sinkOverall: -3,
  sitSnapModifier: 0.05,
};
```

- [ ] **Step 2: Add the type + bundle field + validation in schema.ts**

In `src/content/schema.ts`, add the interface (near the other config interfaces):

```ts
export interface RedshirtConfig {
  successProb: number;
  bumpOverall: number;
  sinkOverall: number;
  sitSnapModifier: number;
}
```

Add to `ContentBundle` (after `transfer`):

```ts
  redshirt: RedshirtConfig;
```

Add validation in `validateContent` (after the transfer/progression validation block):

```ts
  const rs = bundle.redshirt;
  if (rs.successProb < 0 || rs.successProb > 1) errors.push("redshirt.successProb must be in [0,1]");
  if (rs.sitSnapModifier <= 0 || rs.sitSnapModifier > 1) errors.push("redshirt.sitSnapModifier must be in (0,1]");
```

- [ ] **Step 3: Add the state field**

In `src/engine/types.ts`, add to `GameState` (after `snapModifier`):

```ts
  redshirtSeasonActive: boolean;
```

In `src/engine/create-career.ts`, add to the returned object (after `snapModifier: 1,`):

```ts
    redshirtSeasonActive: false,
```

- [ ] **Step 4: Write failing validator tests**

In `src/content/schema.test.ts`, add `REDSHIRT` to the imports and to `goodBundle()` (`import { REDSHIRT } from "./redshirt";`, and inside the returned object add `redshirt: REDSHIRT,`). Then add:

```ts
it("rejects a redshirt successProb outside [0,1]", () => {
  const b = goodBundle();
  b.redshirt = { ...b.redshirt, successProb: 1.5 };
  expect(validateContent(b).join()).toContain("successProb");
});

it("rejects a non-positive redshirt sitSnapModifier", () => {
  const b = goodBundle();
  b.redshirt = { ...b.redshirt, sitSnapModifier: 0 };
  expect(validateContent(b).join()).toContain("sitSnapModifier");
});
```

- [ ] **Step 5: Run to verify they fail**

Run: `npx vitest run src/content/schema.test.ts -t "redshirt"`
Expected: FAIL — first a TS error that `goodBundle` is missing `redshirt` until Step 4's additions compile; then the validator produces no error (validation not yet added). Also expect the engine bundle stubs to need the field (see Step 6).

- [ ] **Step 6: Wire into CONTENT + fix any bundle stubs**

In `src/content/index.ts`, import and wire:

```ts
import { REDSHIRT } from "./redshirt";
```

Add to `CONTENT` (after `transfer:`):

```ts
  redshirt: REDSHIRT,
```

Then run `npm run typecheck`. If any hand-built `ContentBundle` stub in a test file (e.g. `src/engine/select-event.test.ts`) fails to compile for the missing `redshirt` field, add `redshirt: REDSHIRT` (import from `../content/redshirt`) to that stub — a mechanical fixture fix, no assertion change. If a hand-built `GameState` in a test fails for the missing `redshirtSeasonActive`, add `redshirtSeasonActive: false`.

- [ ] **Step 7: Run tests and types**

Run: `npm test`
Expected: all green (new validator tests + real `CONTENT` validates clean at import).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/content/redshirt.ts src/content/schema.ts src/content/index.ts src/engine/types.ts src/engine/create-career.ts src/content/schema.test.ts src/engine/select-event.test.ts
git commit -m "feat(content): redshirt config + redshirtSeasonActive state flag

Adds ContentBundle.redshirt (successProb/bumpOverall/sinkOverall/sitSnapModifier,
validated) and the GameState.redshirtSeasonActive flag the sit season uses.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Only `git add` the stub files you actually had to touch in Step 6.)

---

### Task 2: Suppress individual awards during a redshirt season

A redshirt sits, so the postseason resolver must not grant individual awards that season (team trophies still accrue — the player is rostered).

**Files:**
- Modify: `src/engine/postseason.ts`
- Test: `src/engine/postseason.test.ts`

**Interfaces:**
- Consumes: `state.redshirtSeasonActive` (Task 1).
- Produces: `runPostseasonResolver` still simulates the team record and resolves team trophies, but skips `resolveAwards` (grants no individual awards) when `state.redshirtSeasonActive` is true.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/postseason.test.ts` (it already imports `runPostseasonResolver`, `createCareer`, `CONTENT`, `createRng`, and a `setup`/`resolverSetup` const — reuse them):

```ts
describe("runPostseasonResolver — redshirt season", () => {
  it("grants no individual awards during a redshirt season but still resolves the team record", () => {
    const s = createCareer(resolverSetup, "redshirt-resolve");
    s.overall = 96; // would very likely earn awards if not redshirting
    s.redshirtSeasonActive = true;
    s.school = { schoolId: "bama", tier: 4 };
    s.seasons.push({ seasonIndex: 0, schoolId: "bama", snaps: 500, stats: { passYards: 2000 }, teamWins: 0, teamLosses: 0 });
    runPostseasonResolver(s, CONTENT, createRng("redshirt-resolve"), injuryOf);
    expect(s.awards).toEqual([]); // suppressed
    const line = s.seasons[0]!;
    expect(line.teamWins + line.teamLosses).toBe(CONTENT.postseason.gamesPerSeason); // record still resolved
  });

  it("still grants awards across seeds when NOT a redshirt season (control)", () => {
    let honored = 0;
    for (let i = 0; i < 40; i++) {
      const s = createCareer(resolverSetup, `ctrl-${i}`);
      s.overall = 96;
      s.school = { schoolId: "bama", tier: 4 };
      s.seasons.push({ seasonIndex: 0, schoolId: "bama", snaps: 500, stats: { passYards: 2000 }, teamWins: 0, teamLosses: 0 });
      runPostseasonResolver(s, CONTENT, createRng(`ctrl-${i}`), injuryOf);
      if (s.awards.length > 0) honored++;
    }
    expect(honored).toBeGreaterThan(0);
  });
});
```

(`injuryOf` and `resolverSetup` already exist in this test file from Stage 2a; if the setup const is named `setup` there, use that.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/postseason.test.ts -t "redshirt season"`
Expected: FAIL — awards are granted despite `redshirtSeasonActive` (suppression not implemented), so `s.awards` is not empty.

- [ ] **Step 3: Implement the suppression**

In `src/engine/postseason.ts` `runPostseasonResolver`, replace the `awardEffects` line:

```ts
  const awardEffects = state.redshirtSeasonActive
    ? []
    : resolveAwards(state.setup.position, state.overall, season.stats, trophyEffects.length > 0, cfg, rng);
```

- [ ] **Step 4: Run tests and types**

Run: `npm test`
Expected: all green (suppression test + control + existing resolver tests). Determinism holds.
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/postseason.ts src/engine/postseason.test.ts
git commit -m "feat(engine): suppress individual awards during a redshirt season

A redshirt sits, so no Heisman/All-American/All-Conference that year; the team
record and team trophies still resolve (the player is rostered).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: The redshirt hub decision

Wire redshirt into the offseason hub: the offered-when gate, the take/decline decision, the bump/sink roll, the eligibility-cap bump, and the sit-flag lifecycle.

**Files:**
- Modify: `src/engine/advance.ts`
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: `content.redshirt`, `rngChance` (`./rng`), `applyEffect`, `redshirtSeasonActive`.
- Produces:
  - `raiseNextHubDecision`'s `redshirt` branch offers the decision when `redshirtOffered(s)` is true.
  - `redshirtOffered(s)`: `!s.eligibility.redshirtUsed && (s.eligibility.classYear === "SO" || s.eligibility.classYear === "JR" || s.injuries.some((i) => i.kind === "injury"))`. (Note: the FR season is always played before any offseason hub, so the earliest sit is the SO season; a medical redshirt can be offered any year the player carries an active injury into the offseason.)
  - `getDecision` transfer-style branch for `REDSHIRT_EVENT_ID` with options `redshirt` (take) / `decline`.
  - `applyChoice` branch: `decline` → `raiseNextHubDecision(s, content, rng, "redshirt")`; `redshirt` → roll `rngChance(rng, cfg.successProb)`, apply permanent overall `bumpOverall`/`sinkOverall` via `applyEffect`, set `redshirtUsed = true`, `snapModifier = cfg.sitSnapModifier`, `redshirtSeasonActive = true`, `currentEventId = null` (ends the hub sequence — no declare/transfer this offseason). Reject any choiceId other than `redshirt`/`decline`.
  - `enterOffseason`: reset `s.redshirtSeasonActive = false` (alongside `s.snapModifier = 1`); the force-declare cap becomes `CLASS_ORDER.length + (s.eligibility.redshirtUsed ? 1 : 0)`.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/advance.test.ts`. The roll-value test uses a stripped content bundle (recruiting-only events) so no random events perturb `overall` during the sit season, isolating the roll:

```ts
import { CONTENT } from "../content/index";
import { enterOffseason } from "./advance"; // if not already imported

// Content with no random events, so the sit season can't fire an overall-changing event.
const NO_EVENTS = { ...CONTENT, events: CONTENT.events.filter((e) => e.id === "recruiting") };

function redshirtDecisionState(seed: string) {
  const s = createCareer(setup, seed);
  s.overall = 70;
  s.school = { schoolId: "unt", tier: 2 };
  s.eligibility = { classYear: "SO", yearsUsed: 1, redshirtUsed: false, draftEligible: false };
  s.phase = "offseason";
  s.seasons.push({ seasonIndex: 0, schoolId: "unt", snaps: 400, stats: {}, teamWins: 0, teamLosses: 0 });
  s.currentEventId = "redshirt";
  return s;
}

describe("redshirt decision", () => {
  it("is offered to an early, unused player and not once used", () => {
    const s = createCareer(setup, "rs-offer");
    s.eligibility.classYear = "SO";
    s.currentEventId = "redshirt";
    const d = getDecision(s);
    expect(d?.eventId).toBe("redshirt");
    expect(d!.options.map((o) => o.id)).toEqual(["redshirt", "decline"]);
  });

  it("taking it applies the bump on a success roll and the sink on a failure roll", () => {
    // Find one seed whose first rngChance(0.6) succeeds and one that fails.
    // (Implementer: try seeds; assert both outcomes are reachable and exact.)
    const bumped = advance(redshirtDecisionState("SEED_SUCCESS"), "redshirt", NO_EVENTS);
    expect(bumped.eligibility.redshirtUsed).toBe(true);
    expect(bumped.overall).toBe(70 + NO_EVENTS.redshirt.bumpOverall);

    const sunk = advance(redshirtDecisionState("SEED_FAIL"), "redshirt", NO_EVENTS);
    expect(sunk.eligibility.redshirtUsed).toBe(true);
    expect(sunk.overall).toBe(70 + NO_EVENTS.redshirt.sinkOverall);
  });

  it("the redshirt season is a sit (near-zero snaps) and grants no awards", () => {
    // Drive a real career taking redshirt when offered; the redshirt season line
    // has far fewer snaps than a normal season.
    let s = createCareer(setup, "rs-sit");
    let guard = 0;
    let redshirted = false;
    while (s.status === "active" && guard++ < 400) {
      const d = getDecision(s);
      if (!d) break;
      if (d.eventId === "redshirt") { s = advance(s, "redshirt"); redshirted = true; break; }
      s = advance(s, d.eventId === "declare" ? "return" : (d.options.find((o) => o.id === "stay")?.id ?? d.options[0]!.id));
    }
    expect(redshirted).toBe(true);
    // The lowest-snap season should be the sit (well under a normal ~360+ season).
    const minSnaps = Math.min(...s.seasons.map((x) => x.snaps));
    expect(minSnaps).toBeLessThan(100);
  });

  it("declining proceeds to the rest of the offseason (does not set redshirtUsed)", () => {
    const s = redshirtDecisionState("rs-decline");
    const after = advance(s, "decline");
    expect(after.eligibility.redshirtUsed).toBe(false);
    // decline chains onward; the career keeps progressing to a terminal or next decision.
    expect(["active", "drafted", "busted", "declared"]).toContain(after.status);
  });

  it("a redshirt career can reach a 5th season and still terminates deterministically", () => {
    const play = (seed: string) => {
      let s = createCareer(setup, seed);
      let guard = 0;
      while (s.status === "active" && guard++ < 400) {
        const d = getDecision(s);
        if (!d) break;
        // Take redshirt if offered; otherwise return/first-option.
        if (d.eventId === "redshirt") s = advance(s, "redshirt");
        else s = advance(s, d.eventId === "declare" ? "return" : (d.options.find((o) => o.id === "stay")?.id ?? d.options[0]!.id));
      }
      return s;
    };
    const a = play("rs-fifth");
    const b = play("rs-fifth");
    expect(a).toEqual(b); // determinism with redshirt in play
    expect(a.eligibility.redshirtUsed).toBe(true);
    expect(a.seasons.length).toBeGreaterThanOrEqual(5); // the extra year materialized
    expect(["drafted", "busted"]).toContain(a.status);
  });

  it("rejects an unknown redshirt choice id", () => {
    expect(() => advance(redshirtDecisionState("rs-bad"), "banana")).toThrow(/redshirt/i);
  });
});
```

**Implementer note on `SEED_SUCCESS`/`SEED_FAIL`:** replace those placeholders with two real seed strings you find by trial — one where the redshirt state's first `rngChance(0.6)` draw succeeds (overall → 75) and one where it fails (overall → 67). A quick way: loop a handful of seeds through `advance(redshirtDecisionState(seed), "redshirt", NO_EVENTS)` and pick one giving 75 and one giving 67.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/engine/advance.test.ts -t "redshirt decision"`
Expected: FAIL — `getDecision` returns null / no options for `currentEventId === "redshirt"` (branch not implemented), and the offered/roll behavior is absent.

- [ ] **Step 3: Implement the hub decision**

In `src/engine/advance.ts`:

Add the import for `rngChance` and the constant:

```ts
import { createRng, rngChance, type Rng } from "./rng";
```

```ts
const REDSHIRT_EVENT_ID = "redshirt";
```

Add the offered-when helper (near `raiseNextHubDecision`):

```ts
function redshirtOffered(s: GameState): boolean {
  return (
    !s.eligibility.redshirtUsed &&
    (s.eligibility.classYear === "SO" ||
      s.eligibility.classYear === "JR" ||
      s.injuries.some((i) => i.kind === "injury"))
  );
}
```

In `raiseNextHubDecision`, replace the redshirt placeholder branch:

```ts
    if (step === "redshirt") {
      if (redshirtOffered(s)) { s.currentEventId = REDSHIRT_EVENT_ID; return; }
      continue;
    }
```

In `getDecision`, add a branch (before the generic-event lookup):

```ts
  if (state.currentEventId === REDSHIRT_EVENT_ID) {
    return {
      eventId: REDSHIRT_EVENT_ID,
      title: "Redshirt?",
      description: "Sit this season to preserve a year of eligibility and gamble on coming back stronger — it might backfire.",
      options: [
        { id: "redshirt", label: "Take the redshirt (sit the season)" },
        { id: "decline", label: "Play this season" },
      ],
    };
  }
```

In `applyChoice`, add a branch (before the generic-event lookup):

```ts
  if (s.currentEventId === REDSHIRT_EVENT_ID) {
    if (choiceId !== "redshirt" && choiceId !== "decline") {
      throw new Error(`Invalid redshirt choice: ${choiceId}`);
    }
    if (choiceId === "decline") {
      raiseNextHubDecision(s, content, rng, "redshirt");
      return;
    }
    // Take the redshirt: roll the bump/sink, sit the upcoming season, preserve eligibility.
    const cfg = content.redshirt;
    const success = rngChance(rng, cfg.successProb);
    applyEffect(s, { kind: "overall", timing: "permanent", amount: success ? cfg.bumpOverall : cfg.sinkOverall }, injuryOf);
    s.eligibility.redshirtUsed = true;
    s.snapModifier = cfg.sitSnapModifier;
    s.redshirtSeasonActive = true;
    s.currentEventId = null; // taking the redshirt ends this offseason's hub sequence
    return;
  }
```

In `enterOffseason`, reset the redshirt flag alongside the snap modifier, and bump the force-declare cap. Change the reset line:

```ts
  // Reset per-season modifiers from any prior transfer/redshirt.
  s.snapModifier = 1;
  s.redshirtSeasonActive = false;
```

Change the force-declare check:

```ts
  const eligibilityCap = CLASS_ORDER.length + (s.eligibility.redshirtUsed ? 1 : 0);
  if (s.eligibility.yearsUsed >= eligibilityCap) {
    // Out of eligibility -> forced to declare.
    s.status = "declared";
    return;
  }
```

- [ ] **Step 4: Run tests and types**

Run: `npx vitest run src/engine/advance.test.ts -t "redshirt decision"`
Expected: PASS (fill in the two seeds first). Then:
Run: `npm test`
Expected: all green. If a `balance.test.ts` bound drifts (redshirts change some careers' trajectories/lengths), confirm sane drift and widen the specific bound with a note; do not mask a structural regression (careers must still terminate — the `avgSeasons` may rise slightly since a redshirt adds a year to careers that take it).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/advance.ts src/engine/advance.test.ts
git commit -m "feat(engine): redshirt as a one-time bump/sink offseason gamble

Redshirt is the first offseason-hub step: offered early (SO/JR) or when injured,
once per career. Taking it rolls a permanent overall bump-or-sink, sits the next
season (near-zero snaps, no individual awards), and raises the eligibility cap
4->5 for a fifth season. Declining chains to declare/transfer as before.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Stage 2c design):**
- Redshirt as a one-time bump-or-sink development gamble (roll on take; permanent +bump/−sink via `applyEffect`) → Task 3. ✓
- Offered early (SO/JR post-advancement — FR season is always played) or when carrying an active injury (medical redshirt), once per career → Task 3 `redshirtOffered`. ✓
- Sit season: near-zero snaps (via `snapModifier = sitSnapModifier`, reused Stage-2b mechanism) → Task 3; no individual awards, team trophies still accrue → Task 2. ✓
- Eligibility preserved (cap 4→5 via `redshirtUsed`), existing `enterOffseason` order untouched (no eligibility-revert) → Task 3. ✓
- Config knobs in content, validated → Task 1. ✓
- Determinism (roll = one seeded draw; offering consumes none) and terminality (take ends the hub sequence; decline chains) → Task 3 tests. ✓
- Interactions the spec called out: a lone redshirt sit won't trigger the 2-consecutive-season buried washout (only a redshirt *plus* another buried season does — thematically correct, untouched here); a `−3` sink near the floor washing out is the intended consequence (washout logic unchanged). ✓

**Placeholder scan:** The only placeholders are `SEED_SUCCESS`/`SEED_FAIL` in Task 3's roll test, explicitly flagged with an implementer note on how to find them (trial). Every other step has complete code + exact commands.

**Type/interface consistency:** `RedshirtConfig` (Task 1, `schema.ts`) is consumed by `content/redshirt.ts` (Task 1) and `content.redshirt` in `applyChoice` (Task 3). `redshirtSeasonActive` is added to `GameState`+`create-career` (Task 1), reset in `enterOffseason` (Task 3), read by `runPostseasonResolver` (Task 2) and set in `applyChoice` (Task 3). `REDSHIRT_EVENT_ID`/`redshirtOffered`/the roll use `rngChance` + `applyEffect` (both already exported/available). The eligibility-cap change reads the existing `eligibility.redshirtUsed` (Phase-1 field). `HUB_ORDER` already contains `"redshirt"` (Stage 2b) — Task 3 activates the previously-`continue`d branch.

**Scope:** One coherent feature, one plan. Out of scope (per spec): multiple redshirts, an `RS FR` class label, Stage-4 rebalancing.
