import { describe, it, expect } from "vitest";
import { simulateTeamRecord, resolveAwards, bandProb, runAwards } from "./postseason";
import { createRng } from "./rng";
import { POSTSEASON } from "../content/postseason";
import { CONTENT } from "../content/index";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

describe("simulateTeamRecord", () => {
  it("always produces wins + losses === gamesPerSeason", () => {
    for (let i = 0; i < 20; i++) {
      const r = simulateTeamRecord(75, 3, "starter", POSTSEASON, createRng(`r-${i}`));
      expect(r.wins + r.losses).toBe(POSTSEASON.gamesPerSeason);
    }
  });

  it("elite starters at blue-bloods win more than weak starters at small schools (on average)", () => {
    let elite = 0, weak = 0;
    for (let i = 0; i < 200; i++) {
      elite += simulateTeamRecord(92, 4, "starter", POSTSEASON, createRng(`e-${i}`)).wins;
      weak += simulateTeamRecord(55, 1, "starter", POSTSEASON, createRng(`w-${i}`)).wins;
    }
    expect(elite).toBeGreaterThan(weak);
  });

  it("a backup's overall does not move the team", () => {
    const a = simulateTeamRecord(95, 2, "backup", POSTSEASON, createRng("b"));
    const b = simulateTeamRecord(50, 2, "backup", POSTSEASON, createRng("b"));
    expect(a).toEqual(b);
  });

  it("is deterministic for a seed", () => {
    expect(simulateTeamRecord(80, 2, "starter", POSTSEASON, createRng("same"))).toEqual(
      simulateTeamRecord(80, 2, "starter", POSTSEASON, createRng("same")),
    );
  });
});

describe("bandProb", () => {
  it("returns the first matching band's prob, else 0", () => {
    const bands = [{ min: 90, prob: 0.5 }, { min: 80, prob: 0.2 }];
    expect(bandProb(95, bands)).toBe(0.5);
    expect(bandProb(85, bands)).toBe(0.2);
    expect(bandProb(70, bands)).toBe(0);
  });
});

function prestigeRate(tier: 1 | 2 | 3 | 4, role: "starter" | "rotation" | "backup", n = 400): number {
  let hits = 0;
  for (let i = 0; i < n; i++) {
    const effs = resolveAwards("QB", 95, tier, role, { passYards: 2000 }, true, POSTSEASON, createRng(`p-${tier}-${role}-${i}`));
    if (effs.some((e) => e.kind === "award" && (e.id === "heisman" || e.id === "allAmerican"))) hits++;
  }
  return hits / n;
}

describe("resolveAwards", () => {
  it("grants no awards to a mediocre low-stat player", () => {
    expect(resolveAwards("QB", 60, 4, "starter", { passYards: 200 }, false, POSTSEASON, createRng("x"))).toEqual([]);
  });

  it("an elite starter at a blue-blood can win prestige and production awards", () => {
    let sawPrestige = false, sawProduction = false;
    for (let i = 0; i < 80; i++) {
      const ids = resolveAwards("QB", 95, 4, "starter", { passYards: 2000 }, true, POSTSEASON, createRng(`s-${i}`)).map((e) =>
        e.kind === "award" ? e.id : "",
      );
      if (ids.includes("heisman") || ids.includes("allAmerican")) sawPrestige = true;
      if (ids.includes("allConference")) sawProduction = true;
    }
    expect(sawPrestige).toBe(true);
    expect(sawProduction).toBe(true);
  });

  it("national voters watch the big programs: the same season is worth far less at FCS", () => {
    expect(prestigeRate(4, "starter")).toBeGreaterThan(prestigeRate(1, "starter") * 4);
  });

  it("national awards go to starters only", () => {
    expect(prestigeRate(4, "rotation")).toBe(0);
    expect(prestigeRate(4, "backup")).toBe(0);
  });

  it("a kicker almost never wins prestige awards", () => {
    let kicker = 0;
    for (let i = 0; i < 200; i++) {
      const effs = resolveAwards("K", 95, 4, "starter", {}, true, POSTSEASON, createRng(`k-${i}`));
      if (effs.some((e) => e.kind === "award" && (e.id === "heisman" || e.id === "allAmerican"))) kicker++;
    }
    expect(kicker).toBeLessThan(30);
  });

  it("is deterministic for a seed", () => {
    const a = resolveAwards("QB", 90, 3, "starter", { passYards: 1500 }, true, POSTSEASON, createRng("same"));
    const b = resolveAwards("QB", 90, 3, "starter", { passYards: 1500 }, true, POSTSEASON, createRng("same"));
    expect(a).toEqual(b);
  });
});

const injuryOf = (t: string) => CONTENT.injuries[t] ?? { overallDelta: 3, recoveryPhases: 2 };
const setup: Setup = { lastName: "R", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("runAwards", () => {
  function elite(seed: string) {
    const s = createCareer(setup, seed);
    s.overall = 96;
    s.school = { schoolId: "bama", tier: 4 };
    s.phase = "postseason";
    s.seasons.push({ seasonIndex: 0, schoolId: "bama", snaps: 500, stats: { passYards: 2500 }, teamWins: 11, teamLosses: 1, overall: 96, classYear: "FR", role: "starter" });
    return s;
  }

  it("records each award on the season it was won", () => {
    let saw = false;
    for (let i = 0; i < 40 && !saw; i++) {
      const s = elite(`aw-${i}`);
      runAwards(s, CONTENT, createRng(`aw-${i}`), injuryOf);
      if ((s.seasons[0]!.honors ?? []).length > 0) {
        saw = true;
        for (const h of s.seasons[0]!.honors!) expect(s.awards).toContain(h);
      }
    }
    expect(saw).toBe(true);
  });

  it("grants nothing during a redshirt season", () => {
    for (let i = 0; i < 40; i++) {
      const s = elite(`rs-${i}`);
      s.redshirtSeasonActive = true;
      runAwards(s, CONTENT, createRng(`rs-${i}`), injuryOf);
      expect(s.seasons[0]!.honors ?? []).toEqual([]);
    }
  });

  it("does nothing when there is no season line for the current index", () => {
    const s = createCareer(setup, "none");
    s.seasonIndex = 2;
    runAwards(s, CONTENT, createRng("none"), injuryOf);
    expect(s.awards).toEqual([]);
  });
});
