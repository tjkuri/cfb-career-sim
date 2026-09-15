import { advance, createCareer, getDecision, type GameState, type PendingDecision } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { buildSummary, cardAccount, hubFacts, remainderFacts, schoolName, seasonStamp } from "./view-model";
import { appendLog } from "./storage";
import type { Action, HubFacts, LogEntry, Resolved, SeasonStamp, UiState } from "./types";

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

  // Hub decisions (Signing Day, transfer, declare) author no prose, and the
  // absence of prose used to end the matter: `outcome === null` meant no card.
  // The 017 playtest falsified the reasoning behind that -- "the result is the
  // next screen" is not true when the consequence is a seven-point overall
  // swing the next screen does not mention (B23, DECISION 037).
  //
  // So a hub card is composed from facts instead of read from content, and
  // `src/content/**` stays frozen. `hubFacts` returns null when the hub moved
  // neither the school nor `overall`, which is what keeps this from becoming
  // an empty ceremonial card between every offseason click.
  //
  // `outcome === null` is still the discriminator and still exhaustive:
  // `applyChoice` sets `lastOutcome` for every authored event, so a card
  // without prose is a hub by construction and no event id is matched here.
  const hub: HubFacts | null = outcome === null ? hubFacts(state, next) : null;

  // What THIS card did, separated from what merely happened while it was being
  // resolved (DECISION 046 cause 1). `overallBefore` measures the whole
  // `advance()` -- this outcome, plus an earlier card's deferred effect falling
  // due, plus a season of development -- and attributing all of it here is how
  // *"the fit never quite comes together"* came to print **+5 OVR**.
  //
  // Taken here rather than in the screen for the same reason the stamp is: the
  // baseline it is computed against belongs to the state before the call, and
  // the answer has to survive being written to `localStorage` and read back.
  const account = outcome === null ? null : cardAccount(state, next, decision, option.id);

  // The other half of the same sentence, and the half DECISION 056 found
  // missing. `account` says what the card did; this says what the REST of the
  // number was, so no figure on the card is left unattributed.
  //
  // Computed for every card, not only for the ones with a remainder to
  // explain. A hub card's `account` is null by construction -- `applyChoice`
  // writes no `overall` on the recruiting, declare or transfer branches -- so
  // its whole movement is this, and it is the case B45 is about. Taken here
  // for the same reason the stamp and `overallBefore` are: both states are
  // gone once this returns, and the answer has to survive `localStorage`.
  const remainder = remainderFacts(state, next);

  const resolved: Resolved | null =
    outcome === null && hub === null
      ? null
      : {
          title: decision.title,
          description: decision.description,
          choiceLabel: option.label,
          outcome: outcome ?? "",
          hub,
          // A card with one option was never a choice; the screen must not
          // label it "You chose:" (DECISION 018).
          narrated: decision.options.length === 1,
          stamp,
          overallBefore,
          account,
          remainder,
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
      // A save written before hub cards existed restores without this. Null is
      // the honest answer -- the card then reports whatever prose and delta it
      // was saved with and claims no move -- and it must not arrive as
      // `undefined` on a property the screen is typed to read.
      hub: r.hub ?? null,
      narrated: r.narrated ?? false,
      stamp: normalizeStamp(r.stamp),
      overallBefore: r.overallBefore ?? null,
      // A save written before the card accounted for itself restores without
      // this, and null is the honest answer: such a card reports the whole
      // movement across its `advance`, exactly as it did when it was saved.
      // Re-deriving it here is not possible -- the option id and the baseline
      // it was computed from are both gone by the time a save is read.
      account: r.account ?? null,
      // A save written before the card could say what the remainder WAS
      // restores without this, and null is the honest answer: the figure
      // renders with no line under it, exactly as it did when it was saved.
      // Re-deriving it is not possible -- it is a diff of two states, and the
      // earlier one is gone by the time a save is read.
      remainder: r.remainder ?? null,
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

      // A hub that resolved to nothing puts nothing on screen to hold the
      // player, so whatever landed behind it opens in the same action -- the
      // only path by which a beat can follow a hub, and still one level.
      // A hub that DID resolve to something is a card, and `openCard` steps
      // aside for it: the beat behind it opens on the Continue the player was
      // already going to press, so the hub costs one click and never eats a
      // beat.
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
