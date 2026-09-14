import { getDecision, WASHOUT_REASONS, type GameState } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { standingPhrase, trustPhrase } from "./bands";
import { buildLedger } from "./ledger";
import { awardLabel, iconGlyph, phaseLabel, statLabel, trophyLabel } from "./labels";
import type {
  CareerSummaryView,
  CareerView,
  HonorRarity,
  HonorView,
  MomentView,
  RailView,
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
    const key = `${m.seasonIndex} ${m.item}`;
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
function verdictMagnitude(draft: GameState["draftResult"]): VerdictMagnitude {
  if (!draft || draft.undrafted) return 1;
  if (draft.round <= 1) return 5;
  if (draft.round <= 3) return 4;
  if (draft.round <= 5) return 3;
  return 2;
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
  return {
    playerName: `${state.setup.lastName} #${state.setup.jerseyNumber}`,
    positionLabel: positionLabel(state),
    schoolName: currentSchoolName(state),
    classYear: state.eligibility.classYear,
    seasonRecord: currentRecord(state),
    phaseLabel: phaseLabel(state.phase),
    seasonNumber: state.seasonIndex + 1,
    season: currentSeasonLine(state),
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
    standing: standingPhrase(state.overall),
    trust: trustPhrase(state.character),
    status: state.status,
    decision: getDecision(state),
    summary: terminal ? buildSummary(state) : null,
  };
}
