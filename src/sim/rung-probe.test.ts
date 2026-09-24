import { describe, it, expect } from "vitest";
import {
  OLD_TRUST_BAND_FLOORS,
  rungOf,
  scoreTrail,
  summarizeRungs,
  traceCharacter,
  type BandFloor,
} from "./rung-probe";
import { TRUST_BAND_FLOORS } from "./human-lazy-probe";
import { trustPhrase, trustRungOf } from "../ui/session/bands";
import { makePolicy, PROFILES } from "./policies";
import { STARTING_CHARACTER } from "../engine/create-career";
import type { Setup } from "../engine/index";

const SETUP: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };

describe("rungOf", () => {
  // The whole probe is an argument about which rung a number is on, so it has
  // to agree with the function the player's screen actually calls. If these
  // ever diverge the measurement is describing a ladder that is not shipped.
  it("agrees with the UI ladder across the whole legal range", () => {
    for (let c = 0; c <= 100; c++) {
      expect(rungOf(TRUST_BAND_FLOORS, c), `character ${c}`).toBe(trustRungOf(trustPhrase(c)));
    }
  });

  it("keeps the old calibration available for a side-by-side", () => {
    // The point of holding both tables is that they DISAGREE; a copy that had
    // silently been refreshed to the new numbers would make every before/after
    // in report 054 vacuous.
    expect(OLD_TRUST_BAND_FLOORS.map((b) => b.min)).not.toEqual(TRUST_BAND_FLOORS.map((b) => b.min));
    expect(OLD_TRUST_BAND_FLOORS.map((b) => b.phrase)).toEqual(TRUST_BAND_FLOORS.map((b) => b.phrase));
  });
});

describe("scoreTrail", () => {
  const bands: BandFloor[] = [
    { min: 80, phrase: "top" },
    { min: 66, phrase: "trusted" },
    { min: 50, phrase: "guy" },
    { min: 30, phrase: "problem" },
    { min: 0, phrase: "gone" },
  ];

  it("reports nothing for a career that stays inside one band", () => {
    const t = scoreTrail(bands, [70, 69, 71, 68, 70]);
    expect(t.moves).toBe(0);
    expect(t.firstMove).toBeNull();
    expect(t.firstMoveAt).toBeNull();
    expect(t.finalRung).toBe(1);
    expect(t.everTop).toBe(false);
  });

  it("names the direction and the click of the FIRST change only", () => {
    // Down on click 2, back up later: the playtester's career shape. Both are
    // counted, but only the first one sets `firstMove` -- "was the first thing
    // the ladder ever did to you a fall" is the question B81 was opened over.
    const t = scoreTrail(bands, [70, 70, 64, 64, 72]);
    expect(t.firstMove).toBe("down");
    expect(t.firstMoveAt).toBe(2);
    expect(t.moves).toBe(2);
    expect(t.ups).toBe(1);
    expect(t.downs).toBe(1);
    expect(t.finalRung).toBe(1);
  });

  it("separates touching the top rung from finishing on it", () => {
    const t = scoreTrail(bands, [70, 82, 70]);
    expect(t.everTop).toBe(true);
    expect(t.endsTop).toBe(false);
    expect(t.finalRung).toBe(1);
  });

  it("counts a multi-rung jump as one change, because the ladder has no distance", () => {
    // DECISION 002 / 046: nothing downstream may render how FAR the marker
    // moved, so the probe must not smuggle a magnitude in as a count either.
    const t = scoreTrail(bands, [70, 20]);
    expect(t.moves).toBe(1);
    expect(t.downs).toBe(1);
    expect(t.finalRung).toBe(4);
  });
});

describe("traceCharacter", () => {
  it("starts on the value a fresh career is created with", () => {
    const trail = traceCharacter(SETUP, "rung-probe-1", makePolicy(PROFILES.good));
    expect(trail[0]).toBe(STARTING_CHARACTER);
    expect(trail.length).toBeGreaterThan(1);
  });

  it("is deterministic for a seed", () => {
    const policy = makePolicy(PROFILES.baselineRandom);
    expect(traceCharacter(SETUP, "rung-probe-2", policy)).toEqual(
      traceCharacter(SETUP, "rung-probe-2", policy),
    );
  });
});

describe("summarizeRungs", () => {
  it("returns an occupancy vector that sums to one", () => {
    const policy = makePolicy(PROFILES.baselineRandom);
    const traces = Array.from({ length: 40 }, (_, i) =>
      scoreTrail(TRUST_BAND_FLOORS, traceCharacter(SETUP, `rung-probe-s${i}`, policy)),
    );
    const r = summarizeRungs("baselineRandom", "QB", TRUST_BAND_FLOORS, traces);
    expect(r.finalOccupancy).toHaveLength(5);
    expect(r.finalOccupancy.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(r.topEverRate).toBeGreaterThanOrEqual(r.topEndRate);
  });
});
