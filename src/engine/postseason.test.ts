import { describe, it, expect } from "vitest";
import { simulateTeamRecord } from "./postseason";
import { createRng } from "./rng";
import { POSTSEASON } from "../content/postseason";

describe("simulateTeamRecord", () => {
  it("always produces wins + losses === gamesPerSeason", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const r = simulateTeamRecord(75, 3, POSTSEASON, createRng(seed));
      expect(r.wins + r.losses).toBe(POSTSEASON.gamesPerSeason);
      expect(r.wins).toBeGreaterThanOrEqual(0);
      expect(r.losses).toBeGreaterThanOrEqual(0);
    }
  });

  it("elite players at blue-bloods win more than weak players at low tiers (on average)", () => {
    let eliteWins = 0, weakWins = 0;
    for (let i = 0; i < 60; i++) {
      eliteWins += simulateTeamRecord(95, 4, POSTSEASON, createRng(`elite-${i}`)).wins;
      weakWins += simulateTeamRecord(55, 1, POSTSEASON, createRng(`weak-${i}`)).wins;
    }
    expect(eliteWins).toBeGreaterThan(weakWins);
  });

  it("is deterministic for a seed", () => {
    const a = simulateTeamRecord(80, 2, POSTSEASON, createRng("same"));
    const b = simulateTeamRecord(80, 2, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});
