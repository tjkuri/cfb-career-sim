import { describe, it, expect } from "vitest";
import { createCareer, advance, getDecision, ALL_POSITIONS, ALL_SCHOOL_TRAITS, type Setup } from "../../engine/index";
import { buildView } from "./view-model";
import { reducer, INITIAL_STATE } from "./reducer";
import type { UiState } from "./types";

// The hidden-mechanics rule, enforced at the one boundary that can enforce it.
// Tier logic and the transfer rebuild loop stay implicit; school traits are
// discovered through replay and never stated; draftStock, probability, weight
// and EV are never rendered.
const FORBIDDEN_KEYS = [
  "draftStock",
  "probability",
  "weight",
  "tier",
  "snapModifier",
  "trait",
  "schoolTrait",
  "overall",
  "character",
  "rngCursor",
  "pendingEffects",
  "phaseAbs",
];

function playThrough(seed: string, position: Setup["position"]): UiState[] {
  const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position };
  let ui = reducer(INITIAL_STATE, { type: "start", setup, seed });
  const states: UiState[] = [ui];
  for (let guard = 0; guard < 500; guard++) {
    if (!ui.state) break;
    if (ui.resolved) {
      ui = reducer(ui, { type: "continue" });
      states.push(ui);
      continue;
    }
    const d = getDecision(ui.state);
    if (!d) break;
    ui = reducer(ui, { type: "choose", optionId: d.options[0]!.id });
    states.push(ui);
    if (ui.screen === "summary") break;
  }
  return states;
}

describe("CareerView boundary", () => {
  it("never leaks a mechanic, across every position", () => {
    for (const position of ALL_POSITIONS) {
      for (let i = 0; i < 4; i++) {
        for (const ui of playThrough(`vm-${position}-${i}`, position)) {
          if (!ui.state) continue;
          const view = buildView(ui.state);
          const keys = new Set<string>();
          const walk = (v: unknown): void => {
            if (Array.isArray(v)) return v.forEach(walk);
            if (v && typeof v === "object") {
              for (const [k, val] of Object.entries(v)) {
                keys.add(k);
                walk(val);
              }
            }
          };
          walk(view);
          for (const forbidden of FORBIDDEN_KEYS) {
            // `finalOverall` on the summary is the one deliberate reveal, and
            // it is a distinct key -- a bare `overall` must never appear.
            expect(keys.has(forbidden), `${forbidden} leaked for ${position}`).toBe(false);
          }
        }
      }
    }
  });

  it("never names a school trait in rendered text", () => {
    for (const ui of playThrough("vm-traits", "QB")) {
      if (!ui.state) continue;
      const json = JSON.stringify(buildView(ui.state));
      for (const trait of ALL_SCHOOL_TRAITS) {
        expect(json.includes(trait)).toBe(false);
      }
    }
  });

  it("reports no school before Signing Day rather than a blank", () => {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    expect(buildView(createCareer(setup, "vm-uncommitted")).schoolName).toBeNull();
  });

  it("resolves school ids to display names", () => {
    const setup: Setup = { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" };
    let s = createCareer(setup, "vm-names");
    const d = getDecision(s)!;
    s = advance(s, d.options[0]!.id);
    const view = buildView(s);
    expect(view.schoolName).not.toBeNull();
    expect(view.schoolName).not.toBe(s.school.schoolId);
    expect(view.schoolName!.length).toBeGreaterThan(1);
  });

  it("exposes a summary only once the career is terminal", () => {
    for (const ui of playThrough("vm-summary", "QB")) {
      if (!ui.state) continue;
      const view = buildView(ui.state);
      expect(view.summary === null).toBe(ui.state.status === "active");
    }
  });
});
