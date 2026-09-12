import { describe, it, expect } from "vitest";
import { traitsExperienced } from "./trait-probe";
import { createCareer } from "../engine/index";
import type { GameState, Setup } from "../engine/index";
// SeasonLine is not re-exported by the engine barrel; content modules import
// straight from ./types for the same reason.
import type { SeasonLine } from "../engine/types";
import { playCareer } from "./play-headless";
import { randomPolicy } from "./policies";
import { CONTENT } from "../content/index";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

// A season line is only ever read for its `schoolId` by traitsExperienced, but
// build whole ones so this test keeps compiling honestly if SeasonLine grows.
function seasonAt(seasonIndex: number, schoolId: string): SeasonLine {
  return { seasonIndex, schoolId, snaps: 480, stats: {}, teamWins: 6, teamLosses: 6 };
}

// Start from a real career so every GameState field is populated by the engine
// rather than cast into existence, then overwrite only the season history.
function careerWithSeasons(seasons: SeasonLine[]): GameState {
  return { ...createCareer(setup, "trait-probe-test"), seasons };
}

describe("traitsExperienced", () => {
  // The entire wideOpen calibration rests on this: a career counts as treated
  // if it EVER attended a traited school, even for one season of several. Task
  // 6 read the wideOpen-vs-untraited bucket gap off this function, so a
  // regression here would silently invalidate those numbers rather than fail.
  it("reports a trait attended in only one season of a multi-season career", () => {
    // "unt" (North Texas) carries wideOpen; "utsa" is untraited, same tier.
    const s = careerWithSeasons([seasonAt(0, "unt"), seasonAt(1, "utsa")]);
    expect(traitsExperienced(s).has("wideOpen")).toBe(true);
  });

  it("still reports it when the traited season is the last one, not the first", () => {
    const s = careerWithSeasons([seasonAt(0, "utsa"), seasonAt(1, "unt")]);
    expect(traitsExperienced(s).has("wideOpen")).toBe(true);
  });

  it("returns an empty set for a career with no traited season", () => {
    const s = careerWithSeasons([seasonAt(0, "utsa"), seasonAt(1, "memphis")]);
    expect(traitsExperienced(s).size).toBe(0);
  });

  it("deduplicates a trait attended across several seasons", () => {
    // Two different wideOpen schools plus a repeat: still one trait.
    const s = careerWithSeasons([seasonAt(0, "unt"), seasonAt(1, "temple"), seasonAt(2, "unt")]);
    expect([...traitsExperienced(s)]).toEqual(["wideOpen"]);
  });

  it("returns an empty set for a career with no seasons at all", () => {
    expect(traitsExperienced(careerWithSeasons([])).size).toBe(0);
  });
});

// Finding 4 / spec §8's whole-career isolation check. The handoff cited this
// as an existing guard ("Task 9's whole-career isolation check"); it had only
// ever been run once by hand (seed "iso-check-0", never committed) — this is
// that check, committed. It must filter on every school the career attended,
// not just the one it signed with, which is exactly what traitsExperienced
// does (it walks the whole season history, not just seasons[0]).
describe("whole-career seeded stability (Finding 4)", () => {
  it("produces an identical final state against a trait-stripped bundle, for a career that never attends a traited school", () => {
    const isoSetup: Setup = { lastName: "Iso", jerseyNumber: 1, homeState: "TX", position: "QB" };
    const seed = "iso-check-0";
    const real = playCareer(isoSetup, seed, randomPolicy);
    // Confirms the premise rather than assuming it: if content ever shifts so
    // this seed's career DOES attend a wideOpen school, the test should fail
    // loudly, not silently compare two runs that were never isolated at all.
    expect(traitsExperienced(real).size).toBe(0);

    const stripped = { ...CONTENT, schools: CONTENT.schools.map((s) => ({ ...s, trait: undefined })) };
    const strippedRun = playCareer(isoSetup, seed, randomPolicy, stripped);
    expect(strippedRun).toEqual(real);
  });
});
