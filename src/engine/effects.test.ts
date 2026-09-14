import { describe, it, expect } from "vitest";
import { applyEffect, flushPendingEffects, isSidelined, type InjuryLookup } from "./effects";
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
    s.seasons.push({ seasonIndex: 0, schoolId: "x", snaps: 0, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
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
    expect(s.injuries).toEqual([{ kind: "injury", injuryType: "acl", remainingPhases: 4, restoreAmount: 12 }]);
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
      { kind: "suspension", injuryType: "suspension", remainingPhases: 2, restoreAmount: 0 },
    ]);
    expect(s.overall).toBe(overallBefore);
  });

  it("applies a permanent-timing overall delta immediately without queuing", () => {
    const s = fresh();
    applyEffect(s, { kind: "overall", timing: "immediate", amount: 5 }, injuryOf);
    expect(s.overall).toBe(65);
    expect(s.pendingEffects.length).toBe(0);
  });

  it("tags injury vs suspension entries with a kind discriminator", () => {
    const injuryOf: InjuryLookup = () => ({ overallDelta: 4, recoveryPhases: 2 });

    const hurt = fresh();
    applyEffect(hurt, { kind: "injury", injuryType: "ankle" }, injuryOf);
    expect(hurt.injuries[0]!.kind).toBe("injury");

    const banned = fresh();
    applyEffect(banned, { kind: "suspension", phases: 1 }, injuryOf);
    expect(banned.injuries[0]!.kind).toBe("suspension");
    expect(banned.injuries[0]!.restoreAmount).toBe(0);
    expect(isSidelined(banned)).toBe(true);
  });
});

describe("flushPendingEffects", () => {
  it("applies effects that are not yet due and empties the queue", () => {
    const s = fresh();
    s.phaseAbs = 2;
    applyEffect(s, { kind: "overall", timing: "deferred", amount: -4, delayPhases: 3 }, injuryOf);
    expect(s.overall).toBe(60);
    expect(s.pendingEffects).toHaveLength(1);

    flushPendingEffects(s, injuryOf);

    expect(s.overall).toBe(56);
    expect(s.pendingEffects).toEqual([]);
  });

  it("does not re-queue a deferred effect it just applied", () => {
    const s = fresh();
    applyEffect(s, { kind: "overall", timing: "deferred", amount: -2 }, injuryOf);
    flushPendingEffects(s, injuryOf);
    expect(s.pendingEffects).toEqual([]);
    expect(s.overall).toBe(58);
  });

  it("is a no-op on an empty queue", () => {
    const s = fresh();
    flushPendingEffects(s, injuryOf);
    expect(s.overall).toBe(60);
    expect(s.pendingEffects).toEqual([]);
  });
});

describe("careerInjuries", () => {
  it("counts every injury applied, including repeats of the same type", () => {
    const s = fresh();
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf);
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf);
    expect(s.careerInjuries).toBe(2);
  });

  it("keeps counting after an injury heals", () => {
    const s = fresh();
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf);
    s.injuries = [];
    expect(s.careerInjuries).toBe(1);
  });

  it("does not count suspensions", () => {
    const s = fresh();
    applyEffect(s, { kind: "suspension", phases: 2 }, injuryOf);
    expect(s.careerInjuries).toBe(0);
  });
});
