# Stage 3d Plan B — The Spiral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `busted` terminal naturally reachable by authoring a graded character spiral, and satisfy Stage 3d's blocking exit criterion `bustedRate > 0`.

**Architecture:** Sequential, single author. Instrument the balance harness first so the tuned quantity is visible, then author band 1 (ungated temptations) and band 2 (a `maxCharacter: 55` slipping band with a redemption path) into a new `offfield.ts` slice, add the long injury that makes `bust-mri` live, then tune against the finished pool.

**Tech Stack:** TypeScript, Vitest, tsx.

**Spec:** `docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md`

**Runs after Plan A**, so tuning happens against the final pool composition.

## Global Constraints

- **Determinism is sacrosanct.** No `Math.random`, `Date.now`, or IO in `src/content/**` or `src/engine/**`. `src/sim/**` is outside that boundary.
- **`npm run typecheck` runs two passes.** Both must exit 0.
- **Node is v22.0.0 (< 22.6)** — CLI scripts run via `tsx`.
- **Tone:** light, "silly + real-seeming." **No mean-spirited or offensive content. No real player names.**
- **Do not touch `bust.ts`.** Band 3 is closed content in this stage; its weights and probabilities are Stage 4's.
- **Do not touch `postseason.ts`, `devCap`, or `snapsPerDevPoint`.** Those are Stage 4 levers and would confound this plan's measurements.
- **The blocking exit criterion:** `npm run balance -- 500 random` must report `bustedRate > 0`.

## Mechanical traps specific to this plan

- **`recoveryPhases: 1` injuries and `phases: 1` suspensions are inert.** Production for a phase runs before that phase's events fire (`advance.ts:253`) and the injury clears at the next boundary.
- **Offseason `snaps` effects are mostly inert and semantically backwards.** `applyEffect` writes to `seasons[seasons.length - 1]`, and during an offseason that is the *previous, completed* season. `enterOffseason` has already consumed it for development and already run the washout check. The only thing still reading it is `productionScore` in `draft.ts:5` (total snaps across seasons, capped at 15 stock). **Use `overall` — not `snaps` — as the field cost on offseason events.**
- **Postseason events fire before the resolver** (`advance.ts:277`), so a postseason injury sidelines the player for that season's production.
- Only one `random` event fires per phase.

---

### Task 1: Instrument the balance harness

`BalanceReport` reports nothing about character — the exact quantity this plan tunes. `bustedRate` is a lagging, near-binary signal that stays 0 right up until the spiral connects, giving the tuner no gradient. Fix that first.

**Files:**
- Modify: `src/sim/balance.ts`
- Modify: `src/sim/balance.test.ts`

**Interfaces:**
- Produces: `BalanceReport` extended with `avgFinalCharacter`, `minFinalCharacter`, `characterP05`, `characterP25`, `charUnder55Rate`, `charUnder35Rate`, `avgFinalOverall`, `minFinalOverall` — all `number`. `runBalance(runs: number, seedPrefix: string, policy: Policy): BalanceReport` keeps its signature.

- [ ] **Step 1: Write the failing test**

Append to `src/sim/balance.test.ts`:

```ts
  it("reports the character distribution the spiral is tuned against", () => {
    const r = runBalance(200, "charA", randomPolicy);

    // Ordered percentiles.
    expect(r.minFinalCharacter).toBeLessThanOrEqual(r.characterP05);
    expect(r.characterP05).toBeLessThanOrEqual(r.characterP25);

    // Character and overall are clamped to their engine ranges.
    for (const v of [r.minFinalCharacter, r.characterP05, r.characterP25, r.avgFinalCharacter]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    for (const v of [r.minFinalOverall, r.avgFinalOverall]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(99);
    }
    expect(r.minFinalOverall).toBeLessThanOrEqual(r.avgFinalOverall);

    // Band-entry rates are probabilities, and the deeper band is a subset.
    for (const v of [r.charUnder55Rate, r.charUnder35Rate]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(r.charUnder35Rate).toBeLessThanOrEqual(r.charUnder55Rate);
  });
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npx vitest run src/sim/balance.test.ts -t "character distribution"`
Expected: FAIL — the properties are `undefined`, so the comparisons fail (and TypeScript will flag them).

- [ ] **Step 3: Implement**

In `src/sim/balance.ts`, extend the interface:

```ts
export interface BalanceReport {
  runs: number;
  draftedRate: number;
  bustedRate: number;
  undraftedRate: number;
  round1Rate: number;
  avgSeasons: number;
  // Stage 3d: the spiral is tuned on character, so the report has to show it.
  // bustedRate alone is a lagging, near-binary signal with no gradient.
  avgFinalCharacter: number;
  minFinalCharacter: number;
  characterP05: number;
  characterP25: number;
  charUnder55Rate: number; // band-2 entry rate
  charUnder35Rate: number; // band-3 entry rate
  avgFinalOverall: number;
  minFinalOverall: number;
}
```

Add the helper and collection. Replace the body of `runBalance`:

```ts
function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
}

export function runBalance(runs: number, seedPrefix: string, policy: Policy): BalanceReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };
  let drafted = 0, busted = 0, undrafted = 0, round1 = 0, seasons = 0;
  const characters: number[] = [];
  const overalls: number[] = [];
  for (let i = 0; i < runs; i++) {
    const s = playCareer(setup, `${seedPrefix}-${i}`, policy);
    seasons += s.seasons.length;
    characters.push(s.character);
    overalls.push(s.overall);
    if (s.status === "busted") busted++;
    if (s.status === "drafted") {
      drafted++;
      if (s.draftResult?.undrafted) undrafted++;
      else if (s.draftResult?.round === 1) round1++;
    }
  }
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const sortedChars = [...characters].sort((a, b) => a - b);
  return {
    runs,
    draftedRate: drafted / runs,
    bustedRate: busted / runs,
    undraftedRate: undrafted / runs,
    round1Rate: round1 / runs,
    avgSeasons: seasons / runs,
    avgFinalCharacter: sum(characters) / runs,
    minFinalCharacter: Math.min(...characters),
    characterP05: percentile(sortedChars, 0.05),
    characterP25: percentile(sortedChars, 0.25),
    charUnder55Rate: characters.filter((c) => c <= 55).length / runs,
    charUnder35Rate: characters.filter((c) => c <= 35).length / runs,
    avgFinalOverall: sum(overalls) / runs,
    minFinalOverall: Math.min(...overalls),
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/sim/balance.test.ts`
Expected: PASS, including the existing reproducibility test (the new fields are deterministic functions of the same careers).

- [ ] **Step 5: Take the pre-spiral reading**

Run: `npm run balance -- 500 random`

Record every field. Expect `charUnder55Rate` around 0.03 and `charUnder35Rate` exactly 0 — that is the gap this plan closes.

- [ ] **Step 6: Commit**

```bash
git add src/sim/balance.ts src/sim/balance.test.ts
git commit -m "feat(sim): report character distribution in BalanceReport

The Stage 3d spiral is tuned on character, but bustedRate is a lagging
near-binary signal with no gradient. Adds the band-entry rates and
percentiles so tuning can see where the chain breaks."
```

---

### Task 2: The `offfield.ts` slice and band 1

Creates the new slice, moves the two existing off-field events into it, wires the barrel, and authors band 1.

**Files:**
- Create: `src/content/events/offfield.ts`
- Create: `src/content/events/offfield.test.ts`
- Modify: `src/content/events/universal.ts` (remove `catfished` and `speeding-georgia`)
- Modify: `src/content/events/index.ts` (add the slice to the barrel)
- Modify: `src/content/events/index.test.ts` (add the slice to `SLICES`)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `export const OFFFIELD_EVENTS: GameEvent[]`, spread into `EVENTS` in the barrel.

**Band 1 requirements:**
- **8 new events** plus the 2 moved, for 10 members.
- Phase distribution of the 8 new: **2 offseason, 3 nonconf, 1 conference, 2 postseason** (both moved events are conference-phase, so this keeps the band even).
- **No `conditions.maxCharacter` or `maxOverall`** — band 1 is ungated so it applies pressure to everyone.
- **Weight 3.**
- **No `ending` effects.**
- **Two options each**, so the balance harness's uniform `randomPolicy` takes the corrosive one ~50% of the time.
- **The corrosive option must carry a character cost of ≤ −4 on *both* branches.** That is the "chosen cost" property: you pay for taking the shortcut, not merely for failing at it.
- **The other option must carry no character cost at all** — a genuinely clean path.
- **The corrosive option must pay something real** on its positive branch: `overall`, `snaps`, or a `stat`. Alternatively the clean option may carry a real cost, so the trade is live either way. It must never be strictly dominated.

- [ ] **Step 1: Write the failing test**

Create `src/content/events/offfield.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { OFFFIELD_EVENTS } from "./offfield";
import type { Effect, GameEvent, Outcome } from "../../engine/types";

function outcomes(ev: GameEvent): Outcome[] {
  return ev.options.flatMap((o) =>
    [o.positiveOutcome, o.negativeOutcome].filter((oc): oc is Outcome => oc !== undefined),
  );
}
function allEffects(ev: GameEvent): Effect[] {
  return outcomes(ev).flatMap((oc) => oc.effects);
}
function characterSum(oc: Outcome): number {
  return oc.effects.reduce((a, e) => (e.kind === "character" ? a + e.amount : a), 0);
}
function paysSomething(oc: Outcome): boolean {
  return oc.effects.some((e) => e.kind === "overall" || e.kind === "snaps" || e.kind === "stat");
}

const band1 = OFFFIELD_EVENTS.filter((e) => e.conditions?.maxCharacter === undefined);

describe("off-field band 1 — ungated temptations", () => {
  it("authors ten members", () => {
    expect(band1.length).toBeGreaterThanOrEqual(10);
  });

  // catfished and speeding-georgia predate Stage 3d. They are luck-shaped
  // rather than choice-shaped and carry weight 2, so the conventions authored
  // in this stage exempt them. Converting them is a listed tuning lever
  // (spec section 8.1, lever 5).
  const INHERITED = new Set(["catfished", "speeding-georgia"]);

  it("is ungated, random, and weight 3", () => {
    for (const ev of band1) {
      expect(ev.kind, ev.id).toBe("random");
      expect(ev.conditions?.maxCharacter, `${ev.id} must be ungated on character`).toBeUndefined();
      expect(ev.conditions?.maxOverall, `${ev.id} must be ungated on overall`).toBeUndefined();
      expect(ev.conditions?.position, `${ev.id} must apply to every position`).toBeUndefined();
      if (!INHERITED.has(ev.id)) {
        expect(ev.weight, `${ev.id} must be weight 3`).toBe(3);
        expect(ev.options.length, `${ev.id} must offer exactly two options`).toBe(2);
      }
    }
  });

  it("emits no endings", () => {
    for (const ev of band1) {
      expect(allEffects(ev).filter((e) => e.kind === "ending").length, `${ev.id} emits an ending`).toBe(0);
    }
  });

  it("charges character on the branch you take, not only on failure", () => {
    for (const ev of band1) {
      if (INHERITED.has(ev.id)) continue;
      const chosenCost = ev.options.some((o) => {
        const pos = characterSum(o.positiveOutcome);
        const neg = o.negativeOutcome ? characterSum(o.negativeOutcome) : pos;
        return pos <= -4 && neg <= -4;
      });
      expect(chosenCost, `${ev.id} has no option charging <= -4 character on both branches`).toBe(true);
    }
  });

  it("always offers a clean path", () => {
    for (const ev of band1) {
      const clean = ev.options.some((o) =>
        [o.positiveOutcome, o.negativeOutcome]
          .filter((oc): oc is Outcome => oc !== undefined)
          .every((oc) => characterSum(oc) >= 0),
      );
      expect(clean, `${ev.id} offers no option free of character cost`).toBe(true);
    }
  });

  it("never leaves the corrosive option strictly dominated", () => {
    for (const ev of band1) {
      if (INHERITED.has(ev.id)) continue;
      const corrosive = ev.options.find((o) => characterSum(o.positiveOutcome) <= -4);
      expect(corrosive, `${ev.id} has no corrosive option`).toBeDefined();
      const clean = ev.options.find((o) => o.id !== corrosive!.id);
      const tradeExists = paysSomething(corrosive!.positiveOutcome) || paysSomething(clean!.positiveOutcome);
      expect(tradeExists, `${ev.id} offers no real trade — the corrosive option pays nothing and the clean one costs nothing`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npx vitest run src/content/events/offfield.test.ts`
Expected: FAIL — `./offfield` does not exist yet.

- [ ] **Step 3: Create the slice with the two moved events plus band 1**

Create `src/content/events/offfield.ts`. Move `catfished` and `speeding-georgia` verbatim out of `universal.ts` into this array (delete them from `universal.ts`, leaving `gym-grind`), then author the eight new ones.

This is the shape to follow — the corrosive option pays real overall, and charges character on **both** branches:

```ts
import type { GameEvent } from "../../engine/types";

// The off-field pressure ladder. Band 1 (this file's ungated events) applies
// character pressure to every career; band 2 gates at maxCharacter 55 and only
// finds players who have already slipped; band 3 is bust.ts. See
// docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md.
//
// Band 1 convention: the corrosive option charges character on the branch you
// take, not merely on the branch where you fail. The descent is a chosen cost.
export const OFFFIELD_EVENTS: GameEvent[] = [
  {
    id: "offfield-sportsbook-nil",
    kind: "random",
    phase: "nonconf",
    weight: 3,
    title: "The NIL Deal Nobody Read",
    description: "Forty thousand dollars to post twice a month. The company turns out to be a sportsbook, and you are an amateur athlete.",
    options: [
      {
        id: "take-the-money",
        label: "Take the money and post",
        probability: 0.7,
        positiveOutcome: {
          description: "Compliance never calls. You quit the summer job and train full time instead.",
          effects: [
            { kind: "character", amount: -5 },
            { kind: "overall", timing: "permanent", amount: 2 },
            { kind: "moment", item: "Cashed an NIL check he probably should not have", icon: "money" },
          ],
        },
        negativeOutcome: {
          description: "Compliance calls. The posts come down, the money goes back, and the meeting is ninety minutes long.",
          effects: [
            { kind: "character", amount: -7 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
      },
      {
        id: "have-it-read",
        label: "Have someone read it first",
        probability: 1,
        positiveOutcome: {
          description: "Your compliance officer finds the sportsbook clause in about nine seconds. You pass on it.",
          effects: [],
        },
      },
    ],
  },
  // ... the remaining seven, plus the two moved events
];
```

Author these eight:

| Phase | id | Concept |
|---|---|---|
| offseason | `offfield-group-chat` | **The Group Chat** — a recruiting group chat where you talk about your own coordinator. Someone screenshots it. |
| offseason | `offfield-money-manager` | **Family Business** — your cousin wants to manage your NIL money. He is very confident. |
| nonconf | `offfield-sportsbook-nil` | **The NIL Deal Nobody Read** (worked example above). |
| nonconf | `offfield-skip-install` | **Skip the Install** — a podcast wants you at the same hour as the install meeting. |
| nonconf | `offfield-training-table` | **Cutting the Line** — you skip the training-table queue in front of the walk-ons. Someone films it. |
| conference | `offfield-ticket-hookup` | **The Ticket Hookup** — selling your comp allotment, which is very much against the rules. |
| postseason | `offfield-bowl-curfew` | **Bowl Trip Curfew** — the team curfew, versus the city you flew to. |
| postseason | `offfield-ghost-media` | **Ghosting the Media** — required press availability that you simply do not attend. |

- [ ] **Step 4: Wire the barrel**

In `src/content/events/index.ts`, add `import { OFFFIELD_EVENTS } from "./offfield";` and spread `...OFFFIELD_EVENTS,` into `EVENTS`.

In `src/content/events/index.test.ts`, add the same import and add `OFFFIELD_EVENTS` to the `SLICES` object.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/content/ && npm run typecheck`
Expected: `offfield.test.ts` PASS, `index.test.ts` PASS (this is what proves the slice is actually wired), typecheck both passes exit 0.

- [ ] **Step 6: Measure the band-1 effect**

Run: `npm run balance -- 500 random`

Record it. Expect `avgFinalCharacter` to drop from ~65 toward the high 50s and `charUnder55Rate` to rise well above 0.03. `charUnder35Rate` may still be 0 — band 2 does that work.

- [ ] **Step 7: Commit**

```bash
git add src/content/events/offfield.ts src/content/events/offfield.test.ts \
        src/content/events/universal.ts src/content/events/index.ts src/content/events/index.test.ts
git commit -m "content(offfield): band 1 — ungated temptations

New slice owning the character pressure ladder. Moves catfished and
speeding-georgia out of universal.ts. Band 1 charges character on the
branch you take rather than only on failure, so the descent is a chosen
cost rather than bad luck."
```

---

### Task 3: Band 2 — the slipping band

**Files:**
- Modify: `src/content/events/offfield.ts`
- Modify: `src/content/events/offfield.test.ts`

**Interfaces:**
- Consumes: `OFFFIELD_EVENTS` from Task 2.
- Produces: 5 additional events in the same array, each with `conditions: { maxCharacter: 55 }`.

**Band 2 requirements:**
- **5 events**, phases: **2 offseason, 1 nonconf, 1 conference, 1 postseason**.
- **`conditions: { maxCharacter: 55 }`** on every one.
- **Weight 4** — higher than band 1's 3, so once a player is slipping the pool tilts against them.
- **No `ending` effects.** Band 2 is pressure, not death.
- **Exactly three options**, in this order: *dig in deeper* (character ≤ −6, small mechanical payoff) / *ride it out* (small character cost, no payoff) / *redemption*.
- **The redemption option grants ≥ +6 character on its positive branch and charges a real field cost on that same branch** — `overall` or `snaps`. **On offseason events the field cost must be `overall`, never `snaps`** (see this plan's trap list: offseason `snaps` writes to the previous, already-consumed season).
- Three options rather than two deliberately drops random-policy redemption uptake from ~50% to ~33%.

- [ ] **Step 1: Write the failing test**

Append to `src/content/events/offfield.test.ts`:

```ts
const band2 = OFFFIELD_EVENTS.filter((e) => e.conditions?.maxCharacter !== undefined);

describe("off-field band 2 — the slipping band", () => {
  it("authors five events, all gated at maxCharacter 55 with weight 4", () => {
    expect(band2.length).toBe(5);
    for (const ev of band2) {
      expect(ev.conditions!.maxCharacter, `${ev.id} must gate at exactly 55`).toBe(55);
      expect(ev.weight, `${ev.id} must outweigh band 1`).toBe(4);
      expect(ev.kind, ev.id).toBe("random");
    }
  });

  it("covers the phases the spiral needs", () => {
    const byPhase = (p: string) => band2.filter((e) => e.phase === p).length;
    expect(byPhase("offseason")).toBe(2);
    expect(byPhase("nonconf")).toBe(1);
    expect(byPhase("conference")).toBe(1);
    expect(byPhase("postseason")).toBe(1);
  });

  it("emits no endings — band 2 is pressure, not death", () => {
    for (const ev of band2) {
      expect(allEffects(ev).filter((e) => e.kind === "ending").length, `${ev.id} emits an ending`).toBe(0);
    }
  });

  it("offers three options so redemption is not a coin flip under random play", () => {
    for (const ev of band2) {
      expect(ev.options.length, `${ev.id} must offer exactly three options`).toBe(3);
    }
  });

  it("always offers a redemption path that is paid for on the field", () => {
    for (const ev of band2) {
      const redemption = ev.options.find((o) => characterSum(o.positiveOutcome) >= 6);
      expect(redemption, `${ev.id} offers no option granting >= +6 character`).toBeDefined();

      const fieldCost = redemption!.positiveOutcome.effects.some(
        (e) => (e.kind === "overall" && e.amount < 0) || (e.kind === "snaps" && e.amount < 0),
      );
      expect(fieldCost, `${ev.id}'s redemption is a free undo — it must cost overall or snaps`).toBe(true);

      // Offseason snaps effects write to the previous, already-consumed season
      // (see plan trap list), so the field cost there has to be overall.
      if (ev.phase === "offseason") {
        const usesSnaps = redemption!.positiveOutcome.effects.some((e) => e.kind === "snaps");
        expect(usesSnaps, `${ev.id} is an offseason event and must not pay its cost in snaps`).toBe(false);
      }
    }
  });

  it("always offers a path that digs the hole deeper", () => {
    for (const ev of band2) {
      const deeper = ev.options.some((o) => characterSum(o.positiveOutcome) <= -6);
      expect(deeper, `${ev.id} offers no option costing <= -6 character`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

Run: `npx vitest run src/content/events/offfield.test.ts -t "band 2"`
Expected: FAIL — `band2.length` is 0.

- [ ] **Step 3: Author band 2**

Append to `OFFFIELD_EVENTS`. This is the shape — note the redemption pays in `overall` because it is an offseason event:

```ts
  {
    id: "offfield-entourage",
    kind: "random",
    phase: "offseason",
    weight: 4,
    conditions: { maxCharacter: 55 },
    title: "The Entourage",
    description: "Six people you did not know last spring now have strong opinions about your playing time.",
    options: [
      {
        id: "lean-in",
        label: "They are the only ones who get it",
        probability: 0.6,
        positiveOutcome: {
          description: "You stop taking calls from anyone who tells you something you did not want to hear.",
          effects: [
            { kind: "character", amount: -8 },
            { kind: "overall", timing: "permanent", amount: 1 },
          ],
        },
        negativeOutcome: {
          description: "One of them gets into it with a strength coach in the parking lot, wearing your jersey.",
          effects: [{ kind: "character", amount: -10 }],
        },
      },
      {
        id: "ride-it-out",
        label: "Say nothing and hope it settles",
        probability: 1,
        positiveOutcome: {
          description: "It does not settle, exactly. It just gets quieter for a while.",
          effects: [{ kind: "character", amount: -3 }],
        },
      },
      {
        id: "clear-the-room",
        label: "Change your number and go home for a month",
        probability: 0.75,
        positiveOutcome: {
          description: "Your mother feeds you and nobody asks you for anything. You come back lighter and further behind.",
          effects: [
            { kind: "character", amount: 8 },
            { kind: "overall", timing: "permanent", amount: -3 },
          ],
        },
        negativeOutcome: {
          description: "You go home, and half of them are there when you arrive.",
          effects: [
            { kind: "character", amount: 3 },
            { kind: "overall", timing: "permanent", amount: -3 },
          ],
        },
      },
    ],
  },
```

Author these five:

| Phase | id | Concept |
|---|---|---|
| offseason | `offfield-entourage` | **The Entourage** (worked example above). |
| offseason | `offfield-portal-rumor` | **The Portal Rumor** — you let your name leak into the portal to leverage playing time. |
| nonconf | `offfield-coordinator-blowup` | **On the Sideline, On Camera** — a shouting match with your coordinator, in HD. |
| conference | `offfield-curfew-check` | **Bed Check** — game-week curfew, and your room is empty at 1 a.m. |
| postseason | `offfield-exit-interview` | **The Exit Interview** — the staff tells you exactly where you stand, and it is not where you thought. |

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/content/ && npm run typecheck`
Expected: PASS, both typecheck passes exit 0.

- [ ] **Step 5: Measure**

Run: `npm run balance -- 500 random`

Record it. `charUnder35Rate` should now be above 0. `bustedRate` may or may not be — Task 5 closes that.

- [ ] **Step 6: Commit**

```bash
git add src/content/events/offfield.ts src/content/events/offfield.test.ts
git commit -m "content(offfield): band 2 — the slipping band

Gated at maxCharacter 55 with weight 4, so the pool tilts against a
player who has already slipped. Each event carries a redemption path
paid for on the field, which keeps the spiral from being a one-way trap
and puts the game's first positive character grants outside bust.ts."
```

---

### Task 4: The long injury

Makes `bust-mri` live for the first time. It has fired 0 times across 2,000 measured careers, because its gate is `requiresActiveInjury` at `phase: "offseason"` and no injury has ever survived to an offseason.

**Files:**
- Modify: `src/content/events/universal.ts`
- Create: `src/engine/long-injury.test.ts`

**Interfaces:**
- Consumes: `INJURIES` (`mcl` is `{ overallDelta: 8, recoveryPhases: 3 }`), `applyEffect` and `tickPhaseStart` from `../engine/effects`, `eventMatches` from `../engine/select-event`.
- Produces: a conference-phase event in `UNIVERSAL_EVENTS` whose negative branch emits `{ kind: "injury", injuryType: "mcl" }`.

**Why conference and why `mcl`:** `tickPhaseStart` decrements once per phase entry and drops the injury at 0. From a conference event there are two entries before the offseason's event draw (postseason, then offseason), so `recoveryPhases` must be ≥ 3. `mcl` at exactly 3 arrives with one phase left. It must live in `universal.ts` rather than a position slice because the balance harness only ever runs QB.

- [ ] **Step 1: Write the failing test**

Create `src/engine/long-injury.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { applyEffect, tickPhaseStart } from "./effects";
import { eventMatches } from "./select-event";
import { CONTENT } from "../content/index";
import { INJURIES } from "../content/injuries";
import type { Effect, GameState, Outcome, Setup } from "./types";

const setup: Setup = { lastName: "Doe", jerseyNumber: 3, homeState: "TX", position: "QB" };
const injuryOf = (t: string) => CONTENT.injuries[t] ?? { overallDelta: 3, recoveryPhases: 1 };

describe("long injuries reach the offseason", () => {
  it("some content event inflicts an injury lasting at least three phases", () => {
    const long = CONTENT.events.filter((ev) =>
      ev.options
        .flatMap((o) => [o.positiveOutcome, o.negativeOutcome].filter((oc): oc is Outcome => oc !== undefined))
        .flatMap((oc: Outcome) => oc.effects)
        .some((e: Effect) => e.kind === "injury" && (INJURIES[e.injuryType]?.recoveryPhases ?? 0) >= 3),
    );
    expect(long.length, "no event inflicts an injury with recoveryPhases >= 3, so bust-mri stays dead").toBeGreaterThan(0);
  });

  it("a conference-phase mcl survives into the offseason and makes bust-mri match", () => {
    const s: GameState = { ...createCareer(setup, "mri-reach"), phase: "conference" };
    applyEffect(s, { kind: "injury", injuryType: "mcl" }, injuryOf);
    expect(s.injuries[0]!.remainingPhases).toBe(3);

    // Two phase entries between the conference event and the offseason draw.
    s.phase = "postseason";
    tickPhaseStart(s, injuryOf);
    s.phase = "offseason";
    tickPhaseStart(s, injuryOf);

    expect(s.injuries.some((i) => i.kind === "injury"), "the mcl expired before the offseason").toBe(true);

    const mri = CONTENT.events.find((e) => e.id === "bust-mri")!;
    expect(eventMatches(s, mri), "bust-mri does not match a player carrying a live injury in the offseason").toBe(true);
  });

  it("confirms a two-phase injury would NOT have been enough", () => {
    // Guards the reasoning above: this is why the required injury is mcl and
    // not ankle or shoulder.
    const s: GameState = { ...createCareer(setup, "mri-reach"), phase: "conference" };
    applyEffect(s, { kind: "injury", injuryType: "ankle" }, injuryOf); // recoveryPhases 2
    s.phase = "postseason";
    tickPhaseStart(s, injuryOf);
    s.phase = "offseason";
    tickPhaseStart(s, injuryOf);
    expect(s.injuries.some((i) => i.kind === "injury")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and verify the first test fails**

Run: `npx vitest run src/engine/long-injury.test.ts`
Expected: the first test FAILS (no event emits a ≥3-phase injury). The second and third should already PASS — they test engine mechanics, not content, and confirm the reasoning before you rely on it.

- [ ] **Step 3: Author the event**

Append to `UNIVERSAL_EVENTS` in `src/content/events/universal.ts`:

```ts
  {
    id: "the-knee",
    kind: "random",
    phase: "conference",
    weight: 2,
    conditions: { requiresPlaying: true },
    title: "Somebody Rolls Up On You",
    description: "Nobody hits you. A teammate just falls the wrong way across the back of your leg, and the whole sideline hears it.",
    options: [
      {
        id: "walk-it-off",
        label: "Get up and finish the drive",
        probability: 0.55,
        positiveOutcome: {
          description: "It holds. You finish the game and ice it for a week.",
          effects: [{ kind: "moment", item: "Finished the game on one good leg", icon: "medical" }],
        },
        negativeOutcome: {
          description: "It does not hold. The trainer meets you at the numbers and you do not put weight on it again until January.",
          effects: [{ kind: "injury", injuryType: "mcl" }],
        },
      },
      {
        id: "cart",
        label: "Wave for the trainer",
        probability: 0.6,
        positiveOutcome: {
          description: "Sprain, not a tear. They shut you down early and you keep the rest of the season.",
          effects: [{ kind: "injury", injuryType: "ankle" }],
        },
        negativeOutcome: {
          description: "The scan finds more than the sideline test did.",
          effects: [{ kind: "injury", injuryType: "mcl" }],
        },
      },
    ],
  },
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/engine/long-injury.test.ts && npm run typecheck`
Expected: all three PASS, both typecheck passes exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/content/events/universal.ts src/engine/long-injury.test.ts
git commit -m "content(universal): a conference-phase mcl that reaches the offseason

bust-mri gates on requiresActiveInjury at phase offseason and had fired
0 times in 2,000 careers, because tickPhaseStart clears every existing
injury before an offseason is reached. An mcl (recoveryPhases 3) taken
at conference arrives with one phase left. Satisfies 3c section 10
clause 3."
```

---

### Task 5: The exit criterion

The blocking gate. Everything before this was construction; this is the measurement Stage 3d is judged on.

**Files:**
- Modify: `src/sim/balance.test.ts`
- Modify: `src/content/events/offfield.ts` (tuning only, if the gate fails)

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: a passing `bustedRate > 0` regression test.

- [ ] **Step 1: Write the gate test**

Append to `src/sim/balance.test.ts`:

```ts
  it("the bust spiral is naturally enterable", () => {
    // Stage 3d's blocking exit criterion. The seed prefix matches the CLI
    // (`npm run balance -- 500 random`) so this test and that command agree.
    const r = runBalance(500, "balance", randomPolicy);
    expect(r.charUnder55Rate, "nobody reaches band 2").toBeGreaterThan(0);
    expect(r.charUnder35Rate, "nobody reaches band 3, so no bust event can gate in").toBeGreaterThan(0);
    expect(r.bustedRate, "Stage 3d exit criterion: the busted terminal must be naturally reachable").toBeGreaterThan(0);
  });
```

The three assertions are deliberately ordered so a failure tells you *where* the chain breaks rather than only that it broke.

- [ ] **Step 2: Run it**

Run: `npx vitest run src/sim/balance.test.ts -t "naturally enterable"`

If it passes, skip to Step 4.

- [ ] **Step 3: Tune, if it fails**

Read which assertion failed, then apply the matching lever from spec §8.1. **Change one thing, re-measure, repeat.** Do not change several at once.

| Failing assertion | Meaning | Lever, in order of preference |
|---|---|---|
| `charUnder55Rate` is 0 | Band 1 is too weak; nobody even reaches the slipping band. | Raise band-1 character costs from −5/−7 toward −7/−9. Then raise the band-2 gate from 55 toward 60. |
| `charUnder35Rate` is 0 | Players enter band 2 but stall there — likely redemption is too generous under uniform random choice. | Raise the band-2 gate to 60–65 (more entrants, more draws). Then add a fourth option to band-2 events, dropping redemption uptake from ~33% to 25%. Then raise the redemption's field cost. |
| `bustedRate` is 0 | Players reach band 3 but the bust events are not drawing or not killing. | Do **not** touch `bust.ts` — it is closed in this stage. Instead deepen band 2 so players sit further below 35 and match more than one bust gate (`bust-academics` 35, `bust-drug-test` 30, `bust-doghouse` 25, `bust-arrest` 20). |

**Do not** change `devCap`, `snapsPerDevPoint`, `postseason.ts`, or `bust.ts`. Those are Stage 4's and would confound the measurement.

If four tuning rounds do not move it, stop and report — that is a genuine design finding, and spec §8.1 lever 7 (the deferred `acl` emission) is the escalation, which needs a decision rather than a unilateral change.

- [ ] **Step 4: Run the full suite**

Run: `npm test && npm run typecheck`
Expected: everything green, both typecheck passes exit 0.

- [ ] **Step 5: Take the final measurement**

Run: `npm run balance -- 500 random`

Record every field. Also confirm `round1Rate` has not drifted outside `[0.066, 0.166]` — the spiral's character pressure feeds `deriveDraftStock` through `(character − 50) × 0.15`, so a large drop costs up to ~7.5 stock.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(balance): Stage 3d exit criterion — bustedRate > 0

The busted terminal is now naturally reachable, not merely structurally
reachable. Records the band-entry chain so a future regression says
which link broke."
```

---

### Task 6: Close out the stage

**Files:**
- Modify: `.superpowers/sdd/progress.md` (git-ignored, on-disk ledger)
- Create: `docs/superpowers/STAGE4-HANDOFF.md`
- Delete: `docs/superpowers/STAGE3D-HANDOFF.md`

- [ ] **Step 1: Verify the whole stage**

Run: `npm test && npm run typecheck && npm run play -- demo && npm run balance -- 500 random`
Expected: all green; `play` reaches a terminal state and prints JSON.

- [ ] **Step 2: Record in the durable ledger**

Append a Stage 3d entry to `.superpowers/sdd/progress.md`: what shipped, the final event count, and the final balance numbers.

- [ ] **Step 3: Write the Stage 4 handoff**

Create `docs/superpowers/STAGE4-HANDOFF.md` following the structure of the 3d handoff it replaces: current state and how to verify green, what 3d shipped, the full accumulated Stage-4 balance list (carry forward everything in spec §8.1 and §13, including the deferred `acl` emission and the eight inert stats), and key file pointers.

- [ ] **Step 4: Delete the superseded handoff**

```bash
git rm docs/superpowers/STAGE3D-HANDOFF.md
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: Stage 3d complete, Stage 4 handoff

Supersedes STAGE3D-HANDOFF.md."
```

---

## Definition of done

- [ ] `BalanceReport` reports the character distribution.
- [ ] `offfield.ts` holds 10 band-1 members and 5 band-2 events, wired into the barrel and covered by `index.test.ts`.
- [ ] A conference-phase `mcl` exists and `bust-mri` provably matches after it.
- [ ] **`npm run balance -- 500 random` reports `bustedRate > 0`** — the blocking criterion.
- [ ] `round1Rate` still within `[0.066, 0.166]`.
- [ ] `npm test` green, `npm run typecheck` green (both passes).
- [ ] Ledger updated, Stage 4 handoff written, 3d handoff deleted.
