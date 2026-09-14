import type { CareerView, Resolved, StatView } from "../session/types";

interface Props {
  view: CareerView;
  resolved: Resolved | null;
  onChoose: (optionId: string) => void;
  onContinue: () => void;
}

const NUM = new Intl.NumberFormat("en-US");

/**
 * How loud the card is allowed to be, from the size of a change the player can
 * already see (DECISION 012). Measured over 4,404 resolved cards: 46.6% move
 * `overall` by 0, 42.4% by 1-2, 9.1% by 3-5 and 1.9% by 6 or more. The tiers
 * are cut on those breaks so the loudest treatment fires on about one card in
 * fifty -- the playtester's -8 torn leg lands in it, and the speeding-ticket
 * joke (which moves character only, so delta 0) renders nothing at all.
 *
 * Magnitude only. `Math.abs` is load-bearing: a +8 and a -8 return the same
 * tier and therefore get the same treatment, which is the whole of the rule
 * that scale may track magnitude while hue may never track valence.
 */
function magnitude(delta: number): 0 | 1 | 2 | 3 {
  const size = Math.abs(delta);
  if (size === 0) return 0;
  if (size <= 2) return 1;
  if (size <= 5) return 2;
  return 3;
}

function statLine(stats: StatView[]): string {
  return stats.map((s) => `${NUM.format(s.value)} ${s.label}`).join("   ");
}

export function CareerScreen({ view, resolved, onChoose, onContinue }: Props) {
  // DECISION 019. While an outcome is on screen the rail describes the card
  // being read, not the state the engine has already moved into: `advance()`
  // rolls the phase, the season index and the class year before it returns, and
  // 71% of resolved cards were being read under a phase that was not theirs.
  // The stamp is nullable -- a save written before it existed, and any card
  // restored from one -- so every cell falls back to the live view, never to
  // `undefined`.
  const stamp = resolved?.stamp ?? null;
  const school = (stamp ? stamp.schoolName : view.schoolName) ?? "Uncommitted";
  const classYear = stamp?.classYear ?? view.classYear;
  const seasonNumber = stamp?.seasonNumber ?? view.seasonNumber;
  const phase = stamp?.phaseLabel ?? view.phaseLabel;

  // Snaps, the stat line and the record stay live on purpose. The stamp freezes
  // the season's *identity*; these are the line being written, and DECISION 014
  // keeps the record absent until the postseason resolver has made it real.
  const line = view.season;

  // Null baseline means a save that predates the field, not a change of zero.
  // No delta is reported rather than a fabricated one.
  const delta =
    resolved && resolved.overallBefore !== null ? view.overall - resolved.overallBefore : 0;
  const loudness = magnitude(delta);

  return (
    <div className="frame">
      {/* A fixed slot with fixed cells. A cell with nothing to say renders
          empty and keeps its space, so the strip never changes shape between a
          decision and its outcome (DECISION 019). */}
      <div className="rail">
        <div className="rail-line rail-id">
          <span className="rail-school">{school}</span>
          <span className="rail-when">
            Season {seasonNumber}
            <span className="rail-class">{classYear}</span>
          </span>
        </div>
        <div className="rail-line rail-where">
          <span className="rail-player">{view.playerName}</span>
          <span className="rail-phase">{phase}</span>
          {/* Empty until the postseason resolver has assigned a real W-L
              (DECISION 014). The cell holds its width either way. */}
          <span className="rail-record">{line?.record ?? ""}</span>
        </div>
        <div className="rail-line rail-stats">
          <span className="rail-snaps">{line ? `${NUM.format(line.snaps)} snaps` : ""}</span>
          <span className="rail-statline">{line ? statLine(line.stats) : ""}</span>
        </div>
      </div>

      <div className="standing">
        <span className="ovr-number">{view.overall}</span>
        <span className="ovr-gloss">
          <span className="ovr-band">{view.standing}</span>
          <span className="trust">{view.trust}</span>
        </span>
      </div>

      {resolved ? (
        <section className="card fade-in" aria-live="polite">
          <h2 className="card-title">{resolved.title}</h2>

          {/* A one-option card was never a choice, so it is read as a single
              narrated beat: the setup, the thing that happened, and what it
              cost (DECISION 018). The label is a quiet line, never "You chose:". */}
          {resolved.narrated ? (
            <>
              {resolved.description && <p className="card-body">{resolved.description}</p>}
              <p className="resolved-beat">{resolved.choiceLabel}</p>
            </>
          ) : (
            <p className="resolved-choice">You chose: {resolved.choiceLabel}</p>
          )}

          {/* The outcome and what it cost, inside one rule, because they are
              one fact. The rule thickens and the number grows with the size of
              the change; neither ever changes hue, so a +8 and a -8 are equally
              loud and indistinguishable by colour (DECISION 012). */}
          <div className="consequence" data-magnitude={loudness}>
            <p className="outcome">{resolved.outcome}</p>
            {loudness > 0 && (
              <p className="delta">
                <span aria-hidden="true">
                  {delta > 0 ? "+" : "−"}
                  {Math.abs(delta)} OVR
                </span>
                <span className="sr-only">
                  Overall {delta > 0 ? "up" : "down"} {Math.abs(delta)}, now {view.overall}
                </span>
              </p>
            )}
          </div>

          <button className="continue" type="button" onClick={onContinue} autoFocus>
            Continue
          </button>
        </section>
      ) : view.decision ? (
        <section className="card">
          <h2 className="card-title">{view.decision.title}</h2>
          <p className="card-body">{view.decision.description}</p>
          {/* Every option carries identical emphasis. Distinguishing one from
              its siblings before the player chooses would leak the branch
              (DECISION 006, DECISION 012). */}
          <div className="options">
            {view.decision.options.map((o) => (
              <button key={o.id} className="option" type="button" onClick={() => onChoose(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
