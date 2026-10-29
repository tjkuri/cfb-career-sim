import { describe, it, expect } from "vitest";
import { deriveDraftStock, eligibleTiers, computeDraftResult, projectedRound, UNDRAFTED_FLOOR, ROUND_BAND } from "./draft";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { GameState, SeasonLine, Setup, Tier } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };
const base = (): GameState => createCareer(setup, "s");

function season(over: Partial<SeasonLine> = {}): SeasonLine {
  return { seasonIndex: 0, schoolId: "unt", snaps: 480, stats: {}, teamWins: 8, teamLosses: 4, overall: 75, classYear: "FR", ...over };
}

describe("deriveDraftStock", () => {
  it("rises with overall", () => {
    const low = base(); low.overall = 55;
    const high = base(); high.overall = 90;
    expect(deriveDraftStock(high)).toBeGreaterThan(deriveDraftStock(low));
  });

  it("rises with honours, and a Heisman is worth more than a bowl win", () => {
    const plain = base(); plain.overall = 80; plain.seasons = [season()];
    const bowl = base(); bowl.overall = 80; bowl.seasons = [season({ honors: ["bowlWin"] })];
    const heisman = base(); heisman.overall = 80; heisman.seasons = [season({ honors: ["heisman"] })];
    expect(deriveDraftStock(bowl)).toBeGreaterThan(deriveDraftStock(plain));
    expect(deriveDraftStock(heisman)).toBeGreaterThan(deriveDraftStock(bowl));
  });

  it("counts an honour every season it is won", () => {
    const once = base(); once.overall = 80; once.seasons = [season({ honors: ["allConference"] }), season({ seasonIndex: 1 })];
    const twice = base(); twice.overall = 80;
    twice.seasons = [season({ honors: ["allConference"] }), season({ seasonIndex: 1, honors: ["allConference"] })];
    expect(deriveDraftStock(twice)).toBeGreaterThan(deriveDraftStock(once));
  });

  it("weighs tape against the competition it came against", () => {
    const small = base(); small.overall = 80; small.seasons = [season({ tierPlayed: 1 })];
    const big = base(); big.overall = 80; big.seasons = [season({ tierPlayed: 4 })];
    expect(deriveDraftStock(big)).toBeGreaterThan(deriveDraftStock(small));
  });

  it("falls with a bad reputation", () => {
    const redFlag = base(); redFlag.overall = 80; redFlag.character = 10;
    const clean = base(); clean.overall = 80; clean.character = 90;
    expect(deriveDraftStock(clean)).toBeGreaterThan(deriveDraftStock(redFlag));
  });

  it("is clamped to 0-100", () => {
    const s = base(); s.overall = 99; s.character = 100;
    s.seasons = [0, 1, 2, 3].map((i) => season({ seasonIndex: i, tierPlayed: 4, honors: ["heisman", "allAmerican", "cfpTitle"] }));
    expect(deriveDraftStock(s)).toBe(100);
    const t = base(); t.overall = 0; t.character = 0;
    expect(deriveDraftStock(t)).toBe(0);
  });
});

describe("eligibleTiers", () => {
  it("only offers low tiers to weak players and unlocks blue-bloods for elite ones", () => {
    const weak = base(); weak.overall = 50;
    expect(eligibleTiers(weak)).toEqual([1]);
    const elite = base(); elite.overall = 95;
    expect(eligibleTiers(elite)).toEqual([1, 2, 3, 4] as Tier[]);
  });
});

describe("projectedRound", () => {
  it("is undrafted below the floor and round 7 at it", () => {
    expect(projectedRound(UNDRAFTED_FLOOR - 1)).toBe(0);
    expect(projectedRound(UNDRAFTED_FLOOR)).toBe(7);
  });

  it("climbs one round per band and tops out at round 1", () => {
    expect(projectedRound(UNDRAFTED_FLOOR + ROUND_BAND - 1)).toBe(7);
    expect(projectedRound(UNDRAFTED_FLOOR + ROUND_BAND)).toBe(6);
    expect(projectedRound(UNDRAFTED_FLOOR + 6 * ROUND_BAND - 1)).toBe(2);
    expect(projectedRound(UNDRAFTED_FLOOR + 6 * ROUND_BAND)).toBe(1);
    expect(projectedRound(100)).toBe(1);
  });
});

describe("computeDraftResult", () => {
  it("marks very low stock as undrafted", () => {
    const s = base(); s.overall = 45;
    const r = computeDraftResult(s, createRng("d"));
    expect(r.undrafted).toBe(true);
    expect(r.round).toBe(0);
  });

  it("maps elite stock to round 1 with a valid overall pick", () => {
    const s = base(); s.overall = 96;
    s.seasons = [0, 1, 2].map((i) => season({ seasonIndex: i, tierPlayed: 4, honors: ["allAmerican"] }));
    const r = computeDraftResult(s, createRng("d"));
    expect(r.round).toBe(1);
    expect(r.overallPick).toBeGreaterThanOrEqual(1);
    expect(r.overallPick).toBeLessThanOrEqual(32);
  });

  it("is deterministic for a seed", () => {
    const s = base(); s.overall = 85;
    expect(computeDraftResult(s, createRng("x"))).toEqual(computeDraftResult(s, createRng("x")));
  });
});
