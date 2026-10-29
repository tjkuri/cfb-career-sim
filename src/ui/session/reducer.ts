import { advance, createCareer, getDecision, type GameState, type PendingDecision } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { buildSummary } from "./summary";
import { effectChips, schoolName, seasonRecap } from "./game-view";
import { appendLog } from "./storage";
import type { Action, LogEntry, Resolved, SeasonRecap, UiState } from "./types";

export const INITIAL_STATE: UiState = {
  screen: "creation",
  setup: null,
  seed: "",
  state: null,
  resolved: null,
  recap: null,
  log: [],
  unplayableSave: false,
};

export function makeSeed(random: () => number = Math.random): string {
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
    finalOverall: state.overall,
    trophyCount: summary.honors.filter((h) => ["bowlWin", "confTitle", "cfpTitle"].includes(h.id)).length,
    awards: summary.honors.filter((h) => ["heisman", "allAmerican", "allConference"].includes(h.id)).map((h) => h.label),
  };
}

/** A save can outlive the content that produced it. */
export function isUnplayable(state: GameState): boolean {
  return state.status === "active" && getDecision(state) === null;
}

function play(state: GameState, decision: PendingDecision, optionId: string): { next: GameState; resolved: Resolved | null; recap: SeasonRecap | null } {
  const option = decision.options.find((o) => o.id === optionId)!;
  const next = advance(state, optionId);
  const recap = seasonRecap(state, next);
  const lastBefore = state.seasons[state.seasons.length - 1];
  const lastAfter = next.seasons.find((s) => s.seasonIndex === lastBefore?.seasonIndex);

  // A school choice needs no card: the next screen already shows where you are.
  if (decision.kind === "school") return { next, resolved: null, recap };

  const paid = next.lastOutcome?.positive ?? null;
  const branch = paid === false ? option.negative : option.positive;
  const roleFrom = lastBefore?.role;
  const roleTo = lastAfter?.role;
  const resolved: Resolved = {
    kind: decision.kind,
    title: decision.title,
    choiceLabel: option.label,
    outcome: next.lastOutcome?.description ?? "",
    paid: decision.kind === "redshirt" && optionId === "decline" ? null : paid,
    chips: decision.kind === "bigGame" ? [] : effectChips(branch, state.setup.position),
    ovrBefore: state.overall,
    ovrAfter: recap ? recap.ovrEnd : next.overall,
    bigGame: decision.kind === "bigGame" ? (lastAfter?.bigGame ?? null) : null,
    record: decision.kind === "bigGame" && lastBefore ? `${lastBefore.teamWins}–${lastBefore.teamLosses}` : null,
    roleChange: roleFrom && roleTo && roleFrom !== roleTo && lastBefore?.seasonIndex === next.seasonIndex ? { from: roleFrom, to: roleTo } : null,
  };
  // Declining a redshirt is a formality, not a moment.
  if (decision.kind === "redshirt" && optionId === "decline") return { next, resolved: null, recap };
  return { next, resolved, recap };
}

/** The season's last snap gets the broadcast layout: calling it, and watching it. */
export function isBroadcast(ui: UiState): boolean {
  if (ui.screen !== "career" || !ui.state) return false;
  if (ui.resolved) return !!ui.resolved.bigGame?.played;
  if (ui.recap) return false;
  return getDecision(ui.state)?.kind === "bigGame";
}

export function reducer(ui: UiState, action: Action): UiState {
  switch (action.type) {
    case "start": {
      const state = createCareer(action.setup, action.seed);
      return { ...ui, screen: "career", setup: action.setup, seed: action.seed, state, resolved: null, recap: null, unplayableSave: false };
    }
    case "choose": {
      if (!ui.state || ui.resolved || ui.recap) return ui;
      const decision = getDecision(ui.state);
      if (!decision || !decision.options.some((o) => o.id === action.optionId)) return ui;
      const { next, resolved, recap } = play(ui.state, decision, action.optionId);
      return settle({ ...ui, resolved, recap }, next);
    }
    case "continue": {
      if (!ui.state) return ui;
      if (ui.resolved) return settle({ ...ui, resolved: null }, ui.state);
      if (ui.recap) return settle({ ...ui, recap: null }, ui.state);
      return settle(ui, ui.state);
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
 * The career stays on the career screen while there is a card or a recap to
 * read, and moves to the summary once it is over and both have been seen.
 */
function settle(ui: UiState, state: GameState): UiState {
  if (state.status === "active" || ui.resolved || ui.recap) return { ...ui, state, screen: "career" };
  const alreadyLogged = ui.log.some((e) => e.seed === state.seed);
  return {
    ...ui,
    state,
    screen: "summary",
    log: alreadyLogged ? ui.log : appendLog(ui.log, logEntry(state)),
  };
}

export { schoolName };
