import { describe, it, expect } from "vitest";
import { CAPTAIN_REP, STARTER_BAR, isCaptain, roleOf } from "./role";
import { bigGameOdds } from "./big-game";

describe("the captain's C", () => {
  it("goes to Rep at or above the bar, and goes away with it", () => {
    expect(isCaptain({ character: CAPTAIN_REP })).toBe(true);
    expect(isCaptain({ character: CAPTAIN_REP - 1 })).toBe(false);
  });

  it("wins a depth-chart tie: a captain just under the starter bar starts", () => {
    const overall = STARTER_BAR[3] - 2;
    expect(roleOf({ overall, character: CAPTAIN_REP }, 3)).toBe("starter");
    expect(roleOf({ overall, character: CAPTAIN_REP - 1 }, 3)).toBe("rotation");
  });

  it("does not make a backup a starter", () => {
    const overall = STARTER_BAR[4] - 9;
    expect(roleOf({ overall, character: 100 }, 4)).toBe("rotation");
  });

  it("leans the last snap a captain's way", () => {
    expect(bigGameOdds(75, 0.55, false, true)).toBeCloseTo(0.6);
    expect(bigGameOdds(75, 0.55, false, false)).toBeCloseTo(0.55);
  });
});
