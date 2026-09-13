import { describe, it, expect } from "vitest";
import { getDecision, type Setup } from "../../engine/index";
import { INITIAL_STATE, reducer } from "./reducer";
import { buildView } from "./view-model";
import { shareText } from "./share";
import type { UiState } from "./types";

const SETUP: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };

function playToEnd(seed: string): UiState {
  let ui = reducer(INITIAL_STATE, { type: "start", setup: SETUP, seed });
  for (let guard = 0; guard < 500 && ui.screen !== "summary"; guard++) {
    if (ui.resolved) { ui = reducer(ui, { type: "continue" }); continue; }
    const d = getDecision(ui.state!);
    if (!d) break;
    ui = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
  }
  return ui;
}

describe("share text", () => {
  it("is empty for a career still in progress", () => {
    const ui = reducer(INITIAL_STATE, { type: "start", setup: SETUP, seed: "sh-live" });
    expect(shareText(buildView(ui.state!))).toBe("");
  });

  it("always carries the seed — the only thing that makes a result checkable", () => {
    for (let i = 0; i < 12; i++) {
      const ui = playToEnd(`sh-${i}`);
      const text = shareText(buildView(ui.state!));
      expect(text).toContain(`seed sh-${i}`);
    }
  });

  it("leads with the player and ends with the seed", () => {
    const lines = shareText(buildView(playToEnd("sh-shape").state!)).split("\n");
    expect(lines[0]).toContain("Kuri #7");
    expect(lines[0]).toContain("Quarterback");
    expect(lines[lines.length - 1]).toMatch(/^seed /);
  });

  it("reveals the final OVR exactly once", () => {
    const text = shareText(buildView(playToEnd("sh-ovr").state!));
    expect(text.match(/OVR /g)).toHaveLength(1);
  });

  it("names the school path and season count", () => {
    const ui = playToEnd("sh-path");
    const text = shareText(buildView(ui.state!));
    const summary = buildView(ui.state!).summary!;
    expect(text).toContain(summary.schoolPath.join(" → "));
    expect(text).toMatch(/\d+ seasons?/);
  });

  it("never leaks a mechanic", () => {
    for (let i = 0; i < 12; i++) {
      const text = shareText(buildView(playToEnd(`sh-clean-${i}`).state!));
      for (const forbidden of ["draftStock", "tier", "probability", "wideOpen", "factory", "developmental"]) {
        expect(text).not.toContain(forbidden);
      }
    }
  });

  it("handles a busted career without a draft line", () => {
    // Force the busted shape through the view-model rather than hunting a seed.
    const ui = playToEnd("sh-bust");
    const busted = { ...ui.state!, status: "busted" as const, draftResult: undefined, endingReason: "Career-ending injury" };
    const text = shareText(buildView(busted));
    expect(text).toContain("Career-ending injury");
    expect(text).not.toContain("Round");
  });
});
