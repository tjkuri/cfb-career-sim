import { useState } from "react";
import { ALL_POSITIONS, type Position, type Setup } from "../../engine/index";
import { REGIONS } from "../../content/regions";

// Home states come from REGIONS rather than a list of all fifty: states outside
// it get no recruiting region bonus, so offering them would hand the player a
// quietly worse choice with no way to know it.
const STATE_GROUPS = Object.entries(REGIONS).map(([region, states]) => ({
  region,
  states: [...states].sort(),
}));

const POSITION_TILES: Record<Position, { short: string; name: string; blurb: string }> = {
  QB: { short: "QB", name: "Quarterback", blurb: "The Heisman favourite. Every big game is on you." },
  OSKILL: { short: "RB/WR", name: "Skill player", blurb: "Yards, touchdowns, highlight reels." },
  OL: { short: "OL", name: "Offensive line", blurb: "Nobody knows your name until the draft does." },
  DL: { short: "DL", name: "Defensive line", blurb: "Sacks. Lots of sacks." },
  DSKILL: { short: "LB/DB", name: "Defensive skill", blurb: "Picks, tackles, the last stop of the game." },
  K: { short: "K", name: "Kicker", blurb: "Hard mode. One kick, whole season." },
};

const NAMES = ["Carter", "Mason", "Brooks", "Jackson", "Reed", "Hayes", "Bishop", "Coleman", "Tate", "Ellison", "Moss", "Dawkins"];

interface Props {
  seed: string;
  hasLog: boolean;
  onStart: (setup: Setup) => void;
  onViewLog: () => void;
}

export function CreationScreen({ seed, hasLog, onStart, onViewLog }: Props) {
  const [lastName, setLastName] = useState(() => NAMES[parseInt(seed, 36) % NAMES.length]!);
  const [jersey, setJersey] = useState("7");
  const [homeState, setHomeState] = useState("TX");
  const [position, setPosition] = useState<Position>("QB");

  const jerseyNumber = Number(jersey);
  const jerseyOk = Number.isInteger(jerseyNumber) && jerseyNumber >= 0 && jerseyNumber <= 99;
  const blocker = !lastName.trim() ? "Add a last name to start." : !jerseyOk ? "Pick a jersey number from 0 to 99." : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (blocker) return;
    onStart({ lastName: lastName.trim(), jerseyNumber, homeState, position });
  }

  return (
    <div className="create">
      <h1 className="create-head cond">
        Four years.
        <br />
        One shot at the draft.
      </h1>
      <p className="create-sub">
        Pick your school, take your gambles, and call the play when the season is on the line.
      </p>

      <form onSubmit={submit}>
        <fieldset className="pos-grid">
          <legend className="field-label">Position</legend>
          {ALL_POSITIONS.map((p) => (
            <label key={p} className={`pos ${position === p ? "is-on" : ""}`}>
              <input type="radio" name="position" value={p} checked={position === p} onChange={() => setPosition(p)} />
              <span className="pos-short cond">{POSITION_TILES[p].short}</span>
              <span className="pos-name">{POSITION_TILES[p].name}</span>
              <span className="pos-blurb">{POSITION_TILES[p].blurb}</span>
            </label>
          ))}
        </fieldset>

        <div className="create-row">
          <div className="field">
            <label className="field-label" htmlFor="lastName">Last name</label>
            <input id="lastName" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={20} autoComplete="off" />
          </div>
          <div className="field field-num">
            <label className="field-label" htmlFor="jersey">Number</label>
            <input id="jersey" className="input" type="number" min={0} max={99} value={jersey} onChange={(e) => setJersey(e.target.value)} inputMode="numeric" />
          </div>
          <div className="field field-num">
            <label className="field-label" htmlFor="homeState">Home</label>
            <select id="homeState" className="input" value={homeState} onChange={(e) => setHomeState(e.target.value)}>
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
        </div>

        <button className="go go-big" type="submit" disabled={!!blocker}>
          Go to Signing Day
        </button>
        {blocker && <p className="blocker">{blocker}</p>}
      </form>

      <div className="create-foot">
        {hasLog && (
          <button className="ghost" type="button" onClick={onViewLog}>
            Past careers
          </button>
        )}
        <span className="dim">Seed {seed}</span>
      </div>
    </div>
  );
}
