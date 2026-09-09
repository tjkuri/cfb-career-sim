import { describe, it, expect } from "vitest";
import { simulatePhaseProduction } from "./simulate";
import { applyRecruitingChoice } from "./recruiting";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("simulatePhaseProduction", () => {
  it("accrues snaps and QB stats during on-field phases", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "conference";
    simulatePhaseProduction(s, CONTENT, createRng("p"));
    expect(s.seasons[0]!.snaps).toBeGreaterThan(0);
    expect(s.seasons[0]!.stats.passYards).toBeGreaterThan(0);
  });

  it("accrues nothing while sidelined", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "conference";
    s.injuries.push({ kind: "injury", injuryType: "acl", remainingPhases: 2, restoreAmount: 10 });
    simulatePhaseProduction(s, CONTENT, createRng("p"));
    expect(s.seasons[0]!.snaps).toBe(0);
  });

  it("accrues nothing during the offseason", () => {
    const s = createCareer(setup, "s");
    applyRecruitingChoice(s, "mont", CONTENT);
    s.phase = "offseason";
    simulatePhaseProduction(s, CONTENT, createRng("p"));
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
    simulatePhaseProduction(full, CONTENT, createRng("same"));
    const half = mk();
    half.snapModifier = 0.5;
    simulatePhaseProduction(half, CONTENT, createRng("same"));
    expect(half.seasons[0]!.snaps).toBe(Math.round(full.seasons[0]!.snaps * 0.5));
  });

  it("a kicker accumulates non-zero countable stats over a phase", () => {
    const s = createCareer({ lastName: "K", jerseyNumber: 9, homeState: "TX", position: "K" }, "kicker");
    s.phase = "nonconf";
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
    simulatePhaseProduction(s, CONTENT, createRng("kicker"));
    const line = s.seasons[0]!;
    expect(line.snaps).toBeGreaterThan(0);
    expect(line.stats.fieldGoals ?? 0).toBeGreaterThan(0);
    expect(line.stats.points ?? 0).toBeGreaterThan(0);
  });
});
