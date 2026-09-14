import { useState } from "react";
import type { CareerView, MomentView, SeasonView } from "../session/types";
import { shareText } from "../session/share";

interface Props {
  view: CareerView;
  hasLog: boolean;
  onRestart: () => void;
  onViewLog: () => void;
}

interface MomentGroup {
  seasonIndex: number;
  label: string;
  classYear: string | null;
  moments: MomentView[];
}

// The moments timeline reported three identical trophies and two identical
// rivalry wins, and read "like an event log, not a highlight reel". Measured
// over 700 careers, every repeat is the same moment earned in a *different*
// season -- so the repeats are real and the missing information is the season,
// which `MomentView` has always carried and this list threw away. Grouping is
// the fix; collapsing would delete three years of a career into one line.
function groupMoments(moments: MomentView[], seasons: SeasonView[]): MomentGroup[] {
  const yearOf = new Map(seasons.map((s) => [s.seasonIndex, s.classYear]));
  const groups: MomentGroup[] = [];
  for (const moment of moments) {
    const last = groups[groups.length - 1];
    if (last && last.seasonIndex === moment.seasonIndex) {
      last.moments.push(moment);
      continue;
    }
    groups.push({
      seasonIndex: moment.seasonIndex,
      label: `Season ${moment.seasonIndex + 1}`,
      classYear: yearOf.get(moment.seasonIndex) ?? null,
      moments: [moment],
    });
  }
  return groups;
}

// The arc, season over season. Both ends must be real numbers: a pre-DECISION
// 009 save stores no per-season OVR, and a career with nothing to compare to
// gets no delta rather than a fabricated zero.
function deltaFrom(previous: SeasonView | undefined, season: SeasonView): number | null {
  if (season.overall === null) return null;
  if (previous === undefined || previous.overall === null) return null;
  return season.overall - previous.overall;
}

// DECISION 012: scale and weight may track the magnitude of a change in a value
// the player can already see; hue may never track its direction. A -8 and a +8
// are both loud, and both are the same colour.
function deltaClass(delta: number): string {
  const size = Math.abs(delta);
  if (size >= 6) return "season-delta loud";
  if (size >= 3) return "season-delta mid";
  return "season-delta";
}

function signed(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return "±0";
}

export function SummaryScreen({ view, hasLog, onRestart, onViewLog }: Props) {
  const s = view.summary;
  const [copied, setCopied] = useState(false);
  if (!s) return null;

  const text = shareText(view);
  const seasonWord = s.seasons.length === 1 ? "season" : "seasons";
  const momentGroups = groupMoments(s.moments, s.seasons);
  const hasArc = s.seasons.some((season) => season.overall !== null);

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
      {/* The rail is a fixed slot with `.rail-line` rows (DECISION 019). The
          career is over, so it carries identity only -- one line, no season
          cells to hold open. */}
      <div className="rail">
        <div className="rail-line rail-id">
          <span className="rail-school">{view.playerName}</span>
          <span className="rail-position">{view.positionLabel}</span>
        </div>
      </div>

      {/* The most consequential sentence the game ever prints. It used to be
          set at roughly the weight of a caption. A career that ended without a
          call is set quieter and tighter than one that got drafted -- never in
          a different hue, which is the line DECISIONS 006 and 012 draw. */}
      <section className={s.wasDrafted ? "verdict-block" : "verdict-block quiet"}>
        <p className="path">
          {s.seasons.length > 0 && (
            <span className="path-count">
              {s.seasons.length} {seasonWord}
            </span>
          )}
          <span>{s.schoolPath.join(" → ")}</span>
        </p>
        <p className="verdict">{s.headline}</p>
        {s.subhead && <p className="verdict-sub">{s.subhead}</p>}
        <p className="final-ovr">
          <span className="final-ovr-num">{s.finalOverall}</span>
          <span className="final-ovr-label">final overall</span>
        </p>
      </section>

      {s.seasons.length > 0 && (
        <>
          <h2 className="section-head">Seasons</h2>
          {/* The block a playtester called the best screen in the game, with
              the one column it could never have: the OVR each season was
              finalized at, recorded by DECISION 009 so the arc reads down the
              right-hand edge. */}
          <div className="arc">
            {hasArc && (
              <div className="arc-head" aria-hidden="true">
                <span className="arc-head-ovr">OVR</span>
              </div>
            )}
            {s.seasons.map((season, i) => {
              const delta = deltaFrom(s.seasons[i - 1], season);
              return (
                <div className="season" key={season.seasonIndex}>
                  <span className="season-year">{season.classYear ?? `Y${season.seasonIndex + 1}`}</span>
                  <span className="season-body">
                    <span className="season-school">{season.schoolName}</span>
                    <span className="season-line">
                      {season.record && <span className="season-record">{season.record}</span>}
                      <span className="season-record">{season.snaps} snaps</span>
                    </span>
                    {season.stats.length > 0 && (
                      <span className="season-stats">
                        {season.stats.map((st) => (
                          <span key={st.label}>
                            {st.label} <b>{st.value}</b>
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  {/* A pre-009 save stores no per-season OVR. The cell holds
                      its place and stays empty: the absence of a number, not a
                      NaN and not a substituted one. */}
                  <span className="season-ovr">
                    {season.overall !== null && <span className="season-ovr-num">{season.overall}</span>}
                    {delta !== null && delta !== 0 && <span className={deltaClass(delta)}>{signed(delta)}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {(s.awards.length > 0 || s.trophies.length > 0) && (
        <>
          <h2 className="section-head">Honors</h2>
          {/* The rarest things in the game. They were a bulleted list set
              smaller than the stat labels under them. */}
          <ul className="honors">
            {s.awards.map((a) => (
              <li className="honor" key={a}>
                <span className="honor-label">{a}</span>
              </li>
            ))}
            {s.trophies.map((t) => (
              <li className="honor" key={t.label}>
                <span className="honor-label">{t.label}</span>
                {t.count > 1 && <span className="honor-count">{`×${t.count}`}</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {momentGroups.length > 0 && (
        <>
          <h2 className="section-head">Moments</h2>
          <div className="moments">
            {momentGroups.map((group) => (
              <div className="moment-group" key={group.seasonIndex}>
                <p className="moment-season">
                  <span className="moment-season-n">{group.label}</span>
                  {group.classYear && <span className="moment-season-year">{group.classYear}</span>}
                </p>
                {group.moments.map((m, i) => (
                  <div className="moment" key={`${m.item}-${i}`}>
                    <span className="moment-glyph" aria-hidden="true">
                      {m.glyph}
                    </span>
                    <span className="moment-item">{m.item}</span>
                    {m.count > 1 && <span className="moment-count">{`×${m.count}`}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Copy-as-text on purpose, seed line never omitted (DECISION 005). The
          text is untouched; only its presentation on the page changed. */}
      <section className="share">
        <p className="share-head">Share this career</p>
        <pre className="share-pre">{text}</pre>
        <button className="ghost" type="button" onClick={copy}>
          {copied ? "Copied" : "Copy career"}
        </button>
      </section>

      {/* The playtest: "the primary gold button at the bottom is Copy career.
          New career -- the thing I actually wanted -- is the ghost button next
          to it." The screen exists to sell career #2; it now asks for one. */}
      <div className="summary-actions">
        <button className="primary" type="button" onClick={onRestart}>
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
