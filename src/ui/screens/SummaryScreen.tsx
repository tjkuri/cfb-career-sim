import { useState } from "react";
import type { CareerView } from "../session/types";
import { shareText } from "../session/share";

interface Props {
  view: CareerView;
  hasLog: boolean;
  onRestart: () => void;
  onViewLog: () => void;
}

export function SummaryScreen({ view, hasLog, onRestart, onViewLog }: Props) {
  const s = view.summary;
  const [copied, setCopied] = useState(false);
  if (!s) return null;

  const text = shareText(view);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked. The text is on screen to select by hand.
      setCopied(false);
    }
  }

  return (
    <div className="frame">
      <div className="rail">
        <span className="rail-school">{view.playerName}</span>
        <span>{view.positionLabel}</span>
      </div>

      <p className={s.wasDrafted ? "verdict" : "verdict quiet"}>{s.headline}</p>
      {s.subhead && <p className="verdict-sub">{s.subhead}</p>}

      <p className="path">{s.schoolPath.join(" → ")}</p>
      <p className="ovr">Finished at {s.finalOverall} overall</p>

      {s.seasons.length > 0 && (
        <>
          <h2 className="section-head">Seasons</h2>
          {s.seasons.map((season) => (
            <div className="season" key={season.seasonIndex}>
              <span className="season-school">{season.schoolName}</span>
              <span className="season-record">{season.record}</span>
              <span className="season-record">{season.snaps} snaps</span>
              {season.stats.length > 0 && (
                <span className="season-stats">
                  {season.stats.map((st) => (
                    <span key={st.label}>
                      {st.label} {st.value}
                    </span>
                  ))}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {(s.awards.length > 0 || s.trophies.length > 0) && (
        <>
          <h2 className="section-head">Honors</h2>
          <ul className="honors">
            {s.awards.map((a) => (
              <li key={a}>{a}</li>
            ))}
            {s.trophies.map((t) => (
              <li key={t.label}>
                {t.count > 1 ? `${t.count} × ${t.label}` : t.label}
              </li>
            ))}
          </ul>
        </>
      )}

      {s.moments.length > 0 && (
        <>
          <h2 className="section-head">Moments</h2>
          {s.moments.map((m, i) => (
            <div className="moment" key={`${m.item}-${i}`}>
              <span className="moment-glyph" aria-hidden="true">
                {m.glyph}
              </span>
              <span>{m.item}</span>
            </div>
          ))}
        </>
      )}

      <div className="share">
        <pre className="share-pre">{text}</pre>
        <button className="continue" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy career"}
        </button>
        <button className="ghost" type="button" onClick={onRestart}>
          New career
        </button>
        {hasLog && (
          <button className="ghost" type="button" onClick={onViewLog}>
            Past careers
          </button>
        )}
      </div>
    </div>
  );
}
