import { useState } from "react";
import type { CareerView, HonorView, SeasonView } from "../session/types";
import { shareText } from "../session/share";
import { TRUST_LADDER, trustRungOf } from "../session/bands";
import { countedStatLabel } from "../session/labels";
import { groupMoments } from "../session/view-model";

interface Props {
  view: CareerView;
  hasLog: boolean;
  onRestart: () => void;
  onViewLog: () => void;
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

// DECISION 032: on a career whose arc is NEGATIVE the arc is promoted -- same
// three magnitude cuts as `deltaClass`, so a -2 and a -12 do not shout at the
// same volume. This reads the size of the drop only; the direction decides
// whether the element exists, and the element is the same single hue at every
// size it is ever set in. Nothing here is keyed to a branch flag: the two
// numbers it compares are both already on screen in the column below it.
function declineMagnitude(net: number): 1 | 2 | 3 {
  const size = Math.abs(net);
  if (size >= 6) return 3;
  if (size >= 3) return 2;
  return 1;
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
// Report 020, task 3: `enterOffseason` stops `classYear` at SR, so a fifth
// season stores SR twice and two rows carry the same label -- the one option
// DECISION 015 forbade. The career screen applies this rule via `ledger.ts`;
// the summary's own season table is the third place the duplicate surfaces,
// and it renders from `s.seasons` rather than from a ledger, so it needs the
// equivalent inline. Sequence is the fallback, exactly as DECISION 020 says.
function seasonYearLabel(seasons: SeasonView[], i: number): string {
  const season = seasons[i]!;
  const sequence = `Y${season.seasonIndex + 1}`;
  if (!season.classYear) return sequence;
  const repeated = seasons.some(
    (o, j) => j < i && o.classYear === season.classYear,
  );
  return repeated ? sequence : season.classYear;
}

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
  // The one honest sentence on a tanked career's end screen, and report 017
  // found it "set in the smallest, dimmest type available" under a giant gold
  // headline: "the hierarchy is exactly inverted." On a declining career it
  // moves up into the verdict block and is set at figure size. On a rising
  // one this is null and the block renders exactly as it did -- DECISION 032
  // promotes the arc on a bad ending; it does not quieten a good one.
  const decline = span && span.net < 0 ? span : null;
  const { distinctions, routine } = splitHonors(s.honors);

  // The three elements of the verdict block, named so the no-call branch can
  // order them differently without either branch owning a second copy of the
  // markup. Each is rendered identically in both orders; see the comment at
  // the point of use for why the order is the whole fix.
  const ending = (
    <>
      <p className="verdict">{s.headline}</p>
      {s.subhead && <p className="verdict-sub">{s.subhead}</p>}
    </>
  );
  // The career went down. That is a fact about two numbers the player has
  // already seen, so stating it loudly discloses nothing and scolds no one --
  // DECISION 012's permitted axis, and 032's call. Scale and weight move with
  // the size of the drop; the hue is the chalk the other figures on this
  // screen are set in, identical at every magnitude.
  const arc = decline && (
    <p className="arc-verdict" data-magnitude={declineMagnitude(decline.net)}>
      <span className="arc-verdict-label">
        Over {s.seasons.length} {seasonWord}
      </span>
      <span className="arc-verdict-figure">
        <span className="arc-verdict-range">
          {decline.first} → {decline.last}
        </span>
        <span className="arc-verdict-net">{signed(decline.net)}</span>
      </span>
    </p>
  );
  // DECISION 035: `FINAL OVERALL 61` sits two inches above a table whose last
  // row says 59, and nothing said why. Both numbers stay and the label closes
  // the gap -- this one counts the off-season that followed the last season,
  // and the column head below says the column does not. Four words, at the
  // point of collision.
  const figure = (
    <p className="final-ovr">
      <span className="final-ovr-num">{s.finalOverall}</span>
      <span className="final-ovr-label">
        final overall
        <span className="final-ovr-note">after the off-season</span>
      </span>
    </p>
  );

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

      {/* The most consequential sentence the game ever prints. Its range is
          `data-magnitude`: the draft round at one step per round, 8 (round 1)
          down to 2 (round 7) and 1 for no call at all, driving scale, weight,
          width, opacity and entrance travel -- never hue. It was five steps,
          which made rounds 2 and 3 the same step and therefore unrankable
          (report 017, claim 5); eight is one per round, and the spread runs
          1.34 -> 0.72 rather than 1.12 -> 0.72. Every step is `--milestone`;
          the line DECISIONS 006, 012 and 021 draw is that a bad ending is
          quieter than a good one, never a different colour.

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
        {/* DECISION 032 fixed a congratulatory bad ending by inverting the
            hierarchy, and it fixed it for DRAFTED careers. The undrafted one
            kept the trophy treatment -- report 025: "`Undrafted` is set in the
            same gold display type, size and position as `Round 5, Pick 14`."

            Size and type already differ, and by decision they may not be the
            lever: 026 set the magnitude-1 floor and 032 froze it as "the one
            part of this that was already right". POSITION did not differ, and
            position is what makes it a trophy. This block performs a ceremony
            -- eyebrow, gold line, detail -- and on a career nobody called it
            puts the word for "no result" on the podium.

            `Round 5, Pick 9` is a value. `Undrafted` is the absence of one,
            and this file already rules on absent values, in `.season-ovr`
            below: the slot "holds its place and stays empty -- the absence of
            a number, not a NaN and not a substituted one". A headline slot
            cannot be blank, so it is simply not given first: on a no-call
            ending the career's own closing figure leads and the ending states
            itself last, which is where an ending goes. Every element is the
            same element, in the same hue, at the same size, in a different
            order -- 021's refusal of a chalk/gold split on `.verdict` stands
            untouched. */}
        {s.wasDrafted ? (
          <>
            {ending}
            {arc}
            {figure}
          </>
        ) : (
          <>
            {figure}
            {arc}
            {ending}
          </>
        )}
      </section>

      {/* TASK 043. The one track the game narrated most was not on this screen
          at all: the view model computes `trust` for the live career and this
          file never rendered it, so a player was told "Cost you in the locker
          room." six times across four seasons and then read an ending that did
          not mention the locker room. A playtester asked for exactly this line
          and said it was what would make them start another career.

          It is a LADDER and not a line, because a line is what the career
          screen already has and what did not land. What a rung has that a
          phrase does not is four other rungs: the building could have thought
          something else about you, and here is what. That is the read that
          makes a fourth career worth starting, and it is also the most this
          screen is permitted to say -- position in an order, never a distance
          along it (DECISION 002, DECISION 046).

          Nothing here encodes magnitude. All five rungs are set at one size,
          in one hue, on one rhythm; the player's rung is told apart by being
          filled in rather than by being bigger, and the four that are not
          theirs are identical to each other whether they sit one rung away or
          four. The block carries no accent colour at all -- the seasons block
          above it does not either, and a gold mark on "the staff has stopped
          defending you" would put a trophy treatment on the worst outcome in
          the game (DECISIONS 021, 032).

          Placed directly under the verdict so the two readings of the career
          are read together: what the league decided, then what the building
          decided. Guarded on the phrase being a rung this ladder contains, so
          a save written against different words renders nothing rather than
          five dim lines with no mark on any of them. */}
      {trustRungOf(view.trust) >= 0 && (
        <>
          <h2 className="section-head">With the program</h2>
          <ol className="ladder">
            {TRUST_LADDER.map((phrase) => {
              const here = phrase === view.trust;
              return (
                <li
                  className="rung"
                  key={phrase}
                  data-here={here ? "yes" : "no"}
                  {...(here ? { "aria-current": "true" as const } : {})}
                >
                  <span className="rung-mark" aria-hidden="true" />
                  <span className="rung-body">
                    <span className="rung-phrase">{phrase}</span>
                    {here && <span className="rung-here">You ended here</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}

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
                <span className="arc-head-ovr">Ovr before the offseason</span>
              </div>
            )}
            {s.seasons.map((season, i) => {
              const delta = deltaFrom(s.seasons[i - 1], season);
              return (
                <div className="season" key={season.seasonIndex}>
                  <span className="season-year">{seasonYearLabel(s.seasons, i)}</span>
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
                            {countedStatLabel(st.label, st.value)} <b>{st.value}</b>
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
                instead of leaving the reader to find one in two numerals.

                It is absent on a declining career because the statement has
                MOVED, not been copied: printing `63 -> 59 -4` twice inside
                one screen-height would be the same fact said quietly under
                the same fact said loudly. The block still closes -- `.arc`
                carries its own bottom rule, which is what wave 6 actually
                fixed -- and the shape is stated above, larger. */}
            {span && !decline && (
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
          {distinctions.length > 0 && <h2 className="section-head">Honors</h2>}
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
          {/* DECISION 034: the routine group gets its own heading WHENEVER it
              renders, including -- especially -- when distinctions render
              above it. 027 shipped this as a ternary, so a career with both
              printed a gold All-American box and then an unheaded grey chip:
              "with nothing naming the second tier it reads as 'and this
              lesser thing'." No block is restored and no rarity split is
              undone; the second tier is simply named. */}
          {routine.length > 0 && (
            <h2 className={distinctions.length > 0 ? "section-head second" : "section-head"}>
              Also earned
            </h2>
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

      {/* Gated on there being a moment to show, NOT on there being a group.
          `groupMoments` now returns a row per season, so a career that earned
          nothing would otherwise open a MOMENTS heading over four rows saying
          so -- which is a section about nothing. The quiet rows exist to stop a
          year vanishing from a list the player is already reading (B67), not to
          create the list. */}
      {s.moments.length > 0 && (
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
                {/* B67. A season with no moment used to produce no row at all,
                    so the timeline printed `Season 1 / Season 2 / Season 4` and
                    read as a year that had gone missing rather than a year that
                    was quiet. 172 careers in 360 have at least one. The row
                    states which it is, in the same words the screen uses
                    everywhere else for an absence, and claims nothing about
                    why. */}
                {group.moments.length === 0 && (
                  <p className="moment-quiet">A year with nothing to put on this list.</p>
                )}
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
