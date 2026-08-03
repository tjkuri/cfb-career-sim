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

  it("undrafted floor: stock 34 is undrafted, 35 is drafted in round 7", () => {
    const under = computeDraftResult(stockState(34), createRng("d"));
    expect(under.undrafted).toBe(true);

    const at = computeDraftResult(stockState(35), createRng("d"));
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
