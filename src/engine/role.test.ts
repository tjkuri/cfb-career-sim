import { describe, it, expect } from "vitest";
import { CAPTAIN_REP, STARTER_BAR, isCaptain, roleOf } from "./role";
import { wheelOdds, wheelParts } from "./big-game";

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

  it("widens a captain's wedge on the wheel", () => {
    expect(wheelOdds("even", wheelParts("even", 75, false, true))).toBeCloseTo(0.5);
    expect(wheelOdds("even", wheelParts("even", 75, false, false))).toBeCloseTo(0.45);
  });
});
