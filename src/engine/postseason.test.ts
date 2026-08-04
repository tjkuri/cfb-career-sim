import { describe, it, expect } from "vitest";
import { simulateTeamRecord, resolveTrophies, resolveAwards, bandProb, runPostseasonResolver } from "./postseason";
import { createRng } from "./rng";
import { POSTSEASON } from "../content/postseason";
import { CONTENT } from "../content/index";
import { createCareer } from "./create-career";
import type { PostseasonConfig } from "../content/schema";
import type { Position, Setup } from "./types";

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

describe("bandProb", () => {
  it("returns the first matching band's prob, else 0", () => {
    const bands = [{ min: 90, prob: 0.5 }, { min: 80, prob: 0.2 }];
    expect(bandProb(95, bands)).toBe(0.5);
    expect(bandProb(82, bands)).toBe(0.2);
    expect(bandProb(70, bands)).toBe(0);
  });
});

describe("resolveAwards", () => {
  it("grants no awards to a mediocre low-stat player", () => {
    const effs = resolveAwards("QB", 60, { passYards: 200 }, false, POSTSEASON, createRng("x"));
    expect(effs).toEqual([]);
  });

  it("an elite QB with huge stats and a title can win prestige + production awards", () => {
    // Search seeds to prove reachability (rng-gated), not a single fixed seed.
    let sawPrestige = false, sawProduction = false;
    for (let i = 0; i < 80; i++) {
      const effs = resolveAwards("QB", 95, { passYards: 2000 }, true, POSTSEASON, createRng(`s-${i}`));
      const ids = effs.map((e) => (e.kind === "award" ? e.id : ""));
      if (ids.includes("heisman") || ids.includes("allAmerican")) sawPrestige = true;
      if (ids.includes("allConference")) sawProduction = true;
    }
    expect(sawPrestige).toBe(true);
    expect(sawProduction).toBe(true);
  });

  it("a kicker almost never wins prestige awards (multiplier 0.05)", () => {
    let kickerPrestige = 0;
    for (let i = 0; i < 200; i++) {
      const effs = resolveAwards("K", 95, {}, true, POSTSEASON, createRng(`k-${i}`));
      if (effs.some((e) => e.kind === "award" && (e.id === "heisman" || e.id === "allAmerican"))) kickerPrestige++;
    }
    expect(kickerPrestige).toBeLessThan(30); // rare by design
  });

  it("is deterministic for a seed", () => {
    const a = resolveAwards("QB", 90, { passYards: 1500 }, true, POSTSEASON, createRng("same"));
    const b = resolveAwards("QB", 90, { passYards: 1500 }, true, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});

const injuryOf = (t: string) => CONTENT.injuries[t] ?? { overallDelta: 3, recoveryPhases: 1 };
const resolverSetup: Setup = { lastName: "R", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("runPostseasonResolver", () => {
  it("writes a full team record to the current season line", () => {
    const s = createCareer(resolverSetup, "resolve");
    s.school = { schoolId: "smu", tier: 3 };
    s.seasons.push({ seasonIndex: 0, schoolId: "smu", snaps: 480, stats: { passYards: 1500 }, teamWins: 0, teamLosses: 0 });
    runPostseasonResolver(s, CONTENT, createRng("resolve"), injuryOf);
    const line = s.seasons[0]!;
    expect(line.teamWins + line.teamLosses).toBe(CONTENT.postseason.gamesPerSeason);
  });

  it("does nothing when there is no season line for the current index", () => {
    const s = createCareer(resolverSetup, "noline");
    const before = JSON.stringify(s);
    runPostseasonResolver(s, CONTENT, createRng("noline"), injuryOf);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("an elite career accumulates at least one trophy or award across seeds", () => {
    let honored = 0;
    for (let i = 0; i < 40; i++) {
      const s = createCareer(resolverSetup, `elite-${i}`);
      s.overall = 96;
      s.school = { schoolId: "bama", tier: 4 };
      s.seasons.push({ seasonIndex: 0, schoolId: "bama", snaps: 500, stats: { passYards: 2000 }, teamWins: 0, teamLosses: 0 });
      runPostseasonResolver(s, CONTENT, createRng(`elite-${i}`), injuryOf);
      if (Object.keys(s.trophies).length > 0 || s.awards.length > 0) honored++;
    }
    expect(honored).toBeGreaterThan(0);
  });
});
