import { describe, it, expect } from "vitest";
import { applyEffect, type InjuryLookup } from "./effects";
import { offseasonDevelopment } from "./advance";
import { createCareer } from "./create-career";
import { deriveDraftStock, FIFTH_YEAR_DISCOUNT } from "./draft";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { SeasonLine, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("injuries leave a mark", () => {
  it("heals all but the lasting part", () => {
    const injuryOf: InjuryLookup = () => ({ overallDelta: 14, recoveryPhases: 1, lasting: 5 });
    const s = createCareer(setup, "inj");
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf);
    expect(s.overall).toBe(46);
    expect(s.injuries[0]!.restoreAmount).toBe(9);
  });

  it("gives every injury in the content a lasting cost smaller than the hit", () => {
    for (const inj of Object.values(CONTENT.injuries)) {
      expect(inj.lasting ?? 0).toBeGreaterThan(0);
      expect(inj.lasting!).toBeLessThan(inj.overallDelta);
    }
  });
});

describe("growth is earned", () => {
  const line = (role: SeasonLine["role"], tier: SeasonLine["tierPlayed"]): SeasonLine => ({
    seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0, overall: 60, classYear: "SO", role, tierPlayed: tier,
  });
  const grow = (role: SeasonLine["role"], tier: SeasonLine["tierPlayed"]) => {
    const s = createCareer(setup, "g");
    const noJitter = { ...CONTENT, progression: { ...CONTENT.progression, devJitter: 0 } };
    return offseasonDevelopment(s, line(role, tier), noJitter, createRng("g"));
  };

  it("pays playing time more than the calendar", () => {
    expect(grow("starter", 1)).toBeGreaterThan(grow("backup", 1));
  });

  it("pays a bench at a big program for practicing against future pros", () => {
    expect(grow("backup", 4)).toBeGreaterThan(grow("backup", 1));
  });
});

describe("the redshirt's price", () => {
  it("takes the fifth-year discount off draft stock", () => {
    const s = createCareer(setup, "rs");
    s.overall = 80;
    const before = deriveDraftStock(s);
    s.eligibility.redshirtUsed = true;
    expect(deriveDraftStock(s)).toBe(before - FIFTH_YEAR_DISCOUNT);
  });
});
