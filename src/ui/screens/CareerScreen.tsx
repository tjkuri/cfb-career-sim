import { railView } from "../session/view-model";
import { trustMove } from "../session/bands";
import { classYearLabel, followHeader, type LedgerRow } from "../session/ledger";
import { countedStatLabel } from "../session/labels";
import type { CardAccount, CareerView, Remainder, Resolved, StatView } from "../session/types";

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
 *
 * It is now read from the card's OWN delta, not from the whole `advance`. A
 * card that authored `effects: []` was being set at tier 2 because a deferred
 * effect from three cards ago happened to land underneath it, which is the
 * emphasis rule amplifying a misattribution rather than a magnitude.
 */
function magnitude(delta: number): 0 | 1 | 2 | 3 {
  const size = Math.abs(delta);
  if (size === 0) return 0;
  if (size <= 2) return 1;
  if (size <= 5) return 2;
  return 3;
}

// U+2212, not a hyphen: the minus sign is a numeric glyph and sits on the
// figure's own width and height. The screen-reader text says the word instead.
const MINUS = "−";

function ovrText(delta: number): string {
  return `${delta > 0 ? "+" : MINUS}${Math.abs(delta)} OVR`;
}

function upDown(delta: number): string {
  return delta > 0 ? "up" : "down";
}

/**
 * The card's own number, said as a sentence.
 *
 * With nothing else to report the wording is unchanged from before this split,
 * because there is nothing to distinguish it from: one number, one movement.
 * As soon as a second beat exists the two have to be told apart in speech as
 * well as on screen, or the listener hears two bare numbers.
 */
function ownSentence(own: number, alone: boolean, now: number): string {
  if (alone) return `Overall ${upDown(own)} ${Math.abs(own)}, now ${now}.`;
  if (own === 0) return "This card: no change to overall.";
  return `This card: overall ${upDown(own)} ${Math.abs(own)}.`;
}

/**
 * The character half of an outcome, as words (DECISION 046 cause 2).
 *
 * DECISION 002 is not reversed and no integer appears: character moves draft
 * stock by ~±7.5 against overall's ~82, and a number here would overstate it
 * tenfold. What it gets instead is what B17 said it was missing -- position and
 * weight. The line sits ABOVE the OVR figure, inside the same rule, in the same
 * vocabulary the standing block uses two inches higher ("In the locker room"),
 * so *The Ticket Hookup*'s "compliance flags the resale listing" can no longer
 * be read as a `+1` and nothing else.
 *
 * Direction only. There is no gradation here on purpose: a size would be the
 * resolution DECISION 002 says character does not have, dressed as typography.
 *
 * What it does have, since DECISION 075 (R1), is a floor. `cardAccount` returns
 * `lockerRoom: null` for any outcome whose summed character delta is under
 * `LOCKER_ROOM_MIN_CHARACTER` (= 2, derived in report 051), so this function
 * never sees the single-point nudges that used to print the same sentence as a
 * -32. That is this docblock's stated intent finally implemented, not a new
 * one: a verdict that arrives on a card worth 0.15 draft stock is not a fact,
 * it is narration, and it taught players to skim the ones that were.
 */
function lockerRoomLine(account: CardAccount): string | null {
  // Terse on purpose. Before the floor a character effect fired on 37.5% of
  // resolved cards (measured over 360 careers), so this line is read often --
  // and a sentence read that often has to behave like `+1 OVR` does, as a
  // stated fact that never varies, rather than like narration, which would
  // turn into the wallpaper this whole wave exists to stop people skimming.
  if (account.lockerRoom === "cost") return "Cost you in the locker room.";
  if (account.lockerRoom === "credit") return "Earned you credit in the locker room.";
  return null;
}

/**
 * The two footnotes an OVR figure can need to be true.
 *
 * An injury's points are a loan: `effects.ts` restores the full `overallDelta`
 * when it heals. A card that prints the loss and says nothing contradicts
 * itself twice -- once here, and again later when the points reappear on an
 * unrelated card as somebody else's remainder.
 *
 * A deferred effect that is still queued is the mirror image: the card has not
 * finished happening. One that already landed inside the same `advance` is not
 * a footnote at all -- it is the card's own number, and `cardAccount` counts it
 * there. That distinction is the whole of the *Position Switch* row: its
 * authored `−2` lands in its own tick, so the card now prints `−2` under "the
 * fit never quite comes together" instead of the `+5` that belonged to a
 * season of development.
 *
 * Neither the size nor the timing is ever stated -- only that the card is not
 * finished.
 */
function accountNotes(account: CardAccount, own: number): string[] {
  const notes: string[] = [];
  if (account.injury && own !== 0) notes.push("The OVR comes back when the injury heals.");
  if (account.later === "cost") notes.push("The cost of this one lands later.");
  if (account.later === "credit") notes.push("The rest of this one lands later.");
  return notes;
}

/**
 * What the figure that this card did NOT earn actually was (DECISION 056; B45,
 * B47).
 *
 * Two figures on this screen were printed with no sentence attached: a hub
 * card's whole movement, and the `EVERYTHING ELSE` remainder. A player reading
 * a bare **+5 OVR** under *"You chose: Stay at Memphis"* has one attribution
 * available to them -- the choice they just made -- and it is the one thing the
 * number is guaranteed not to be, because `applyChoice` writes no `overall` on
 * a hub branch at all.
 *
 * `Remainder` carries presence, never size, so this states what happened and
 * never how much of the number each part was. Where two causes fired, both are
 * said: apportioning them would be the confident fiction `cardAccount` refuses
 * when its candidates disagree. Where none can be proved, the figure keeps its
 * label and gets no sentence -- a vague truth beats a precise invention, and
 * the four causes are the complete set, so this is a save-compatibility path
 * rather than a real card.
 *
 * `ownInjury` suppresses the fourth clause: an injury the card's own outcome
 * caused is already in `own`, where `accountNotes` is describing it, and
 * naming it again down here would report one injury as two.
 */
function remainderLine(remainder: Remainder, ownInjury: boolean): string | null {
  const parts: string[] = [];
  if (remainder.healed) parts.push("An injury healed and gave the points back.");
  if (remainder.landed) parts.push("An earlier card's effect came due.");
  // DECISION 058 split this in two. `developed` means a season boundary was
  // crossed; since the upperclass decline exists, crossing one can SUBTRACT.
  // Saying "a season of development came in" over a three-point drop is a
  // number with a sentence that contradicts it, which is worse than the bare
  // number this block was written to replace -- and the decline was chosen
  // precisely so a failing career is legible while it is failing.
  if (remainder.declined) parts.push("A season on the sideline cost you ground.");
  else if (remainder.developed) parts.push("A season of development came in.");
  if (remainder.hurt && !ownInjury) parts.push("You got hurt between decisions.");
  return parts.length ? parts.join(" ") : null;
}

// `1 Game-Winners` was printed here (017 playtest, claim 10.2), and the same
// mistake was available for eight of the fifteen stats in the table. The count
// is the thing that decides the label, so it is the count that picks it --
// `labels.ts` owns the vocabulary and a test owns its coverage.
// The separator is two EN SPACES, not three ASCII ones. The join has always
// been written as three spaces, and HTML has always collapsed them to one --
// so `38 Pancakes 13 Sacks Allowed` printed as one run-on string rather than
// the spaced columns the strip is documented to draw, which is part of why
// there was nothing here to read. U+2002 is not collapsible whitespace.
const STAT_GAP = "\u2002\u2002";

function statLine(stats: StatView[]): string {
  return stats
    .map((s) => `${NUM.format(s.value)} ${countedStatLabel(s.label, s.value)}`)
    .join(STAT_GAP);
}

/**
 * The season-over-season step in OVR, read down the PLAYED rows only.
 *
 * This is the read the 017 playtester called the best thing in the game, and
 * until now it existed only on the ending screen -- the career arc was hidden
 * until it was over. It is derived here rather than stored: the previous
 * *rated* row is the baseline, so a season with no stored OVR (a pre-DECISION
 * 009 save) is skipped over rather than reported as a change of zero.
 *
 * Read off `finished`, never off `state`. The in-progress line is stamped with
 * the OVR the season STARTED at (`advance.ts:319`) and is not overwritten until
 * `enterOffseason`, so a delta against it would be a season old -- the same
 * stale number the row's own OVR cell refuses to print. `finished` is exactly
 * that distinction, and it is the one that survives the row ALSO being current,
 * which is what a season boundary is.
 */
function ledgerDelta(rows: LedgerRow[], index: number): number | null {
  const row = rows[index];
  if (!row || !row.finished || row.overall === null) return null;
  for (let j = index - 1; j >= 0; j--) {
    const prev = rows[j];
    if (prev && prev.finished && prev.overall !== null) return row.overall - prev.overall;
  }
  return null;
}

/**
 * The career so far, first rated season to last -- the summary screen's
 * closing `.arc-span` row, said mid-career.
 *
 * Null until two seasons have actually recorded an OVR: one season is not an
 * arc, and a span invented from a single number would be the fabrication
 * DECISION 014 forbids everywhere else in this table.
 */
function ledgerArc(rows: LedgerRow[]): { first: number; last: number; net: number; count: number } | null {
  const rated = rows.filter((r) => r.finished && r.overall !== null);
  if (rated.length < 2) return null;
  const first = rated[0]!.overall!;
  const last = rated[rated.length - 1]!.overall!;
  return { first, last, net: last - first, count: rated.length };
}

function signed(delta: number): string {
  return `${delta > 0 ? "+" : MINUS}${Math.abs(delta)}`;
}

/**
 * The career ledger (DECISIONS 007 / 010 / 013 / 020), built in
 * `session/ledger.ts` and only drawn here.
 *
 * Four rows, or five once a redshirt has been used -- the table states the
 * years the career HAS rather than promising one most careers never get (see
 * `BASE_SLOTS`). Completed rows are filled, the current row is lifted, future
 * rows are visible as empty chrome.
 *
 * WAVE 13. The rows now carry what the ending screen's seasons block carries:
 * school, the year it was played as, the record, the snaps, and the OVR it
 * finished at with its step from the season before. That block is the
 * best-liked screen in the game and this table was the same table with four
 * of its six columns thrown away -- which is why it fitted in 224px and left
 * a 475px void underneath it at 1456x824. The content is the answer to the
 * void; the width follows the content.
 *
 * Three things it deliberately does NOT draw:
 *
 *   * An UNFINISHED season's OVR, or a step against it. `advance.ts:319`
 *     stamps a line with the OVR it STARTED at and `enterOffseason` overwrites
 *     it with the OVR it ended at, so a season still being played carries a
 *     number a season old. The live OVR is the hero numeral in the other
 *     column; printing a stale one beside it would report two moments at once,
 *     which is the bug DECISION 019 just finished closing on the rail. Note the
 *     gate is `finished`, not `state`: on the last card of a season the row is
 *     current AND finished, and its figures are real.
 *   * A record for an unfinished season. There isn't one until the postseason
 *     resolver runs, and `0-0` is the absence of a record rather than a value
 *     for it (DECISION 014). The cell stays empty.
 *   * An unfinished season's snaps. They accumulate live, and the rail two
 *     columns over is FROZEN to the card being read (DECISION 019) -- so the
 *     two cells would print different snap counts for the same season every
 *     time an outcome was on screen. The row states where the player is; the
 *     rail states what has happened there.
 */
function Ledger({ rows }: { rows: LedgerRow[] }) {
  const arc = ledgerArc(rows);
  const rated = rows.some((row) => row.finished && row.overall !== null);

  return (
    <aside className="ledger" aria-label="Career ledger">
      {/* The head names the quantity, and the quantity is NOT the one in the
          header. `enterOffseason` finalizes a season line with the OVR the
          season ended at and THEN adds the development those snaps earned,
          because the points are earned for the next season (advance.ts:228-240,
          pinned by an engine test). So at every season boundary the header read
          63 and this column read 61 for the same year, under a head that said
          `Ovr at season's end` -- two parts of one screen answering the same
          question with two numbers. The 036 playtester reported it at all four
          boundaries of the career.

          The value is right; the head was not. The column is the figure each season
          finished on, before the offseason that follows it does anything --
          which is exactly the +2 the card on screen has just attributed to "a
          season of development". Said that way the two numbers stop being a
          contradiction and become the two ends of the sentence the card is
          already saying. Absent until there is a figure in the column to name.

          The ending screen's `.arc-head-ovr` still carries the old words for
          the same column; it is owned elsewhere this wave and is flagged in the
          report rather than edited here. */}
      {rated && (
        <p className="ledger-head" aria-hidden="true">
          Ovr before the offseason
        </p>
      )}

      <ol className="ledger-rows">
        {rows.map((row, index) => {
          const delta = ledgerDelta(rows, index);
          const year = classYearLabel(rows, row.slot, row.classYear);
          return (
            <li
              key={row.slot}
              className="ledger-row"
              data-state={row.state}
              data-finished={row.finished ? "yes" : "no"}
              {...(row.state === "current" ? { "aria-current": "step" as const } : {})}
            >
              <span className="ledger-year">{row.label}</span>
              <span className="ledger-body">
                <span className="ledger-school">{row.schoolName ?? ""}</span>
                <span className="ledger-line">
                  {year && <span className="ledger-class">{year}</span>}
                  {row.finished && row.record && <span className="ledger-record">{row.record}</span>}
                  {row.finished && row.snaps !== null && (
                    <span className="ledger-snaps">{NUM.format(row.snaps)} snaps</span>
                  )}
                </span>
              </span>
              <span className="ledger-ovr">
                {row.finished && row.overall !== null && (
                  <span className="ledger-ovr-num">
                    {row.overall}
                    <span className="sr-only"> overall</span>
                  </span>
                )}
                {delta !== null && delta !== 0 && (
                  <span className="ledger-delta">
                    <span aria-hidden="true">{signed(delta)}</span>
                    <span className="sr-only">
                      , {upDown(delta)} {Math.abs(delta)} on the season before
                    </span>
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {/* The closing line, and at desktop the floor of the room: it is pushed
          to the bottom of the column so the table has a defined bottom edge
          rather than stopping in mid-air over 250px of black. Same words and
          same three cells as the summary's `.arc-span`, because it is the same
          statement made earlier. */}
      {arc && (
        <p className="ledger-arc">
          <span className="ledger-arc-label">
            Across {arc.count} season{arc.count === 1 ? "" : "s"}
          </span>
          <span className="ledger-arc-range" aria-hidden="true">
            {arc.first} &rarr; {arc.last}
          </span>
          {arc.net !== 0 && (
            <span className="ledger-arc-net" aria-hidden="true">
              {signed(arc.net)}
            </span>
          )}
          <span className="sr-only">
            Across {arc.count} seasons, overall {arc.first} to {arc.last}.
          </span>
        </p>
      )}
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

  // The table follows the player, not the cursor. `buildLedger` keys the
  // current row to the live season index, which is a season ahead of the header
  // on the last card of every season -- the header is frozen to the card being
  // read (DECISION 019) and the engine has already crossed the boundary. Moving
  // the highlight with `rail.seasonNumber`, the same number the header prints,
  // is what makes them one statement. With no card on screen the rail IS the
  // live view and this is a no-op.
  const ledgerRows = followHeader(view.ledger, rail.seasonNumber);

  // The record is still absent until the postseason resolver has made it real
  // (DECISION 014); freezing the line cannot manufacture one, because the line
  // was frozen with the same null the live view would have reported.
  const line = rail.season;

  // DECISION 046. Three numbers where there used to be one, and only the first
  // of them was ever this card's.
  //
  //   total     everything `advance()` moved: this outcome, plus an earlier
  //             card's deferred effect coming due, plus a season of
  //             development. Null baseline means a save that predates the
  //             field, not a change of zero -- no delta is reported rather
  //             than a fabricated one.
  //   own       what THIS card's chosen outcome did, read from content by
  //             `cardAccount`. Null account (a hub card, or a save written
  //             before the field) falls back to `total`, which is what every
  //             card reported before this split and is what DECISION 037
  //             wanted on the hub specifically.
  //   elsewhere the remainder. It is real -- it is a deferred effect landing,
  //             or a season of development, or both -- so it is not dropped;
  //             it gets its own beat, one line down, under its own label.
  const account = resolved?.account ?? null;
  const total =
    resolved && resolved.overallBefore !== null ? view.overall - resolved.overallBefore : 0;
  const own = account ? account.own : total;
  const elsewhere = account ? total - own : 0;
  const loudness = magnitude(own);

  // A hub card, which is the one card whose figure is the whole `advance` ON
  // PURPOSE (DECISION 037) and was therefore the one card with no way to say so
  // (B45, DECISION 056 hole 1). Told apart by carrying hub facts rather than by
  // a null account, which an old save also has -- such a save is an authored
  // card and keeps the fallback it was written with.
  //
  // The figure itself is untouched: same value, same accent, same magnitude
  // scaling. 037 wants the whole movement reported on this card and it still
  // is. What changes is that it is now named and explained, because a number
  // with no sentence is the defect. It is NOT re-attributed to the choice --
  // `applyChoice` writes no `overall` on a hub branch, so "the transfer did
  // this" would be false, and 037's real ~0.43-0.91 price is an expectation
  // across seeds rather than a term in this card's arithmetic.
  const hubCard = resolved?.hub != null && account === null;

  // Once there are two numbers they both need naming; one number on its own
  // needs no label and does not get one, which keeps the 46.6%-of-cards common
  // case exactly as it was. A zero own-delta is PRINTED rather than omitted
  // when there is a remainder beside it: "no change" is the fact that
  // *Cutting the Line*'s `effects: []` was contradicting when the card showed
  // the −3 that belonged to something else.
  const showElsewhere = elsewhere !== 0;
  const showOwn = own !== 0 || showElsewhere;
  const notes = account ? accountNotes(account, own) : [];
  const locker = account ? lockerRoomLine(account) : null;

  // The sentence under whichever figure this card did not earn: the hub's
  // whole movement, or the remainder beside an authored card's own number.
  // Never both -- a card is one or the other -- so one string serves both and
  // the two defects get literally the same fix, which is what DECISION 056
  // means by "the same defect wearing a label".
  const why =
    resolved?.remainder && (hubCard || showElsewhere)
      ? remainderLine(resolved.remainder, account?.injury ?? false)
      : null;

  // The label on the hub's figure. "This card" would be false here (the hub
  // moved nothing) and "Everything else" needs a "this card" to be else FROM,
  // so the hub gets the one name that is true of it: the window the number
  // covers.
  const ownLabel = hubCard ? "Since your last card" : "This card";
  const showOwnLabel = hubCard || showElsewhere;

  // DECISION 056 hole 2 (B46). The block has exactly one emphasis slot --
  // `--emphasis` on the figure, scaled by `--rule`/`--delta-size` -- and it is
  // attached to the only element carrying a numeral. On *The Ticket Hookup*'s
  // negative outcome the card did `character −6` and `overall +1`, so the slot
  // went to the smaller of the two things the card did and the playtester read
  // "compliance flags the resale listing" as a reward.
  //
  // So the slot moves to whichever element is the card's largest movement. It
  // fires on BOTH directions of the character effect, never on `cost` alone:
  // an accent that appeared only on a cost would be valence told by colour,
  // which DECISION 012 forbids and which the words already do properly.
  //
  // DECISION 002 is untouched and no integer appears. The threshold is the
  // magnitude scale's own bottom tier (|own| <= 2, 89% of cards), so a card
  // that moved OVR by a visible amount keeps the slot on the number.
  const characterLeads = locker !== null && magnitude(own) <= 1;

  // TASK 043. The rung the standing sits on can move under the player with
  // nothing marking it -- one playtester only noticed theirs move because it
  // happened on the very last click of the career, after being told "Cost you
  // in the locker room." six times. The phrase changing IS the event, and an
  // event that is not marked is not an event.
  //
  // Read off the frozen pre-`advance` phrase, so it is true of THIS click and
  // disappears with the card that caused it. Null whenever there is nothing to
  // say: no card, no baseline, or the same rung as before.
  //
  // Direction, never distance. `trustMove` cannot return a size, which is the
  // point: a fall of three rungs and a fall of one render identically here,
  // because DECISION 002 says `character` does not have the resolution that
  // would tell them apart and DECISION 046 refused the same magnitude dressed
  // as typography. Both directions are marked, in one hue at one weight -- an
  // emphasis that appeared only on a fall would be valence told by colour,
  // which DECISION 012 forbids and which the two words already do properly.
  const trustBefore = resolved?.trustBefore ?? null;
  const moved = trustMove(trustBefore, view.trust);

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
              {/* `SR` twice: `enterOffseason` advances the class year through
                  CLASS_ORDER and stops at SR, so a fifth season is stored --
                  and was printed -- as a second senior year, here and on ledger
                  rows 4 and 5. The playtester read it as "a glitch rather than
                  a fifth-year victory lap". One display rule, shared with the
                  ledger, so the header and the table can never qualify the same
                  year differently. */}
              <span className="rail-class">
                {classYearLabel(ledgerRows, rail.seasonNumber, rail.classYear)}
              </span>
            </span>
          </div>
          <div className="rail-line rail-where">
            <span className="rail-player">{view.playerName}</span>
            <span className="rail-phase">{rail.phaseLabel}</span>
            {/* Empty until the postseason resolver has assigned a real W-L
                (DECISION 014). The cell holds its width either way. */}
            {/* The same season as the stats row below, and labelled by it: a
                record only ever exists for a line the postseason resolver has
                closed (DECISION 014), which is exactly the case where the
                heading and the figures name different seasons. */}
            <span className="rail-record">{line?.record ?? ""}</span>
          </div>
          {/* B64 / B65. The heading above says `Season 4`; these figures, and
              the record beside the phase, are `seasons[last]` -- which the
              engine does not push for the new season until its first on-field
              phase, so for the whole of every offseason all three cells belong
              to the season before. Measured over 360 careers: 3,985 screens,
              about eleven per career. Read downward that is a season the player
              just played reporting almost no snaps; read across the boundary it
              is the same heading swapping 614 snaps for 198, so a finished
              season appears to lose figures.

              The figures stay -- the redshirt and transfer cards are read here
              and last season IS the evidence they are decided on (DECISION
              013). The rail now names whose season they are, and only when that
              differs from the heading; on every on-field screen this is null
              and the row is exactly what it was. The label leads the row so it
              governs the cells after it, and it sits inside the same fixed slot
              rather than adding one. */}
          <div className="rail-line rail-stats">
            {rail.seasonLabel && <span className="rail-season-of">{rail.seasonLabel}</span>}
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
          <p className="standing-claim standing-room" data-moved={moved ?? undefined}>
            <span className="claim-where">In the locker room</span>
            <span className="trust">{view.trust}</span>
            {/* The rung that was true one click ago, named. Naming it is what
                makes this a ladder rather than a phrase that swapped itself:
                the player reads where they were and where they are, and the
                four rungs they have not reached are the reason to keep
                playing (the summary draws all five). No arrow, no count, no
                second colour -- two words and the previous rung. */}
            {moved && trustBefore && (
              <span className="trust-move">
                <span aria-hidden="true">
                  {moved === "up" ? "Up from" : "Down from"} “{trustBefore}”
                </span>
                <span className="sr-only">
                  Your standing in the locker room moved {moved}. It was: {trustBefore}.
                </span>
              </span>
            )}
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
                loud and indistinguishable by colour (DECISION 012).

                A hub card carries no prose and fills this block with facts
                instead (B23): the move, the delta, or both. The block is not
                rendered at all when it would hold none of the three, so the
                rule never draws beside an empty card. */}
            {(resolved.outcome || resolved.hub?.to || showOwn || locker) && (
            <div
              className="consequence"
              data-magnitude={loudness}
              data-lead={characterLeads ? "character" : undefined}
            >
              {resolved.outcome && <p className="outcome">{resolved.outcome}</p>}

              {/* The one thing a transfer resolution knows that the chosen
                  label does not: the school it left. "Transfer to Baylor" was
                  on the button; "UTSA → Baylor" is the career fact, and it is
                  the sentence the 017 playtester said the game never wrote.
                  Stated, never characterised -- no tier, no badge, nothing
                  about whether the move was a good one (DECISION 012). */}
              {resolved.hub?.to && (
                <p className="move">
                  <span className="move-from" aria-hidden="true">
                    {resolved.hub.from}
                  </span>
                  <span className="move-arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="move-to" aria-hidden="true">
                    {resolved.hub.to}
                  </span>
                  <span className="sr-only">
                    Moved from {resolved.hub.from} to {resolved.hub.to}.
                  </span>
                </p>
              )}

              {/* Character, as a cost, without an integer (DECISION 002 held,
                  DECISION 046 cause 2). It is placed above the OVR figure
                  deliberately: B17 is that the character read is too easy to
                  skip, and on a card whose real cost was character the number
                  underneath must not be the first thing the eye lands on. */}
              {locker && <p className="locker-room">{locker}</p>}

              {showOwn && (
                <p className="delta">
                  {showOwnLabel && <span className="account-label">{ownLabel}</span>}
                  <span aria-hidden="true">{own === 0 ? "No change" : ovrText(own)}</span>
                  <span className="sr-only">
                    {hubCard
                      ? `Since your last card: overall ${upDown(own)} ${Math.abs(own)}, now ${view.overall}.`
                      : ownSentence(own, !showElsewhere, view.overall)}
                  </span>
                </p>
              )}

              {/* B45. On a hub card the figure above is the whole movement and
                  nothing on the card explains it, so the explanation goes
                  directly under it -- the same place, and the same quiet
                  register, that `accountNotes` already uses for a footnote on
                  the figure it sits beneath. */}
              {hubCard && why && <p className="account-note">{why}</p>}

              {notes.map((note) => (
                <p className="account-note" key={note}>
                  {note}
                </p>
              ))}

              {/* The remainder, and the reason the card above it can afford to
                  be honest. It is never scaled by magnitude -- DECISION 012
                  attaches emphasis to what a card DID, and this is the part it
                  did not do. Quiet, stated, and never explained beyond what is
                  knowable: "a deferred effect from three cards ago" is a fact
                  only the engine holds, and a precise invention would be worse
                  than a vague truth. */}
              {showElsewhere && (
                <p className="delta-else">
                  <span className="account-label">Everything else</span>
                  <span className="account-figure" aria-hidden="true">
                    {ovrText(elsewhere)}
                  </span>
                  {/* The explanatory sentence is deliberately NOT repeated in
                      here. It is visible text in the paragraph directly below
                      and is read from there; appending it would make a screen
                      reader say it twice. */}
                  <span className="sr-only">
                    Everything else: overall {upDown(elsewhere)} {Math.abs(elsewhere)}, now{" "}
                    {view.overall}.
                  </span>
                </p>
              )}

              {/* B47. `EVERYTHING ELSE` was a labelled bucket that was never
                  once explained to the player, which is B45 wearing a label --
                  so it gets B45's sentence. Outside the row rather than inside
                  it: the row is a label and a figure on one baseline, and a
                  clause appended to it would read as a third column of the
                  same statistic. */}
              {showElsewhere && why && <p className="account-note else-why">{why}</p>}
            </div>
            )}

            <button className="continue" type="button" onClick={onContinue} autoFocus>
              Continue
            </button>
          </section>
        ) : view.decision ? (
          <section className="card">
            <h2 className="card-title">{view.decision.title}</h2>
            <p className="card-body">{view.decision.description}</p>
            {/* `view.decisionNote` was removed here with the declare card it
                annotated (DECISION 057). It printed one line of rule-of-the-game
                fact -- how much eligibility remained -- and the declare card was
                its only user, because that card was a hidden trap and the line
                was its warning. No card left needs one, and DECISION 025's
                refusal of projections means the slot must not be repurposed into
                advice. */}
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

      <Ledger rows={ledgerRows} />
    </div>
  );
}
