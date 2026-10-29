import { useEffect, useState } from "react";
import type { GameState } from "../../engine/index";
import { buildSummary, shareText } from "../session/summary";
import type { GameView } from "../session/types";
import { ovrBand } from "./CareerScreen";
import { Trophy } from "./Trophy";

interface Props {
  state: GameState;
  view: GameView;
  hasLog: boolean;
  onRestart: () => void;
  onViewLog: () => void;
}

const TICK_MS = 3200;
const LAST_PICK = 224; // seven rounds of 32

/**
 * Draft night: the board ticks through the picks, slowing as it reaches
 * yours, and stops on your name, or runs out without it.
 */
function useDraftClock(target: number): [number, boolean, () => void] {
  const [pick, setPick] = useState(() => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 1));
  const done = pick >= target;
  useEffect(() => {
    if (done) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / TICK_MS);
      // Fast through the early picks, crawling into yours.
      const eased = 1 - Math.pow(1 - p, 4);
      setPick(Math.max(1, Math.round(target * eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Runs once; skipping jumps straight to the end.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [pick, done, () => setPick(target)];
}

function roundAndPick(n: number): string {
  return `Round ${Math.ceil(n / 32)}, Pick ${((n - 1) % 32) + 1}`;
}

export function SummaryScreen({ state, view, hasLog, onRestart, onViewLog }: Props) {
  const s = buildSummary(state);
  const [copied, setCopied] = useState(false);
  const busted = state.status === "busted";
  const target = busted ? 1 : s.overallPick || LAST_PICK;
  const [pick, revealed, skip] = useDraftClock(target);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText(state));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="summary">
      <section className={`draft ${revealed ? `draft-${s.tier} draft-revealed` : "draft-ticking"}`} aria-live="polite">
        <p className="draft-kicker">{view.name} #{view.number} · {view.positionLabel}</p>
        {revealed ? (
          <>
            <h1 className="draft-head cond">{s.headline}</h1>
            <p className="draft-sub">{s.subhead}</p>
            <div className={`ovr ovr-${ovrBand(view.overall)} draft-ovr`}>
              <span className="ovr-num cond">{view.overall}</span>
              <span className="ovr-tag">OVR</span>
            </div>
          </>
        ) : (
          <>
            <p className="draft-clock-label">Draft night · on the clock</p>
            <p className="draft-clock cond">{roundAndPick(pick)}</p>
            <p className="draft-sub dim">Pick #{pick}. Your phone is face up on the table.</p>
            <button type="button" className="ghost" onClick={skip}>
              Skip to my pick
            </button>
          </>
        )}
      </section>

      {revealed && (
        <>

      {s.honors.length > 0 ? (
        <ul className="cabinet" aria-label="Trophy cabinet">
          {s.honors.map((h, i) => (
            <li key={h.id} style={{ animationDelay: `${400 + i * 160}ms` }}>
              <Trophy id={h.id} size={h.rarity === 3 ? 76 : h.rarity === 2 ? 62 : 52} />
              <span className="cabinet-label">
                {h.count > 1 && <span className="cabinet-count">{h.count}× </span>}
                {h.label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="cabinet-empty dim">An empty trophy case. Next career, take the shot.</p>
      )}

      <section className="scouting">
        <h2 className="sum-title cond">Scouting report</h2>
        <div className="scout-cols">
          {s.scouting.liked.length > 0 && (
            <ul className="scout-list scout-good">
              {s.scouting.liked.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          {s.scouting.concerns.length > 0 && (
            <ul className="scout-list scout-bad">
              {s.scouting.concerns.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
        </div>
        {s.scouting.nextRound && <p className="scout-next cond">{s.scouting.nextRound}</p>}
      </section>

      <section className="sum-grid">
        <div className="sum-block">
          <h2 className="sum-title cond">Path</h2>
          <p className="sum-path">{s.schoolPath.join(" → ")}</p>
          <dl className="recap-stats">
            <div>
              <dt>Team record</dt>
              <dd className="cond">{s.record}</dd>
            </div>
            <div>
              <dt>Big games</dt>
              <dd className="cond">
                {s.bigGames.won}–{s.bigGames.played - s.bigGames.won}
              </dd>
            </div>
            {s.totals.map((t) => (
              <div key={t.label}>
                <dt>{t.label}</dt>
                <dd className="cond">{t.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="sum-block">
          <h2 className="sum-title cond">Season by season</h2>
          <ol className="sum-seasons">
            {view.ledger
              .filter((r) => r.state !== "future")
              .map((r) => (
                <li key={r.seasonNumber}>
                  <span className="lrow-class cond">{r.classLabel}</span>
                  <span>
                    {r.schoolName}
                    {r.record && <span className="dim"> · {r.record}</span>}
                    {r.honors.map((h, i) => (
                      <Trophy key={i} id={h.id} size={16} className="inline-trophy" />
                    ))}
                  </span>
                  {r.overall !== undefined && <span className={`lrow-ovr cond ovr-${ovrBand(r.overall)}`}>{r.overall}</span>}
                </li>
              ))}
          </ol>
        </div>

        {view.moments.length > 0 && (
          <div className="sum-block">
            <h2 className="sum-title cond">Moments</h2>
            <ul className="moments">
              {view.moments.map((m, i) => (
                <li key={i}>
                  <span aria-hidden="true">{m.icon}</span> {m.item}
                  <span className="dim"> · year {m.seasonNumber}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

          <div className="sum-actions">
            <button type="button" className="go" onClick={onRestart} autoFocus>
              Play another career
            </button>
            <button type="button" className="ghost" onClick={copy}>
              {copied ? "Copied" : "Copy share text"}
            </button>
            {hasLog && (
              <button type="button" className="ghost" onClick={onViewLog}>
                Past careers
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
