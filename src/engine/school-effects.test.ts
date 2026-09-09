import { describe, it, expect } from "vitest";
import { schoolTraitOf, schoolSnapModifier, rollAmbientInjury } from "./school-effects";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import { INJURIES } from "../content/injuries";
import type { Setup } from "./types";

const injuryOf = (t: string) => INJURIES[t]!;

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

  it("returns the trait of the current school", () => {
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

describe("rollAmbientInjury", () => {
  // No school carries a trait until Task 4, and a unit test of an engine
  // mechanic should not depend on content assignment anyway. Inject the
  // trait onto a real school locally, same as schoolSnapModifier's test above.
  const WIDE_ID = "unt";
  const wideContent = {
    ...CONTENT,
    schools: CONTENT.schools.map((s) => (s.id === WIDE_ID ? { ...s, trait: "wideOpen" as const } : s)),
  };

  it("consumes no RNG at an untraited school, so those careers are bit-for-bit unchanged", () => {
    // The whole point of gating the draw on the trait: a career that never
    // attends a traited school must consume exactly the RNG it consumed before
    // this feature existed.
    const plain = CONTENT.schools.find((x) => x.trait === undefined)!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: plain.id, tier: plain.tier };
    const rng = createRng("ambient");
    rollAmbientInjury(s, CONTENT, rng, injuryOf);
    expect(rng.cursor).toBe(0);
    expect(s.injuries).toHaveLength(0);
  });

  it("never fires when the probability is 0, and consumes no draw", () => {
    const wide = wideContent.schools.find((x) => x.id === WIDE_ID)!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: wide.id, tier: wide.tier };
    const content = { ...wideContent, schoolTraits: { ...wideContent.schoolTraits, wideOpen: { ...wideContent.schoolTraits.wideOpen, injuryProbPerPhase: 0 } } };
    const rng = createRng("ambient");
    rollAmbientInjury(s, content, rng, injuryOf);
    expect(rng.cursor).toBe(0);
    expect(s.injuries).toHaveLength(0);
  });

  it("always fires at probability 1 and applies a real injury from the configured list", () => {
    const wide = wideContent.schools.find((x) => x.id === WIDE_ID)!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: wide.id, tier: wide.tier };
    const content = { ...wideContent, schoolTraits: { ...wideContent.schoolTraits, wideOpen: { ...wideContent.schoolTraits.wideOpen, injuryProbPerPhase: 1 } } };
    const before = s.overall;
    rollAmbientInjury(s, content, createRng("ambient"), injuryOf);
    expect(s.injuries).toHaveLength(1);
    expect(content.schoolTraits.wideOpen.injuryTypes).toContain(s.injuries[0]!.injuryType);
    expect(s.careerInjuries).toBe(1);
    expect(s.overall).toBeLessThan(before);
  });

  it("does not stack a second injury on an already-sidelined player", () => {
    const wide = wideContent.schools.find((x) => x.id === WIDE_ID)!;
    const s = createCareer(SETUP, "ambient");
    s.school = { schoolId: wide.id, tier: wide.tier };
    s.injuries.push({ kind: "injury", injuryType: "ankle", remainingPhases: 2, restoreAmount: 5 });
    const content = { ...wideContent, schoolTraits: { ...wideContent.schoolTraits, wideOpen: { ...wideContent.schoolTraits.wideOpen, injuryProbPerPhase: 1 } } };
    rollAmbientInjury(s, content, createRng("ambient"), injuryOf);
    expect(s.injuries).toHaveLength(1);
  });
});
