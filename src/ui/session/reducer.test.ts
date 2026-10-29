import { describe, it, expect } from "vitest";
import { getDecision, type Setup } from "../../engine/index";
import { INITIAL_STATE, isBroadcast, reducer } from "./reducer";
import type { UiState } from "./types";

const SETUP: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };

function start(seed: string): UiState {
  return reducer(INITIAL_STATE, { type: "start", setup: SETUP, seed });
}

/** Take the first option, or move past whatever card is on screen. */
function step(ui: UiState): UiState {
  if (ui.resolved || ui.recap) return reducer(ui, { type: "continue" });
  const d = getDecision(ui.state!);
  return reducer(ui, { type: "choose", optionId: d!.options[0]!.id });
}

function playOut(seed: string): { ui: UiState; resolvedCards: number; recaps: number; steps: number } {
  let ui = start(seed);
  let resolvedCards = 0, recaps = 0, steps = 0;
  while (ui.screen === "career" && steps++ < 400) {
    ui = step(ui);
    if (ui.resolved) resolvedCards++;
    if (ui.recap && !ui.resolved) recaps++;
  }
  return { ui, resolvedCards, recaps, steps };
}

describe("reducer", () => {
  it("starts on Signing Day", () => {
    const ui = start("r-1");
    expect(ui.screen).toBe("career");
    expect(getDecision(ui.state!)?.eventId).toBe("recruiting");
  });

  it("a school choice puts no card on screen: the next decision is already up", () => {
    const ui = step(start("r-2"));
    expect(ui.resolved).toBeNull();
    expect(ui.state!.school.schoolId).not.toBe("");
  });

  it("a gamble shows a result card with its chips, and Continue clears it", () => {
    let ui = step(start("r-3"));
    ui = step(ui);
    expect(ui.resolved).not.toBeNull();
    expect(ui.resolved!.chips.length).toBeGreaterThan(0);
    ui = reducer(ui, { type: "continue" });
    expect(ui.resolved).toBeNull();
  });

  it("ignores a choice while a card is on screen", () => {
    let ui = step(step(start("r-4")));
    expect(ui.resolved).not.toBeNull();
    const before = ui.state;
    ui = reducer(ui, { type: "choose", optionId: "anything" });
    expect(ui.state).toBe(before);
  });

  it("plays a career to draft night with a recap for every season", () => {
    const { ui, recaps } = playOut("r-5");
    expect(ui.screen).toBe("summary");
    expect(ui.state!.status === "drafted" || ui.state!.status === "busted").toBe(true);
    const seasonsFinished = ui.state!.seasons.filter((s) => s.teamWins + s.teamLosses > 0).length;
    expect(recaps).toBe(seasonsFinished);
    expect(ui.log).toHaveLength(1);
  });

  it("logs a finished career once, however often it is settled", () => {
    let { ui } = playOut("r-6");
    ui = reducer(ui, { type: "continue" });
    ui = reducer(ui, { type: "continue" });
    expect(ui.log).toHaveLength(1);
  });

  it("keeps a career to well under thirty decisions", () => {
    let ui = start("r-7");
    let decisions = 0;
    let guard = 0;
    while (ui.screen === "career" && guard++ < 400) {
      if (!ui.resolved && !ui.recap) decisions++;
      ui = step(ui);
    }
    expect(decisions).toBeLessThan(30);
  });

  it("is in broadcast mode exactly while the big game is being called and watched", () => {
    let ui = start("r-8");
    let guard = 0;
    while (guard++ < 200 && !(ui.state && !ui.resolved && !ui.recap && getDecision(ui.state)?.kind === "bigGame")) {
      expect(isBroadcast(ui)).toBe(false);
      ui = step(ui);
    }
    expect(isBroadcast(ui)).toBe(true);
    ui = step(ui); // call the play
    expect(isBroadcast(ui)).toBe(!!ui.resolved?.bigGame?.played);
    ui = reducer(ui, { type: "continue" }); // on to the season recap
    expect(isBroadcast(ui)).toBe(false);
  });
});
