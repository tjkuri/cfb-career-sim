import { useState } from "react";
import { ALL_POSITIONS, type Position, type Setup } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { REGIONS } from "../../content/regions";

// Home states come from REGIONS rather than a list of all fifty: states outside
// it get no recruiting region bonus, so offering them would hand the player a
// quietly worse choice with no way to know it.
const STATE_GROUPS = Object.entries(REGIONS).map(([region, states]) => ({
  region,
  states: [...states].sort(),
}));

interface Props {
  seed: string;
  hasLog: boolean;
  onStart: (setup: Setup) => void;
  onViewLog: () => void;
}

export function CreationScreen({ seed, hasLog, onStart, onViewLog }: Props) {
  const [lastName, setLastName] = useState("");
  const [jersey, setJersey] = useState("7");
  const [homeState, setHomeState] = useState("TX");
  const [position, setPosition] = useState<Position>("QB");

  const jerseyNumber = Number(jersey);
  const jerseyOk = Number.isInteger(jerseyNumber) && jerseyNumber >= 1 && jerseyNumber <= 99;
  const ready = lastName.trim().length > 0 && jerseyOk;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    onStart({ lastName: lastName.trim(), jerseyNumber, homeState, position });
  }

  return (
    <div className="frame">
      <h1 className="creation-head">
        Four years
        <br />
        to get drafted
      </h1>

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="jersey">Jersey number</label>
          <div className="jersey">
            <span className="jersey-hash" aria-hidden="true">
              #
            </span>
            <input
              id="jersey"
              className="jersey-input"
              type="number"
              min={1}
              max={99}
              value={jersey}
              onChange={(e) => setJersey(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="lastName">Last name</label>
          <input
            id="lastName"
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="The name on the back of the jersey"
            maxLength={20}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="position">Position</label>
          <select
            id="position"
            className="select"
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
          >
            {ALL_POSITIONS.map((p) => (
              <option key={p} value={p}>
                {CONTENT.positions[p].label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="homeState">Home state</label>
          <select
            id="homeState"
            className="select"
            value={homeState}
            onChange={(e) => setHomeState(e.target.value)}
          >
            {STATE_GROUPS.map((g) => (
              <optgroup key={g.region} label={g.region}>
                {g.states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button className="primary" type="submit" disabled={!ready}>
          Start the recruiting cycle
        </button>
      </form>

      <p className="seed-note">Seed {seed}</p>

      {hasLog && (
        <p style={{ marginTop: "1.4rem" }}>
          <button className="ghost" type="button" onClick={onViewLog}>
            Past careers
          </button>
        </p>
      )}
    </div>
  );
}
