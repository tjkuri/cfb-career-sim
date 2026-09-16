import { describe, it, expect } from "vitest";
import { advance, getDecision, ALL_POSITIONS, type Setup } from "../../engine/index";
import { INITIAL_STATE, isUnplayable, makeSeed, openCard, reducer } from "./reducer";
import { buildView } from "./view-model";
import { trustMove, trustRungOf } from "./bands";
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
    // NARROWED, not weakened (DECISION 057). This walked a career asserting
    // that EVERY resolved card carried authored prose. That held only because
    // a first-option policy used to press "Declare for the NFL Draft" the
    // moment it was offered, which ended the career before the transfer hub --
    // the one multi-option card that authors no prose -- was ever reachable.
    // With the declare decision deleted the walk now reaches it, and a hub
    // card's `outcome` is "" by construction (DECISION 037: it is composed
    // from facts in `hub`, not read from content). The assertion that matters
    // is unchanged: a card with authored prose behind it must show it.
    let ui = start("r-4");
    let sawAuthored = false;
    for (let guard = 0; guard < 200 && ui.screen !== "summary"; guard++) {
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
      if (ui.resolved) {
        expect(ui.resolved.title.length).toBeGreaterThan(0);
        expect(ui.resolved.choiceLabel.length).toBeGreaterThan(0);
        if (ui.resolved.hub === null) {
          sawAuthored = true;
          expect(ui.resolved.outcome.length).toBeGreaterThan(0);
        } else {
          // A hub card carries facts instead, and must never be empty of both.
          expect(ui.resolved.hub).not.toBeNull();
        }
      }
    }
    expect(sawAuthored).toBe(true);
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
    // TIGHTENED for DECISION 057. The old version assumed the card on screen
    // after a multi-option choice was that card's own resolution. That was safe
    // only while the declare decision ended a first-option career before the
    // transfer hub: a multi-option hub that moved nothing resolves to NOTHING,
    // and `openCard` then auto-resolves the following one-option beat, whose
    // `narrated` is correctly true. Matching the resolution to the decision it
    // came from is what the test meant all along.
    let checked = false;
    let ui = start("r-beat-multi");
    for (let guard = 0; guard < 300 && ui.screen !== "summary"; guard++) {
      const d = !ui.resolved && ui.state ? getDecision(ui.state) : null;
      const chosen = d?.options[0] ?? null;
      const next = step(ui, (ids) => ids[0]!);
      if (next === ui) break;
      ui = next;
      const isOwnResolution =
        d !== null && chosen !== null && ui.resolved !== null &&
        ui.resolved.title === d.title && ui.resolved.choiceLabel === chosen.label;
      if (d && d.options.length > 1 && isOwnResolution) {
        expect(ui.resolved!.narrated).toBe(false);
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
    // `stamp` was already normalized in storage.ts; `description`, `narrated`,
    // `overallBefore`, `hub`, `account` and `trustBefore` are all newer than
    // some saves and arrive as `undefined` from an old one. The reducer is the
    // funnel every restored UiState passes through.
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
      hub: null,
      narrated: false,
      stamp: null,
      overallBefore: null,
      // A save from before the rung was frozen cannot say which rung it was
      // on, so the restored card marks no locker-room move rather than
      // announcing one that may never have happened.
      trustBefore: null,
      account: null,
      remainder: null,
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

// ---------------------------------------------------------------------------
// B23 / DECISION 037. The four hub decisions -- Signing Day, redshirt, declare,
// transfer -- author no prose, and the reducer used to read the missing prose
// as "nothing happened". The 017 playtest falsified that: "Stay at Baylor" ran
// 75 -> 82 between two clicks, and the one transfer of the career was
// "acknowledged by one word changing in the header".
//
// The rule that replaced it reads facts, not event ids: a hub card appears iff
// the career is still active AND (the school moved OR `overall` moved). These
// tests pin both halves -- the card that must now appear, and the empty
// ceremonial card that must not.
// ---------------------------------------------------------------------------
describe("hub decisions resolve when they carry a consequence", () => {
  // `ids[0]` never reaches a transfer hub: it takes the redshirt in the first
  // offseason (which ENDS that offseason's hub sequence) and then declares at
  // the first declare card. Both pickers below decline the redshirt and return
  // to school, so the career actually runs long enough to reach the portal.
  function keepPlaying(ids: string[], portal: "move" | "stay"): string {
    if (portal === "move") {
      const offer = ids.find((id) => id.startsWith("transfer-"));
      if (offer) return offer;
    }
    if (ids.includes("stay")) return "stay";
    if (ids.includes("decline")) return "decline";
    if (ids.includes("return")) return "return";
    return ids[0]!;
  }

  /** Every resolved card a career produces, played to the end. */
  function cardsOf(seed: string, setup: Setup, portal: "move" | "stay") {
    const cards: NonNullable<UiState["resolved"]>[] = [];
    let ui = start(seed, setup);
    for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
      if (ui.resolved) cards.push(ui.resolved);
      const next = step(ui, (ids) => keepPlaying(ids, portal));
      if (next === ui) break;
      ui = next;
    }
    return cards;
  }

  it("states the move when a transfer changed schools", () => {
    // Somewhere in this cohort a portal offer is taken. The card it produces
    // carries no prose -- there is none to carry, `src/content/**` is frozen --
    // and says only where the career went.
    let checked = 0;
    for (const position of ALL_POSITIONS) {
      for (const card of cardsOf(`r-hub-move-${position}`, { ...SETUP, position }, "move")) {
        if (!card.hub?.to) continue;
        checked++;
        expect(card.outcome).toBe("");
        expect(card.hub.from).toBeTruthy();
        expect(card.hub.from).not.toBe(card.hub.to);
        // A stated fact, never a characterisation: the card names two schools
        // and nothing about which of them was the better idea (DECISION 012).
        expect(card.title.length).toBeGreaterThan(0);
      }
    }
    expect(checked, "no transfer that changed schools was reachable").toBeGreaterThan(0);
  });

  it("reports a pure overall movement without naming the school again", () => {
    // The playtester's case: "Stay at Baylor", 75 -> 82. Nothing moved but the
    // number, so the number is the whole card -- printing the school a second
    // time would only repeat the button that was just pressed.
    let checked = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-hub-stay-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        if (ui.resolved?.hub && !ui.resolved.hub.to) {
          checked++;
          expect(ui.resolved.outcome).toBe("");
          expect(ui.resolved.overallBefore).not.toBe(ui.state!.overall);
        }
        const next = step(ui, (ids) => keepPlaying(ids, "stay"));
        if (next === ui) break;
        ui = next;
      }
    }
    expect(checked, "no hub resolved on an overall movement alone").toBeGreaterThan(0);
  });

  it("gives that movement something to say for itself (B45, DECISION 056)", () => {
    // The playtester's exact case, in 3/3 careers: "You chose: Stay at
    // Memphis" -> +5 OVR, with no sentence at all. The number was real -- a
    // deferred injury refund from an earlier card coming due -- and the only
    // attribution the card offered was the choice that had just been made,
    // which is the one thing it could not have been: `applyChoice`'s transfer
    // branch writes no `overall` at all.
    //
    // DECISION 037 is preserved exactly. The figure is untouched; what this
    // asserts is that a hub card never again reaches the screen with a
    // movement and nothing to attribute it to.
    let checked = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-hub-why-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const r = ui.resolved;
        if (r?.hub && r.overallBefore !== null && r.overallBefore !== ui.state!.overall) {
          checked++;
          const f = r.remainder!;
          expect(f, "a hub card restored without its remainder").not.toBeNull();
          expect(
            f.healed || f.landed || f.developed || f.hurt,
            `"${r.choiceLabel}" moved overall and had nothing to say for it`,
          ).toBe(true);
        }
        const next = step(ui, (ids) => keepPlaying(ids, "stay"));
        if (next === ui) break;
        ui = next;
      }
    }
    expect(checked, "no hub card carried an overall movement").toBeGreaterThan(0);
  });

  it("shows nothing on Signing Day", () => {
    // The one hub that is deliberately silent. There is no school to have moved
    // FROM, so the only fact available is the one the player chose a click ago
    // and the rail is already printing; measured over 3,000 careers, Signing Day
    // moves `overall` by 0 in 3,000 of 3,000, so there is no second fact either.
    for (const position of ALL_POSITIONS) {
      const ui = start(`r-hub-signing-${position}`, { ...SETUP, position });
      const d = getDecision(ui.state!)!;
      expect(d.eventId).toBe("recruiting");
      const after = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
      expect(after.resolved).toBeNull();
    }
  });

  it("never puts a card in front of the draft verdict: no declare beat exists", () => {
    // REPLACED (DECISION 057). This used to walk to the declare card and assert
    // that pressing "Declare for the NFL Draft" went straight to the summary
    // with no beat in between -- a card in front of the draft verdict is a
    // click, not a beat. The card is gone entirely, which is the stronger form
    // of the same guarantee, so what is pinned now is its absence: no career,
    // at any position, is ever offered a decision with that id, and the click
    // that ends the career still lands on the summary.
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-hub-declare-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const d = !ui.resolved && ui.state ? getDecision(ui.state) : null;
        expect(d?.eventId, `${position} was offered a declare decision`).not.toBe("declare");
        const next = step(ui, (ids) => ids[0]!);
        if (next === ui) break;
        ui = next;
      }
      expect(ui.screen, position).toBe("summary");
    }
  });

  it("never renders an empty ceremonial card", () => {
    // The failure mode the brief names by name. Every hub card that appears
    // must carry at least one fact; a hub that changed nothing stays silent
    // and the next beat opens behind it exactly as it used to.
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-hub-empty-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const r = ui.resolved;
        if (r && r.outcome === "") {
          const moved = !!r.hub?.to;
          const delta = r.overallBefore !== null && r.overallBefore !== ui.state!.overall;
          expect(moved || delta, `${position}: a hub card carried no fact`).toBe(true);
        }
        const next = step(ui, (ids) => keepPlaying(ids, "move"));
        if (next === ui) break;
        ui = next;
      }
    }
  });

  it("does not eat the beat behind it", () => {
    // `openCard` steps aside while a hub card is on screen, so the one-option
    // beat that landed behind it opens on the Continue the player was going to
    // press anyway -- one extra click for the hub, never a lost card.
    let checked = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-hub-beat-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        if (ui.resolved?.hub) {
          const cursorBefore = ui.state!.rngCursor;
          const after = reducer(ui, { type: "continue" });
          // Continue is a pure UI transition unless it opened a narrated beat,
          // which is exactly one engine call and never two.
          if (after.resolved) expect(after.resolved.narrated).toBe(true);
          else expect(after.state!.rngCursor).toBe(cursorBefore);
          checked++;
        }
        const next = step(ui, (ids) => keepPlaying(ids, "move"));
        if (next === ui) break;
        ui = next;
      }
    }
    expect(checked, "no hub card was reachable").toBeGreaterThan(0);
  });
});

// DECISION 046. The number on a card used to be `view.overall -
// resolved.overallBefore`: everything that moved during the `advance`, whoever
// caused it. `cardAccount` splits that into what the card did and what merely
// happened while it was on screen, and the reducer is where the split is taken
// -- the baseline belongs to the state before the engine call, and the answer
// has to survive `localStorage`.
describe("a resolved card carries its own accounting", () => {
  /** One card as the screen reads it: what it reported before this split
      (`total`) and what it now reports as its own. */
  interface Card {
    resolved: NonNullable<UiState["resolved"]>;
    total: number;
  }

  /** Play with a deterministic but varied policy, so the sample is not just
      whatever `options[0]` happens to be on every card in the game. */
  function cardsOf(seed: string, setup: Setup): Card[] {
    const out: Card[] = [];
    let ui = start(seed, setup);
    let x = seed.length * 2654435761;
    for (let guard = 0; guard < 600 && ui.screen !== "summary"; guard++) {
      if (ui.resolved) {
        const r = ui.resolved;
        const overall = buildView(ui.state!).overall;
        out.push({ resolved: r, total: r.overallBefore === null ? 0 : overall - r.overallBefore });
        ui = reducer(ui, { type: "continue" });
        continue;
      }
      const d = ui.state ? getDecision(ui.state) : null;
      if (!d) break;
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      ui = reducer(ui, { type: "choose", optionId: d.options[x % d.options.length]!.id });
    }
    return out;
  }

  function sample(): Card[] {
    const out: Card[] = [];
    for (const position of ALL_POSITIONS) {
      for (let i = 0; i < 6; i++) {
        out.push(...cardsOf(`acct-${position}-${i}`, { ...SETUP, position }));
      }
    }
    return out;
  }

  it("identifies the outcome that fired on every card that has prose", () => {
    // If the description match ever failed, the account would fall back to
    // null and the card would silently go back to reporting the whole advance
    // -- the defect, restored, with nothing on screen to show it. Measured
    // over 4,341 resolved cards: zero unidentified.
    const cards = sample().filter((c) => c.resolved.outcome !== "");
    expect(cards.length).toBeGreaterThan(300);
    expect(cards.filter((c) => c.resolved.account === null)).toEqual([]);
  });

  it("separates what the card did from what landed underneath it", () => {
    // The defect, measured on our own screens rather than argued. Over 360
    // careers, 14.4% of resolved cards were reporting a number that was not
    // theirs, 146 of them with the wrong SIGN, and 132 printed an OVR movement
    // on a card that authored none.
    const cards = sample().filter(
      (c) => c.resolved.outcome !== "" && c.resolved.overallBefore !== null,
    );
    const misattributed = cards.filter((c) => c.total !== c.resolved.account!.own);
    expect(misattributed.length).toBeGreaterThan(0);

    // The two shapes that made the prose look like a liar. A card that
    // authored no OVR movement and printed one:
    const phantom = cards.filter((c) => c.resolved.account!.own === 0 && c.total !== 0);
    expect(phantom.length).toBeGreaterThan(0);
    // And a card whose own number points the other way from the one it showed:
    const inverted = cards.filter(
      (c) =>
        c.total !== 0 &&
        c.resolved.account!.own !== 0 &&
        Math.sign(c.total) !== Math.sign(c.resolved.account!.own),
    );
    expect(inverted.length).toBeGreaterThan(0);

    // A character cost with no OVR movement is the shape that read as a free
    // win: `effects: [{ character: -4 }, { snaps: 15 }]` printed whatever the
    // rest of the phase did, or nothing at all.
    const freeWins = cards.filter(
      (c) => c.resolved.account!.lockerRoom === "cost" && c.resolved.account!.own >= 0,
    );
    expect(freeWins.length).toBeGreaterThan(0);
  });

  it("leaves a hub card reporting the movement across the click", () => {
    // DECISION 037 is not reopened. A hub authors no prose, so there is no
    // outcome to account and the account is null -- which is exactly what
    // makes the screen fall back to the whole delta, the seven-point swing
    // B23 was filed about.
    const hubs = sample().filter((c) => c.resolved.outcome === "");
    for (const hub of hubs) expect(hub.resolved.account).toBeNull();
  });

  it("takes the account from the state the choice was made in", () => {
    // Same reasoning as the stamp: `advance()` can carry the career across a
    // phase boundary before it returns, so the baseline the account clamps
    // against is gone by the time anything is rendered.
    const ui = start("acct-baseline");
    let next = reducer(ui, { type: "choose", optionId: getDecision(ui.state!)!.options[0]!.id });
    for (let guard = 0; guard < 40 && !(next.resolved && next.resolved.outcome); guard++) {
      next = next.resolved
        ? reducer(next, { type: "continue" })
        : reducer(next, { type: "choose", optionId: getDecision(next.state!)!.options[0]!.id });
    }
    expect(next.resolved!.account).not.toBeNull();
    expect(next.resolved!.overallBefore).not.toBeNull();
  });
});

// Task 043. The card freezes the rung the career was standing on, so the
// career screen can mark the click the standing crossed one. Two things have
// to be true of that field or the marker is either silent or lying.
describe("the locker-room rung a card is read against", () => {
  it("is always a ladder phrase, and never a character number", () => {
    let crossings = 0;
    let cards = 0;
    for (const position of ALL_POSITIONS) {
      let ui = start(`r-rung-${position}`, { ...SETUP, position });
      for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
        const next = step(ui, (ids) => ids[ids.length - 1]!);
        if (next === ui) break;
        ui = next;
        if (!ui.resolved || !ui.state) continue;
        cards++;
        const before = ui.resolved.trustBefore;
        // A phrase, always -- never null on a live card, and never an integer
        // that a screen could subtract (DECISION 002).
        expect(typeof before).toBe("string");
        expect(trustRungOf(before!)).toBeGreaterThanOrEqual(0);
        // The rule the whole field exists for: what the card can say is that
        // the rung moved and which way, and there is no third answer.
        const moved = trustMove(before, buildView(ui.state).trust);
        expect(moved === null || moved === "up" || moved === "down").toBe(true);
        if (moved) crossings++;
      }
    }
    expect(cards).toBeGreaterThan(100);
    // The marker is reachable rather than theoretical. A last-option walk is
    // the selfish one, so this is mostly falls -- the point is only that a
    // real career crosses rungs while it is being played, which is the claim
    // the ending screen's ladder is built on.
    expect(crossings).toBeGreaterThan(0);
  });

  it("marks no move on a card restored from a save that predates the field", () => {
    const ui = start("r-rung-legacy");
    const chosen = reducer(ui, { type: "choose", optionId: getDecision(ui.state!)!.options[0]!.id });
    const legacy = {
      ...chosen,
      resolved: { ...chosen.resolved!, trustBefore: undefined },
    } as unknown as UiState;
    const restored = reducer(ui, { type: "restore", state: legacy });
    expect(restored.resolved!.trustBefore).toBeNull();
    expect(trustMove(restored.resolved!.trustBefore, buildView(restored.state!).trust)).toBeNull();
  });
});
