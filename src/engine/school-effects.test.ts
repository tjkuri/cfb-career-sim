import { describe, it, expect } from "vitest";
import { schoolTraitOf, schoolSnapModifier } from "./school-effects";
import { createCareer } from "./create-career";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const SETUP: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("schoolTraitOf", () => {
  it("returns undefined at Signing Day, when the player has no school yet", () => {
    const s = createCareer(SETUP, "trait-lookup");
    expect(s.school.schoolId).toBe("");
    expect(schoolTraitOf(s, CONTENT)).toBeUndefined();
  });

  it("returns undefined for a school id that is not in the ladder", () => {
    const s = createCareer(SETUP, "trait-lookup");
    s.school = { schoolId: "not-a-real-school", tier: 2 };
    expect(schoolTraitOf(s, CONTENT)).toBeUndefined();
  });

  // Skipped: no school carries a trait until Task 4 assigns them. This is the
  // guard that Task 4 actually happened — un-skip it there.
  it.skip("returns the trait of the current school", () => {
    const traited = CONTENT.schools.find((x) => x.trait !== undefined);
    expect(traited, "no school carries a trait — Task 4 assigns them").toBeDefined();
    const s = createCareer(SETUP, "trait-lookup");
    s.school = { schoolId: traited!.id, tier: traited!.tier };
    expect(schoolTraitOf(s, CONTENT)).toBe(traited!.trait);
  });
});

describe("schoolSnapModifier", () => {
  it("is 1 for an untraited school", () => {
    const plain = CONTENT.schools.find((x) => x.trait === undefined)!;
    const s = createCareer(SETUP, "snapmod");
    s.school = { schoolId: plain.id, tier: plain.tier };
    expect(schoolSnapModifier(s, CONTENT)).toBe(1);
  });

  it("is 1 at Signing Day, before the player has a school", () => {
    const s = createCareer(SETUP, "snapmod");
    expect(schoolSnapModifier(s, CONTENT)).toBe(1);
  });

  it("applies the wideOpen bonus for as long as the player is enrolled, not just year one", () => {
    // No school carries a trait until Task 4, and a unit test of an engine
    // mechanic should not depend on content assignment anyway. Inject the
    // trait onto a real school locally instead.
    const WIDE_ID = "unt";
    const wideContent = {
      ...CONTENT,
      schools: CONTENT.schools.map((s) => (s.id === WIDE_ID ? { ...s, trait: "wideOpen" as const } : s)),
    };
    // The benefit is deliberately NOT tenure-keyed: it is paired with an
    // ongoing injury cost, and a one-shot benefit against an ongoing cost is
    // farmable by hopping between wideOpen schools (a lateral transfer offer
    // is generated every single offseason).
    const wide = wideContent.schools.find((x) => x.id === WIDE_ID)!;
    const s = createCareer(SETUP, "snapmod");
    s.school = { schoolId: wide.id, tier: wide.tier };
    const expected = wideContent.schoolTraits.wideOpen.snapModifier;
    for (const seasonsPlayed of [0, 1, 2, 3]) {
      s.seasons = Array.from({ length: seasonsPlayed }, (_, i) => ({
        seasonIndex: i, schoolId: wide.id, snaps: 400, stats: {}, teamWins: 6, teamLosses: 6,
      }));
      expect(schoolSnapModifier(s, wideContent), `season ${seasonsPlayed}`).toBe(expected);
    }
  });
});
