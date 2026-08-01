import { describe, it, expect } from "vitest";
import { applyEffect, type InjuryLookup } from "./effects";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };
const injuryOf: InjuryLookup = (t) =>
  t === "acl" ? { overallDelta: 12, recoveryPhases: 4 } : { overallDelta: 3, recoveryPhases: 1 };
const fresh = () => createCareer(setup, "s");

describe("applyEffect (immediate)", () => {
  it("applies an immediate overall delta and clamps to 0-99", () => {
    const s = fresh();
    applyEffect(s, { kind: "overall", timing: "immediate", amount: 5 }, injuryOf);
    expect(s.overall).toBe(65);
    applyEffect(s, { kind: "overall", timing: "immediate", amount: 100 }, injuryOf);
    expect(s.overall).toBe(99);
  });

  it("queues a deferred overall delta instead of applying now", () => {
    const s = fresh();
    s.phaseAbs = 2;
    applyEffect(s, { kind: "overall", timing: "deferred", amount: -4, delayPhases: 3 }, injuryOf);
    expect(s.overall).toBe(60);
    expect(s.pendingEffects).toEqual([
      { effect: { kind: "overall", timing: "deferred", amount: -4, delayPhases: 3 }, firePhaseAbs: 5 },
    ]);
  });

  it("clamps character to 0-100", () => {
    const s = fresh();
    applyEffect(s, { kind: "character", amount: -100 }, injuryOf);
    expect(s.character).toBe(0);
  });

  it("adds stat and snap totals to the current season line", () => {
    const s = fresh();
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
    applyEffect(s, { kind: "stat", stat: "passYards", amount: 250 }, injuryOf);
    applyEffect(s, { kind: "snaps", amount: 40 }, injuryOf);
    expect(s.seasons[0]!.stats.passYards).toBe(250);
    expect(s.seasons[0]!.snaps).toBe(40);
  });

  it("no-ops on stat and snaps effects when there is no current season line", () => {
    const s = fresh();
    expect(s.seasons.length).toBe(0);
    expect(() =>
      applyEffect(s, { kind: "stat", stat: "passYards", amount: 250 }, injuryOf),
    ).not.toThrow();
    expect(() => applyEffect(s, { kind: "snaps", amount: 40 }, injuryOf)).not.toThrow();
    expect(s.seasons.length).toBe(0);
  });

  it("registers an injury with recovery phases and an immediate overall penalty", () => {
    const s = fresh();
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf);
    expect(s.overall).toBe(48);
    expect(s.injuries).toEqual([{ injuryType: "acl", remainingPhases: 4, restoreAmount: 12 }]);
  });

  it("records trophies, awards, and moments", () => {
    const s = fresh();
    applyEffect(s, { kind: "trophy", id: "confTitle" }, injuryOf);
    applyEffect(s, { kind: "trophy", id: "confTitle" }, injuryOf);
    applyEffect(s, { kind: "award", id: "heisman" }, injuryOf);
    applyEffect(s, { kind: "moment", item: "Got catfished", icon: "phone" }, injuryOf);
    expect(s.trophies.confTitle).toBe(2);
    expect(s.awards).toEqual(["heisman"]);
    expect(s.moments).toEqual([{ seasonIndex: 0, item: "Got catfished", icon: "phone" }]);
  });

  it("an ending effect sets busted status and reason", () => {
    const s = fresh();
    applyEffect(s, { kind: "ending", reason: "Academic ineligibility" }, injuryOf);
    expect(s.status).toBe("busted");
    expect(s.endingReason).toBe("Academic ineligibility");
  });

  it("registers a suspension as an injuries entry with no overall penalty", () => {
    const s = fresh();
    const overallBefore = s.overall;
    applyEffect(s, { kind: "suspension", phases: 2 }, injuryOf);
    expect(s.injuries).toEqual([
      { injuryType: "suspension", remainingPhases: 2, restoreAmount: 0 },
    ]);
    expect(s.overall).toBe(overallBefore);
  });

  it("applies a permanent-timing overall delta immediately without queuing", () => {
    const s = fresh();
    applyEffect(s, { kind: "overall", timing: "permanent", amount: 5 }, injuryOf);
    expect(s.overall).toBe(65);
    expect(s.pendingEffects.length).toBe(0);
  });
});
