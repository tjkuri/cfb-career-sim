import { useEffect, useMemo, useReducer, useState } from "react";
import type { Setup } from "../engine/index";
import { INITIAL_STATE, isUnplayable, makeSeed, normalize, openCard, reducer } from "./session/reducer";
import { buildView } from "./session/view-model";
import { clearCurrent, hydrate, saveCurrent, saveLog } from "./session/storage";
import type { UiState } from "./session/types";
import { CreationScreen } from "./screens/CreationScreen";
import { CareerScreen } from "./screens/CareerScreen";
import { SummaryScreen } from "./screens/SummaryScreen";
import { LogScreen } from "./screens/LogScreen";

function init(): UiState {
  const restored = hydrate(INITIAL_STATE);
  // A save can outlive the content that produced it. Say so and offer a fresh
  // start rather than painting a card with no options on it.
  if (restored.state && isUnplayable(restored.state)) {
    return { ...restored, screen: "creation", state: null, resolved: null, unplayableSave: true };
  }
  // The same funnel every other UiState passes through: fill in fields a save
  // predates, and open a beat the save is parked on (DECISION 018).
  //
  // Safe under StrictMode, which double-invokes this initializer: both calls
  // run from `hydrate`'s own output, so each is `advance(sameState, sameId)` on
  // a deterministic engine rather than a second advance from an advanced state.
  // That is exactly the difference from doing this in a `useEffect`, where the
  // second run would consume a real decision.
  return openCard(normalize(restored));
}

export function App() {
  const [ui, dispatch] = useReducer(reducer, undefined, init);
  const [seed, setSeed] = useState(makeSeed);

  useEffect(() => {
    if (ui.state) saveCurrent(ui.state, ui.resolved);
  }, [ui.state, ui.resolved]);

  useEffect(() => {
    saveLog(ui.log);
  }, [ui.log]);

  const view = useMemo(() => (ui.state ? buildView(ui.state) : null), [ui.state]);

  function start(setup: Setup) {
    dispatch({ type: "start", setup, seed });
  }

  function restart() {
    clearCurrent();
    setSeed(makeSeed());
    dispatch({ type: "dismissUnplayable" });
  }

  return (
    <div className="app">
      {ui.screen === "creation" && (
        <div className="frame">
          {ui.unplayableSave && (
            <div className="notice">
              <p>
                Your saved career was built on an older version of the game and can&apos;t be
                continued. Starting fresh.
              </p>
              <button className="ghost" type="button" onClick={() => dispatch({ type: "dismissUnplayable" })}>
                Got it
              </button>
            </div>
          )}
          <CreationScreen
            seed={seed}
            hasLog={ui.log.length > 0}
            onStart={start}
            onViewLog={() => dispatch({ type: "goto", screen: "log" })}
          />
        </div>
      )}

      {ui.screen === "career" && view && (
        <CareerScreen
          view={view}
          resolved={ui.resolved}
          onChoose={(optionId) => dispatch({ type: "choose", optionId })}
          onContinue={() => dispatch({ type: "continue" })}
        />
      )}

      {ui.screen === "summary" && view && (
        <SummaryScreen
          view={view}
          hasLog={ui.log.length > 0}
          onRestart={restart}
          onViewLog={() => dispatch({ type: "goto", screen: "log" })}
        />
      )}

      {ui.screen === "log" && (
        <LogScreen
          log={ui.log}
          onBack={() => dispatch({ type: "goto", screen: ui.state ? (ui.state.status === "active" ? "career" : "summary") : "creation" })}
        />
      )}
    </div>
  );
}
