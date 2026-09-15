import { describe, it, expect } from "vitest";
import { deriveDraftStock, eligibleTiers, computeDraftResult } from "./draft";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { ClassYear, GameState, Setup } from "./types";

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
    // A SENIOR. This test pins the top of the round-band arithmetic -- elite
    // stock lands in round 1 and the pick stays inside a 32-team round -- and
    // that is a statement about a prospect who played out his eligibility,
    // which since DECISION 057 is the only kind of prospect there is.
    s.eligibility.classYear = "SR";
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

  // The same construction for a SENIOR, whose `classPart` is 2. The floor test
  // keeps using this one: every career that reaches the draft now reaches it as
  // a senior (the only path to `declared` is running out of eligibility), so a
  // senior fixture is the one that describes a real prospect.
  const srStockState = (target: number): GameState => {
    const s = base();
    s.character = 50;
    s.eligibility.classYear = "SR";
    s.overall = 40 + (target - 2) / 1.4;
    return s;
  };

  it("the senior helper also produces the requested stock exactly", () => {
    expect(deriveDraftStock(srStockState(49))).toBe(49);
    expect(deriveDraftStock(srStockState(50))).toBe(50);
  });

  // UPDATED for DECISION 058: the floor moved 35 -> 50. The old rows (34
  // undrafted, 35 in round 7) encoded a bar that sat below even a deliberately
  // bad career -- stock ~60 -- which is why nothing could fail. The assertion
  // itself is unchanged in kind: one point under the floor is undrafted, the
  // floor itself is round 7.
  it("undrafted floor: stock 49 is undrafted, 50 is drafted in round 7", () => {
    const under = computeDraftResult(srStockState(49), createRng("d"));
    expect(under.undrafted).toBe(true);

    const at = computeDraftResult(srStockState(50), createRng("d"));
    expect(at.undrafted).toBe(false);
    expect(at.round).toBe(7);
  });

  // The round-band divisor is the other half of DECISION 058 and has its own
  // failure mode: at the old 9.3 a floor of 50 puts round 1 out of reach (it
  // would need a raw stock of 99). This pins that round 1 is still reachable at
  // the top of the scale.
  it("round bands still span 1..7 between the floor and stock 100", () => {
    expect(computeDraftResult(srStockState(100), createRng("d")).round).toBe(1);
    expect(computeDraftResult(srStockState(95), createRng("d")).round).toBe(1);
    const rounds = [50, 60, 70, 80, 90, 100].map(
      (t) => computeDraftResult(srStockState(t), createRng("d")).round,
    );
    // Monotone non-increasing: more stock never costs a round.
    for (let i = 1; i < rounds.length; i++) expect(rounds[i]!).toBeLessThanOrEqual(rounds[i - 1]!);
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

// REPLACED (DECISION 057/058): this file used to hold a
// `EARLY_DECLARE_PENALTY (DECISION 038)` suite. The penalty priced declaring
// with eligibility left, the declare decision is deleted, and the constant is
// gone with it. What survives from that suite is the part that was never about
// the penalty: that `deriveDraftStock` is shared with `eligibleTiers` and must
// stay free of any draft-time-only term, because an 8-point shift inside it
// would move players across the 25/45/70 tier gates and rewrite the offer
// ladder. That constraint outlives the constant and is the reason a future
// draft-time cost must not be added to `deriveDraftStock` either.
describe("deriveDraftStock carries no draft-time-only term (DECISION 038's surviving constraint)", () => {
  // character 50 => characterPart 0; no snaps/trophies/awards.
  const at = (overall: number, classYear: ClassYear): GameState => {
    const s = base();
    s.character = 50;
    s.overall = overall;
    s.eligibility.classYear = classYear;
    return s;
  };

  it("a non-senior's draft-time stock now equals his derived stock exactly", () => {
    for (const cls of ["FR", "SO", "JR", "SR"] as ClassYear[]) {
      const s = at(80, cls);
      expect(computeDraftResult(s, createRng("d")).draftStock).toBe(deriveDraftStock(s));
    }
  });

  it("class year moves stock by classPart alone: 2 for a senior, nothing else", () => {
    for (const overall of [50, 60, 70, 80, 90]) {
      expect(deriveDraftStock(at(overall, "FR"))).toBe(deriveDraftStock(at(overall, "SO")));
      expect(deriveDraftStock(at(overall, "FR"))).toBe(deriveDraftStock(at(overall, "JR")));
      expect(deriveDraftStock(at(overall, "SR")) - deriveDraftStock(at(overall, "FR"))).toBe(2);
    }
  });

  it("does not leak into eligibleTiers: the offer ladder is unmoved", () => {
    // stock 25/45/70 are the tier gates. Built as a junior -- the class the
    // offer ladder actually matters for -- each must still clear its gate.
    const stockJr = (target: number): GameState => at(40 + target / 1.4, "JR");
    expect(deriveDraftStock(stockJr(25))).toBe(25);
    expect(eligibleTiers(stockJr(24))).not.toContain(2);
    expect(eligibleTiers(stockJr(25))).toContain(2);
    expect(eligibleTiers(stockJr(44))).not.toContain(3);
    expect(eligibleTiers(stockJr(45))).toContain(3);
    expect(eligibleTiers(stockJr(69))).not.toContain(4);
    expect(eligibleTiers(stockJr(70))).toContain(4);
  });
});
