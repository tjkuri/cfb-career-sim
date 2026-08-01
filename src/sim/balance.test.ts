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
});
