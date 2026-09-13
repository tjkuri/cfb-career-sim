import { advance, createCareer, getDecision, type GameState } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { buildSummary, schoolName } from "./view-model";
import { appendLog } from "./storage";
import type { Action, LogEntry, UiState } from "./types";

export const INITIAL_STATE: UiState = {
  screen: "creation",
  setup: null,
  seed: "",
  state: null,
  resolved: null,
  log: [],
  unplayableSave: false,
};

export function makeSeed(random: () => number = Math.random): string {
  // The engine's no-Math.random rule binds src/engine/**; the seed is an input
  // to the engine, not a draw inside it, so generating one here is fine.
  return Math.floor(random() * 0xffffffff).toString(36).padStart(6, "0").slice(0, 6);
}

function logEntry(state: GameState): LogEntry {
  const summary = buildSummary(state);
  return {
    id: `${state.seed}-${Date.now()}`,
    finishedAt: Date.now(),
    seed: state.seed,
    lastName: state.setup.lastName,
    jerseyNumber: state.setup.jerseyNumber,
    position: state.setup.position,
    positionLabel: CONTENT.positions[state.setup.position].label,
    schoolPath: summary.schoolPath,
    status: state.status,
    headline: summary.headline,
    finalOverall: summary.finalOverall,
    trophyCount: summary.trophies.reduce((a, t) => a + t.count, 0),
    awards: summary.awards,
  };
}

/**
 * A save can outlive the content that produced it -- an event id that no longer
 * exists leaves `status === "active"` with no decision to render. Detect that on
 * restore rather than painting an empty card with no way forward.
 */
export function isUnplayable(state: GameState): boolean {
  return state.status === "active" && getDecision(state) === null;
}

export function reducer(ui: UiState, action: Action): UiState {
  switch (action.type) {
    case "start": {
      const state = createCareer(action.setup, action.seed);
      return {
        ...ui,
        screen: "career",
        setup: action.setup,
        seed: action.seed,
        state,
        resolved: null,
        unplayableSave: false,
      };
    }

    case "choose": {
      if (!ui.state) return ui;
      const decision = getDecision(ui.state);
      if (!decision) return ui;
      const option = decision.options.find((o) => o.id === action.optionId);
      if (!option) return ui;

      // Exactly one engine call per player choice. `advance` returns both the
      // outcome of this choice and the next pending decision; Continue is a
      // pure UI transition, not a second call.
      const next = advance(ui.state, option.id);
      const outcome = next.lastOutcome?.description ?? null;

      // Hub decisions (Signing Day, transfer, declare) author no prose because
      // their result is the next screen. So do single-option beats, where the
      // button press was the acknowledgement. Both skip the outcome step.
      const skipOutcome = outcome === null || decision.options.length === 1;
      if (skipOutcome) return settle(ui, next, null);

      return settle(ui, next, {
        title: decision.title,
        choiceLabel: option.label,
        outcome,
      });
    }

    case "continue": {
      if (!ui.state) return ui;
      return settle({ ...ui, resolved: null }, ui.state, null);
    }

    case "goto":
      return { ...ui, screen: action.screen };

    case "restore":
      return action.state;

    case "dismissUnplayable":
      return { ...INITIAL_STATE, log: ui.log };

    default:
      return ui;
  }
}

/**
 * Park the career on the right screen. The branch is on `status`, not on
 * whether `getDecision` returned null: a content `ending` effect terminates the
 * career inside the same `advance` that produced the outcome prose, and the
 * player must read how it ended before the summary replaces the card.
 */
function settle(ui: UiState, state: GameState, resolved: UiState["resolved"]): UiState {
  const terminal = state.status !== "active";

  if (terminal && resolved) {
    // Show the final outcome on the card; Continue moves to the summary.
    return { ...ui, state, resolved, screen: "career" };
  }

  if (terminal) {
    // Seeds are generated per career and never re-entered, so the seed is a
    // sufficient dedupe key: settling twice on the same career (Continue after
    // a final outcome, then any later re-settle) must not log it twice.
    const alreadyLogged = ui.log.some((e) => e.seed === state.seed);
    return {
      ...ui,
      state,
      resolved: null,
      screen: "summary",
      log: alreadyLogged ? ui.log : appendLog(ui.log, logEntry(state)),
    };
  }

  return { ...ui, state, resolved, screen: "career" };
}

export { schoolName };
