import { describe, it, expect } from "vitest";
import { deriveDraftStock, eligibleTiers, computeDraftResult, EARLY_DECLARE_PENALTY } from "./draft";
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
    // that is a statement about a prospect who played out his eligibility.
    // `base()` returns a FR, so leaving it would silently charge
    // EARLY_DECLARE_PENALTY and turn a band test into a penalty test.
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
  // has to use this one: UNDRAFTED_FLOOR is compared against the stock AFTER
  // EARLY_DECLARE_PENALTY, so only a senior's draft-time stock equals his
  // derived stock. A FR fixture would be asserting the penalty, not the floor.
  const srStockState = (target: number): GameState => {
    const s = base();
    s.character = 50;
    s.eligibility.classYear = "SR";
    s.overall = 40 + (target - 2) / 1.4;
    return s;
  };

  it("the senior helper also produces the requested stock exactly", () => {
    expect(deriveDraftStock(srStockState(34))).toBe(34);
    expect(deriveDraftStock(srStockState(35))).toBe(35);
  });

  it("undrafted floor: stock 34 is undrafted, 35 is drafted in round 7", () => {
    const under = computeDraftResult(srStockState(34), createRng("d"));
    expect(under.undrafted).toBe(true);

    const at = computeDraftResult(srStockState(35), createRng("d"));
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

describe("EARLY_DECLARE_PENALTY (DECISION 038)", () => {
  // character 50 => characterPart 0; no snaps/trophies/awards.
  const at = (overall: number, classYear: ClassYear): GameState => {
    const s = base();
    s.character = 50;
    s.overall = overall;
    s.eligibility.classYear = classYear;
    return s;
  };

  it("is 8 -- the measured gap between a tanked two-season career and the floor", () => {
    expect(EARLY_DECLARE_PENALTY).toBe(8);
  });

  it("costs a non-senior exactly 8 points of draft stock at the draft", () => {
    for (const cls of ["FR", "SO", "JR"] as ClassYear[]) {
      const s = at(80, cls);
      const derived = deriveDraftStock(s);
      expect(computeDraftResult(s, createRng("d")).draftStock).toBe(derived - EARLY_DECLARE_PENALTY);
    }
  });

  it("costs a senior nothing", () => {
    const s = at(80, "SR");
    expect(computeDraftResult(s, createRng("d")).draftStock).toBe(deriveDraftStock(s));
  });

  it("cannot drive draft stock below zero", () => {
    const s = at(40, "FR"); // derived stock 0
    expect(deriveDraftStock(s)).toBe(0);
    expect(computeDraftResult(s, createRng("d")).draftStock).toBe(0);
  });

  // The hard constraint from DECISION 038: the penalty is charged at the draft
  // and NOWHERE ELSE. `deriveDraftStock` also feeds `eligibleTiers`, which
  // generates Signing Day and transfer offers against thresholds of 25/45/70 --
  // an 8-point shift inside the shared function would move players across them
  // and rewrite the offer ladder for every junior in the game. If this test
  // fails, the penalty has leaked and the change is wrong.
  it("does not leak into deriveDraftStock: the shared function ignores it entirely", () => {
    for (const overall of [50, 60, 70, 80, 90]) {
      // FR/SO/JR all share classPart 0, so their derived stock is identical and
      // free of any draft-time term.
      expect(deriveDraftStock(at(overall, "FR"))).toBe(deriveDraftStock(at(overall, "SO")));
      expect(deriveDraftStock(at(overall, "FR"))).toBe(deriveDraftStock(at(overall, "JR")));
      // A senior differs by classPart 2 only -- never by the penalty.
      expect(deriveDraftStock(at(overall, "SR")) - deriveDraftStock(at(overall, "FR"))).toBe(2);
    }
  });

  it("does not leak into eligibleTiers: the offer ladder is unmoved", () => {
    // stock 25/45/70 are the tier gates. Built as a junior -- the class the
    // offer ladder actually matters for -- each must still clear its gate.
    const stockJr = (target: number): GameState => {
      const s = at(40 + target / 1.4, "JR");
      return s;
    };
    expect(deriveDraftStock(stockJr(25))).toBe(25);
    expect(eligibleTiers(stockJr(24))).not.toContain(2);
    expect(eligibleTiers(stockJr(25))).toContain(2);
    expect(eligibleTiers(stockJr(44))).not.toContain(3);
    expect(eligibleTiers(stockJr(45))).toContain(3);
    expect(eligibleTiers(stockJr(69))).not.toContain(4);
    expect(eligibleTiers(stockJr(70))).toContain(4);
  });
});
