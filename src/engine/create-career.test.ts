import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Smith", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("createCareer", () => {
  it("starts every player at the fixed baseline", () => {
    const s = createCareer(setup, "seed");
    expect(s.overall).toBe(60);
    expect(s.character).toBe(70);
    expect(s.eligibility.classYear).toBe("FR");
    expect(s.eligibility.draftEligible).toBe(false);
  });

  it("starts in the offseason with no school and awaiting the recruiting event", () => {
    const s = createCareer(setup, "seed");
    expect(s.phase).toBe("offseason");
    expect(s.seasonIndex).toBe(0);
    expect(s.phaseAbs).toBe(0);
    expect(s.school.schoolId).toBe("");
    expect(s.currentEventId).toBe("recruiting");
    expect(s.status).toBe("active");
  });

  it("carries the seed and starts the rng cursor at 0", () => {
    const s = createCareer(setup, "abc");
    expect(s.seed).toBe("abc");
    expect(s.rngCursor).toBe(0);
  });

  it("initializes empty records", () => {
    const s = createCareer(setup, "seed");
    expect(s.seasons).toEqual([]);
    expect(s.awards).toEqual([]);
    expect(s.moments).toEqual([]);
    expect(s.trophies).toEqual({});
    expect(s.pendingEffects).toEqual([]);
    expect(s.injuries).toEqual([]);
  });
});
