import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { advance } from "./advance";
import type { GameState, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

// A career sitting on the declare decision with a deferred penalty queued far
// enough out that no tickPhaseStart will ever reach it. This is the shape a
// postseason `deferred` effect leaves behind when the player declares.
function aboutToDeclare(): GameState {
  const s = createCareer(setup, "flush-seed");
  s.currentEventId = "declare";
  s.eligibility.draftEligible = true;
  s.phaseAbs = 4;
  s.pendingEffects = [
    { effect: { kind: "overall", timing: "deferred", amount: -6 }, firePhaseAbs: 99 },
  ];
  return s;
}

describe("pending effects at career end", () => {
  it("lands a queued deferred effect when the player declares", () => {
    const s = advance(aboutToDeclare(), "declare");
    expect(s.status).toBe("drafted");
    expect(s.pendingEffects).toEqual([]);
    expect(s.overall).toBe(54); // 60 - 6
  });

  it("charges the draft result for the flushed penalty", () => {
    const withPenalty = advance(aboutToDeclare(), "declare");

    const clean = aboutToDeclare();
    clean.pendingEffects = [];
    const withoutPenalty = advance(clean, "declare");

    expect(withPenalty.draftResult!.draftStock)
      .toBeLessThan(withoutPenalty.draftResult!.draftStock);
  });
});
