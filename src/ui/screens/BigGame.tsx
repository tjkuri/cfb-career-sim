import { useEffect, useMemo, useState } from "react";
import type { BigGameResult, BigGameStakes, Matchup, Position, Spot } from "../../engine/index";
import { Telestrator } from "../telestrator/Telestrator";
import { preSnap, stagePlay } from "../telestrator/choreo";
import type { DecisionView, Resolved } from "../session/types";
import { Trophy } from "./Trophy";
import { Confetti } from "./Confetti";
import { ContinueButton, useQuietFocus } from "./Continue";

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

function Bug({ stakes, name, opponent, setting }: { stakes: BigGameStakes; name: string; opponent: string; setting?: string }) {
  return (
    <div className="bug cond">
      <span className="bug-stakes">{STAKES_LABEL[stakes]}</span>
      <span className="bug-game">{name}</span>
      {setting && <span className="bug-setting">{setting}</span>}
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

// --- the snap ----------------------------------------------------------------

const SNAP_MS = 3800;

function useNarrow(): boolean {
  const query = "(max-width: 620px)";
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/** Runs the snap from 0 to 1 once, unless reduced motion asks for the end. */
function useSnapClock(): [number, () => void] {
  const [t, setT] = useState(() => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0));
  useEffect(() => {
    if (t >= 1) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / SNAP_MS);
      setT(next);
      if (next < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Runs once per mount; skipping sets t to 1 directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [t, () => setT(1)];
}

// --- the call ----------------------------------------------------------------

interface CardProps {
  d: DecisionView;
  position: Position;
  team: string;
  record: string | null;
  onChoose: (id: string) => void;
}

export function BigGameCard({ d, position, team, record, onChoose }: CardProps) {
  const g = d.bigGame!;
  const narrow = useNarrow();
  const [named, setNamed] = useState(false);
  const play = useMemo(() => preSnap(position, g.spot, g.lookIndex, g.pkg), [position, g.spot, g.lookIndex, g.pkg]);
  // The wind is the field goal's read; on a chip shot it is the block team.
  const kick = g.setting === "fieldgoal";
  return (
    <div className={`card biggame broadcast-card broadcast-intro stakes-${g.stakes}`}>
      <Bug stakes={g.stakes} name={g.name} opponent={g.opponent} setting={g.packageName} />
      <p className="stakes-intro">
        {g.intro}
        {record && <span className="dim"> You went {record} to get here.</span>} {g.situation}
      </p>
      <Scoreboard spot={g.spot} team={team} opponent={g.opponent} />
      <div className="stage">
        <Telestrator play={play} spot={g.spot} t={0} live={false} tight={narrow} ariaLabel={`Before the snap. ${g.look}.`} />
      </div>
      {g.thrownIn && <p className="thrown">The starter goes down on the drive before. Coach looks down the bench at you.</p>}

      <div className="clues">
        <div className="clue">
          <span className="clue-head">{kick ? "Warmups" : "Film"}</span>
          <span className="clue-body">
            <b>{g.scout.call}</b> on {g.scout.percent}% of {kick ? "warmup kicks" : "snaps like this"}
          </span>
          <span className="clue-meter" aria-hidden="true">
            <span style={{ width: `${g.scout.percent}%` }} />
          </span>
        </div>
        <div className="clue">
          <span className="clue-head">{kick ? "The flags right now" : "Pre-snap look"}</span>
          <span className="clue-body">
            {named ? <b>{g.look}</b> : kick ? "Read the flags on the uprights." : "Read the alignment on the field."}
          </span>
          <span className="clue-note">
            {kick ? "Wind shifts about 4 kicks in 10." : "Defenses disguise about 4 looks in 10."}{" "}
            {!named && (
              <button type="button" className="name-look" onClick={() => setNamed(true)}>
                Name it for me
              </button>
            )}
          </span>
        </div>
      </div>

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

interface ResultProps {
  r: Resolved;
  position: Position;
  team: string;
  onContinue: () => void;
}

export function BigGameResultCard({ r, position, team, onContinue }: ResultProps) {
  const g = r.bigGame!;
  const narrow = useNarrow();
  const [t, skip] = useSnapClock();
  const focus = useQuietFocus();
  const drawable = !!g.spot && g.callIndex !== undefined && g.counterIndex !== undefined && g.lookIndex !== undefined;
  const play = useMemo(
    () =>
      drawable
        ? stagePlay({
            position,
            pkg: g.pkg ?? 0,
            spot: g.spot!,
            mine: g.callIndex!,
            theirs: g.counterIndex!,
            look: g.lookIndex!,
            won: g.won,
            strong: g.matchup === "strong",
          })
        : null,
    [drawable, position, g],
  );
  const done = !play || t >= 1;
  // Only the long field goal is about the wind; a chip shot is about the block.
  const windy = g.spot?.side === "kick" && (g.pkg ?? 0) === 0;
  const [us, them] = g.score;
  const trophy = g.won ? STAKES_TROPHY[g.stakes] : null;
  const matchup = g.matchup ? MATCHUP[g.matchup] : null;
  return (
    <div className={`card biggame broadcast-card stakes-${g.stakes} enter ${done ? (g.won ? "is-good" : "is-bad") : ""}`}>
      {done && g.won && g.stakes !== "rivalry" && <Confetti big={g.stakes === "cfp"} />}
      <Bug stakes={g.stakes} name={g.name} opponent={g.opponent} />
      {g.spot && <Scoreboard spot={g.spot} team={team} opponent={g.opponent} score={done ? g.score : undefined} />}
      {play && g.spot && (
        <div className="stage">
          <Telestrator play={play} spot={g.spot} t={t} live tight={narrow} ariaLabel={`${g.call} against ${g.counter}. ${finalWord(g)}`} />
        </div>
      )}
      {done ? (
        <>
          <p className="reveal">
            {windy ? (
              <>
                You aimed <b>{g.call?.toLowerCase()}</b>. The wind: <b>{g.counter?.toLowerCase()}</b>.
              </>
            ) : (
              <>
                You called <b>{g.call}</b>. They ran <b>{g.counter}</b>
                {g.lookIndex !== undefined && g.lookIndex !== g.counterIndex ? <span className="dim"> (they showed you something else)</span> : null}.
              </>
            )}
          </p>
          {matchup && <p className={`matchup matchup-${matchup.tone}`}>{windy ? matchup.kick : matchup.label}</p>}
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
        </>
      ) : (
        <div className="result-foot">
          <span className="dim">{g.call}</span>
          <button type="button" className="ghost" onClick={skip} ref={focus}>
            Skip to the result
          </button>
        </div>
      )}
    </div>
  );
}
