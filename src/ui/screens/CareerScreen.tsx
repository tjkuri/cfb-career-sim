import { railView } from "../session/view-model";
import type { LedgerRow } from "../session/ledger";
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

/**
 * The secondary read on a ledger row: which year it was played as, and where.
 *
 * A future row is empty chrome and says nothing -- except slot 5, which says
 * what it is. The playtester finished three careers still believing the game
 * was four seasons long ("four years to get drafted" is on the title screen and
 * never referenced again) and found the fifth season by accident. Naming the
 * slot is the whole point of DECISION 010's fifth row: it teaches that a fifth
 * year exists and that the redshirt is what buys it. Redshirting is a decision
 * the game openly offers, not a tier, a probability or a trait, so this is not
 * a hidden mechanic being leaked.
 */
function ledgerDetail(row: LedgerRow): string {
  if (row.state === "future") return row.redshirtSlot ? "redshirt year" : "";
  return [row.classYear, row.schoolName].filter(Boolean).join("  ");
}

/**
 * The career ledger (DECISIONS 007 / 010 / 013 / 020), built in
 * `session/ledger.ts` and only drawn here.
 *
 * Five rows, always -- a table that grew a row when the redshirt landed would
 * move the "how much is left" signal underneath the player, which is the one
 * job it exists to do. Completed rows are filled, the current row is lifted,
 * future rows are visible as empty chrome.
 *
 * Two things it deliberately does NOT draw:
 *
 *   * The current row's season-end OVR. `advance.ts:285` stamps a line with the
 *     OVR it STARTED at and `enterOffseason` overwrites it with the OVR it
 *     ended at, so the in-progress row's stored number is a season old. The
 *     live OVR is the hero numeral directly above; printing a stale one beside
 *     it would report two moments at once, which is the bug DECISION 019 just
 *     finished closing on the rail.
 *   * A record for the current season. There isn't one until the postseason
 *     resolver runs, and `0-0` is the absence of a record rather than a value
 *     for it (DECISION 014). The cell stays empty.
 */
function Ledger({ rows }: { rows: LedgerRow[] }) {
  return (
    <aside className="ledger" aria-label="Career ledger">
      <ol className="ledger-rows">
        {rows.map((row) => (
          <li
            key={row.slot}
            className="ledger-row"
            data-state={row.state}
            data-tentative={row.tentative ? "yes" : "no"}
            {...(row.state === "current" ? { "aria-current": "step" as const } : {})}
          >
            <span className="ledger-year">{row.label}</span>
            <span className="ledger-ovr">
              {row.state === "played" && row.overall !== null ? (
                <>
                  {row.overall}
                  <span className="sr-only"> overall</span>
                </>
              ) : (
                ""
              )}
            </span>
            <span className="ledger-detail">{ledgerDetail(row)}</span>
            <span className="ledger-record">{row.record ?? ""}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function CareerScreen({ view, resolved, onChoose, onContinue }: Props) {
  // DECISION 019. While an outcome is on screen the rail describes the card
  // being read, not the state the engine has already moved into: `advance()`
  // rolls the phase, the season index and the class year before it returns --
  // and can simulate an entire phase on the way -- so 71% of resolved cards
  // were read under a phase that was not theirs, and the fix's first half left
  // a rail whose identity was frozen beside a season line that was not
  // (`Offseason - 175 snaps`). Every cell now comes from one moment. The
  // assembly, and the nullable-stamp fallback, live in the view-model.
  const rail = railView(view, resolved);

  // The record is still absent until the postseason resolver has made it real
  // (DECISION 014); freezing the line cannot manufacture one, because the line
  // was frozen with the same null the live view would have reported.
  const line = rail.season;

  // Null baseline means a save that predates the field, not a change of zero.
  // No delta is reported rather than a fabricated one.
  const delta =
    resolved && resolved.overallBefore !== null ? view.overall - resolved.overallBefore : 0;
  const loudness = magnitude(delta);

  return (
    // The decision column comes first in the DOM and the ledger follows it, so
    // at 360px the table lands BELOW the card rather than pushing it off the
    // fold. At desktop width a grid moves the ledger into the empty right-hand
    // field (B1) and makes it persistent, which is the placement DECISION 007
    // asked for. One order, two layouts, no duplicated markup.
    <div className="frame career">
      <div className="career-main">
        {/* A fixed slot with fixed cells. A cell with nothing to say renders
            empty and keeps its space, so the strip never changes shape between a
            decision and its outcome (DECISION 019). */}
        <div className="rail">
          <div className="rail-line rail-id">
            <span className="rail-school">{rail.school}</span>
            <span className="rail-when">
              Season {rail.seasonNumber}
              <span className="rail-class">{rail.classYear}</span>
            </span>
          </div>
          <div className="rail-line rail-where">
            <span className="rail-player">{view.playerName}</span>
            <span className="rail-phase">{rail.phaseLabel}</span>
            {/* Empty until the postseason resolver has assigned a real W-L
                (DECISION 014). The cell holds its width either way. */}
            <span className="rail-record">{line?.record ?? ""}</span>
          </div>
          <div className="rail-line rail-stats">
            <span className="rail-snaps">{line ? `${NUM.format(line.snaps)} snaps` : ""}</span>
            <span className="rail-statline">{line ? statLine(line.stats) : ""}</span>
          </div>
        </div>

        {/* Two axes, two statements (DECISION 024). The OVR number and its band
            phrase are one claim about the player on the field; the trust phrase
            is a different claim about a different thing, and stacking the three
            adjacent in one dimming ramp made `All-America caliber / just a guy
            in the building` parse as a single self-contradicting sentence. The
            playtester filed it as a bug. It is not one -- both halves are true
            of a great player the staff is neutral on -- so the fix is
            structural: each statement is named for the place it describes and
            they are separated by a rule, rather than being told apart by size.

            `character` stays words-only. It swings draft stock by ~±7.5 against
            overall's ~82, so a number, a meter, a bar or a dot count would all
            imply a resolution it does not have (DECISION 002). And it is not
            made quieter to buy the separation -- B17 is that it is already too
            easy to ignore, so it moves UP to the band's own size. */}
        <div className="standing">
          <span className="ovr-number">{view.overall}</span>
          <p className="standing-claim standing-field">
            <span className="claim-where">On the field</span>
            <span className="ovr-band">{view.standing}</span>
          </p>
          <p className="standing-claim standing-room">
            <span className="claim-where">In the locker room</span>
            <span className="trust">{view.trust}</span>
          </p>
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

      <Ledger rows={view.ledger} />
    </div>
  );
}
