import { getDecision, WASHOUT_REASONS, type GameState, type PendingDecision } from "../../engine/index";
// The one import that does not come through `engine/index`, because the barrel
// does not re-export it and the barrel is another agent's file this wave.
// `CLASS_ORDER` is the length of a career's eligibility, and `eligibilityLeft`
// below is arithmetic on it; writing the 4 out as a literal here would be a
// second copy of an engine rule that can change. Type-only imports from this
// module are already the norm across `src/ui/session/**`.
import { CLASS_ORDER, type Effect, type Outcome } from "../../engine/types";
// Same reasoning, one module over. `clampOverall` is the engine's own bound on
// `overall` (0-99), and `cardAccount` below has to reproduce the engine's
// arithmetic exactly or the remainder it hands the card is off by the clamp.
// Importing the function is what makes "exactly" true; re-spelling `Math.min(99,
// ...)` here would be a second copy of an engine rule, drifting silently.
import { clampOverall } from "../../engine/effects";
import { CONTENT } from "../../content/index";
import { standingPhrase, trustPhrase } from "./bands";
import { buildLedger } from "./ledger";
import { awardLabel, iconGlyph, phaseLabel, statLabel, trophyLabel } from "./labels";
import type {
  CardAccount,
  CareerSummaryView,
  CareerView,
  HonorRarity,
  HonorView,
  HubFacts,
  MomentView,
  RailView,
  Remainder,
  Resolved,
  SeasonLineView,
  SeasonStamp,
  SeasonView,
  StatView,
  VerdictMagnitude,
} from "./types";

// THE boundary. This is the only module that reads GameState. Screens receive a
// CareerView and therefore cannot render tier, draftStock, probability, weight,
// snapModifier or trait names, because those values are never copied across.
// view-model.test.ts asserts that property over a full career.
//
// `overall` IS copied across, deliberately. It is the player's own progression
// number and the genre's native language; hiding it behind bands suppressed
// roughly three quarters of all progression feedback (measured: OVR moves on
// 44.5% of decisions, the band on 12.2%, and 6% of careers never change band
// at all). `character` stays qualitative -- it swings draft stock by about
// ±7.5 against overall's ~82, so an integer would overstate it tenfold.

const SCHOOL_NAMES: Record<string, string> = Object.fromEntries(
  CONTENT.schools.map((s) => [s.id, s.name]),
);

export function schoolName(schoolId: string): string {
  return SCHOOL_NAMES[schoolId] ?? schoolId;
}

// Before Signing Day the career carries no school id at all. That is a state to
// name, not a blank to render.
function currentSchoolName(state: GameState): string | null {
  if (!state.school.schoolId) return null;
  return schoolName(state.school.schoolId);
}

function positionLabel(state: GameState): string {
  return CONTENT.positions[state.setup.position].label;
}

type SeasonLine = GameState["seasons"][number];

// DECISION 014, verified in source: `simulateTeamRecord` runs exactly once, at
// the end of the postseason phase (postseason.ts:69-73), and the season index
// increments in the same tick (advance.ts:305-306). A line still stamped with
// the live `seasonIndex` has therefore never been through the resolver, and its
// `0-0` is not a record -- it is the absence of one. Return null so no consumer
// can render it. Nothing here estimates, projects or substitutes a record, and
// making W-L accrue during the season is an engine change that would move the
// RNG draw order and diverge every existing seed; it is explicitly not taken.
function recordOf(line: SeasonLine | undefined, state: GameState): string | null {
  if (!line) return null;
  if (line.seasonIndex === state.seasonIndex) return null;
  return `${line.teamWins}-${line.teamLosses}`;
}

// Snaps and stats are the honest half: both accumulate live (effects.ts:36,41,
// simulate.ts:27), so the line is real from the first on-field phase. The label
// layer is position-aware for one specific reason -- a QB throws `ints` and a
// DB catches them -- so the position goes through it rather than around it.
function statViews(state: GameState, stats: Record<string, number>): StatView[] {
  return Object.entries(stats)
    .filter(([, v]) => v !== 0)
    .map(([key, value]) => ({ label: statLabel(state.setup.position, key), value }));
}

function currentRecord(state: GameState): string | null {
  const line = state.seasons[state.seasons.length - 1];
  if (!line || line.seasonIndex !== state.seasonIndex) return null;
  return recordOf(line, state);
}

// The most recent line: in progress during the on-field phases, and the season
// just completed during an offseason -- which is where the redshirt, transfer
// and declare cards ask for it. Null before the first on-field phase, because
// `advance.ts:273-277` only pushes a line on entering one; during recruiting
// there is no season to report, which is a state to name, not a row of zeroes.
function currentSeasonLine(state: GameState): SeasonLineView | null {
  const line = state.seasons[state.seasons.length - 1];
  if (!line) return null;
  return {
    seasonNumber: line.seasonIndex + 1,
    schoolName: schoolName(line.schoolId),
    record: recordOf(line, state),
    snaps: line.snaps,
    stats: statViews(state, line.stats),
    inProgress: line.seasonIndex === state.seasonIndex,
  };
}

// DECISION 009 put `overall` and `classYear` on `SeasonLine` for exactly one
// read: the career arc, a column going 50 -> 82 -> 66 down the summary. Both
// are *recorded*, never recomputed -- the view-model is a pure function of the
// current state and has no way to reconstruct what OVR was three seasons ago,
// which is why the field had to exist.
//
// Old saves are the constraint. `localStorage` holds serialized GameStates
// written before 009 landed, whose lines carry neither field, so both are read
// defensively: a missing or non-finite value becomes null, and the row renders
// without a number. Null is the absence of a record, not a placeholder for one
// (DECISION 014) -- nothing here substitutes the final OVR, an average, or a
// zero for a season that never stored its own.
function storedOverall(line: SeasonLine): number | null {
  const value: unknown = line.overall;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function storedClassYear(line: SeasonLine): SeasonView["classYear"] {
  return line.classYear ?? null;
}

function seasonViews(state: GameState): SeasonView[] {
  return state.seasons.map((line) => ({
    seasonIndex: line.seasonIndex,
    schoolName: schoolName(line.schoolId),
    classYear: storedClassYear(line),
    record: recordOf(line, state),
    snaps: line.snaps,
    overall: storedOverall(line),
    stats: statViews(state, line.stats),
  }));
}

// Everything the context rail draws, captured before `advance()` runs so a
// resolved outcome is read under the header that was true when the choice was
// made -- the season's identity AND the season line, because `advance()` can
// simulate a whole phase and a rail whose halves straddle that call describes
// two moments at once. Progression values are deliberately excluded and the
// reasoning differs; see SeasonStamp.
export function seasonStamp(state: GameState): SeasonStamp {
  return {
    seasonNumber: state.seasonIndex + 1,
    classYear: state.eligibility.classYear,
    phaseLabel: phaseLabel(state.phase),
    schoolName: currentSchoolName(state),
    season: currentSeasonLine(state),
  };
}

/**
 * The facts a hub resolution is made of, or null when the hub changed nothing
 * worth a card. Takes both sides of one `advance()` for the same reason
 * `seasonStamp` is taken before it: the "before" state is gone by the time
 * anything is rendered.
 *
 * B23 / DECISION 037. Signing Day, the transfer portal and the declare card
 * author no prose, and the reducer read the missing prose as "nothing
 * happened". It is not: the 017 playtester's "Stay at Baylor" moved `overall`
 * 75 -> 82 in the gap between two clicks, and the one transfer of the career
 * was announced by one word changing in the header.
 *
 * The rule is generic and reads only facts, so it needs no list of hub ids:
 *
 *   * A career that is no longer active gets **nothing**. Declaring IS the
 *     next screen -- the draft verdict, which wave 8 spent its whole budget
 *     making loud -- and a card in front of it is a click, not a beat.
 *   * A career with no school BEFORE the choice gets nothing. That is Signing
 *     Day, where the "move" is from nowhere to the school the player picked
 *     one click ago and the rail is already printing. Measured over 3,000
 *     careers, Signing Day moves `overall` by 0 in 3,000 of 3,000, so there is
 *     never a second fact to carry either.
 *   * Otherwise the card appears iff the school moved or `overall` moved. A
 *     hub that changed neither is the empty ceremonial card the brief forbids
 *     and is suppressed -- which, measured the same way, is 100% of "return to
 *     school" (it lands straight on the next hub, so nothing has run yet) and
 *     81.4% of "stay".
 *
 * Measured card rate over the same 3,000 careers: transfer hubs fire on 50.0%
 * (school moved 38.5%, overall moved 17.0%), about 1.1 cards per career. The
 * redshirt hub is untouched by this -- taking the redshirt authors its own
 * prose, which is the machinery B23 observed already working.
 */
export function hubFacts(before: GameState, after: GameState): HubFacts | null {
  if (after.status !== "active") return null;
  const fromId = before.school.schoolId;
  if (!fromId) return null;

  const toId = after.school.schoolId;
  const moved = toId !== fromId;
  if (!moved && after.overall === before.overall) return null;

  return {
    from: schoolName(fromId),
    // Named only on a move. On a card reporting a pure overall movement the
    // school is unchanged and the chosen label already says where it is;
    // printing it again would be chrome, not a fact.
    to: moved ? schoolName(toId) : null,
  };
}

// ---------------------------------------------------------------------------
// What a card did, as opposed to what happened while it was on screen.
// ---------------------------------------------------------------------------

const EVENTS_BY_ID = new Map(CONTENT.events.map((e) => [e.id, e]));

// A structural mirror of `advance.ts`'s `REDSHIRT_EVENT_ID`, which is not
// exported, for the same reason `DECLARE_EVENT_ID` below is one. The redshirt
// hub is the one decision outside `content.events` that authors prose: the
// engine reads its two descriptions and its bump/sink amounts straight off
// `content.redshirt`, so its card can be accounted for from content like any
// other. A test plays a redshirt and asserts the account is non-null, so a
// drift in the id fails rather than quietly demoting the card.
const REDSHIRT_EVENT_ID = "redshirt";

// The engine's own fallback when an `injury` effect names a type the bundle
// does not carry (`advance.ts`'s `injuryLookup`). Mirrored, not guessed: if the
// engine subtracted 3 for an unknown type, so must the card's account.
const UNKNOWN_INJURY_DELTA = 3;

/**
 * The candidate outcomes a chosen option could have resolved to, narrowed to
 * those whose prose matches what the engine reported.
 *
 * This is the whole trick, and it needs no engine change: `GameState` carries
 * only `lastOutcome: { description }` (DECISION 001 strips the branch flag on
 * purpose), but an `EventOption` has at most two authored outcomes, and their
 * descriptions are distinct. Matching the reported description against the two
 * therefore identifies which one fired, from content the UI is already allowed
 * to read.
 *
 * Nothing here is told the option's `probability`, and the result is only ever
 * computed for the option the player actually took -- so no unchosen branch is
 * reachable through it (DECISIONS 006, 012).
 */
function firedOutcomes(eventId: string, optionId: string, description: string): Outcome[] {
  if (eventId === REDSHIRT_EVENT_ID) {
    const cfg = CONTENT.redshirt;
    const out: Outcome[] = [];
    if (cfg.bumpDescription === description) {
      out.push({ description, effects: [{ kind: "overall", timing: "immediate", amount: cfg.bumpOverall }] });
    }
    if (cfg.sinkDescription === description) {
      out.push({ description, effects: [{ kind: "overall", timing: "immediate", amount: cfg.sinkOverall }] });
    }
    return out;
  }
  const option = EVENTS_BY_ID.get(eventId)?.options.find((o) => o.id === optionId);
  if (!option) return [];
  return [option.positiveOutcome, option.negativeOutcome].filter(
    (o): o is Outcome => !!o && o.description === description,
  );
}

function direction(amount: number): "cost" | "credit" | null {
  if (amount < 0) return "cost";
  if (amount > 0) return "credit";
  return null;
}

type OverallEffect = Extract<Effect, { kind: "overall" }>;

/**
 * Has this card's own deferred effect already landed by the time the card is
 * read?
 *
 * This is not a detail, and getting it wrong inverts the fix. Every deferred
 * effect in the bundle is `delayPhases: 1`, which fires at the next
 * `tickPhaseStart` -- and `advance()` runs `autoProgress` until the next
 * decision is raised, so whether that tick happens before the player sees the
 * card depends entirely on whether the next decision falls in the same phase.
 * Measured over 360 careers: the *Position Switch*'s authored `−2` lands inside
 * its own `advance` on most resolutions and on a later card on the rest.
 *
 * So the queue is asked instead of assumed. If an effect matching this one is
 * still queued after the call, it has not landed and the card says only that
 * something lands later. If it is not, it landed during this `advance` and it
 * is this card's own number -- disowning it would put "the fit never quite
 * comes together" over "no change", which is the same defect pointing the
 * other way.
 *
 * Matching is by value, not identity: `applyEffect` pushes the authored object
 * into `pendingEffects`, and a save round-trips through JSON. Two identical
 * deferred effects from two different cards are indistinguishable by
 * construction -- if an earlier card's twin fired while this one stayed
 * queued, the same amount is attributed to this card and the earlier one is
 * reported as still pending. The arithmetic is unchanged either way, and the
 * total the card reports is the same.
 */
function stillPending(before: GameState, after: GameState, effect: OverallEffect): boolean {
  const matches = (state: GameState): number =>
    state.pendingEffects.filter(
      (p) =>
        p.effect.amount === effect.amount &&
        (p.effect.delayPhases ?? 1) === (effect.delayPhases ?? 1),
    ).length;
  return matches(after) > matches(before);
}

/**
 * One outcome's effects, accounted.
 *
 * `own` is walked in authored order through the engine's own clamp, from the
 * OVR the card was read against. That is not decoration: `applyChoice` runs
 * FIRST inside `advance()` (advance.ts:88), before any phase tick, simulation
 * or development, so replaying the outcome's effects from `overallBefore`
 * reproduces the engine's arithmetic exactly -- including the 99 ceiling, where
 * a naive sum would credit a card with a point the engine refused and push a
 * phantom −1 into the remainder.
 *
 * A deferred effect counts as `own` once it has landed, and only then; see
 * `stillPending`.
 */
function accountOf(
  effects: Effect[],
  before: GameState,
  after: GameState,
): CardAccount {
  let overall = before.overall;
  let deferred = 0;
  let character = 0;
  let injury = false;

  for (const effect of effects) {
    switch (effect.kind) {
      case "overall":
        if (effect.timing !== "deferred") overall = clampOverall(overall + effect.amount);
        else if (stillPending(before, after, effect)) deferred += effect.amount;
        else overall = clampOverall(overall + effect.amount);
        break;
      case "injury":
        injury = true;
        overall = clampOverall(
          overall - (CONTENT.injuries[effect.injuryType]?.overallDelta ?? UNKNOWN_INJURY_DELTA),
        );
        break;
      case "character":
        character += effect.amount;
        break;
      default:
        // stat, snaps, suspension, trophy, award, moment, ending. All real, and
        // none of them an OVR movement this card would otherwise be blamed for
        // -- the stat line is already on the rail and the honours are already
        // on the summary.
        break;
    }
  }

  return {
    own: overall - before.overall,
    injury,
    lockerRoom: direction(character),
    later: direction(deferred),
  };
}

/**
 * What the card on screen actually did, or null when that cannot be known.
 *
 * Null is a real answer and the card handles it by falling back to the whole
 * movement across the `advance`, which is what every card did before this
 * existed. It is returned for:
 *
 *   * a hub card (Signing Day, transfer, declare) -- no authored prose, so
 *     nothing to match, and DECISION 037 already settled that its number is
 *     the movement across the click and is the point of the card;
 *   * an event id or option id that is no longer in the bundle, which is the
 *     same drift `isUnplayable` guards;
 *   * prose that matches neither candidate, or matches both with two different
 *     accountings. An ambiguous match is not resolved by picking one: a wrong
 *     attribution is exactly the defect this function exists to remove, and a
 *     card that reports the honest total is strictly better than one that
 *     reports a confident fiction.
 */
export function cardAccount(
  before: GameState,
  after: GameState,
  decision: PendingDecision,
  optionId: string,
): CardAccount | null {
  const description = after.lastOutcome?.description;
  if (description === undefined) return null;

  const candidates = firedOutcomes(decision.eventId, optionId, description);
  if (candidates.length === 0) return null;

  const accounts = candidates.map((o) => accountOf(o.effects, before, after));
  const first = accounts[0]!;
  const agree = accounts.every(
    (a) =>
      a.own === first.own &&
      a.injury === first.injury &&
      a.lockerRoom === first.lockerRoom &&
      a.later === first.later,
  );
  return agree ? first : null;
}

// ---------------------------------------------------------------------------
// What moved the number that the card itself did not move.
// ---------------------------------------------------------------------------

/**
 * Count a list by a key, so a diff can tell "one of these left" from "one of
 * these arrived" without matching identities the engine does not keep.
 *
 * Both lists this is used on hold structurally identical entries -- two 3-phase
 * hamstrings, or two queued −2s, are the same record twice -- so identity
 * matching is impossible in principle and counting is the honest read. It also
 * fails in the safe direction: an entry that left while an identical one
 * arrived nets to zero and the card says nothing, rather than saying something
 * wrong.
 */
function tally<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function fewerAfter(before: Map<string, number>, after: Map<string, number>): boolean {
  for (const [k, n] of before) if ((after.get(k) ?? 0) < n) return true;
  return false;
}

function moreAfter(before: Map<string, number>, after: Map<string, number>): boolean {
  for (const [k, n] of after) if ((before.get(k) ?? 0) < n) return true;
  return false;
}

// `remainingPhases` is deliberately NOT in the key: it decrements on every
// tick, so including it would make every surviving injury look like one that
// left and a different one that arrived. `restoreAmount` is, because a
// suspension is stored in the same list with `restoreAmount: 0` and its
// departure returns no points and must not be reported as a heal.
const injuryKey = (i: { kind: string; injuryType: string; restoreAmount: number }) =>
  `${i.kind}:${i.injuryType}:${i.restoreAmount}`;

// `delayPhases` defaults to 1 in the engine (`applyEffect`), and `firePhaseAbs`
// is absolute, so it is not comparable across an advance that ticked. The pair
// below is the same signature `stillPending` matches on, for the same reason.
const pendingKey = (p: { effect: { amount: number; delayPhases?: number } }) =>
  `${p.effect.amount}:${p.effect.delayPhases ?? 1}`;

/**
 * Everything that moved `overall` during this advance EXCEPT the chosen
 * outcome, as facts (DECISION 056; B45, B47).
 *
 * This exists because a number with no sentence is the defect. `cardAccount`
 * answers "what did this card do"; on a hub card the answer is *nothing* --
 * `applyChoice`'s recruiting, declare and transfer branches write no `overall`
 * -- and on an authored card the leftover is whatever `own` did not explain.
 * Either way the player was shown a bare signed integer and left to invent an
 * attribution, and the one they invent is the choice they just made, which is
 * the one thing it is guaranteed not to be.
 *
 * Read from the state pair rather than stored by the engine, and deliberately
 * coarse: presence only, never size. The diff cannot apportion the number
 * between two causes that both fired, and a card that names the causes it can
 * prove is strictly better than one that splits the total by guesswork -- the
 * same rule `cardAccount` follows when its candidates disagree.
 */
export function remainderFacts(before: GameState, after: GameState): Remainder {
  const injuriesBefore = tally(before.injuries, injuryKey);
  const injuriesAfter = tally(after.injuries, injuryKey);
  const pendingBefore = tally(before.pendingEffects, pendingKey);
  const pendingAfter = tally(after.pendingEffects, pendingKey);

  return {
    // A suspension keys with `restoreAmount: 0`, so its expiry cannot reach
    // this: it returns no points and is not part of any number.
    healed: before.injuries.some(
      (i) => i.restoreAmount > 0 && (injuriesAfter.get(injuryKey(i)) ?? 0) < (injuriesBefore.get(injuryKey(i)) ?? 0),
    ),
    landed: fewerAfter(pendingBefore, pendingAfter),
    // The season index advances only in `advancePhase`'s postseason branch,
    // and `enterOffseason` -- the one place development is applied -- runs on
    // the far side of it. One is exactly the other.
    developed: after.seasonIndex > before.seasonIndex,
    hurt: moreAfter(injuriesBefore, injuriesAfter),
  };
}

// The declare card's one line of fact (DECISION 038, B25).
//
// DECISION 025 stands and is not reopened here: no projection, no draft stock,
// no round estimate, no "you would go undrafted". What goes in is the number of
// seasons of eligibility that remain, which is a rule of the game rather than a
// reading of the player -- it is identical for a 45-overall walk-on and a
// 95-overall All-American in the same class year, so it cannot be used to infer
// anything hidden.
//
// The count is `cap - yearsUsed`, exactly the arithmetic `enterOffseason` uses
// to force a declaration, and it INCLUDES the season about to be played: a
// junior who returns has two more seasons in him, and the card says two.
function eligibilityLeft(state: GameState): number {
  const cap = CLASS_ORDER.length + (state.eligibility.redshirtUsed ? 1 : 0);
  return cap - state.eligibility.yearsUsed;
}

// Spelled out rather than set as a numeral. Every numeral on this screen is a
// measured quantity -- the OVR, the snap count, the record -- and a season
// count is not one of those; "2" beside them reads as a fourth statistic.
const COUNT_WORDS = ["no", "one", "two", "three", "four", "five"];

function seasonsPhrase(n: number): string {
  const word = COUNT_WORDS[n] ?? String(n);
  return n === 1 ? `${word} season` : `${word} seasons`;
}

// A structural mirror of `advance.ts`'s `DECLARE_EVENT_ID`, which is not
// exported. `view-model.test.ts` asserts the note actually appears on the
// declare card the engine builds, so a drift in the id fails a test rather
// than silently dropping the line.
const DECLARE_EVENT_ID = "declare";

function decisionNote(state: GameState, decision: PendingDecision | null): string | null {
  if (!decision || decision.eventId !== DECLARE_EVENT_ID) return null;
  const left = eligibilityLeft(state);
  // The card is only raised while the career is active, so this is at least 1;
  // the guard is for a save whose eligibility has drifted, where saying
  // nothing is right and saying "no seasons remain" beside a live choice is
  // not.
  if (left < 1) return null;
  const verb = left === 1 ? "remains" : "remain";
  const phrase = seasonsPhrase(left);
  return `${phrase[0]!.toUpperCase()}${phrase.slice(1)} of eligibility ${verb}.`;
}

// The rail, assembled in one place so no screen has to decide cell by cell
// which side of `advance()` a value comes from. With a resolved card on screen
// every cell comes off its stamp; with no card, every cell is live. There is
// no third case: a stamp that exists and carries a null school or a null
// season line is reporting that state, not missing it, and falling through to
// the live value is exactly how the rail came to name two moments (DECISION
// 019). A card with no stamp at all -- a save written before the field
// existed -- falls back wholesale, never to `undefined` and never to a zero.
export function railView(view: CareerView, resolved: Resolved | null): RailView {
  const stamp = resolved?.stamp ?? null;
  if (!stamp) {
    return {
      school: view.schoolName ?? "Uncommitted",
      classYear: view.classYear,
      seasonNumber: view.seasonNumber,
      phaseLabel: view.phaseLabel,
      season: view.season,
    };
  }
  return {
    school: stamp.schoolName ?? "Uncommitted",
    classYear: stamp.classYear,
    seasonNumber: stamp.seasonNumber,
    phaseLabel: stamp.phaseLabel,
    // `?? null` is not redundant: a save written before the field existed
    // restores a stamp whose `season` is `undefined`. `normalize()` in the
    // reducer fills it, and this is the belt to that pair of braces.
    season: stamp.season ?? null,
  };
}

// The playtest read the timeline as "an event log, not a highlight reel":
// three identical trophies, two rivalry wins. Measured over 700 careers
// (300 full four-year, 400 `random`), every single repeated `item` string is
// the same moment earned in a *different season* -- 656 of 656 in the full
// cohort, 324 of 324 in the random one. Zero repeats share a season index, and
// zero are pushed twice by one `advance()`.
//
// So there is nothing here to dedupe. Winning the rivalry game three years
// running is the career, and collapsing it would delete the thing the row is
// reporting. What was missing is the season it belongs to -- `seasonIndex` has
// always been on the moment and the timeline threw it away, which is what made
// three real trophies look like one trophy printed three times. The screen
// groups by season; this layer only merges the one shape that would be a bug,
// the same item recorded twice inside a single season, into a count.
function momentViews(state: GameState): MomentView[] {
  const out: MomentView[] = [];
  const seen = new Map<string, MomentView>();
  for (const m of state.moments) {
    const key = `${m.seasonIndex}\u0000${m.item}`;
    const prior = seen.get(key);
    if (prior) {
      prior.count += 1;
      continue;
    }
    const view: MomentView = {
      seasonIndex: m.seasonIndex,
      item: m.item,
      glyph: iconGlyph(m.icon),
      count: 1,
    };
    seen.set(key, view);
    out.push(view);
  }
  return out;
}

function schoolPath(state: GameState): string[] {
  const path: string[] = [];
  for (const line of state.seasons) {
    const name = schoolName(line.schoolId);
    if (path[path.length - 1] !== name) path.push(name);
  }
  if (path.length === 0) path.push(schoolName(state.school.schoolId));
  return path;
}

// The single sentence a whole career resolves into, and until now the one with
// no range: measured on our own screens, `#69 overall` (round 3) and
// `#194 overall` (round 7) printed in the same hue at the same size and weight,
// and a playtester reported "the ending is a gold headline regardless of what
// I did".
//
// Round is the magnitude axis, and it is the right one: it is ordinal, it is
// already printed in the headline (so emphasising it discloses nothing new --
// DECISION 012's test), and `undrafted` sits at its far end rather than off to
// one side. Cuts follow the measured distribution over 600 random-policy
// careers: R1 2.7% | R2-3 12.5% | R4-5 39.0% | R6-7 40.0% | no call 5.9%.
//
// What reads the number is scale, weight, width and entrance travel. Never
// hue: tier 5 and tier 1 are both `--milestone`, which is the whole point of
// DECISIONS 012 and 021 and is asserted in summary.css.
// Eight steps, one per round, because the pairs a player can actually compare
// are adjacent rounds and the old five-step cut gave Round 2 and Round 3 the
// SAME step -- not a small difference, no difference at all. Measured over 600
// random-policy careers, all six positions: R1 1.8% | R2 5.8% | R3 8.3% |
// R4 16.8% | R5 20.0% | R6 24.3% | R7 17.2% | undrafted 4.0% | ended early
// 1.7%. Round 8 does not exist in the draft; the clamp is a guard, not a tier.
function verdictMagnitude(draft: GameState["draftResult"]): VerdictMagnitude {
  if (!draft || draft.undrafted) return 1;
  const round = Math.min(7, Math.max(1, Math.round(draft.round)));
  return (9 - round) as VerdictMagnitude;
}

function headline(state: GameState): {
  headline: string;
  subhead: string | null;
  wasDrafted: boolean;
  verdictMagnitude: VerdictMagnitude;
} {
  const draft = state.draftResult;
  const magnitude = verdictMagnitude(draft);
  if (draft && !draft.undrafted) {
    return {
      headline: `Round ${draft.round}, Pick ${draft.pick}`,
      subhead: `#${draft.overallPick} overall`,
      wasDrafted: true,
      verdictMagnitude: magnitude,
    };
  }
  if (draft && draft.undrafted) {
    return {
      headline: "Undrafted",
      subhead: "No team called.",
      wasDrafted: false,
      verdictMagnitude: magnitude,
    };
  }
  // Busted. endingReason is not limited to the two WASHOUT_REASONS strings --
  // content `ending` effects supply their own ("Career-ending injury",
  // "Academically ineligible") -- so render the field, never match a known set.
  const reason = state.endingReason ?? WASHOUT_REASONS.overall;
  return {
    headline: reason,
    subhead: "The career ended here.",
    wasDrafted: false,
    verdictMagnitude: magnitude,
  };
}

// Rarity, measured rather than assumed, over 600 random-policy careers across
// all six positions: heisman 0.7%, cfpTitle 0.0% | allAmerican 5.8%,
// confTitle 2.7% | allConference 50.5%, bowlWin 45.3%.
//
// The bottom tier is the finding behind this table. An "HONORS" heading fired
// on 70.5% of careers, and on 17.8% of them its entire content was `Bowl Win`
// -- a playtester's deliberately-bad 7-5 / 5-7 career among them. A result
// that half the league gets is not an honour, and a screen that says otherwise
// congratulates every input. Both facts are still rendered; only the routine
// ones stop being rendered as distinctions.
//
// An unknown id is treated as a distinction, not as routine: content that adds
// an award should arrive loud and be demoted on evidence, never silently
// filed under "also".
const HONOR_RARITY: Record<string, HonorRarity> = {
  heisman: 3,
  cfpTitle: 3,
  allAmerican: 2,
  confTitle: 2,
  allConference: 1,
  bowlWin: 1,
};

function honorRarity(id: string): HonorRarity {
  return HONOR_RARITY[id] ?? 2;
}

// Rarest first, and stable within a tier: awards before trophies, each in the
// order the engine holds them. Sorting here rather than in the screen keeps the
// screen from having to know what any id means.
function honorViews(state: GameState): HonorView[] {
  const out: HonorView[] = [];
  for (const id of state.awards) {
    out.push({ id, label: awardLabel(id), count: 1, rarity: honorRarity(id) });
  }
  for (const [id, count] of Object.entries(state.trophies)) {
    if (count > 0) out.push({ id, label: trophyLabel(id), count, rarity: honorRarity(id) });
  }
  return out.sort((a, b) => b.rarity - a.rarity);
}

export function buildSummary(state: GameState): CareerSummaryView {
  const { headline: h, subhead, wasDrafted, verdictMagnitude: magnitude } = headline(state);
  return {
    headline: h,
    subhead,
    verdictMagnitude: magnitude,
    finalOverall: state.overall,
    seed: state.seed,
    schoolPath: schoolPath(state),
    seasons: seasonViews(state),
    trophies: Object.entries(state.trophies)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({ label: trophyLabel(id), count })),
    awards: state.awards.map(awardLabel),
    // The same facts as `awards` + `trophies`, carrying the one thing those
    // two shapes cannot: how rare each is. `awards` and `trophies` stay
    // exactly as they are because `share.ts` and `reducer.ts` read them and
    // DECISION 005 freezes the share text.
    honors: honorViews(state),
    moments: momentViews(state),
    wasDrafted,
  };
}

export function buildView(state: GameState): CareerView {
  const terminal = state.status !== "active";
  const decision = getDecision(state);
  // The season line is built once and used twice: the header prints its snap
  // count, and the standing phrase is checked against that same number, so the
  // two halves of one strip cannot contradict each other (report 027, defect 2).
  const season = currentSeasonLine(state);
  return {
    playerName: `${state.setup.lastName} #${state.setup.jerseyNumber}`,
    positionLabel: positionLabel(state),
    schoolName: currentSchoolName(state),
    classYear: state.eligibility.classYear,
    seasonRecord: currentRecord(state),
    phaseLabel: phaseLabel(state.phase),
    seasonNumber: state.seasonIndex + 1,
    season,
    // The fixed five-row table DECISIONS 007/010 commit us to, built by the
    // pure module rather than here: `seasonViews` has already applied the
    // view-model's honesty rules (no `0-0` mid-season, null on a pre-009
    // save), so the ledger inherits them instead of reimplementing them.
    ledger: buildLedger({
      seasons: seasonViews(state),
      currentSeasonIndex: state.seasonIndex,
      redshirtUsed: state.eligibility.redshirtUsed,
      active: !terminal,
    }),
    overall: state.overall,
    // `season?.snaps ?? null` -- null is the absence of a number, never a zero.
    // Deliberately NOT gated on `season.inProgress`: during the offseason the
    // header still prints last season's snap count beside this phrase, so that
    // is the number the phrase must not contradict.
    standing: standingPhrase(state.overall, season?.snaps ?? null),
    trust: trustPhrase(state.character),
    status: state.status,
    decision,
    decisionNote: decisionNote(state, decision),
    summary: terminal ? buildSummary(state) : null,
  };
}
