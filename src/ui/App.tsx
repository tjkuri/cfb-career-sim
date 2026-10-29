import { useEffect, useMemo, useReducer, useState } from "react";
import { flushSync } from "react-dom";
import type { Setup } from "../engine/index";
import { INITIAL_STATE, isBroadcast, isUnplayable, makeSeed, reducer } from "./session/reducer";
import { buildView } from "./session/game-view";
import { clearCurrent, hydrate, saveCurrent, saveLog } from "./session/storage";
import type { Action, UiState } from "./session/types";
import { CreationScreen } from "./screens/CreationScreen";
import { CareerScreen } from "./screens/CareerScreen";
import { SummaryScreen } from "./screens/SummaryScreen";
import { LogScreen } from "./screens/LogScreen";

function init(): UiState {
  const restored = hydrate(INITIAL_STATE);
  // A save can outlive the content that produced it. Say so and start fresh
  // rather than painting a card with no options on it.
  if (restored.state && !restored.resolved && !restored.recap && isUnplayable(restored.state)) {
    return { ...restored, screen: "creation", state: null, resolved: null, recap: null, unplayableSave: true };
  }
  return restored;
}

export function App() {
  const [ui, dispatch] = useReducer(reducer, undefined, init);
  const [seed, setSeed] = useState(makeSeed);

  useEffect(() => {
    if (ui.state) saveCurrent(ui.state, ui.resolved, ui.recap);
  }, [ui.state, ui.resolved, ui.recap]);

  useEffect(() => {
    saveLog(ui.log);
  }, [ui.log]);

  const view = useMemo(() => (ui.state ? buildView(ui.state) : null), [ui.state]);

  // Moving into or out of the broadcast morphs the layout instead of cutting:
  // the card grows into the field, the player card folds into the strip.
  // Browsers without view transitions, and reduced motion, keep the cut.
  function act(action: Action) {
    const flips = isBroadcast(ui) !== isBroadcast(reducer(ui, action));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (flips && !reduce && typeof document.startViewTransition === "function") {
      document.startViewTransition(() => flushSync(() => dispatch(action)));
    } else {
      dispatch(action);
    }
  }

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
          recap={ui.recap}
          onChoose={(optionId) => act({ type: "choose", optionId })}
          onContinue={() => act({ type: "continue" })}
        />
      )}

      {ui.screen === "summary" && view && ui.state && (
        <SummaryScreen
          state={ui.state}
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
