import { describe, it, expect } from "vitest";
import { simulateTeamRecord, resolveTrophies } from "./postseason";
import { createRng } from "./rng";
import { POSTSEASON } from "../content/postseason";
import type { PostseasonConfig } from "../content/schema";

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

describe("resolveTrophies", () => {
  it("awards no trophies below the bowl win threshold", () => {
    const effs = resolveTrophies(3, 4, POSTSEASON, createRng("x"));
    expect(effs).toEqual([]);
  });

  it("can award the bowl with a forced-certain config", () => {
    const cfg: PostseasonConfig = {
      ...POSTSEASON,
      bowl: { id: "bowlWin", minWins: 0, prob: 1 },
      conf: { ...POSTSEASON.conf, minWins: 99 },
      cfp: { ...POSTSEASON.cfp, minWins: 99 },
    };
    const effs = resolveTrophies(8, 3, cfg, createRng("x"));
    expect(effs).toEqual([{ kind: "trophy", id: "bowlWin" }]);
  });

  it("can award all three in a dominant season with certain probabilities", () => {
    const certain: PostseasonConfig = {
      ...POSTSEASON,
      bowl: { id: "bowlWin", minWins: 0, prob: 1 },
      conf: { id: "confTitle", minWins: 0, probByTier: { 1: 1, 2: 1, 3: 1, 4: 1 } },
      cfp: { id: "cfpTitle", minWins: 0, probByTier: { 1: 1, 2: 1, 3: 1, 4: 1 } },
    };
    const ids = resolveTrophies(12, 4, certain, createRng("x")).map((e) => (e.kind === "trophy" ? e.id : ""));
    expect(ids).toEqual(["bowlWin", "confTitle", "cfpTitle"]);
  });

  it("is deterministic for a seed", () => {
    const a = resolveTrophies(11, 4, POSTSEASON, createRng("same"));
    const b = resolveTrophies(11, 4, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});
