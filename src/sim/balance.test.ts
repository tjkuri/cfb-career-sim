import { describe, it, expect } from "vitest";
import { runBalance } from "./balance";
import { playCareer } from "./play-headless";
import { firstOptionPolicy, randomPolicy } from "./policies";
import type { Setup } from "../engine/index";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("headless balance harness", () => {
  it("every career reaches a terminal state", () => {
    for (let i = 0; i < 50; i++) {
      const s = playCareer(setup, `t-${i}`, randomPolicy);
      expect(["drafted", "busted"]).toContain(s.status);
    }
  });

  it("produces sane aggregate rates over many runs", () => {
    const r = runBalance(500, "seedA", randomPolicy);
    expect(r.runs).toBe(500);
    // Rates are valid probabilities.
    for (const v of [r.draftedRate, r.bustedRate, r.undraftedRate, r.round1Rate]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // Careers last multiple seasons on average.
    expect(r.avgSeasons).toBeGreaterThan(1);
    // Not everyone should be a round-1 pick under a random policy.
    expect(r.round1Rate).toBeLessThan(1);
  });

  it("is reproducible for a fixed seed prefix and policy", () => {
    expect(runBalance(200, "fixed", firstOptionPolicy)).toEqual(runBalance(200, "fixed", firstOptionPolicy));
  });

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

  it("the bust spiral is naturally enterable", () => {
    // Stage 3d's blocking exit criterion. The seed prefix matches the CLI
    // (`npm run balance -- 500 random`) so this test and that command agree.
    const r = runBalance(500, "balance", randomPolicy);
    expect(r.charUnder55Rate, "nobody reaches band 2").toBeGreaterThan(0);
    expect(r.charUnder35Rate, "nobody reaches band 3, so no bust event can gate in").toBeGreaterThan(0);
    expect(r.bustedRate, "Stage 3d exit criterion: the busted terminal must be naturally reachable").toBeGreaterThan(0);
  });
});
