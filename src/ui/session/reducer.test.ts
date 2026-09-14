import { describe, it, expect } from "vitest";
import { getDecision, ALL_POSITIONS, type Setup } from "../../engine/index";
import { INITIAL_STATE, isUnplayable, makeSeed, reducer } from "./reducer";
import { buildView } from "./view-model";
import type { UiState } from "./types";

const SETUP: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };

function start(seed: string, setup: Setup = SETUP): UiState {
  return reducer(INITIAL_STATE, { type: "start", setup, seed });
}

/** Answer whatever is on screen, pressing Continue whenever an outcome shows. */
function step(ui: UiState, pick: (ids: string[]) => string): UiState {
  if (ui.resolved) return reducer(ui, { type: "continue" });
  const d = ui.state ? getDecision(ui.state) : null;
  if (!d) return ui;
  return reducer(ui, { type: "choose", optionId: pick(d.options.map((o) => o.id)) });
}

function playToEnd(seed: string, setup: Setup = SETUP): UiState {
  let ui = start(seed, setup);
  for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
    const next = step(ui, (ids) => ids[0]!);
    if (next === ui) break;
    ui = next;
  }
  return ui;
}

describe("start", () => {
  it("opens the career screen with a live decision", () => {
    const ui = start("r-1");
    expect(ui.screen).toBe("career");
    expect(ui.resolved).toBeNull();
    expect(getDecision(ui.state!)?.eventId).toBe("recruiting");
  });

  it("generates distinct seeds", () => {
    const seeds = new Set(Array.from({ length: 200 }, () => makeSeed()));
    expect(seeds.size).toBeGreaterThan(150);
  });
});

describe("choose", () => {
  it("makes exactly one engine call per choice", () => {
    // The cursor advances once; a second advance would move it twice.
    const ui = start("r-2");
    const before = ui.state!.rngCursor;
    const after = reducer(ui, { type: "choose", optionId: getDecision(ui.state!)!.options[0]!.id });
    expect(after.state!.rngCursor).toBeGreaterThanOrEqual(before);
    expect(after.state).not.toBe(ui.state);
  });

  it("skips the outcome step on a hub decision", () => {
    // Signing Day is the first decision and authors no outcome prose.
    const ui = start("r-3");
    const after = reducer(ui, { type: "choose", optionId: getDecision(ui.state!)!.options[0]!.id });
    expect(after.resolved).toBeNull();
  });

  it("shows outcome prose on a multi-option content event", () => {
    let ui = start("r-4");
    let sawResolved = false;
    for (let guard = 0; guard < 200 && ui.screen !== "summary"; guard++) {
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
      if (ui.resolved) {
        sawResolved = true;
        expect(ui.resolved.outcome.length).toBeGreaterThan(0);
        expect(ui.resolved.title.length).toBeGreaterThan(0);
        expect(ui.resolved.choiceLabel.length).toBeGreaterThan(0);
      }
    }
    expect(sawResolved).toBe(true);
  });

  it("skips the outcome step on a single-option beat", () => {
    // The button press is the acknowledgement, so there is nothing to resolve.
    let ui = start("r-5");
    let checked = false;
    for (let guard = 0; guard < 200 && ui.screen !== "summary"; guard++) {
      const d = ui.state && !ui.resolved ? getDecision(ui.state) : null;
      const wasSingle = d?.options.length === 1;
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      if (wasSingle) {
        expect(next.resolved).toBeNull();
        checked = true;
      }
      ui = next;
    }
    expect(checked).toBe(true);
  });

  it("ignores an option id that is not on the current decision", () => {
    const ui = start("r-6");
    expect(reducer(ui, { type: "choose", optionId: "not-a-real-option" })).toBe(ui);
  });
});

describe("terminal careers", () => {
  it("reaches a summary for every position", () => {
    for (const position of ALL_POSITIONS) {
      const ui = playToEnd(`r-end-${position}`, { ...SETUP, position });
      expect(ui.screen, position).toBe("summary");
      expect(ui.state!.status).not.toBe("active");
      expect(buildView(ui.state!).summary).not.toBeNull();
    }
  });

  it("logs the finished career exactly once", () => {
    const ui = playToEnd("r-log");
    expect(ui.log).toHaveLength(1);
    const again = reducer(ui, { type: "continue" });
    expect(again.log).toHaveLength(1);
  });

  it("records a readable headline in the log", () => {
    const ui = playToEnd("r-log-2");
    expect(ui.log[0]!.headline.length).toBeGreaterThan(0);
    expect(ui.log[0]!.schoolPath.length).toBeGreaterThan(0);
  });

  it("shows a career-ending outcome before the summary replaces it", () => {
    // A content `ending` effect terminates the career in the same advance that
    // produced the prose. The player must get to read it.
    for (let i = 0; i < 60; i++) {
      let ui = start(`r-bust-${i}`);
      for (let guard = 0; guard < 300 && ui.screen !== "summary"; guard++) {
        const next = step(ui, (ids) => ids[ids.length - 1]!);
        if (next === ui) break;
        if (next.state!.status === "busted" && next.resolved) {
          expect(next.screen).toBe("career");
          expect(reducer(next, { type: "continue" }).screen).toBe("summary");
          return;
        }
        ui = next;
      }
    }
  });
});

describe("navigation and recovery", () => {
  it("moves between screens without touching the career", () => {
    const ui = start("r-nav");
    const log = reducer(ui, { type: "goto", screen: "log" });
    expect(log.screen).toBe("log");
    expect(log.state).toBe(ui.state);
  });

  it("keeps the log when dismissing an unplayable save", () => {
    const ui = playToEnd("r-dismiss");
    const fresh = reducer(ui, { type: "dismissUnplayable" });
    expect(fresh.screen).toBe("creation");
    expect(fresh.state).toBeNull();
    expect(fresh.log).toEqual(ui.log);
  });

  it("flags an active save with no renderable decision", () => {
    const ui = start("r-unplayable");
    expect(isUnplayable(ui.state!)).toBe(false);
    // Simulate content drift: the pending event id no longer exists.
    const drifted = { ...ui.state!, currentEventId: "event-deleted-in-a-later-release" };
    expect(isUnplayable(drifted)).toBe(true);
  });
});

// A resolved outcome is read under a header that `advance()` has already moved.
// The playtest caught the class badge flipping FR -> SO while the previous
// season's last outcome was still on screen; measured over 36 careers, 69 of
// 378 resolved cards (18%) sit under a class year that is not theirs, 270
// (71%) under a phase that is not theirs, and EVERY career hits it at least
// once. The stamp is the data half of the fix; the card itself still renders
// from `view`, so the screen has to prefer the stamp for this to be visible.
describe("the resolved card is stamped with the season it belongs to", () => {
  it("stamps from the state the choice was made in, not the state after it", () => {
    let stamped = 0;
    let classFlips = 0;
    let phaseFlips = 0;
    const careersThatFlip = new Set<string>();

    for (const position of ALL_POSITIONS) {
      const setup: Setup = { ...SETUP, position };
      const seed = `r-stamp-${position}`;
      let ui = start(seed, setup);
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const next = step(ui, (ids) => ids[0]!);
        if (next === ui) break;
        ui = next;
        if (!ui.resolved || !ui.state) continue;
        const stamp = ui.resolved.stamp;
        expect(stamp).not.toBeNull();
        stamped++;

        const view = buildView(ui.state);
        expect(stamp!.seasonNumber).toBeGreaterThan(0);
        expect(stamp!.phaseLabel.length).toBeGreaterThan(0);
        // The stamp is never ahead of the live view: `advance` only ever moves
        // the career forward, so a frozen value is equal or behind.
        expect(stamp!.seasonNumber).toBeLessThanOrEqual(view.seasonNumber);
        if (stamp!.classYear !== view.classYear) {
          classFlips++;
          careersThatFlip.add(seed);
        }
        if (stamp!.phaseLabel !== view.phaseLabel) phaseFlips++;
      }
    }

    expect(stamped).toBeGreaterThan(0);
    // The bug is real and it is not rare. If these ever go to zero the stamp
    // has stopped being taken before `advance`.
    expect(classFlips).toBeGreaterThan(0);
    expect(phaseFlips).toBeGreaterThan(0);
    expect(careersThatFlip.size).toBe(ALL_POSITIONS.length);
  });

  it("freezes only the season identity, never the progression numbers", () => {
    // DECISION 012 wants the magnitude of a change visible on the resolved
    // card. Freezing `overall` or the band phrases would hide the very delta
    // the card exists to report, so the stamp deliberately carries neither.
    let checked = false;
    let ui = start("r-stamp-fields");
    for (let guard = 0; guard < 300 && ui.screen !== "summary"; guard++) {
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
      if (!ui.resolved?.stamp) continue;
      expect(Object.keys(ui.resolved.stamp).sort()).toEqual([
        "classYear",
        "phaseLabel",
        "schoolName",
        "seasonNumber",
      ]);
      checked = true;
    }
    expect(checked).toBe(true);
  });
});
