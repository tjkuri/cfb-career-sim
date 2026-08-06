# Phase 2 — Stage 3a: Content Enablers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Light up two mechanisms the Stage-3b content push depends on: fire authored *fixed* milestone events (today only random events surface), and give the Kicker real countable stats (today it yields zeros, so kickers can't earn awards).

**Architecture:** `autoProgress` is restructured to fire every matching `fixed` event for a phase one at a time (tracked via new `GameState` fields), then the single random draw. A new pure `selectFixedEvent` mirrors `selectRandomEvent`. The Kicker's headline stats are redefined to countable ones (`fieldGoals`/`points`/`gameWinners`) with real `STAT_MODEL` yields and a K All-Conference award row. This is Stage 3a of Phase 2 (2a–2c ✅ → **3a enablers** → 3b content pile → Stage 4 balance).

**Tech Stack:** TypeScript (strict), Vitest, tsx CLIs. Node v22.0.0 (< 22.6).

## Global Constraints

- **Engine purity:** no `Math.random`, `Date.now`, or IO in `src/engine/**` or `src/content/**`. All randomness through the seeded `Rng` (`GameState.rngCursor`). New engine/content files type-check under the engine-isolation pass (`tsconfig.engine.json`, `types: []`).
- **Behavior-preserving for current content:** the real `CONTENT` bundle's only `fixed` event is `recruiting` (engine-special, excluded from firing). So `selectFixedEvent` returns `null` for current content, and firing fixed events must be a **no-op for existing careers** — all current tests (determinism, career playthroughs) stay green byte-for-byte. New firing behavior is verified with crafted test bundles.
- **Determinism:** `seed` + choice sequence → byte-identical `GameState`. Firing a fixed event consumes no rng (it's condition-gated, not a roll); resolving one consumes rng only via its options' `resolveOutcome` like any content event. The single random draw remains exactly one `selectRandomEvent` per phase, guarded so it happens once.
- **Content validator is the safety net:** known-stats derive from `POSITIONS`, so renaming K's stats auto-updates the validator; the new K award row's `stat` must be a known K stat; real `CONTENT` validates clean at import.
- **All new numeric values (K yields, K award threshold) are initial balance-tunable starting points** (Stage 4).
- **Real facts only; no real player names.**
- **Conventional commits** with a scope; end every commit body with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Run `npm test` and `npm run typecheck` (BOTH passes must be clean).

## File Structure

- `src/engine/select-event.ts` — **modify.** Add `selectFixedEvent`.
- `src/engine/types.ts` — **modify.** Add `phaseFiredEventIds: string[]` + `phaseRandomDrawn: boolean` to `GameState`.
- `src/engine/create-career.ts` — **modify.** Initialize the two new fields.
- `src/engine/advance.ts` — **modify.** Restructure `autoProgress` to fire fixed events then the random draw; record fired fixed ids in `applyChoice`.
- `src/content/positions.ts` — **modify.** K stats → countable.
- `src/engine/simulate.ts` — **modify.** `STAT_MODEL.K` real yields.
- `src/content/postseason.ts` — **modify.** Add the K All-Conference production row.

---

### Task 1: `selectFixedEvent` + phase-tracking fields

Add the pure fixed-event selector and the `GameState` fields that track per-phase firing.

**Files:**
- Modify: `src/engine/select-event.ts`
- Modify: `src/engine/types.ts`
- Modify: `src/engine/create-career.ts`
- Test: `src/engine/select-event.test.ts`

**Interfaces:**
- Produces:
  - `export function selectFixedEvent(state: GameState, content: ContentBundle): GameEvent | null` — returns the first (content-order) event with `kind === "fixed"`, `id !== "recruiting"`, `eventMatches(state, ev)` true, and `id` not in `state.phaseFiredEventIds`; else `null`. No rng, deterministic.
  - `GameState` gains `phaseFiredEventIds: string[]` and `phaseRandomDrawn: boolean`; `createCareer` sets them `[]` and `false`.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/select-event.test.ts` (reuse its existing `makeState`/`makeEvent` helpers or state factory; the sketch shows the assertions — match the file's actual helper names):

```ts
import { selectFixedEvent } from "./select-event";

describe("selectFixedEvent", () => {
  it("returns the first matching fixed event, excluding recruiting and already-fired ids", () => {
    const state = makeState({ phase: "nonconf" }); // ensure phase matches the events below
    const content = {
      ...CONTENT,
      events: [
        { id: "recruiting", kind: "fixed", phase: "nonconf", weight: 1, title: "r", description: "d",
          options: [{ id: "c", label: "c", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
        { id: "m1", kind: "fixed", phase: "nonconf", weight: 1, title: "m1", description: "d",
          options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
        { id: "m2", kind: "fixed", phase: "nonconf", weight: 1, title: "m2", description: "d",
          options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
        { id: "r1", kind: "random", phase: "nonconf", weight: 1, title: "r1", description: "d",
          options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
      ],
    } as typeof CONTENT;

    expect(selectFixedEvent({ ...state, phaseFiredEventIds: [] }, content)!.id).toBe("m1"); // recruiting excluded
    expect(selectFixedEvent({ ...state, phaseFiredEventIds: ["m1"] }, content)!.id).toBe("m2");
    expect(selectFixedEvent({ ...state, phaseFiredEventIds: ["m1", "m2"] }, content)).toBeNull(); // random not returned
  });
});
```

Import `CONTENT` from `../content/index` if not already imported. The `makeState` factory must produce a state with the two new fields (add them via the spread `{ ...state, phaseFiredEventIds: [...] }` as shown); if `makeState` builds from `createCareer`, the fields exist after Step 3.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/select-event.test.ts -t "selectFixedEvent"`
Expected: FAIL — `selectFixedEvent` not defined (and TS errors on the missing `phaseFiredEventIds` field until Step 3).

- [ ] **Step 3: Add the fields**

In `src/engine/types.ts`, add to `GameState` (after `redshirtSeasonActive`):

```ts
  phaseFiredEventIds: string[];
  phaseRandomDrawn: boolean;
```

In `src/engine/create-career.ts`, add to the returned object (after `redshirtSeasonActive: false,`):

```ts
    phaseFiredEventIds: [],
    phaseRandomDrawn: false,
```

- [ ] **Step 4: Implement `selectFixedEvent`**

In `src/engine/select-event.ts`, add (below `selectRandomEvent`):

```ts
export function selectFixedEvent(state: GameState, content: ContentBundle): GameEvent | null {
  for (const ev of content.events) {
    if (ev.kind !== "fixed" || ev.id === "recruiting") continue;
    if (state.phaseFiredEventIds.includes(ev.id)) continue;
    if (eventMatches(state, ev)) return ev;
  }
  return null;
}
```

- [ ] **Step 5: Run tests and types**

Run: `npm test`
Expected: all green (the new test + everything else; adding the two fields shouldn't break anything — any hand-built `GameState` stub in a test that now fails to compile needs `phaseFiredEventIds: []` / `phaseRandomDrawn: false` added — a mechanical fixture fix).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/engine/select-event.ts src/engine/types.ts src/engine/create-career.ts src/engine/select-event.test.ts
git commit -m "feat(engine): selectFixedEvent + per-phase fixed-event tracking fields

Adds the pure fixed-event selector (matching fixed events, excluding recruiting
and already-fired ids) and the GameState.phaseFiredEventIds/phaseRandomDrawn
fields the autoProgress restructure will use.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Only `git add` the stub files you actually had to touch.)

---

### Task 2: Fire fixed events in the season loop

Restructure `autoProgress` to fire all matching fixed events for a phase (one at a time), then the single random draw. Behavior-preserving for current content (no non-recruiting fixed events exist).

**Files:**
- Modify: `src/engine/advance.ts`
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: `selectFixedEvent` (Task 1), `phaseFiredEventIds`/`phaseRandomDrawn`.
- Produces: `autoProgress` fires matching fixed events before the single random draw; `applyChoice` records a resolved fixed content event's id into `phaseFiredEventIds` so it doesn't re-fire that phase.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/advance.test.ts`:

```ts
describe("fixed milestone events", () => {
  const fixedNonconf = (id: string) => ({
    id, kind: "fixed" as const, phase: "nonconf" as const, weight: 1, title: id, description: "d",
    options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }],
  });
  const withFixed = {
    ...CONTENT,
    events: [
      ...CONTENT.events.filter((e) => e.id === "recruiting"),
      fixedNonconf("milestone-1"),
      fixedNonconf("milestone-2"),
    ],
  } as typeof CONTENT;

  it("fires each matching fixed event once, in content order, then proceeds", () => {
    let s = createCareer(setup, "fixed-fire");
    const seen: string[] = [];
    let guard = 0;
    while (s.status === "active" && guard++ < 400) {
      const d = getDecision(s, withFixed);
      if (!d) break;
      seen.push(d.eventId);
      s = advance(s, d.options[0]!.id, withFixed);
    }
    const firstMs1 = seen.indexOf("milestone-1");
    const firstMs2 = seen.indexOf("milestone-2");
    expect(firstMs1).toBeGreaterThanOrEqual(0);
    expect(firstMs2).toBeGreaterThan(firstMs1); // m1 before m2 (content order)
    // Each fires exactly once per season it matches; over a full career (>=1 nonconf phase) at least once.
    expect(seen.filter((x) => x === "milestone-1").length).toBeGreaterThanOrEqual(1);
  });

  it("is behavior-preserving for the real content bundle (no non-recruiting fixed events)", () => {
    // Same seed with real CONTENT must be identical to itself (determinism) and terminate.
    const play = (seed: string) => {
      let s = createCareer(setup, seed);
      let guard = 0;
      while (s.status === "active" && guard++ < 400) {
        const d = getDecision(s)!;
        s = advance(s, d.eventId === "declare" ? "return" : d.options[0]!.id);
      }
      return s;
    };
    expect(play("preserve")).toEqual(play("preserve"));
    expect(["drafted", "busted"]).toContain(play("preserve").status);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/engine/advance.test.ts -t "fixed milestone"`
Expected: FAIL — `milestone-1`/`milestone-2` never surface (fixed events aren't fired), so `firstMs1` is `-1`.

- [ ] **Step 3: Restructure `autoProgress`**

In `src/engine/advance.ts`, add `selectFixedEvent` to the import from `./select-event`:

```ts
import { selectRandomEvent, selectFixedEvent } from "./select-event";
```

Replace the body of the `while` loop in `autoProgress` with:

```ts
  while (s.status === "active" && s.currentEventId === null && guard++ < 1000) {
    if (!s.phaseSimulated) {
      // First time entering this phase: tick + produce exactly once.
      tickPhaseStart(s, injuryOf);
      if (s.status !== "active") return;
      if (ON_FIELD_PHASES.has(s.phase)) {
        const last = s.seasons[s.seasons.length - 1];
        if (!last || last.seasonIndex !== s.seasonIndex) {
          s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
        }
      }
      simulatePhaseProduction(s, rng);
      s.phaseSimulated = true;
      s.phaseFiredEventIds = [];
      s.phaseRandomDrawn = false;
    }

    // Fire matching fixed (scripted) events one at a time.
    const fixedEv = selectFixedEvent(s, content);
    if (fixedEv) {
      s.currentEventId = fixedEv.id;
      return;
    }

    // Then at most one random event per phase.
    if (!s.phaseRandomDrawn) {
      s.phaseRandomDrawn = true;
      const ev: GameEvent | null = selectRandomEvent(s, content, rng);
      if (ev) {
        s.currentEventId = ev.id;
        return;
      }
    }

    // Phase fully handled: resolve postseason honors, then move on.
    if (s.phase === "postseason") runPostseasonResolver(s, content, rng, injuryOf);
    advancePhase(s);
    s.phaseSimulated = false;
    if (s.phase === "offseason") {
      enterOffseason(s, content, rng);
      if (s.currentEventId !== null || s.status !== "active") return;
    }
  }
```

- [ ] **Step 4: Record resolved fixed events in `applyChoice`**

In `src/engine/advance.ts` `applyChoice`, in the generic content-event branch (the one that does `resolveOutcome`), after applying effects and before/at clearing `currentEventId`, record a fixed event so it doesn't re-fire this phase. Change the tail of that branch:

```ts
  const outcome = resolveOutcome(opt, rng);
  for (const eff of outcome.effects) applyEffect(s, eff, injuryOf);
  if (ev.kind === "fixed") s.phaseFiredEventIds.push(ev.id);
  s.currentEventId = null;
```

- [ ] **Step 5: Run tests and types**

Run: `npm test`
Expected: all green — the fixed-milestone test passes, and every existing test stays green (real content has no non-recruiting fixed events, so `selectFixedEvent` returns null and behavior is unchanged; determinism holds).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/engine/advance.ts src/engine/advance.test.ts
git commit -m "feat(engine): fire authored fixed milestone events per phase

autoProgress now fires every matching fixed event (one at a time, tracked in
phaseFiredEventIds) before the single random draw. No-op for current content
(only recruiting is fixed, and it's excluded); unlocks Stage-3b milestones.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Kicker real stats

Redefine the Kicker's headline stats to countable ones, give `STAT_MODEL.K` real yields, and add a K All-Conference award row so a strong kicker can earn recognition (0.05 prestige multiplier keeps the hard-mode draft ceiling).

**Files:**
- Modify: `src/content/positions.ts`
- Modify: `src/engine/simulate.ts`
- Modify: `src/content/postseason.ts`
- Test: `src/engine/simulate.test.ts`
- Test: `src/engine/postseason.test.ts`

**Interfaces:**
- Produces: `POSITIONS.K.stats = ["fieldGoals", "points", "gameWinners"]`; `STAT_MODEL.K` yields non-zero countable production; `POSTSEASON.production` gains a K row.

- [ ] **Step 1: Write the failing tests**

Add to `src/engine/simulate.test.ts` (reuse its state/rng helpers; the sketch shows the assertion):

```ts
it("a kicker accumulates non-zero countable stats over a phase", () => {
  const s = createCareer({ lastName: "K", jerseyNumber: 9, homeState: "TX", position: "K" }, "kicker");
  s.phase = "nonconf";
  s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
  simulatePhaseProduction(s, createRng("kicker"));
  const line = s.seasons[0]!;
  expect(line.snaps).toBeGreaterThan(0);
  expect(line.stats.fieldGoals ?? 0).toBeGreaterThan(0);
  expect(line.stats.points ?? 0).toBeGreaterThan(0);
});
```

Add to `src/engine/postseason.test.ts`:

```ts
it("a strong kicker can earn All-Conference across seeds (production award reachable)", () => {
  let honored = 0;
  for (let i = 0; i < 60; i++) {
    const s = createCareer({ lastName: "K", jerseyNumber: 9, homeState: "TX", position: "K" }, `k-${i}`);
    s.overall = 90;
    s.school = { schoolId: "smu", tier: 3 };
    s.seasons.push({ seasonIndex: 0, schoolId: "smu", snaps: 180, stats: { fieldGoals: 20, points: 90 }, teamWins: 0, teamLosses: 0 });
    runPostseasonResolver(s, CONTENT, createRng(`k-${i}`), injuryOf);
    if (s.awards.includes("allConference")) honored++;
  }
  expect(honored).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/engine/simulate.test.ts -t "kicker accumulates"`
Expected: FAIL — K yields are all 0, so `fieldGoals`/`points` stay 0.
Run: `npx vitest run src/engine/postseason.test.ts -t "All-Conference across seeds"`
Expected: FAIL — no K production row, so `allConference` never granted (also `fieldGoals` isn't yet a known K stat).

- [ ] **Step 3: Redefine K stats + yields + award row**

In `src/content/positions.ts`:

```ts
  K: { label: "Kicker", stats: ["fieldGoals", "points", "gameWinners"] },
```

In `src/engine/simulate.ts`, replace the `K` entry of `STAT_MODEL`:

```ts
  K: { snapsMin: 40, snapsMax: 70, per100: { fieldGoals: 9, points: 42, gameWinners: 0.8 } },
```

In `src/content/postseason.ts`, add to the `production` array (after the DSKILL row):

```ts
    { id: "allConference", position: "K", stat: "fieldGoals", threshold: 15, prob: 0.6 },
```

- [ ] **Step 4: Run tests and types**

Run: `npm test`
Expected: all green — kicker production test passes; K All-Conference reachable; real `CONTENT` validates clean (the K award row's `fieldGoals` is now a known K stat). The K prestige multiplier is unchanged (0.05), so prestige awards for K stay near-zero.
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/content/positions.ts src/engine/simulate.ts src/content/postseason.ts src/engine/simulate.test.ts src/engine/postseason.test.ts
git commit -m "feat(content): kicker real countable stats + All-Conference row

K headline stats become fieldGoals/points/gameWinners (countable, fitting the
accumulation model); STAT_MODEL.K yields non-zero production; a K All-Conference
award row lets a strong kicker earn recognition. Prestige multiplier stays 0.05
so the hard-mode draft ceiling holds.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Stage 3a design):**
- Fire authored fixed milestone events — `selectFixedEvent` (Task 1) + `autoProgress` restructure firing fixed-then-random with per-phase tracking (Task 2). ✓
- Behavior-preserving for current content (only recruiting is fixed, excluded) — asserted in Task 2's second test + all existing tests stay green. ✓
- Frequency semantics (fixed events fire whenever conditions match; authors gate via conditions; no once-per-career mechanism) — encoded by `selectFixedEvent` + `phaseFiredEventIds` (fires once per phase per season). ✓
- Kicker countable stats + real yields + K award row, prestige multiplier unchanged (hard-mode) — Task 3. ✓
- Determinism (firing consumes no rng; single random draw guarded once) — Task 2 structure + tests. ✓
- Deferred (noted): the milestone/per-position/off-field/bust content and school-ladder expansion are Stage 3b; a once-per-career flag and FG%/long-FG special-casing are out of scope.

**Placeholder scan:** No TBD/TODO. Every step has complete code + exact commands. K yields/threshold are concrete (flagged balance-tunable per Global Constraints).

**Type/interface consistency:** `selectFixedEvent(state, content)` (Task 1) is consumed by `autoProgress` (Task 2). `phaseFiredEventIds`/`phaseRandomDrawn` are added to `GameState`+`create-career` (Task 1), reset in `autoProgress` (Task 2), read by `selectFixedEvent` (Task 1) and written in `applyChoice` (Task 2). K's new stat names in `POSITIONS` (Task 3) match `STAT_MODEL.K` keys (Task 3) and the K award row's `stat` (Task 3); the validator derives known-stats from `POSITIONS`, so consistency is enforced at import.

**Behavior-preservation note:** Because the real content has no non-recruiting fixed events, Task 2 changes no existing career's rng sequence — the single random draw still happens at the same cursor position (no fixed events fire to consume draws before it). New behavior only manifests once Stage 3b authors fixed events.
