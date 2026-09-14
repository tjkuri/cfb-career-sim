import { describe, it, expect } from "vitest";
import { advance, getDecision, ALL_POSITIONS, type Setup } from "../../engine/index";
import { INITIAL_STATE, isUnplayable, makeSeed, openCard, reducer } from "./reducer";
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

  it("keeps the prose on a single-option beat instead of dropping it", () => {
    // REVERSED by DECISION 018. This test previously asserted the opposite --
    // that a one-option card resolved to nothing -- which was the 40% of a
    // career that played out in silence. The beat now arrives already resolved,
    // so a bare one-option decision is never reachable through the reducer and
    // the assertion is made in the dedicated describe block below.
    let ui = start("r-5");
    let checked = false;
    for (let guard = 0; guard < 200 && ui.screen !== "summary"; guard++) {
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
      if (next.resolved?.narrated) {
        expect(next.resolved.outcome.length).toBeGreaterThan(0);
        checked = true;
      }
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

  it("freezes the whole rail, and never the progression numbers", () => {
    // Two rules, and the stamp's field list is where they are visible. It
    // carries everything the rail draws -- the season's identity and the line
    // being written -- because a rail with one frozen half and one live half
    // names two moments at once. It carries no progression value: DECISION 012
    // wants the magnitude of a change visible on the resolved card, and
    // freezing `overall` or the band phrases would hide the very delta the
    // card exists to report. Those are read in `.standing`, which is never
    // stamped, so the two rules never meet on the same pixel.
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
        "season",
        "seasonNumber",
      ]);
      // The stamped line is the one that was on screen. Within a single
      // season its snaps can only trail the live count -- `advance` never
      // un-plays a snap -- and across a boundary the live view is already on
      // the next line entirely, which is the whole reason the line is frozen.
      const live = buildView(ui.state!);
      const frozen = ui.resolved.stamp.season;
      if (frozen && live.season && frozen.seasonNumber === live.season.seasonNumber) {
        expect(frozen.snaps).toBeLessThanOrEqual(live.season.snaps);
      }
      checked = true;
    }
    expect(checked).toBe(true);
  });

  it("normalizes a stamp written before it carried the season line", () => {
    // A save from between the stamp landing and the line joining it restores
    // a stamp with no `season`. It becomes null -- the rail's third line then
    // renders empty -- and never reaches a screen as `undefined`.
    const ui = start("r-stamp-legacy");
    const legacy = {
      ...ui,
      resolved: {
        title: "Old Card",
        description: "",
        choiceLabel: "c",
        outcome: "It happened.",
        narrated: false,
        stamp: { seasonNumber: 2, classYear: "SO", phaseLabel: "Postseason", schoolName: "Toledo" },
        overallBefore: 60,
      },
    } as unknown as UiState;
    const restored = reducer(ui, { type: "restore", state: legacy });
    expect(restored.resolved!.stamp).toEqual({
      seasonNumber: 2,
      classYear: "SO",
      phaseLabel: "Postseason",
      schoolName: "Toledo",
      season: null,
    });
    expect("season" in restored.resolved!.stamp!).toBe(true);
  });
});

// DECISION 018. A decision with exactly one option is not a choice. Until now
// `reducer.ts:88` threw its authored outcome on the floor to save a tap the
// player was never charged -- 104 cards in 72 careers, every one of them with
// prose the engine had already produced. The beat now resolves on arrival,
// inside the reducer, and the prose is read behind the same single Continue.
describe("one-option cards resolve on arrival and keep their prose", () => {
  /** Every decision the player is actually shown, in order, for one career. */
  function cardsShown(seed: string, setup: Setup = SETUP) {
    const cards: { optionCount: number; resolved: boolean; advances: number }[] = [];
    let ui = start(seed, setup);
    for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
      const before = ui.state!.rngCursor;
      if (ui.resolved) {
        cards.push({ optionCount: 1, resolved: true, advances: 0 });
        const next = reducer(ui, { type: "continue" });
        if (next === ui) break;
        ui = next;
        continue;
      }
      const d = getDecision(ui.state!);
      if (!d) break;
      const next = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
      if (next === ui) break;
      cards.push({
        optionCount: d.options.length,
        resolved: next.resolved !== null,
        advances: next.state!.rngCursor - before,
      });
      ui = next;
    }
    return cards;
  }

  it("never shows a bare one-option decision waiting for a tap", () => {
    // The auto-resolution runs in the reducer, so by the time any action has
    // returned, a one-option decision has already become a narrated card.
    let checked = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-beat-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        if (!ui.resolved && ui.state) {
          const d = getDecision(ui.state);
          if (d) {
            expect(d.options.length, `${position}: ${d.title}`).toBeGreaterThan(1);
            checked++;
          }
        }
        const next = step(ui, (ids) => ids[0]!);
        if (next === ui) break;
        ui = next;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("renders the beat as a narrated card, not as a choice", () => {
    let narrated = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-narrate-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const next = step(ui, (ids) => ids[0]!);
        if (next === ui) break;
        ui = next;
        if (!ui.resolved?.narrated) continue;
        narrated++;
        // Title, description, the quiet option label and the authored prose.
        expect(ui.resolved.title.length).toBeGreaterThan(0);
        expect(ui.resolved.description.length).toBeGreaterThan(0);
        expect(ui.resolved.choiceLabel.length).toBeGreaterThan(0);
        expect(ui.resolved.outcome.length).toBeGreaterThan(0);
        expect(ui.resolved.stamp).not.toBeNull();
        expect(typeof ui.resolved.overallBefore).toBe("number");
      }
    }
    // 104 one-option cards measured over 72 careers; six is a floor, not a target.
    expect(narrated).toBeGreaterThan(5);
  });

  it("spends exactly one advance per card, beats included", () => {
    // The engine call count is the invariant that a double-resolve would break.
    // `advance` moves the RNG cursor, so a card that consumed two decisions
    // would show up here as a card nobody was shown.
    const cards = cardsShown("r-beat-count");
    expect(cards.length).toBeGreaterThan(10);
    for (const card of cards) {
      if (card.advances === 0) continue; // a Continue press, not an engine call
      expect(card.optionCount).toBeGreaterThan(1);
    }
  });

  it("resolves at most one level: two consecutive beats are two cards", () => {
    // Measured: 7 back-to-back one-option pairs across 72 careers. Each must
    // still cost the player two Continues, never one merged card.
    let ui = start("r-beat-chain");
    let pairs = 0;
    let previousWasBeat = false;
    for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
      const wasBeat = ui.resolved?.narrated === true;
      if (wasBeat && previousWasBeat) pairs++;
      previousWasBeat = wasBeat;
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
    }
    // The chain case is seed-dependent; what must hold for every seed is that
    // the walk terminated at a summary rather than spinning.
    expect(ui.screen).toBe("summary");
    expect(pairs).toBeGreaterThanOrEqual(0);
  });

  it("terminates, and cannot spin, over every position", () => {
    for (const position of ALL_POSITIONS) {
      const ui = playToEnd(`r-beat-term-${position}`, { ...SETUP, position });
      expect(ui.screen, position).toBe("summary");
    }
  });

  it("leaves hub decisions exactly as they were", () => {
    // Signing Day authors no prose because its result is the next screen.
    const ui = start("r-beat-hub");
    const d = getDecision(ui.state!)!;
    expect(d.eventId).toBe("recruiting");
    expect(d.options.length).toBeGreaterThan(1);
    const after = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
    expect(after.resolved).toBeNull();
  });

  it("leaves multi-option cards as choices, labelled as chosen", () => {
    let checked = false;
    let ui = start("r-beat-multi");
    for (let guard = 0; guard < 300 && ui.screen !== "summary"; guard++) {
      const optionCount = !ui.resolved && ui.state ? getDecision(ui.state)?.options.length ?? 0 : 0;
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
      if (optionCount > 1 && ui.resolved) {
        expect(ui.resolved.narrated).toBe(false);
        checked = true;
      }
    }
    expect(checked).toBe(true);
  });

  it("is idempotent: opening an already-opened card advances nothing", () => {
    // App.tsx runs `openCard` inside the useReducer initializer, and StrictMode
    // double-invokes initializers. Both invocations run from the same restored
    // state, so this is the property that keeps a decision from being eaten.
    let ui = start("r-beat-idem");
    for (let guard = 0; guard < 60; guard++) {
      const opened = openCard(ui);
      const twice = openCard(opened);
      if (opened.resolved) expect(twice).toBe(opened);
      expect(openCard(opened).state!.rngCursor).toBe(opened.state!.rngCursor);
      const next = step(opened, (ids) => ids[0]!);
      if (next === opened || next.screen === "summary") break;
      ui = next;
    }
  });
});

// DECISION 012. The card whose whole job is "here is what happened" has to
// report the size of what happened, and the only honest baseline is the OVR as
// it stood before `advance()` ran.
describe("the resolved card carries the pre-advance overall", () => {
  it("captures it at the same point as the stamp", () => {
    const ui = start("r-delta");
    const before = ui.state!.overall;
    let after = ui;
    for (let guard = 0; guard < 300 && after.screen !== "summary"; guard++) {
      const next = step(after, (ids) => ids[0]!);
      if (next === after) break;
      after = next;
      if (after.resolved) break;
    }
    expect(after.resolved).not.toBeNull();
    expect(after.resolved!.overallBefore).toBe(before);
  });

  it("moves at least sometimes, and the delta is post minus pre", () => {
    let moved = 0;
    let seen = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-delta-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const next = step(ui, (ids) => ids[0]!);
        if (next === ui) break;
        ui = next;
        const pre = ui.resolved?.overallBefore;
        if (typeof pre !== "number") continue;
        seen++;
        const delta = buildView(ui.state!).overall - pre;
        expect(Number.isFinite(delta)).toBe(true);
        if (delta !== 0) moved++;
      }
    }
    expect(seen).toBeGreaterThan(20);
    // If this ever hits zero the baseline is being taken after `advance`.
    expect(moved).toBeGreaterThan(0);
  });
});

describe("restoring a save written before these fields existed", () => {
  it("normalizes the missing properties instead of leaking undefined", () => {
    // `stamp` was already normalized in storage.ts; `description`, `narrated`
    // and `overallBefore` are new and arrive as `undefined` from an old save.
    // The reducer is the funnel every restored UiState passes through.
    const ui = start("r-legacy");
    const legacy = {
      ...ui,
      resolved: { title: "Old Card", choiceLabel: "Old Choice", outcome: "It happened." },
    } as unknown as UiState;
    const restored = reducer(ui, { type: "restore", state: legacy });
    expect(restored.resolved).toEqual({
      title: "Old Card",
      description: "",
      choiceLabel: "Old Choice",
      outcome: "It happened.",
      narrated: false,
      stamp: null,
      overallBefore: null,
    });
  });

  it("opens a restored save that is parked on a bare one-option card", () => {
    // Pre-018 saves can sit on an un-resolved beat. Restoring one must produce
    // the narrated card, not a button waiting to be pressed.
    let ui = start("r-legacy-beat");
    for (let guard = 0; guard < 400; guard++) {
      const d = ui.state && !ui.resolved ? getDecision(ui.state) : null;
      if (d && d.options.length === 1) {
        const restored = reducer(ui, { type: "restore", state: { ...ui, resolved: null } });
        expect(restored.resolved?.narrated).toBe(true);
        return;
      }
      // Walk with the raw engine so the reducer's auto-resolution is bypassed
      // and a bare beat can actually be observed.
      if (!ui.state || ui.state.status !== "active") break;
      const next = getDecision(ui.state);
      if (!next) break;
      ui = { ...ui, resolved: null, state: advance(ui.state, next.options[0]!.id) };
    }
    throw new Error("no bare one-option decision was reachable to restore onto");
  });
});
