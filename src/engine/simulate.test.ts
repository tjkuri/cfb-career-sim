import { describe, it, expect } from "vitest";
import { recruitingOptions, applyRecruitingChoice, simulatePhaseProduction } from "./simulate";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("recruiting", () => {
  it("offers only tiers the player is eligible for at baseline (no blue-bloods)", () => {
    const s = createCareer(setup, "s");
    const opts = recruitingOptions(s, CONTENT);
    const tiers = opts.map((o) => o.tier);
    expect(tiers).toContain(1);
    expect(tiers).not.toContain(4);
  });

  it("applying a choice sets the school and opens season 0", () => {
    const s = createCareer(setup, "s");
    const opts = recruitingOptions(s, CONTENT);
    applyRecruitingChoice(s, opts[0]!.schoolId, CONTENT);
    expect(s.school.schoolId).toBe(opts[0]!.schoolId);
    expect(s.seasons).toHaveLength(1);
    expect(s.seasons[0]!.seasonIndex).toBe(0);
  });
});

describe("simulatePhaseProduction", () => {
  it("accrues snaps and QB stats during on-field phases", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "conference";
    simulatePhaseProduction(s, createRng("p"));
    expect(s.seasons[0]!.snaps).toBeGreaterThan(0);
    expect(s.seasons[0]!.stats.passYards).toBeGreaterThan(0);
  });

  it("accrues nothing while sidelined", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "conference";
    s.injuries.push({ kind: "injury", injuryType: "acl", remainingPhases: 2, restoreAmount: 10 });
    simulatePhaseProduction(s, createRng("p"));
    expect(s.seasons[0]!.snaps).toBe(0);
  });

  it("accrues nothing during the offseason", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "offseason";
    simulatePhaseProduction(s, createRng("p"));
    expect(s.seasons[0]!.snaps).toBe(0);
  });

  it("scales rolled snaps by state.snapModifier", () => {
    // Two identical states + same seed; one with a 0.5 modifier should accrue
    // roughly half the snaps of the 1.0 baseline for the same phase.
    const mk = () => {
      const s = createCareer(setup, "snapmod");
      s.phase = "nonconf";
      s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
      return s;
    };
    const full = mk();
    simulatePhaseProduction(full, createRng("same"));
    const half = mk();
    half.snapModifier = 0.5;
    simulatePhaseProduction(half, createRng("same"));
    expect(half.seasons[0]!.snaps).toBe(Math.round(full.seasons[0]!.snaps * 0.5));
  });
});
