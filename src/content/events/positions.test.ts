import { describe, it, expect } from "vitest";
import { QB_EVENTS } from "./qb";
import { OSKILL_EVENTS } from "./oskill";
import { OL_EVENTS } from "./ol";
import { DL_EVENTS } from "./dl";
import { DSKILL_EVENTS } from "./dskill";
import { K_EVENTS } from "./k";
import { POSITIONS } from "../positions";
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
    const byClass = events.filter((e) => e.conditions?.minClass !== undefined).length;
    const byTier = events.filter((e) => e.conditions?.tier !== undefined).length;
    expect(byClass, `${position} needs >= 2 events gated by minClass, has ${byClass}`).toBeGreaterThanOrEqual(2);
    expect(byTier, `${position} needs >= 1 event gated by tier, has ${byTier}`).toBeGreaterThanOrEqual(1);
  });

  it("emits no ending effects", () => {
    for (const ev of events) {
      const endings = allEffects(ev).filter((e) => e.kind === "ending");
      expect(endings.length, `${ev.id} emits an ending; band 3 is closed content`).toBe(0);
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

  it("has some reachable outcome that reduces its award stat", () => {
    const sig = SIGNATURE[position];
    const reducers = events.flatMap((ev) =>
      allEffects(ev)
        .filter((e) => e.kind === "stat" && e.stat === sig.stat && e.amount < 0)
        .map(() => ev.id),
    );
    // Every slice must be able to LOSE award-stat ground, not merely gain less
    // of it. Without this, a slice's award stat is a one-way ratchet and its
    // gambles risk nothing that the award actually depends on.
    expect(
      reducers.length > 0,
      `${position} has no outcome that reduces ${sig.stat}, so its award stat is a one-way ratchet`,
    ).toBe(true);
  });
});
