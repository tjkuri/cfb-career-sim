import { advance, createCareer, getDecision, type GameState, type PendingDecision } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { buildSummary, schoolName, seasonStamp } from "./view-model";
import { appendLog } from "./storage";
import type { Action, LogEntry, Resolved, SeasonStamp, UiState } from "./types";

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

/**
 * Answer one decision and build the card the player reads afterwards.
 *
 * The stamp and the pre-`advance` `overall` are both taken here, before the
 * engine call, and for the same reason: `advance()` can carry the career across
 * a phase boundary -- and across a season boundary, where `enterOffseason`
 * advances the class year -- before it returns, so the state this outcome
 * belongs to is gone by the time it is rendered. The stamp freezes the season's
 * identity; `overallBefore` freezes the number the card's delta is measured
 * against (DECISION 012).
 */
function play(state: GameState, decision: PendingDecision, option: { id: string; label: string }) {
  const stamp = seasonStamp(state);
  const overallBefore = state.overall;
  const next = advance(state, option.id);
  const outcome = next.lastOutcome?.description ?? null;

  // Hub decisions (Signing Day, transfer, declare) author no prose because
  // their result is the next screen. Nothing to read, so no card.
  const resolved: Resolved | null =
    outcome === null
      ? null
      : {
          title: decision.title,
          description: decision.description,
          choiceLabel: option.label,
          outcome,
          // A card with one option was never a choice; the screen must not
          // label it "You chose:" (DECISION 018).
          narrated: decision.options.length === 1,
          stamp,
          overallBefore,
        };

  return { next, resolved };
}

/**
 * DECISION 018. A decision with exactly one option is not a decision -- it is a
 * narrated beat, and the tap it costs buys nothing. Resolve it the moment the
 * player arrives on it so its authored prose is read behind the single Continue
 * they were going to press anyway.
 *
 * This lives in the reducer on purpose. As a `useEffect` it would double-fire
 * under StrictMode and `advance` twice from an already-advanced state, silently
 * eating a decision. Here the work is part of the action that produced the
 * card, and `openCard(openCard(x))` is a no-op whenever the first call produced
 * a card to read -- which, measured over 72 careers, is every one of the 104
 * one-option cards in the content.
 *
 * It resolves **at most one level**: the result is returned untouched, never
 * re-entered. Two consecutive one-option cards therefore cost two Continues,
 * and a one-option card that authored no prose cannot recurse.
 */
export function openCard(ui: UiState): UiState {
  if (ui.screen !== "career" || ui.resolved || !ui.state) return ui;
  if (ui.state.status !== "active") return ui;

  const decision = getDecision(ui.state);
  if (!decision || decision.options.length !== 1) return ui;

  const option = decision.options[0]!;
  const { next, resolved } = play(ui.state, decision, option);
  return settle(ui, next, resolved);
}

/**
 * A save can predate a field on `Resolved`. `storage.ts` already normalizes
 * `stamp`; `description`, `narrated` and `overallBefore` arrived later, and an
 * old save restores with all three missing. Every restored `UiState` enters the
 * app through here or through `App.tsx`'s initializer, so this is the one place
 * that has to refuse `undefined` on a property the screens are typed to read.
 * A missing baseline becomes null, never zero: the card then reports no delta
 * rather than a fabricated one (DECISION 014's rule, applied to progression).
 *
 * The stamp itself can now be half-written, which is why it is normalized one
 * level deep: a save from between the stamp landing and the season line joining
 * it restores a stamp with no `season`. Null is the right answer there -- the
 * rail's third line renders empty -- and it must not arrive as `undefined`.
 */
function normalizeStamp(stamp: SeasonStamp | null | undefined): SeasonStamp | null {
  if (!stamp) return null;
  return { ...stamp, season: stamp.season ?? null };
}

export function normalize(ui: UiState): UiState {
  const r = ui.resolved as Partial<Resolved> | null;
  if (!r) return ui;
  return {
    ...ui,
    resolved: {
      title: r.title ?? "",
      description: r.description ?? "",
      choiceLabel: r.choiceLabel ?? "",
      outcome: r.outcome ?? "",
      narrated: r.narrated ?? false,
      stamp: normalizeStamp(r.stamp),
      overallBefore: r.overallBefore ?? null,
    },
  };
}

export function reducer(ui: UiState, action: Action): UiState {
  switch (action.type) {
    case "start": {
      const state = createCareer(action.setup, action.seed);
      return openCard({
        ...ui,
        screen: "career",
        setup: action.setup,
        seed: action.seed,
        state,
        resolved: null,
        unplayableSave: false,
      });
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
      const { next, resolved } = play(ui.state, decision, option);

      // A hub card produces no prose, so nothing is on screen to hold the
      // player. Open whatever landed behind it -- which is the only path by
      // which a beat can follow a hub in the same action, and still one level.
      return openCard(settle(ui, next, resolved));
    }

    case "continue": {
      if (!ui.state) return ui;
      return openCard(settle({ ...ui, resolved: null }, ui.state, null));
    }

    case "goto":
      return { ...ui, screen: action.screen };

    case "restore":
      return openCard(normalize(action.state));

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
