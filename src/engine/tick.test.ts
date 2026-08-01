import { describe, it, expect } from "vitest";
import { tickPhaseStart, isSidelined, applyEffect, type InjuryLookup } from "./effects";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };
const injuryOf: InjuryLookup = () => ({ overallDelta: 10, recoveryPhases: 2 });

describe("tickPhaseStart", () => {
  it("fires deferred effects whose firePhaseAbs has arrived, once", () => {
    const s = createCareer(setup, "s");
    s.phaseAbs = 5;
    s.pendingEffects.push({ effect: { kind: "overall", timing: "deferred", amount: -6 }, firePhaseAbs: 5 });
    s.pendingEffects.push({ effect: { kind: "overall", timing: "deferred", amount: -2 }, firePhaseAbs: 9 });
    tickPhaseStart(s, injuryOf);
    expect(s.overall).toBe(54); // 60 - 6; the +9 one has not fired
    expect(s.pendingEffects).toEqual([
      { effect: { kind: "overall", timing: "deferred", amount: -2 }, firePhaseAbs: 9 },
    ]);
    // ticking again does not re-apply
    tickPhaseStart(s, injuryOf);
    expect(s.overall).toBe(54);
  });

  it("decrements injuries, heals (restores overall) and clears them when done", () => {
    const s = createCareer(setup, "s");
    applyEffect(s, { kind: "injury", injuryType: "acl" }, injuryOf); // overall 50, remaining 2
    expect(s.overall).toBe(50);
    expect(isSidelined(s)).toBe(true);
    tickPhaseStart(s, injuryOf); // remaining -> 1, still injured, no restore yet
    expect(s.injuries[0]!.remainingPhases).toBe(1);
    expect(s.overall).toBe(50);
    tickPhaseStart(s, injuryOf); // remaining -> 0, heal now, restore +10, clear
    expect(s.injuries).toEqual([]);
    expect(s.overall).toBe(60);
    expect(isSidelined(s)).toBe(false);
  });

  it("suspensions expire without restoring overall", () => {
    const s = createCareer(setup, "s");
    applyEffect(s, { kind: "suspension", phases: 1 }, injuryOf);
    expect(isSidelined(s)).toBe(true);
    tickPhaseStart(s, injuryOf);
    expect(s.injuries).toEqual([]);
    expect(s.overall).toBe(60);
  });
});
