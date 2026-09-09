import { describe, it, expect } from "vitest";
import { schoolTraitOf } from "./school-effects";
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
