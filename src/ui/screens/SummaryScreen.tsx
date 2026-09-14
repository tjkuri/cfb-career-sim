import { useState } from "react";
import type { CareerView, HonorView, MomentView, SeasonView } from "../session/types";
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

// The career's own arc, end to end. The playtest confirmed the OVR column for
// four and five seasons ("66 / 63 / 71 / 83 -- I read that as an arc without
// being told to") and refuted it for two, where the same layout yields a
// two-row stub that just stops. This is the closing line that gives a short
// career a shape and a long one a total: it compares the two numbers at the
// ends of the column, both already on screen, so it discloses nothing and
// invents nothing. Null unless at least two seasons actually recorded an OVR
// -- a one-season career and a pre-009 save get no span rather than a
// fabricated zero (DECISION 014).
function arcSpan(seasons: SeasonView[]): { first: number; last: number; net: number } | null {
  const rated = seasons.filter((s): s is SeasonView & { overall: number } => s.overall !== null);
  const first = rated[0];
  const last = rated[rated.length - 1];
  if (!first || !last || first === last) return null;
  return { first: first.overall, last: last.overall, net: last.overall - first.overall };
}

// Distinctions from routine results. Rarity 1 is `allConference` and
// `bowlWin`, which 50.5% and 45.3% of careers respectively earn; 2 and 3 are
// the things almost nobody gets. Splitting them is what stops the word HONORS
// from appearing over a bowl win -- see `HONOR_RARITY` in view-model.ts for the
// measurement, and DECISION 014 for the rule that the answer is to stop
// claiming the thing, not to stop showing it.
function splitHonors(honors: HonorView[]): { distinctions: HonorView[]; routine: HonorView[] } {
  return {
    distinctions: honors.filter((h) => h.rarity > 1),
    routine: honors.filter((h) => h.rarity === 1),
  };
}

export function SummaryScreen({ view, hasLog, onRestart, onViewLog }: Props) {
  const s = view.summary;
  const [copied, setCopied] = useState(false);
  if (!s) return null;

  const text = shareText(view);
  const seasonWord = s.seasons.length === 1 ? "season" : "seasons";
  const momentGroups = groupMoments(s.moments, s.seasons);
  const hasArc = s.seasons.some((season) => season.overall !== null);
  const span = arcSpan(s.seasons);
  // Two seasons in a layout built for five read as truncated (playtest claim
  // 5). The block is not rebuilt for short careers; it is given the room and
  // the closing edge that make two rows look finished rather than cut off.
  const arcSpanLength = s.seasons.length <= 2 ? "short" : "full";
  const { distinctions, routine } = splitHonors(s.honors);

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

      {/* The most consequential sentence the game ever prints, and until now
          the one with no range: a 3rd-round pick and a 7th-round pick differed
          only in their digits. `data-magnitude` is the draft round, 5 (round
          1) down to 1 (no call at all), and it drives scale, weight, width and
          entrance travel -- never hue. Every tier is `--milestone`; the line
          DECISIONS 006, 012 and 021 draw is that a bad ending is quieter than
          a good one, never a different colour.

          `.quiet` is kept beside it because DECISION 021 named
          `.verdict-block.quiet .verdict` as its one-line revert point; it now
          selects exactly the set that magnitude 1 covers. */}
      <section
        className={s.wasDrafted ? "verdict-block" : "verdict-block quiet"}
        data-magnitude={s.verdictMagnitude}
      >
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
          <div className="arc" data-span={arcSpanLength}>
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
            {/* The closing row. It exists so the block ends rather than stops
                -- which a five-row career could get away with and a two-row
                one could not -- and so a short career states its own shape
                instead of leaving the reader to find one in two numerals. */}
            {span && (
              <div className="arc-span">
                <span className="arc-span-label">
                  Across {s.seasons.length} {seasonWord}
                </span>
                <span className="arc-span-range">
                  {span.first} → {span.last}
                </span>
                {span.net !== 0 && <span className={deltaClass(span.net)}>{signed(span.net)}</span>}
              </div>
            )}
          </div>
        </>
      )}

      {s.honors.length > 0 && (
        <>
          {/* The heading is the fix the playtest asked for. An HONORS block
              fired on 70.5% of careers and read `Bowl Win` alone on 17.8% of
              them -- including a deliberately-bad 7-5 / 5-7 two-season career,
              which the screen then congratulated. A bowl win and an
              all-conference nod are real and are still printed; they are
              printed as what half the league has, not as an honour. When a
              career has an actual distinction, the word is earned and used. */}
          <h2 className="section-head">{distinctions.length > 0 ? "Honors" : "Also earned"}</h2>
          {distinctions.length > 0 && (
            <ul className="honors">
              {distinctions.map((h) => (
                <li className="honor" data-rarity={h.rarity} key={h.id}>
                  <span className="honor-label">{h.label}</span>
                  {h.count > 1 && <span className="honor-count">{`×${h.count}`}</span>}
                </li>
              ))}
            </ul>
          )}
          {routine.length > 0 && (
            <ul className="also">
              {routine.map((h) => (
                <li className="also-chip" key={h.id}>
                  {h.label}
                  {h.count > 1 && <span className="also-count">{`×${h.count}`}</span>}
                </li>
              ))}
            </ul>
          )}
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
