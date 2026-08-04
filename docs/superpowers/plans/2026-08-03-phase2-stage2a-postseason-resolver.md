# Phase 2 — Stage 2a: Season Production & Postseason Honors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each season produce a real team record, team trophies, and individual awards (all feeding draft stock), and make players develop by playing — turning the currently-static climb into a systemic one.

**Architecture:** A new pure engine module `src/engine/postseason.ts` (team-record sim → trophy resolution → award resolution, composed by `runPostseasonResolver`) is hooked into the season loop at the end of the postseason phase. All numbers live in a new content data module `src/content/postseason.ts` (added to `ContentBundle`, validated), so the engine stays generic and the values are balance-tunable in Stage 4. A passive development bump (also config-driven) is applied in the offseason hub. This is Stage 2a of 4 for Phase 2 (2a season/postseason systems → 2b offseason hub → Stage 3 content → Stage 4 balance).

**Tech Stack:** TypeScript (strict), Vitest, tsx CLIs. Node v22.0.0 (< 22.6).

## Global Constraints

- **Engine purity:** no `Math.random`, `Date.now`, or IO in `src/engine/**` or `src/content/**`. All randomness flows through the seeded `Rng` (`GameState.rngCursor`); the resolver receives an `Rng` and pulls every draw from it. `src/engine/postseason.ts` must type-check under the engine-isolation pass (`tsconfig.engine.json`, `types: []`) — import only from `./types`, `./rng`, `./effects`, `./draft`, and `../content/schema` (types).
- **Determinism:** `seed` + choice sequence → byte-identical `GameState`. The resolver adds RNG draws inside the postseason phase; this WILL shift the downstream RNG sequence versus pre-Stage-2a (e.g. which later random events fire). That is expected. The determinism test (same seed+policy → identical state) must still pass; the balance-harness distribution tests assert loose ranges and must still pass — re-run them and confirm.
- **Content validator is the safety net:** every trophy/award id and position/stat the resolver config can emit MUST be validated against the bundle's `trophyIds`/`awardIds`/positions/known-stats, and all probabilities must be in `[0,1]`. The real `CONTENT` bundle must still validate clean at import (`content/index.ts` throws on any error).
- **`deriveDraftStock` already consumes honors** (trophy count × 2.5, awards × 3) — the resolver must emit trophy/award effects through `applyEffect` so this bridge works and dedup/clamp logic is reused. Do NOT change `deriveDraftStock` in this stage.
- **All numeric config values in this plan are initial, balance-tunable starting points** (tuned in Stage 4). They are grounded in the existing `STAT_MODEL` yields and the soccer reference formula; do not treat them as final.
- **Real facts only; no real player names.**
- **Conventional commits** with a scope; end every commit body with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Run the whole suite with `npm test` and types with `npm run typecheck` (runs BOTH the engine-isolation pass and the full pass; both must be clean).

## File Structure

- `src/content/postseason.ts` — **new.** The `POSTSEASON` config data (team-record model, trophy thresholds, award multipliers/curves/thresholds) and the `PROGRESSION` config (development knobs). Data only.
- `src/content/schema.ts` — **modify.** Add `PostseasonConfig` + `ProgressionConfig` types; add `postseason` + `progression` fields to `ContentBundle`; validate them.
- `src/content/index.ts` — **modify.** Wire the new config into `CONTENT`.
- `src/engine/postseason.ts` — **new.** Pure functions: `simulateTeamRecord`, `resolveTrophies`, `resolveAwards`, `runPostseasonResolver`, and the `bandProb` helper.
- `src/engine/advance.ts` — **modify.** Hook `runPostseasonResolver` into `autoProgress` (end of postseason) and apply the development bump in `runOffseasonHub`.

---

### Task 1: Resolver + progression config (data tables, schema, validation)

Introduce all Stage-2a config as validated content data. This freezes the config contract the later tasks consume.

**Files:**
- Create: `src/content/postseason.ts`
- Modify: `src/content/schema.ts`
- Modify: `src/content/index.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Consumes: `Position`, `Tier` from `../engine/types`.
- Produces:
  - `PostseasonConfig` (exported from `schema.ts`):
    ```ts
    interface AwardBand { min: number; prob: number }
    interface PrestigeAward { id: string; bands: AwardBand[]; teamSuccessBoost: number }
    interface ProductionAward { id: string; position: Position; stat: string; threshold: number; prob: number }
    interface TrophyRule { id: string; minWins: number; prob: number }               // bowl
    interface TieredTrophyRule { id: string; minWins: number; probByTier: Record<Tier, number> } // conf, cfp
    interface PostseasonConfig {
      gamesPerSeason: number;
      tierBaseWinPct: Record<Tier, number>;
      overallWinShiftPerPoint: number;
      winPctClamp: [number, number];
      bowl: TrophyRule;
      conf: TieredTrophyRule;
      cfp: TieredTrophyRule;
      positionMultiplier: Record<Position, number>;
      prestige: PrestigeAward[];
      production: ProductionAward[];
    }
    interface ProgressionConfig { snapsPerDevPoint: number; devCap: number }
    ```
  - `ContentBundle` gains `postseason: PostseasonConfig` and `progression: ProgressionConfig`.
  - `POSTSEASON: PostseasonConfig` and `PROGRESSION: ProgressionConfig` exported from `content/postseason.ts`.

- [ ] **Step 1: Create the config data module**

Create `src/content/postseason.ts`:

```ts
import type { PostseasonConfig, ProgressionConfig } from "./schema";

// All values are initial, balance-tunable starting points (tuned in Stage 4).
// Award stat thresholds are grounded in the STAT_MODEL yields in engine/simulate.ts:
// a full season is ~3 on-field phases x ~160 snaps at overall 70. K produces no
// stats in the current model, so K earns no production award (intentional hard-mode);
// its tiny prestige multiplier keeps prestige awards near-impossible too.
export const POSTSEASON: PostseasonConfig = {
  gamesPerSeason: 12,
  tierBaseWinPct: { 1: 0.45, 2: 0.5, 3: 0.58, 4: 0.68 },
  overallWinShiftPerPoint: 0.005, // (overall - 70) * this, added to base win pct
  winPctClamp: [0.12, 0.92],
  bowl: { id: "bowlWin", minWins: 7, prob: 0.55 },
  conf: { id: "confTitle", minWins: 10, probByTier: { 1: 0.5, 2: 0.45, 3: 0.4, 4: 0.5 } },
  cfp: { id: "cfpTitle", minWins: 12, probByTier: { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35 } },
  positionMultiplier: { QB: 1.0, OSKILL: 0.8, DL: 0.4, DSKILL: 0.4, OL: 0.15, K: 0.05 },
  prestige: [
    { id: "heisman", bands: [{ min: 92, prob: 0.5 }, { min: 88, prob: 0.25 }, { min: 84, prob: 0.08 }], teamSuccessBoost: 0.5 },
    { id: "allAmerican", bands: [{ min: 85, prob: 0.6 }, { min: 80, prob: 0.3 }, { min: 75, prob: 0.1 }], teamSuccessBoost: 0.3 },
  ],
  production: [
    { id: "allConference", position: "QB", stat: "passYards", threshold: 1300, prob: 0.7 },
    { id: "allConference", position: "OSKILL", stat: "scrimmageYards", threshold: 900, prob: 0.7 },
    { id: "allConference", position: "OL", stat: "pancakes", threshold: 30, prob: 0.7 },
    { id: "allConference", position: "DL", stat: "sacks", threshold: 7, prob: 0.7 },
    { id: "allConference", position: "DSKILL", stat: "tackles", threshold: 60, prob: 0.7 },
  ],
};

export const PROGRESSION: ProgressionConfig = { snapsPerDevPoint: 180, devCap: 3 };
```

- [ ] **Step 2: Add the config types + bundle fields in schema.ts**

In `src/content/schema.ts`, add the `Tier` import and the config types, and extend `ContentBundle`. Update the top import:

```ts
import type { Effect, GameEvent, Outcome, Position, Tier } from "../engine/types";
import { CLASS_ORDER } from "../engine/types";
```

Add these interface declarations above `ContentBundle`:

```ts
export interface AwardBand { min: number; prob: number }
export interface PrestigeAward { id: string; bands: AwardBand[]; teamSuccessBoost: number }
export interface ProductionAward { id: string; position: Position; stat: string; threshold: number; prob: number }
export interface TrophyRule { id: string; minWins: number; prob: number }
export interface TieredTrophyRule { id: string; minWins: number; probByTier: Record<Tier, number> }
export interface PostseasonConfig {
  gamesPerSeason: number;
  tierBaseWinPct: Record<Tier, number>;
  overallWinShiftPerPoint: number;
  winPctClamp: [number, number];
  bowl: TrophyRule;
  conf: TieredTrophyRule;
  cfp: TieredTrophyRule;
  positionMultiplier: Record<Position, number>;
  prestige: PrestigeAward[];
  production: ProductionAward[];
}
export interface ProgressionConfig { snapsPerDevPoint: number; devCap: number }
```

Add the two fields to `ContentBundle` (after `awardIds`):

```ts
  postseason: PostseasonConfig;
  progression: ProgressionConfig;
```

- [ ] **Step 3: Write failing validator tests**

Add to `src/content/schema.test.ts`. The `goodBundle()` helper must now include valid `postseason` + `progression` blocks — add them to `goodBundle()` (import the real config to avoid duplicating values):

At the top of the test file, add to the imports:

```ts
import { POSTSEASON, PROGRESSION } from "./postseason";
```

Inside `goodBundle()`'s returned object, add:

```ts
    postseason: POSTSEASON,
    progression: PROGRESSION,
```

Then add these tests inside the `describe("validateContent", ...)` block:

```ts
it("rejects a prestige award id not in awardIds", () => {
  const b = goodBundle();
  b.postseason = { ...b.postseason, prestige: [{ id: "ghostAward", bands: [{ min: 90, prob: 0.5 }], teamSuccessBoost: 0.3 }] };
  expect(validateContent(b).join()).toContain("ghostAward");
});

it("rejects a trophy id not in trophyIds", () => {
  const b = goodBundle();
  b.postseason = { ...b.postseason, bowl: { id: "ghostTrophy", minWins: 7, prob: 0.5 } };
  expect(validateContent(b).join()).toContain("ghostTrophy");
});

it("rejects a production award referencing an unknown stat", () => {
  const b = goodBundle();
  b.postseason = { ...b.postseason, production: [{ id: "allConference", position: "QB", stat: "notAStat", threshold: 1, prob: 0.7 }] };
  expect(validateContent(b).join()).toContain("notAStat");
});

it("rejects a probability outside [0,1] in postseason config", () => {
  const b = goodBundle();
  b.postseason = { ...b.postseason, bowl: { id: "bowlWin", minWins: 7, prob: 1.5 } };
  expect(validateContent(b).some((e) => e.toLowerCase().includes("prob"))).toBe(true);
});
```

- [ ] **Step 4: Run the validator tests to verify they fail**

Run: `npx vitest run src/content/schema.test.ts -t "prestige award id"`
Expected: FAIL — no error is produced (the validator doesn't inspect `postseason` yet). Also expect TS errors that `goodBundle` is missing `postseason`/`progression` until Step 3's additions compile — resolve by ensuring Step 3 edits are in place.

- [ ] **Step 5: Implement the config validation**

In `src/content/schema.ts`, inside `validateContent`, after the injury `recoveryPhases` loop (near the top, before the events loop), add validation of the new config. Use the existing `knownTrophies`/`knownAwards`/`knownStats`/`knownPositions` sets:

```ts
  const ps = bundle.postseason;
  const inRange = (p: number) => p >= 0 && p <= 1;
  for (const t of [ps.bowl] as { id: string; prob: number }[]) {
    if (!knownTrophies.has(t.id)) errors.push(`Postseason: unknown trophy "${t.id}"`);
    if (!inRange(t.prob)) errors.push(`Postseason trophy ${t.id}: prob must be in [0,1]`);
  }
  for (const t of [ps.conf, ps.cfp]) {
    if (!knownTrophies.has(t.id)) errors.push(`Postseason: unknown trophy "${t.id}"`);
    for (const p of Object.values(t.probByTier))
      if (!inRange(p)) errors.push(`Postseason trophy ${t.id}: probByTier must be in [0,1]`);
  }
  for (const a of ps.prestige) {
    if (!knownAwards.has(a.id)) errors.push(`Postseason: unknown award "${a.id}"`);
    for (const band of a.bands) if (!inRange(band.prob)) errors.push(`Postseason award ${a.id}: band prob must be in [0,1]`);
  }
  for (const a of ps.production) {
    if (!knownAwards.has(a.id)) errors.push(`Postseason: unknown award "${a.id}"`);
    if (!knownStats.has(a.stat)) errors.push(`Postseason award ${a.id}: unknown stat "${a.stat}"`);
    if (!knownPositions.has(a.position)) errors.push(`Postseason award ${a.id}: unknown position "${a.position}"`);
    if (!inRange(a.prob)) errors.push(`Postseason award ${a.id}: prob must be in [0,1]`);
  }
```

Note: `knownPositions` is declared later in the current function body — move its declaration (the `const knownPositions = new Set<string>(Object.keys(bundle.positions));` line) up to sit with the other `known*` set declarations near the top of `validateContent`, so it is in scope here. (`knownStats`, `knownTrophies`, `knownAwards` are already declared at the top.)

- [ ] **Step 6: Wire the config into CONTENT**

In `src/content/index.ts`, import and add the fields:

```ts
import { POSTSEASON, PROGRESSION } from "./postseason";
```

Add to the `CONTENT` object literal (after `events: EVENTS,`):

```ts
  postseason: POSTSEASON,
  progression: PROGRESSION,
```

- [ ] **Step 7: Run tests and types to verify green**

Run: `npx vitest run src/content/schema.test.ts`
Expected: PASS (all new + existing validator tests; the real `POSTSEASON`/`PROGRESSION` used in `goodBundle` validate clean).
Run: `npm test`
Expected: all green — the real `CONTENT` imports without throwing (proves the real config validates).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/content/postseason.ts src/content/schema.ts src/content/index.ts src/content/schema.test.ts
git commit -m "feat(content): postseason resolver + progression config tables

Adds ContentBundle.postseason (team-record model, trophy thresholds, award
multipliers/curves/stat-thresholds) and ContentBundle.progression (development
knobs) as validated data. Values are initial balance-tunable starting points.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Team-record simulation

Pure function that rolls a season's win/loss record from the player's overall + school tier + seeded rng.

**Files:**
- Create: `src/engine/postseason.ts`
- Test: `src/engine/postseason.test.ts`

**Interfaces:**
- Consumes: `GameState`, `Tier` (`./types`); `Rng` (`./rng`); `PostseasonConfig` (`../content/schema`).
- Produces: `export function simulateTeamRecord(overall: number, tier: Tier, cfg: PostseasonConfig, rng: Rng): { wins: number; losses: number }`. Rolls exactly `cfg.gamesPerSeason` games; `wins + losses === cfg.gamesPerSeason`. Per game, win probability = `clamp(cfg.tierBaseWinPct[tier] + (overall - 70) * cfg.overallWinShiftPerPoint, cfg.winPctClamp[0], cfg.winPctClamp[1])`, won when `rng.next() < winPct`.

- [ ] **Step 1: Write the failing test**

Create `src/engine/postseason.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { simulateTeamRecord } from "./postseason";
import { createRng } from "./rng";
import { POSTSEASON } from "../content/postseason";

describe("simulateTeamRecord", () => {
  it("always produces wins + losses === gamesPerSeason", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const r = simulateTeamRecord(75, 3, POSTSEASON, createRng(seed));
      expect(r.wins + r.losses).toBe(POSTSEASON.gamesPerSeason);
      expect(r.wins).toBeGreaterThanOrEqual(0);
      expect(r.losses).toBeGreaterThanOrEqual(0);
    }
  });

  it("elite players at blue-bloods win more than weak players at low tiers (on average)", () => {
    let eliteWins = 0, weakWins = 0;
    for (let i = 0; i < 60; i++) {
      eliteWins += simulateTeamRecord(95, 4, POSTSEASON, createRng(`elite-${i}`)).wins;
      weakWins += simulateTeamRecord(55, 1, POSTSEASON, createRng(`weak-${i}`)).wins;
    }
    expect(eliteWins).toBeGreaterThan(weakWins);
  });

  it("is deterministic for a seed", () => {
    const a = simulateTeamRecord(80, 2, POSTSEASON, createRng("same"));
    const b = simulateTeamRecord(80, 2, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/postseason.test.ts`
Expected: FAIL — `simulateTeamRecord` is not defined / module not found.

- [ ] **Step 3: Implement `simulateTeamRecord`**

Create `src/engine/postseason.ts`:

```ts
import type { Tier } from "./types";
import type { Rng } from "./rng";
import type { PostseasonConfig } from "../content/schema";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function simulateTeamRecord(
  overall: number,
  tier: Tier,
  cfg: PostseasonConfig,
  rng: Rng,
): { wins: number; losses: number } {
  const base = cfg.tierBaseWinPct[tier];
  const winPct = clamp(base + (overall - 70) * cfg.overallWinShiftPerPoint, cfg.winPctClamp[0], cfg.winPctClamp[1]);
  let wins = 0;
  for (let g = 0; g < cfg.gamesPerSeason; g++) if (rng.next() < winPct) wins++;
  return { wins, losses: cfg.gamesPerSeason - wins };
}
```

- [ ] **Step 4: Run tests and types to verify green**

Run: `npx vitest run src/engine/postseason.test.ts`
Expected: PASS (3 tests).
Run: `npm run typecheck`
Expected: both passes exit 0 (confirms `postseason.ts` compiles under engine isolation).

- [ ] **Step 5: Commit**

```bash
git add src/engine/postseason.ts src/engine/postseason.test.ts
git commit -m "feat(engine): team-record simulation from overall + tier + rng

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Trophy resolution

Pure function mapping a season's record + tier to team-trophy effects via the config's thresholds and (tiered) probabilities.

**Files:**
- Modify: `src/engine/postseason.ts`
- Test: `src/engine/postseason.test.ts`

**Interfaces:**
- Consumes: `Tier` (`./types`); `Rng`; `PostseasonConfig`; `Effect` (`./types`).
- Produces: `export function resolveTrophies(wins: number, tier: Tier, cfg: PostseasonConfig, rng: Rng): Effect[]` — returns zero or more `{ kind: "trophy", id }` effects. Rolls, in this fixed order: bowl (`wins >= cfg.bowl.minWins` and `rng.next() < cfg.bowl.prob`), conf (`wins >= cfg.conf.minWins` and `rng.next() < cfg.conf.probByTier[tier]`), cfp (`wins >= cfg.cfp.minWins` and `rng.next() < cfg.cfp.probByTier[tier]`). The three are independent rolls (a dominant season may earn all three). Always draws in that fixed order for determinism; only rolls a probability when the win threshold is met.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/postseason.test.ts`:

```ts
import { resolveTrophies } from "./postseason";
import type { PostseasonConfig } from "../content/schema";

describe("resolveTrophies", () => {
  it("awards no trophies below the bowl win threshold", () => {
    const effs = resolveTrophies(3, 4, POSTSEASON, createRng("x"));
    expect(effs).toEqual([]);
  });

  it("can award the bowl with a forced-certain config", () => {
    const cfg: PostseasonConfig = {
      ...POSTSEASON,
      bowl: { id: "bowlWin", minWins: 0, prob: 1 },
      conf: { ...POSTSEASON.conf, minWins: 99 },
      cfp: { ...POSTSEASON.cfp, minWins: 99 },
    };
    const effs = resolveTrophies(8, 3, cfg, createRng("x"));
    expect(effs).toEqual([{ kind: "trophy", id: "bowlWin" }]);
  });

  it("can award all three in a dominant season with certain probabilities", () => {
    const certain: PostseasonConfig = {
      ...POSTSEASON,
      bowl: { id: "bowlWin", minWins: 0, prob: 1 },
      conf: { id: "confTitle", minWins: 0, probByTier: { 1: 1, 2: 1, 3: 1, 4: 1 } },
      cfp: { id: "cfpTitle", minWins: 0, probByTier: { 1: 1, 2: 1, 3: 1, 4: 1 } },
    };
    const ids = resolveTrophies(12, 4, certain, createRng("x")).map((e) => (e.kind === "trophy" ? e.id : ""));
    expect(ids).toEqual(["bowlWin", "confTitle", "cfpTitle"]);
  });

  it("is deterministic for a seed", () => {
    const a = resolveTrophies(11, 4, POSTSEASON, createRng("same"));
    const b = resolveTrophies(11, 4, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/postseason.test.ts -t "resolveTrophies"`
Expected: FAIL — `resolveTrophies` is not defined.

- [ ] **Step 3: Implement `resolveTrophies`**

Add to `src/engine/postseason.ts` (add `Effect` to the type import from `./types`):

```ts
export function resolveTrophies(wins: number, tier: Tier, cfg: PostseasonConfig, rng: Rng): Effect[] {
  const effects: Effect[] = [];
  if (wins >= cfg.bowl.minWins && rng.next() < cfg.bowl.prob)
    effects.push({ kind: "trophy", id: cfg.bowl.id });
  if (wins >= cfg.conf.minWins && rng.next() < cfg.conf.probByTier[tier])
    effects.push({ kind: "trophy", id: cfg.conf.id });
  if (wins >= cfg.cfp.minWins && rng.next() < cfg.cfp.probByTier[tier])
    effects.push({ kind: "trophy", id: cfg.cfp.id });
  return effects;
}
```

- [ ] **Step 4: Run tests and types to verify green**

Run: `npx vitest run src/engine/postseason.test.ts`
Expected: PASS (all record + trophy tests).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/postseason.ts src/engine/postseason.test.ts
git commit -m "feat(engine): team-trophy resolution (bowl/conf/cfp) from record + tier

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Individual award resolution

Pure function granting individual awards from season stats + overall + team success, using the soccer-borrowed formula (overall-band base × position multiplier × team-success boost for prestige; stat thresholds for production).

**Files:**
- Modify: `src/engine/postseason.ts`
- Test: `src/engine/postseason.test.ts`

**Interfaces:**
- Consumes: `Position`, `Effect` (`./types`); `Rng`; `PostseasonConfig`; a season stats map `Record<string, number>`.
- Produces:
  - `export function bandProb(overall: number, bands: AwardBand[]): number` — returns the `prob` of the first band (in array order) whose `min <= overall`, else 0. (Bands are authored high-to-low.)
  - `export function resolveAwards(position: Position, overall: number, stats: Record<string, number>, wonAnyTrophy: boolean, cfg: PostseasonConfig, rng: Rng): Effect[]` — returns `{ kind: "award", id }` effects. Processes `cfg.prestige` in order: `p = min(1, bandProb(overall, award.bands) * cfg.positionMultiplier[position] * (wonAnyTrophy ? 1 + award.teamSuccessBoost : 1))`; roll `rng.next() < p`. Then `cfg.production` filtered to `award.position === position`: if `(stats[award.stat] ?? 0) >= award.threshold` roll `rng.next() < award.prob`. Draws are consumed in that fixed order (prestige array order, then production array order) whether or not each roll succeeds, EXCEPT a production award whose stat threshold is not met consumes NO draw (mirrors the trophy pattern: only roll when the gate is met). For prestige, always roll (the multiplier can be 0 for K but a draw is still consumed to keep the sequence stable) — see note. Duplicate award ids are naturally deduped downstream by `applyEffect`, but `resolveAwards` may return the same id twice (e.g. two production rows); that is acceptable.

  **Draw-order note (important for determinism):** prestige rolls ALWAYS consume one draw each (even when `p` is 0, call `rng.next()` and compare); production rolls consume a draw ONLY when the stat threshold is met. This keeps the RNG sequence deterministic and independent of overall.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/postseason.test.ts`:

```ts
import { resolveAwards, bandProb } from "./postseason";
import type { Position } from "./types";

describe("bandProb", () => {
  it("returns the first matching band's prob, else 0", () => {
    const bands = [{ min: 90, prob: 0.5 }, { min: 80, prob: 0.2 }];
    expect(bandProb(95, bands)).toBe(0.5);
    expect(bandProb(82, bands)).toBe(0.2);
    expect(bandProb(70, bands)).toBe(0);
  });
});

describe("resolveAwards", () => {
  it("grants no awards to a mediocre low-stat player", () => {
    const effs = resolveAwards("QB", 60, { passYards: 200 }, false, POSTSEASON, createRng("x"));
    expect(effs).toEqual([]);
  });

  it("an elite QB with huge stats and a title can win prestige + production awards", () => {
    // Search seeds to prove reachability (rng-gated), not a single fixed seed.
    let sawPrestige = false, sawProduction = false;
    for (let i = 0; i < 80; i++) {
      const effs = resolveAwards("QB", 95, { passYards: 2000 }, true, POSTSEASON, createRng(`s-${i}`));
      const ids = effs.map((e) => (e.kind === "award" ? e.id : ""));
      if (ids.includes("heisman") || ids.includes("allAmerican")) sawPrestige = true;
      if (ids.includes("allConference")) sawProduction = true;
    }
    expect(sawPrestige).toBe(true);
    expect(sawProduction).toBe(true);
  });

  it("a kicker almost never wins prestige awards (multiplier 0.05)", () => {
    let kickerPrestige = 0;
    for (let i = 0; i < 200; i++) {
      const effs = resolveAwards("K", 95, {}, true, POSTSEASON, createRng(`k-${i}`));
      if (effs.some((e) => e.kind === "award" && (e.id === "heisman" || e.id === "allAmerican"))) kickerPrestige++;
    }
    expect(kickerPrestige).toBeLessThan(30); // rare by design
  });

  it("is deterministic for a seed", () => {
    const a = resolveAwards("QB", 90, { passYards: 1500 }, true, POSTSEASON, createRng("same"));
    const b = resolveAwards("QB", 90, { passYards: 1500 }, true, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/postseason.test.ts -t "resolveAwards"`
Expected: FAIL — `resolveAwards`/`bandProb` not defined.

- [ ] **Step 3: Implement `bandProb` + `resolveAwards`**

Add to `src/engine/postseason.ts` (add `Position` to the `./types` import and `AwardBand` to the `../content/schema` import):

```ts
export function bandProb(overall: number, bands: AwardBand[]): number {
  for (const b of bands) if (overall >= b.min) return b.prob;
  return 0;
}

export function resolveAwards(
  position: Position,
  overall: number,
  stats: Record<string, number>,
  wonAnyTrophy: boolean,
  cfg: PostseasonConfig,
  rng: Rng,
): Effect[] {
  const effects: Effect[] = [];
  const mult = cfg.positionMultiplier[position];
  for (const award of cfg.prestige) {
    const boost = wonAnyTrophy ? 1 + award.teamSuccessBoost : 1;
    const p = Math.min(1, bandProb(overall, award.bands) * mult * boost);
    if (rng.next() < p) effects.push({ kind: "award", id: award.id }); // always consumes a draw
  }
  for (const award of cfg.production) {
    if (award.position !== position) continue;
    if ((stats[award.stat] ?? 0) < award.threshold) continue; // no draw when gate unmet
    if (rng.next() < award.prob) effects.push({ kind: "award", id: award.id });
  }
  return effects;
}
```

- [ ] **Step 4: Run tests and types to verify green**

Run: `npx vitest run src/engine/postseason.test.ts`
Expected: PASS (all postseason unit tests).
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/postseason.ts src/engine/postseason.test.ts
git commit -m "feat(engine): individual award resolution (prestige + production)

Overall-band base x position multiplier x team-success boost for prestige
awards; per-position stat thresholds for production awards. Kicker's 0.05
multiplier enforces the hard-mode draft ceiling by construction.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Compose the resolver + hook into the season loop

Compose the three pure functions into `runPostseasonResolver`, which writes the record to the current season line and applies trophy/award effects, then hook it into `autoProgress` at the end of the postseason phase.

**Files:**
- Modify: `src/engine/postseason.ts`
- Modify: `src/engine/advance.ts`
- Test: `src/engine/postseason.test.ts`
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: `GameState` (`./types`); `Rng`; `ContentBundle` (`../content/schema`); `applyEffect`, `InjuryLookup` (`./effects`); `simulateTeamRecord`, `resolveTrophies`, `resolveAwards`.
- Produces: `export function runPostseasonResolver(state: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void`. Reads the current-season line (`state.seasons[state.seasons.length - 1]`); if none matches `state.seasonIndex`, returns without effect. Otherwise: rolls the record and writes `season.teamWins`/`season.teamLosses`; resolves trophies (record+tier), then awards (position, overall, season.stats, `wonAnyTrophy` = trophy list non-empty); applies every resulting effect via `applyEffect`. Order of rng draws: record → trophies → awards.
- `advance.ts`: `autoProgress` calls `runPostseasonResolver(s, content, rng, injuryOf)` exactly once, immediately before `advancePhase(s)`, guarded by `s.phase === "postseason"`.

- [ ] **Step 1: Write the failing composition test**

Add to `src/engine/postseason.test.ts`:

```ts
import { runPostseasonResolver } from "./postseason";
import { createCareer } from "./create-career";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const injuryOf = (t: string) => CONTENT.injuries[t] ?? { overallDelta: 3, recoveryPhases: 1 };
const setup: Setup = { lastName: "R", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("runPostseasonResolver", () => {
  it("writes a full team record to the current season line", () => {
    const s = createCareer(setup, "resolve");
    s.school = { schoolId: "smu", tier: 3 };
    s.seasons.push({ seasonIndex: 0, schoolId: "smu", snaps: 480, stats: { passYards: 1500 }, teamWins: 0, teamLosses: 0 });
    runPostseasonResolver(s, CONTENT, createRng("resolve"), injuryOf);
    const line = s.seasons[0]!;
    expect(line.teamWins + line.teamLosses).toBe(CONTENT.postseason.gamesPerSeason);
  });

  it("does nothing when there is no season line for the current index", () => {
    const s = createCareer(setup, "noline");
    const before = JSON.stringify(s);
    runPostseasonResolver(s, CONTENT, createRng("noline"), injuryOf);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("an elite career accumulates at least one trophy or award across seeds", () => {
    let honored = 0;
    for (let i = 0; i < 40; i++) {
      const s = createCareer(setup, `elite-${i}`);
      s.overall = 96;
      s.school = { schoolId: "bama", tier: 4 };
      s.seasons.push({ seasonIndex: 0, schoolId: "bama", snaps: 500, stats: { passYards: 2000 }, teamWins: 0, teamLosses: 0 });
      runPostseasonResolver(s, CONTENT, createRng(`elite-${i}`), injuryOf);
      if (Object.keys(s.trophies).length > 0 || s.awards.length > 0) honored++;
    }
    expect(honored).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/postseason.test.ts -t "runPostseasonResolver"`
Expected: FAIL — `runPostseasonResolver` not defined.

- [ ] **Step 3: Implement `runPostseasonResolver`**

Add to `src/engine/postseason.ts` (add imports: `GameState` from `./types`, `ContentBundle` from `../content/schema`, `applyEffect` + `InjuryLookup` from `./effects`):

```ts
export function runPostseasonResolver(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
  injuryOf: InjuryLookup,
): void {
  const season = state.seasons[state.seasons.length - 1];
  if (!season || season.seasonIndex !== state.seasonIndex) return;
  const cfg = content.postseason;
  const record = simulateTeamRecord(state.overall, state.school.tier, cfg, rng);
  season.teamWins = record.wins;
  season.teamLosses = record.losses;
  const trophyEffects = resolveTrophies(record.wins, state.school.tier, cfg, rng);
  const awardEffects = resolveAwards(state.setup.position, state.overall, season.stats, trophyEffects.length > 0, cfg, rng);
  for (const eff of [...trophyEffects, ...awardEffects]) applyEffect(state, eff, injuryOf);
}
```

- [ ] **Step 4: Run the composition test to verify green**

Run: `npx vitest run src/engine/postseason.test.ts`
Expected: PASS (all postseason tests).

- [ ] **Step 5: Write the failing integration test (season loop)**

Add to `src/engine/advance.test.ts` (inside the top-level `describe`):

```ts
it("populates a team record for every played season and can accrue honors", () => {
  // Play many careers; every completed season must have a full record, and
  // across the sample at least one career earns a trophy or award.
  let honored = 0;
  let checkedSeasons = 0;
  for (let i = 0; i < 30; i++) {
    const s = autoplay(`records-${i}`);
    for (const line of s.seasons) {
      expect(line.teamWins + line.teamLosses).toBe(12);
      checkedSeasons++;
    }
    if (Object.keys(s.trophies).length > 0 || s.awards.length > 0) honored++;
  }
  expect(checkedSeasons).toBeGreaterThan(0);
  expect(honored).toBeGreaterThan(0);
});
```

(`autoplay` already exists in this file and plays a career to a terminal state with a first-option policy. `12` is `POSTSEASON.gamesPerSeason`; if that constant changes, update this literal.)

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/engine/advance.test.ts -t "populates a team record"`
Expected: FAIL — season lines have `teamWins + teamLosses === 0` (resolver not yet hooked in).

- [ ] **Step 7: Hook the resolver into `autoProgress`**

In `src/engine/advance.ts`, import the resolver:

```ts
import { runPostseasonResolver } from "./postseason";
```

In `autoProgress`, replace the "Phase fully handled" transition:

```ts
    // Phase fully handled (no event, or the event was just resolved): move on.
    advancePhase(s);
```

with a resolver call guarded to the postseason phase, BEFORE advancing:

```ts
    // Phase fully handled (no event, or the event was just resolved).
    // Resolve postseason honors for the season just completed, then move on.
    if (s.phase === "postseason") runPostseasonResolver(s, content, rng, injuryOf);
    advancePhase(s);
```

- [ ] **Step 8: Run the full suite and types**

Run: `npm test`
Expected: all green, including the new integration test. If the balance-harness distribution tests (`src/sim/balance.test.ts`) fail because the added postseason RNG draws shifted a distribution past a loose bound, inspect the failure: confirm it is a distribution-range drift (not a logic error) and widen the specific bound in `balance.test.ts` to reflect the new distribution, noting the change in the commit. Do NOT loosen a bound to hide a real regression — if career length or bust rate changed structurally, report it.
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/engine/postseason.ts src/engine/advance.ts src/engine/postseason.test.ts src/engine/advance.test.ts
git commit -m "feat(engine): wire postseason resolver into the season loop

runPostseasonResolver composes record -> trophies -> awards, writes the record
to the season line, and applies honor effects (which feed draftStock). Hooked
into autoProgress at the end of the postseason phase.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Development curve (offseason)

Apply a passive per-offseason `overall` bump gated by the just-completed season's snaps, so players develop by playing and "return for another year" becomes a real bet.

**Files:**
- Modify: `src/engine/advance.ts`
- Test: `src/engine/advance.test.ts`

**Interfaces:**
- Consumes: `GameState`; `ProgressionConfig` (`../content/schema`); `clampOverall` (`./effects`); `ContentBundle`.
- Produces: `export function developmentDelta(seasonSnaps: number, cfg: ProgressionConfig): number` (in `advance.ts` or a small helper) — returns `Math.min(cfg.devCap, Math.floor(seasonSnaps / cfg.snapsPerDevPoint))`. `runOffseasonHub` applies it to `s.overall` (via `clampOverall`) using the last-completed season line's snaps, once per offseason transition, before the eligibility/declare logic reads state.

- [ ] **Step 1: Write the failing test**

Add to `src/engine/advance.test.ts`:

```ts
import { developmentDelta } from "./advance";

describe("development curve", () => {
  it("developmentDelta scales with snaps and caps out", () => {
    const cfg = { snapsPerDevPoint: 180, devCap: 3 };
    expect(developmentDelta(0, cfg)).toBe(0);
    expect(developmentDelta(200, cfg)).toBe(1);
    expect(developmentDelta(400, cfg)).toBe(2);
    expect(developmentDelta(2000, cfg)).toBe(3); // capped
  });

  it("a returning player's overall rises across seasons from playing", () => {
    // Always-return policy plays multiple full seasons; overall should end above
    // the starting baseline (60) purely from development (no gamble events needed).
    const s = autoplayAlwaysReturn("develops");
    expect(s.overall).toBeGreaterThan(60);
  });
});
```

(`autoplayAlwaysReturn` already exists in this file; it returns to school every declare decision and plays all four years.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/advance.test.ts -t "development"`
Expected: FAIL — `developmentDelta` not exported; and the returning player's overall stays at 60 (no development applied).

- [ ] **Step 3: Implement `developmentDelta` and apply it in the hub**

In `src/engine/advance.ts`, add the import for the progression type is not needed (config comes via `content`), but add `clampOverall` to the effects import:

```ts
import { applyEffect, tickPhaseStart, clampOverall, type InjuryLookup } from "./effects";
```

Add the helper (top-level export, near the other functions):

```ts
export function developmentDelta(seasonSnaps: number, cfg: { snapsPerDevPoint: number; devCap: number }): number {
  return Math.min(cfg.devCap, Math.floor(seasonSnaps / cfg.snapsPerDevPoint));
}
```

`runOffseasonHub` needs the content config; thread it through. Change its signature and call site:

```ts
function runOffseasonHub(s: GameState, content: ContentBundle): void {
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
    s.status = "declared";
    return;
  }
  if (s.eligibility.draftEligible) s.currentEventId = DECLARE_EVENT_ID;
}
```

Update the call in `autoProgress`:

```ts
    if (s.phase === "offseason") {
      runOffseasonHub(s, content);
      if (s.currentEventId !== null || s.status !== "active") return;
    }
```

- [ ] **Step 4: Run tests and types to verify green**

Run: `npx vitest run src/engine/advance.test.ts`
Expected: PASS (development tests + all existing advance tests — the always-return player now ends above overall 60).
Run: `npm test`
Expected: all green. If a balance distribution shifts (development raises average overall → draft stock → fewer busts / higher picks), apply the same disciplined widen-with-note approach from Task 5 Step 8.
Run: `npm run typecheck`
Expected: both passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine/advance.ts src/engine/advance.test.ts
git commit -m "feat(engine): passive development curve gated by playing time

Players gain overall each offseason based on last season's snaps (capped),
so development comes from playing and 'return for another year' is a real bet.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Decision 1 + Decision 4a):**
- Postseason resolver: team record sim (Task 2), team trophies (Task 3), individual awards via the soccer-borrowed overall-band × position-multiplier × team-success-boost + stat-threshold formula (Task 4), composed and hooked into the loop feeding draft stock (Task 5). ✓
- Award/trophy/threshold data tables in content, engine stays generic (Task 1). ✓
- Position multipliers baking in Kicker hard-mode / OL-leans-on-overall (Task 1 data + Task 4 logic + the kicker test). ✓
- Awards/trophies keep feeding `deriveDraftStock` (unchanged; resolver emits effects that increment trophies/awards — verified via the existing draft tests + Task 5 reachability). ✓
- Development curve gated by playing time, no decline (Task 6). ✓
- Deliberately deferred to later stages (noted, not gaps): fire fixed milestone events (4b) → moved to the start of Stage 3 (its only consumers are authored milestones; keeps this stage's `autoProgress` change minimal); transfer/redshirt/soft-washout/school-sampler → Stage 2b; balance re-tuning of all initial config values → Stage 4.

**Placeholder scan:** No TBD/TODO. Every code step has complete code; every run step has the exact command + expected result. Config values are concrete (and explicitly labelled balance-tunable per the Global Constraints, which is a project rule, not a placeholder). ✓

**Type consistency:** `PostseasonConfig`/`ProgressionConfig`/`AwardBand` defined in Task 1 (`schema.ts`) are imported and used identically in Tasks 2–6. `simulateTeamRecord`/`resolveTrophies`/`resolveAwards`/`bandProb`/`runPostseasonResolver`/`developmentDelta` signatures match between their defining task's Interfaces block, their implementation, and their call sites (Task 5 composition, Task 6 hub). `Effect` shape `{ kind: "trophy"|"award", id }` matches `src/engine/types.ts`. `runOffseasonHub` gains a `content` param in Task 6 and its sole caller is updated in the same task. ✓

**RNG-shift risk (called out in Global Constraints + Task 5/6 steps):** the resolver and development add draws inside the season loop; determinism holds (same seed → same result), but balance distributions may drift. Tasks 5 and 6 include the disciplined "confirm it's drift, not regression, then widen the specific bound with a note" instruction. ✓
