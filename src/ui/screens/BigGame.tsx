import { useEffect, useState } from "react";
import type { BigGameResult, BigGameStakes, Matchup, Spot } from "../../engine/index";
import type { DecisionView, Resolved } from "../session/types";
import { Trophy } from "./Trophy";
import { Confetti } from "./Confetti";
import { ContinueButton } from "./Continue";

const STAKES_LABEL: Record<BigGameStakes, string> = {
  rivalry: "Rivalry",
  bowl: "Bowl season",
  conf: "Conference title",
  cfp: "National title",
};

const STAKES_TROPHY: Record<BigGameStakes, { id: string; label: string } | null> = {
  rivalry: null,
  bowl: { id: "bowlWin", label: "Bowl champions" },
  conf: { id: "confTitle", label: "Conference champions" },
  cfp: { id: "cfpTitle", label: "National champions" },
};

const MATCHUP: Record<Matchup, { label: string; kick: string; tone: string }> = {
  strong: { label: "Right call: it beats what they ran", kick: "Right read: you played the wind", tone: "good" },
  even: { label: "Even matchup: it came down to execution", kick: "Half a read: it came down to your leg", tone: "neutral" },
  weak: { label: "Wrong call: they had it covered", kick: "Wrong read: the wind had other ideas", tone: "bad" },
};

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function ordinal(n: number): string {
  return ["", "1st", "2nd", "3rd", "4th"][n] ?? `${n}th`;
}

/** "3rd & Goal at the 9", "They have 2nd & 7 at your 35", "47-yard field goal". */
export function downAndDistance(spot: Spot): string {
  if (spot.side === "kick") return `${spot.yardsToGoal + 17}-yard field goal`;
  const togo = spot.toGo >= spot.yardsToGoal ? "Goal" : String(spot.toGo);
  const dd = `${ordinal(spot.down)} & ${togo}`;
  return spot.side === "offense" ? `${dd} at their ${spot.yardsToGoal}` : `They have ${dd} at your ${spot.yardsToGoal}`;
}

function Bug({ stakes, name, opponent }: { stakes: BigGameStakes; name: string; opponent: string }) {
  return (
    <div className="bug cond">
      <span className="bug-stakes">{STAKES_LABEL[stakes]}</span>
      <span className="bug-game">{name}</span>
      <span className="bug-vs">vs {opponent}</span>
    </div>
  );
}

function Scoreboard({ spot, team, opponent, score }: { spot: Spot; team: string; opponent: string; score?: [number, number] }) {
  const [us, them] = score ?? [spot.us, spot.them];
  return (
    <div className="scoreboard cond" aria-label={`${team} ${us}, ${opponent} ${them}. ${downAndDistance(spot)}`}>
      <span className="sb-team">{team}</span>
      <span className={`sb-score ${score && us > spot.us ? "sb-flash" : ""}`}>{us}</span>
      <span className="sb-mid">
        <span className="sb-clock">{spot.overtime ? "OT" : `Q4 ${clock(spot.clock)}`}</span>
        <span className="sb-dd">{downAndDistance(spot)}</span>
      </span>
      <span className={`sb-score ${score && them > spot.them ? "sb-flash" : ""}`}>{them}</span>
      <span className="sb-team sb-them">{opponent}</span>
    </div>
  );
}

// --- the field ---------------------------------------------------------------

const W = 600;
const H = 74;
const EZ = 60; // end zone width in px

/**
 * The near end of the field, drawn so the end zone being attacked is on the
 * right. On defense that end zone is yours. `outcome` animates the ball to
 * where the snap left it.
 */
function Field({ spot, outcome }: { spot: Spot; outcome?: { won: boolean } }) {
  const visible = Math.max(25, Math.min(50, spot.yardsToGoal + 14));
  const ppy = (W - EZ) / visible;
  const x = (ytg: number) => W - EZ - ytg * ppy;
  const ballX = x(spot.yardsToGoal);
  const gain = spot.toGo < spot.yardsToGoal ? x(spot.yardsToGoal - spot.toGo) : null;

  const [moved, setMoved] = useState(false);
  useEffect(() => {
    if (!outcome) return;
    const t = window.setTimeout(() => setMoved(true), 250);
    return () => window.clearTimeout(t);
  }, [outcome]);

  // Where the ball ends up.
  let endX = ballX;
  let endY = H / 2;
  if (outcome) {
    const scored = spot.side === "defense" ? !outcome.won : outcome.won;
    if (spot.side === "kick") {
      endX = W - 8;
      endY = outcome.won ? H / 2 : H / 2 + (spot.clock % 2 ? 30 : -30);
    } else if (scored) endX = W - EZ / 2;
    else endX = x(spot.yardsToGoal + (spot.side === "defense" ? 4 : -Math.min(spot.yardsToGoal - 1, 2)));
  }
  const dx = moved ? endX - ballX : 0;
  const dy = moved ? endY - H / 2 : 0;

  const lines = [];
  for (let yd = 5; yd < visible; yd += 5) {
    const lx = x(yd);
    lines.push(<line key={yd} x1={lx} x2={lx} y1={4} y2={H - 4} className={yd % 10 === 0 ? "f-line10" : "f-line5"} />);
    if (yd % 10 === 0)
      lines.push(
        <text key={`n${yd}`} x={lx} y={H - 8} className="f-num">
          {yd}
        </text>,
      );
  }

  return (
    <svg className="field" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={downAndDistance(spot)}>
      <rect x={0} y={0} width={W} height={H} rx={8} className="f-turf" />
      <rect x={W - EZ} y={0} width={EZ} height={H} className={spot.side === "defense" ? "f-ez f-ez-ours" : "f-ez"} />
      {spot.side !== "kick" && (
        <text x={W - EZ / 2} y={H / 2 + 4} className="f-ez-label" transform={`rotate(90 ${W - EZ / 2} ${H / 2})`}>
          {spot.side === "defense" ? "YOURS" : "END ZONE"}
        </text>
      )}
      {lines}
      <line x1={W - EZ} x2={W - EZ} y1={0} y2={H} className="f-goal" />
      {spot.side === "kick" && (
        <g className="f-posts">
          <line x1={W - 8} x2={W - 8} y1={H / 2 - 22} y2={H / 2 + 22} />
          <line x1={W - 8} x2={W - 1} y1={H / 2} y2={H / 2} />
        </g>
      )}
      {gain !== null && <line x1={gain} x2={gain} y1={0} y2={H} className="f-gain" />}
      <line x1={ballX} x2={ballX} y1={0} y2={H} className="f-los" />
      <g className="f-ball" style={{ transform: `translate(${dx}px, ${dy}px)` }}>
        <ellipse cx={ballX} cy={H / 2} rx={12} ry={7} />
        <line x1={ballX - 5} x2={ballX + 5} y1={H / 2} y2={H / 2} />
      </g>
    </svg>
  );
}

// --- the call ----------------------------------------------------------------

interface CardProps {
  d: DecisionView;
  team: string;
  record: string | null;
  onChoose: (id: string) => void;
}

export function BigGameCard({ d, team, record, onChoose }: CardProps) {
  const g = d.bigGame!;
  return (
    <div className={`card biggame stakes-${g.stakes} enter`}>
      <Bug stakes={g.stakes} name={g.name} opponent={g.opponent} />
      <p className="stakes-intro">
        {g.intro}
        {record && <span className="dim"> You went {record} to get here.</span>} {g.situation}
      </p>
      <Scoreboard spot={g.spot} team={team} opponent={g.opponent} />
      <Field spot={g.spot} />
      {g.thrownIn && <p className="thrown">The starter goes down on the drive before. Coach looks down the bench at you.</p>}

      <div className="clues">
        <div className="clue">
          <span className="clue-head">{g.spot.side === "kick" ? "Warmups" : "Film"}</span>
          <span className="clue-body">
            <b>{g.scout.call}</b> on {g.scout.percent}% of {g.spot.side === "kick" ? "warmup kicks" : "snaps like this"}
          </span>
          <span className="clue-meter" aria-hidden="true">
            <span style={{ width: `${g.scout.percent}%` }} />
          </span>
        </div>
        <div className="clue">
          <span className="clue-head">{g.spot.side === "kick" ? "Right now" : "Pre-snap"}</span>
          <span className="clue-body">
            <b>{g.look}</b>
          </span>
          <span className="clue-note">
            {g.spot.side === "kick" ? "Wind shifts about 4 kicks in 10" : "Defenses disguise about 4 looks in 10"}
          </span>
        </div>
      </div>

      <h2 className="card-title cond">Call the play</h2>
      <div className="opts opts-3">
        {d.options.map((o, i) => (
          <button key={o.id} type="button" className="opt" onClick={() => onChoose(o.id)}>
            <span className="opt-key" aria-hidden="true">
              {i + 1}
            </span>
            <span className="opt-label cond">{o.label}</span>
            <span className="opt-detail">{o.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- the result --------------------------------------------------------------

function finalWord(g: BigGameResult): string {
  const side = g.spot?.side ?? "offense";
  if (side === "kick") return g.won ? "It's good!" : "No good";
  if (side === "defense") return g.won ? "Stopped!" : "They score";
  return g.won ? "Touchdown!" : "Stopped";
}

export function BigGameResultCard({ r, team, onContinue }: { r: Resolved; team: string; onContinue: () => void }) {
  const g = r.bigGame!;
  const [us, them] = g.score;
  const trophy = g.won ? STAKES_TROPHY[g.stakes] : null;
  const matchup = g.matchup ? MATCHUP[g.matchup] : null;
  return (
    <div className={`card biggame stakes-${g.stakes} enter ${g.won ? "is-good" : "is-bad"}`}>
      {g.won && g.stakes !== "rivalry" && <Confetti big={g.stakes === "cfp"} />}
      <Bug stakes={g.stakes} name={g.name} opponent={g.opponent} />
      {g.spot && <Scoreboard spot={g.spot} team={team} opponent={g.opponent} score={g.score} />}
      {g.spot && <Field spot={g.spot} outcome={{ won: g.won }} />}
      <p className="reveal">
        {g.spot?.side === "kick" ? (
          <>
            You aimed <b>{g.call?.toLowerCase()}</b>. The wind: <b>{g.counter?.toLowerCase()}</b>.
          </>
        ) : (
          <>
            You called <b>{g.call}</b>. They ran <b>{g.counter}</b>.
          </>
        )}
      </p>
      {matchup && (
        <p className={`matchup matchup-${matchup.tone}`}>{g.spot?.side === "kick" ? matchup.kick : matchup.label}</p>
      )}
      <div className="final cond">
        <span className="final-word">{finalWord(g)}</span>
        <span className="final-score">
          {g.won ? "W" : "L"} {us}–{them}
        </span>
      </div>
      <p className="result-text">{g.text}</p>
      {trophy && (
        <div className="trophy-won">
          <Trophy id={trophy.id} size={g.stakes === "cfp" ? 132 : 104} className="trophy-lift" />
          <span className="trophy-won-label cond">{trophy.label}</span>
        </div>
      )}
      <div className="result-foot">
        <span className="dim">{g.won ? "+1 OVR · +3 Rep" : ""}</span>
        <ContinueButton onContinue={onContinue} />
      </div>
    </div>
  );
}
