# Stage 3d Plan A — The Position Pile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author ~58 position-gated flavor events across the six position slices, against a shared invariant test written before the fan-out.

**Architecture:** Task 1 writes `positions.test.ts`, the contract every slice must satisfy. Tasks 2–7 are six independent authors, one slice file each, with zero shared files between them. Task 8 measures the balance impact and trims if the draft distribution moved.

**Tech Stack:** TypeScript, Vitest, tsx. Content is typed data validated at import by `validateContent` (`src/content/schema.ts`).

**Spec:** `docs/superpowers/specs/2026-08-08-phase2-stage3d-content-pile-design.md`

## Global Constraints

- **Determinism is sacrosanct.** No `Math.random`, `Date.now`, or IO anywhere in `src/content/**` or `src/engine/**`. Enforced by `tsc -p tsconfig.engine.json`.
- **`npm run typecheck` runs two passes** (`tsconfig.engine.json` then `tsconfig.json`). Both must exit 0.
- **Node is v22.0.0 (< 22.6)** — CLI scripts run via `tsx`, never `node --experimental-strip-types`.
- **Tone:** light, "silly + real-seeming" — the register of `catfished` and `speeding-georgia`. **No mean-spirited or offensive content. No real player names.** School and conference names are fine.
- **Moments:** a moment implying *first / only / last* may only come from an event gated to fire once. A moment on a repeatable random event must read sensibly if it happens twice.
- **`probability: 1` makes the negative branch unreachable** — the validator does not catch this, and it is usually a mistake unless intentional.
- **Baseline to preserve:** `npm run balance -- 500 random` currently reports `draftedRate 1, bustedRate 0, undraftedRate 0.008, round1Rate 0.116, avgSeasons 3.11`.

---

### Task 1: The position-slice contract

Writes the shared invariant test **before** any slice is authored, so the six parallel authors work against a fixed target and stay consistent without coordinating.

**This test is expected to FAIL after this task and stay red until Task 7 completes.** That is the intended state of a test-first fan-out — do not weaken it to get green early.

**Files:**
- Create: `src/content/events/positions.test.ts`

**Interfaces:**
- Consumes: `QB_EVENTS`, `OSKILL_EVENTS`, `OL_EVENTS`, `DL_EVENTS`, `DSKILL_EVENTS`, `K_EVENTS` from their slice files; `POSITIONS` from `../positions`; `INJURIES` from `../injuries`.
- Produces: the contract Tasks 2–7 satisfy. Each author runs only their own bucket via `-t "<POSITION>"`.

- [ ] **Step 1: Write the contract test**

Create `src/content/events/positions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { POSITIONS } from "../positions";
import { INJURIES } from "../injuries";
import type { Effect, GameEvent, Outcome, Phase, Position } from "../../engine/types";

// The Stage 3d position-slice contract, written before the six slices were
// authored so each author works against a fixed target and the files stay
// consistent without their authors ever coordinating.
const BUCKETS: { position: Position; events: GameEvent[] }[] = [
  { position: "QB", events: QB_EVENTS },
  { position: "OSKILL", events: OSKILL_EVENTS },
  { position: "OL", events: OL_EVENTS },
  { position: "DL", events: DL_EVENTS },
  { position: "DSKILL", events: DSKILL_EVENTS },
  { position: "K", events: K_EVENTS },
];

// Position events concentrate on-field so the off-field pool owns the offseason
// and the Plan B spiral gets draws it never has to win a weight fight for.
const PHASE_QUOTA: Record<Phase, number> = {
  offseason: 2, nonconf: 3, conference: 3, postseason: 2,
};

// ~60% of one on-field phase's baseline production for the bucket's
// award-bearing stat (see spec §5.4). A grant at or above this is a
// "signature" beat and the slice may hold at most two.
const SIGNATURE: Record<Position, { stat: string; amount: number }> = {
  QB: { stat: "passYards", amount: 250 },
  OSKILL: { stat: "scrimmageYards", amount: 175 },
  OL: { stat: "pancakes", amount: 7 },
  DL: { stat: "sacks", amount: 1.5 },
  DSKILL: { stat: "tackles", amount: 12 },
  K: { stat: "fieldGoals", amount: 3 },
};

function outcomes(ev: GameEvent): Outcome[] {
  return ev.options.flatMap((o) =>
    [o.positiveOutcome, o.negativeOutcome].filter((oc): oc is Outcome => oc !== undefined),
  );
}

function allEffects(ev: GameEvent): Effect[] {
  return outcomes(ev).flatMap((oc) => oc.effects);
}

function overallSum(oc: Outcome): number {
  return oc.effects.reduce((a, e) => (e.kind === "overall" ? a + e.amount : a), 0);
}

// Expected overall change, assuming every option is equally likely (which is
// exactly what the balance harness's randomPolicy does). Note resolveOutcome
// falls back to the positive outcome when there is no negative branch, so a
// missing negativeOutcome must be modelled as the positive one, not as zero.
function overallEv(ev: GameEvent): number {
  const perOption = ev.options.map((o) => {
    const pos = overallSum(o.positiveOutcome);
    const neg = o.negativeOutcome ? overallSum(o.negativeOutcome) : pos;
    return o.probability * pos + (1 - o.probability) * neg;
  });
  return perOption.reduce((a, b) => a + b, 0) / perOption.length;
}

describe.each(BUCKETS)("$position position slice", ({ position, events }) => {
  it("authors at least 8 events", () => {
    expect(events.length).toBeGreaterThanOrEqual(8);
  });

  it("is all random events gated to its own position only", () => {
    for (const ev of events) {
      expect(ev.kind, `${ev.id} must be a random event`).toBe("random");
      expect(ev.conditions?.position, `${ev.id} must be gated to exactly ["${position}"]`).toEqual([position]);
      expect(ev.weight, `${ev.id} weight must be 2-4`).toBeGreaterThanOrEqual(2);
      expect(ev.weight, `${ev.id} weight must be 2-4`).toBeLessThanOrEqual(4);
    }
  });

  it("meets the per-phase quota", () => {
    for (const [phase, min] of Object.entries(PHASE_QUOTA)) {
      const n = events.filter((e) => e.phase === phase).length;
      expect(n, `${position} needs >= ${min} ${phase} events, has ${n}`).toBeGreaterThanOrEqual(min);
    }
  });

  it("references its own stats and no other bucket's", () => {
    const own = new Set(POSITIONS[position].stats);
    for (const ev of events) {
      // A bare .filter() does not narrow the Effect union, so the predicate has
      // to be a type guard for `.stat` to be reachable.
      const stats = allEffects(ev)
        .filter((e): e is Extract<Effect, { kind: "stat" }> => e.kind === "stat")
        .map((e) => e.stat);
      for (const s of stats) {
        expect(own.has(s), `${ev.id} references foreign stat "${s}"`).toBe(true);
      }
    }
  });

  it("gives every on-field event a stat effect, and no offseason event one", () => {
    for (const ev of events) {
      const stats = allEffects(ev).filter((e) => e.kind === "stat");
      if (ev.phase === "offseason") {
        // In an offseason, applyEffect writes to seasons[length - 1], which is
        // the PREVIOUS, already-resolved season: development is spent, the
        // washout check has run, and awards are decided. A stat effect there
        // silently edits history. Pay offseason outcomes in overall instead.
        expect(stats.length, `${ev.id} is an offseason event and must not carry a stat effect`).toBe(0);
      } else {
        expect(stats.length, `${ev.id} is an on-field event and must carry a stat effect`).toBeGreaterThan(0);
      }
    }
  });

  it("gates at least two events by class and one by tier", () => {
    expect(events.filter((e) => e.conditions?.minClass !== undefined).length).toBeGreaterThanOrEqual(2);
    expect(events.filter((e) => e.conditions?.tier !== undefined).length).toBeGreaterThanOrEqual(1);
  });

  it("emits no ending effects", () => {
    for (const ev of events) {
      const endings = allEffects(ev).filter((e) => e.kind === "ending");
      expect(endings.length, `${ev.id} emits an ending; band 3 is closed content`).toBe(0);
    }
  });

  it("emits no mechanically inert injury or suspension", () => {
    for (const ev of events) {
      for (const eff of allEffects(ev)) {
        if (eff.kind === "injury") {
          const inj = INJURIES[eff.injuryType];
          expect(inj, `${ev.id} references unknown injury "${eff.injuryType}"`).toBeDefined();
          expect(
            inj!.recoveryPhases,
            `${ev.id} inflicts "${eff.injuryType}" at recoveryPhases 1, which clears before it can sideline anyone`,
          ).toBeGreaterThanOrEqual(2);
        }
        if (eff.kind === "suspension") {
          expect(eff.phases, `${ev.id} suspension of 1 phase is mechanically free`).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it("keeps character effects small — the pressure axis belongs to offfield.ts", () => {
    for (const ev of events) {
      for (const eff of allEffects(ev)) {
        if (eff.kind === "character") {
          expect(Math.abs(eff.amount), `${ev.id} character effect exceeds +/-2`).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("stays near overall-EV-neutral", () => {
    // Draft stock is dominated by overall ((overall - 40) * 1.4 in draft.ts).
    // Unchecked grants are what moved round1Rate 7x when milestones landed.
    for (const ev of events) {
      expect(overallEv(ev), `${ev.id} has overall EV ${overallEv(ev).toFixed(2)}, above the +1.0 per-event cap`)
        .toBeLessThanOrEqual(1.0);
    }
    const mean = events.reduce((a, e) => a + overallEv(e), 0) / events.length;
    expect(mean, `${position} mean overall EV is ${mean.toFixed(2)}, outside [-0.5, 0.5]`).toBeLessThanOrEqual(0.5);
    expect(mean, `${position} mean overall EV is ${mean.toFixed(2)}, outside [-0.5, 0.5]`).toBeGreaterThanOrEqual(-0.5);
  });

  it("holds at most two signature-sized stat grants", () => {
    const sig = SIGNATURE[position];
    const big = events.filter((ev) =>
      allEffects(ev).some((e) => e.kind === "stat" && e.stat === sig.stat && e.amount >= sig.amount),
    );
    expect(big.length, `${position} has ${big.length} signature ${sig.stat} grants (max 2): ${big.map((e) => e.id).join(", ")}`)
      .toBeLessThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails for all six buckets**

Run: `npx vitest run src/content/events/positions.test.ts`

Expected: FAIL. QB fails the count/quota assertions (it has 2 events); the other five fail on `events.length` being 0 and on empty-array assertions. This is correct — do not fix it here.

- [ ] **Step 3: Confirm nothing else broke**

Run: `npm run typecheck`
Expected: both passes exit 0. The new test file must compile even though it fails.

- [ ] **Step 4: Commit**

```bash
git add src/content/events/positions.test.ts
git commit -m "test(content): position-slice contract for Stage 3d

Written before the six slices are authored so parallel authors work
against a fixed target. Expected red until all six buckets land."
```

---

## Tasks 2–7: the six slices (fully parallel)

**These six tasks share no files and may run simultaneously.** Each author touches exactly one slice file and nothing else.

**Every one of them must satisfy the identical requirements below.** They are repeated in full in each task rather than cross-referenced, because an author may be reading their task in isolation.

### Shared authoring requirements (all six slices)

1. **≥8 events**, all `kind: "random"`, all with `conditions.position` set to exactly your bucket.
2. **Phase quota:** ≥2 `offseason`, ≥3 `nonconf`, ≥3 `conference`, ≥2 `postseason`.
3. **Weight 2–4** on every event.
4. **Every on-field event (nonconf/conference/postseason) must carry at least one `stat` effect**, and any `stat` effect anywhere may only reference stats from your own bucket's `POSITIONS` row.
   **Offseason events must carry no `stat` effect at all.** In an offseason, `applyEffect` writes to `seasons[seasons.length - 1]` — the *previous, already-resolved* season, whose development is already spent, whose washout check has already run, and whose awards are already decided. A stat effect there silently edits history. **Pay offseason outcomes in `overall` instead** (and note the same applies to `snaps`, which is near-inert there — only `productionScore` in `draft.ts:5` still reads it).
5. **≥2 events gated by `minClass`**, **≥1 gated by `tier`**.
6. **No `ending` effects. No `injury` whose type has `recoveryPhases: 1`** (`hamstring`, `concussion`, `turfToe` are banned; `ankle`, `shoulder`, `collarbone`, `mcl`, `acl` are allowed). **No `suspension` with `phases: 1`.**
7. **Character effects capped at ±2.**
8. **Overall EV ≤ +1.0 per event, and the slice mean in [−0.5, +0.5].** A +2 overall positive branch needs a negative branch that costs overall. Pay upside in stats, snaps, and moments — not in overall.
9. **At most 2 signature-sized stat grants** (thresholds in the test's `SIGNATURE` table).

### Stat calibration (per on-field phase at overall 70)

A season is ~3× these. Award thresholds sit within a few percent of one season of baseline, so stat grants are what decide an All-Conference nod.

| Bucket | Award stat (**read by the game**) | Per-phase baseline | Flavor stats (**inert — affect nothing**) |
|---|---|---|---|
| QB | `passYards` ~415 | 415 | `passTds` 3.2, `ints` 1.6 |
| OSKILL | `scrimmageYards` ~290 | 290 | `totalTds` 3.2, `receptions` 13 |
| OL | `pancakes` ~11 | 11 | `sacksAllowed` 3.7 |
| DL | `sacks` ~2.5 | 2.5 | `tfls` 5.0, `tackles` 16.5 |
| DSKILL | `tackles` ~20 | 20 | `ints` 1.65, `passBreakups` 5.0 |
| K | `fieldGoals` ~5 | 5 | `points` 23, `gameWinners` 0.44 |

**Only the award stat in column 2 is read by anything** (`postseason.ts:56`). Everything in column 4 is pure narration — a "penalty" of `+2 ints` costs the player exactly zero. Use flavor stats for texture, never as the downside of an option.

A "solid" grant is ~25% of the phase baseline. A "signature" grant is ~75%.

### Mechanical traps

- **Base production accrues before events** (`advance.ts:253`), so `stat` effects add on top rather than replacing.
- **Postseason events fire before the resolver** (`advance.ts:277`), so a postseason `stat` effect feeds that season's awards, and an `injury` there sidelines the player for it.
- Only one `random` event fires per phase, so your events compete with each other and with the off-field pool.

### The worked pattern

This is `film-study`, already in `qb.ts`, and it is the shape to copy — a real choice, a real downside, upside paid mostly in stats:

```ts
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
      negativeOutcome: { description: "You're gassed for practice.", effects: [{ kind: "overall", timing: "deferred", amount: -1, delayPhases: 1 }] },
    },
  ],
},
```

Its overall EV is `0.9 × 1 + 0.1 × (−1) = 0.8` — under the +1.0 cap, and a slice of events like it averages well under +0.5 once some carry negative EV.

### Per-task verification (identical for all six)

- [ ] **Step A: Author the events** in your slice file, appending to the existing exported array.

  Your task gives a concept table with one row per event: its phase, its id where fixed, and its premise. Write each one following the worked pattern above and the nine shared requirements. The prose is yours to write — that is the point of the task — but the *structure* is not: count, phase, gates, stats, weights, and EV are all fixed by the contract test, which is the arbiter. If a judgment call is not settled by the requirements, the concept table, or the test, make it and note it in your commit message.

- [ ] **Step B: Run your bucket's contract tests**
  Run: `npx vitest run src/content/events/positions.test.ts -t "<POSITION>"`
  Expected: PASS. Other buckets will still fail — that is expected until all six land.
- [ ] **Step C: Run the content validator and barrel tests**
  Run: `npx vitest run src/content/`
  Expected: `src/content/index.test.ts` and `events/index.test.ts` PASS. `validateContent` throws at import on any bad stat, injury, trophy, award, or position reference, so an import failure here is a content bug in your file.
- [ ] **Step D: Typecheck**
  Run: `npm run typecheck`
  Expected: both passes exit 0.
- [ ] **Step E: Commit** (message given per task below).

---

### Task 2: QB slice

**Files:**
- Modify: `src/content/events/qb.ts` (append to `QB_EVENTS`, which already holds `film-study` and `signature-win`)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `QB_EVENTS` with ≥10 total events (2 existing + 8 new).

**Existing phase coverage:** `film-study` is nonconf, `signature-win` is postseason. So author **2 offseason, 2 nonconf, 3 conference, 1 postseason** to reach the quota.

**Stats available:** `passYards` (read), `passTds`, `ints` (both inert flavor).

**Event concepts** — author all eight:

| Phase | Concept |
|---|---|
| offseason | **The Transfer QB** — a decorated transfer arrives in your room. Compete, or mentor him? |
| offseason | **New Playbook** — new coordinator, new system, install season. Gate `minClass: "SO"`. |
| nonconf | **Audible Authority** — the OC unlocks the line-of-scrimmage checks for you. |
| nonconf | **Caught on the Sideline Camera** — the broadcast catches you barking at a receiver. |
| conference | **Third and Long** — hero ball or check it down. |
| conference | **The Silent Count** — a genuinely deafening road stadium. Gate `tier: [1, 2]` (the big-road-trip experience). |
| conference | **The Two-Minute Drill** — down four, no timeouts. Gate `minClass: "JR"`. |
| postseason | **All-Star Game Invite** — accept and show out, or skip and protect your stock. |

- [ ] Complete Steps A–D from "Per-task verification" above, with `-t "QB"`.
- [ ] **Step E: Commit**

```bash
git add src/content/events/qb.ts
git commit -m "content(qb): eight quarterback events for Stage 3d"
```

---

### Task 3: OSKILL slice

**Files:**
- Modify: `src/content/events/oskill.ts` (`OSKILL_EVENTS`, currently empty)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `OSKILL_EVENTS` with ≥10 events.

**Phase quota to author:** 2 offseason, 3 nonconf, 3 conference, 2 postseason.

**Stats available:** `scrimmageYards` (read), `totalTds`, `receptions` (both inert flavor).

**Event concepts** — author all ten:

| Phase | Concept |
|---|---|
| offseason | **Position Switch** — the staff wants to move you (RB to slot, or the reverse). |
| offseason | **The Weight Room Bet** — the strength coach bets you can't hit a number. Gate `minClass: "SO"`. |
| nonconf | **Return Duty** — they want you fielding punts too. More snaps, more risk. |
| nonconf | **The Drop** — a wide-open ball off your hands in week two. |
| nonconf | **Bubble Screen Diet** — the OC is feeding you nothing but three-yard touches. |
| conference | **Feature Back Workload** — 28 touches a game. Gate `minClass: "JR"`. |
| conference | **The Toe-Tap** — a sideline catch the whole stadium has to wait on. |
| conference | **Asked to Block** — they need you sealing the edge, not touching the ball. |
| postseason | **Bowl Opt-Out** — sit and protect your draft stock, or play for your teammates. Gate `tier: [1, 2]`. |
| postseason | **The Long One** — one snap, one seam, eighty yards. |

- [ ] Complete Steps A–D from "Per-task verification" above, with `-t "OSKILL"`.
- [ ] **Step E: Commit**

```bash
git add src/content/events/oskill.ts
git commit -m "content(oskill): ten offensive-skill events for Stage 3d"
```

---

### Task 4: OL slice

**Files:**
- Modify: `src/content/events/ol.ts` (`OL_EVENTS`, currently empty)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `OL_EVENTS` with ≥10 events.

**Phase quota to author:** 2 offseason, 3 nonconf, 3 conference, 2 postseason.

**Stats available:** `pancakes` (read), `sacksAllowed` (inert flavor).

**Note:** this bucket has only two stats, and `sacksAllowed` is inert. Every event still needs a `stat` effect, so most will touch `pancakes`. Keep the amounts modest (baseline is ~11 per phase) and remember only two events may grant ≥7.

**Event concepts** — author all ten:

| Phase | Concept |
|---|---|
| offseason | **Bulk Up or Slim Down** — the new line coach wants you at a different weight. |
| offseason | **New Line Coach** — he rebuilds your stance from scratch. Gate `minClass: "SO"`. |
| nonconf | **The Blindside** — you're moved to protect the quarterback's back side. |
| nonconf | **Cadence Trouble** — two false starts in the opener. |
| nonconf | **Pancake Highlight** — a rep that ends up on the team's social account. |
| conference | **Facing the Freak** — the conference's best pass rusher, all afternoon. Gate `minClass: "JR"`. |
| conference | **The Holding Call** — a drive-killing flag, and the coordinator saw it. |
| conference | **Playing Through the Hand** — a club cast, or sit. |
| postseason | **Senior Bowl Invite** — Gate `tier: [1, 2]`. |
| postseason | **Guard or Tackle?** — scouts want you inside; you've played outside your whole life. |

- [ ] Complete Steps A–D from "Per-task verification" above, with `-t "OL"`.
- [ ] **Step E: Commit**

```bash
git add src/content/events/ol.ts
git commit -m "content(ol): ten offensive-line events for Stage 3d"
```

---

### Task 5: DL slice

**Files:**
- Modify: `src/content/events/dl.ts` (`DL_EVENTS`, currently empty)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `DL_EVENTS` with ≥10 events.

**Phase quota to author:** 2 offseason, 3 nonconf, 3 conference, 2 postseason.

**Stats available:** `sacks` (read), `tfls`, `tackles` (both inert flavor **for this bucket** — `tackles` is only read for DSKILL).

**Note:** `sacks` baseline is only ~2.5 per phase, so grants are small integers. A +2 sacks grant is enormous; +1 is a solid game. The signature threshold is 1.5, so at most two events may grant ≥2.

**Event concepts** — author all ten:

| Phase | Concept |
|---|---|
| offseason | **The Get-Off** — a track coach is hired to fix your first step. |
| offseason | **Weight Class** — nose tackle bulk or edge-rusher quickness. Gate `minClass: "SO"`. |
| nonconf | **Stat-Padding Saturday** — a badly overmatched opponent. |
| nonconf | **Gap Discipline** — chase the splash play or hold your assignment. |
| nonconf | **The Roughing Call** — a late hit on the quarterback, and the officials are watching you now. |
| conference | **Double-Teamed All Day** — you're the problem they game-planned for. Gate `minClass: "JR"`. |
| conference | **The Strip Sack** — ball out, scrum, everyone's hands in the pile. |
| conference | **Trash Talk** — the opposing guard has been at you since warmups. |
| postseason | **Bowl Practice Reps** — three weeks of live work against your own offense. |
| postseason | **Combine Buzz** — scouts want an edge-rusher number you may not have. Gate `tier: [1, 2]`. |

- [ ] Complete Steps A–D from "Per-task verification" above, with `-t "DL"`.
- [ ] **Step E: Commit**

```bash
git add src/content/events/dl.ts
git commit -m "content(dl): ten defensive-line events for Stage 3d"
```

---

### Task 6: DSKILL slice

**Files:**
- Modify: `src/content/events/dskill.ts` (`DSKILL_EVENTS`, currently empty)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `DSKILL_EVENTS` with ≥10 events.

**Phase quota to author:** 2 offseason, 3 nonconf, 3 conference, 2 postseason.

**Stats available:** `tackles` (read — All-Conference threshold 60 for this bucket), `ints`, `passBreakups` (both inert flavor).

**Event concepts** — author all ten:

| Phase | Concept |
|---|---|
| offseason | **Coverage Install** — the new defensive coordinator's system is three inches thick. |
| offseason | **Film Room Rat** — you start showing up before the coaches. Gate `minClass: "SO"`. |
| nonconf | **Gambling on the Jump** — jump the route for the pick, or stay home. |
| nonconf | **The Missed Tackle Reel** — the coordinator cuts one just for you. |
| nonconf | **Special Teams Gunner** — extra snaps nobody wants. |
| conference | **Travel With the No. 1** — you're following their best receiver everywhere. Gate `minClass: "JR"`. |
| conference | **The Pick-Six** — the one everyone remembers. |
| conference | **Targeting Review** — a hit that could get you ejected. |
| postseason | **The Bowl Interception** — Gate `tier: [1, 2]`. |
| postseason | **All-Star Practice Week** — scouts watching every rep of one-on-ones. |

- [ ] Complete Steps A–D from "Per-task verification" above, with `-t "DSKILL"`.
- [ ] **Step E: Commit**

```bash
git add src/content/events/dskill.ts
git commit -m "content(dskill): ten defensive-skill events for Stage 3d"
```

---

### Task 7: K slice

**Files:**
- Modify: `src/content/events/k.ts` (`K_EVENTS`, currently empty)

**Interfaces:**
- Consumes: `GameEvent` from `../../engine/types`.
- Produces: `K_EVENTS` with ≥10 events.

**Phase quota to author:** 2 offseason, 3 nonconf, 3 conference, 2 postseason.

**Stats available:** `fieldGoals` (read — All-Conference threshold 15), `points`, `gameWinners` (both inert flavor).

**Note:** the kicker's baseline is ~5 `fieldGoals` per phase, ~15 per season, against a threshold of exactly 15 — this bucket sits right on its award line, so `fieldGoals` grants are unusually consequential. Keep them to +1 or +2 outside the two permitted signature beats. The kicker is also the game's hard-mode position (`positionMultiplier: 0.05`), so lean into the comedy of it.

**Event concepts** — author all ten:

| Phase | Concept |
|---|---|
| offseason | **New Holder** — the punter who caught for you graduated. |
| offseason | **The Yips** — you miss eleven in a row in an empty stadium. Gate `minClass: "SO"`. |
| nonconf | **Kickoff Duties Too** — they want you doing both jobs. |
| nonconf | **The Chip Shot** — a 22-yarder, and you have time to think about it. |
| nonconf | **The Fake** — the call comes in and the ball is going to *you*. |
| conference | **Iced** — timeout called as you start your approach. Gate `minClass: "JR"`. |
| conference | **The Wind at Home** — your own stadium's swirl, which nobody believes in but you. |
| conference | **Onside Kick** — down eight, ninety seconds left. |
| postseason | **Bowl Game Winner** — Gate `tier: [1, 2]`. |
| postseason | **The Long Attempt** — 57 yards, and the coach is asking if you have it. |

- [ ] Complete Steps A–D from "Per-task verification" above, with `-t "K"`.
- [ ] **Step E: Commit**

```bash
git add src/content/events/k.ts
git commit -m "content(k): ten kicker events for Stage 3d"
```

---

### Task 8: Measure the balance impact

The position pile adds ~58 weighted events to the draw pool and a large amount of new `overall` and `stat` EV. This task confirms it did not blow out the draft distribution the way milestones did.

**Files:**
- No source changes unless the gate fails.

**Interfaces:**
- Consumes: all six slices from Tasks 2–7.
- Produces: a recorded measurement for Plan B to tune against.

- [ ] **Step 1: Confirm the whole contract is green**

Run: `npx vitest run src/content/events/positions.test.ts`
Expected: PASS for all six buckets. This is the first moment it can pass.

- [ ] **Step 2: Run the full suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: all tests pass (181 existing + the new contract tests), both typecheck passes exit 0.

- [ ] **Step 3: Measure**

Run: `npm run balance -- 500 random`

Record all five numbers. The pre-Plan-A baseline is:

```json
{ "draftedRate": 1, "bustedRate": 0, "undraftedRate": 0.008, "round1Rate": 0.116, "avgSeasons": 3.11 }
```

- [ ] **Step 4: Apply the gate**

**`round1Rate` must be within ±0.05 of 0.116** — i.e. in `[0.066, 0.166]`.

> **RESOLVED 2026-08-09 — gate relaxed on the low side.** The measured value was **0.052**: the
> pile *halved* `round1Rate` and tripled `undraftedRate` (0.008 → 0.028) via pool dilution, since
> only one random event fires per phase and ~58 modest-EV position events crowd out high-EV
> universal ones like `gym-grind` (+3 overall at 72%). This gate exists to catch *inflation* — the
> milestones' 7× spike — so a miss in the deflationary direction does not implicate its rationale.
> Accepted as-is by the human partner; **no content was changed**. Full measurement, per-position
> table, and reasoning in the task-8 report in this plan's SDD workspace.

If it is outside that band, the position pile is granting too much (or too little) overall. Fix by adjusting `overall` effect amounts in the slice files — **not** by changing `devCap`, `snapsPerDevPoint`, or anything in `postseason.ts`, which are Stage 4's levers and would confound Plan B's tuning. Re-run Step 3 until the gate passes.

`bustedRate` is expected to still be 0 after Plan A. That is Plan B's job, not a failure here.

- [ ] **Step 5: Commit the measurement**

```bash
git add -A
git commit -m "chore(balance): record Stage 3d Plan A balance measurement

round1Rate <value> vs 0.116 baseline, within the +/-0.05 gate.
bustedRate still 0 — Plan B's blocking criterion."
```

---

## Definition of done

- [ ] Six slices authored, ≥58 new events total.
- [ ] `positions.test.ts` green for all six buckets.
- [ ] `npm test` green, `npm run typecheck` green (both passes).
- [ ] `round1Rate` within `[0.066, 0.166]`, measurement recorded in the commit message.
- [ ] Ready for Plan B, which tunes the spiral against this final pool composition.
