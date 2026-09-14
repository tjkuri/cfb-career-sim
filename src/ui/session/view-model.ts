import { getDecision, WASHOUT_REASONS, type GameState } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { standingPhrase, trustPhrase } from "./bands";
import { awardLabel, iconGlyph, phaseLabel, statLabel, trophyLabel } from "./labels";
import type {
  CareerSummaryView,
  CareerView,
  MomentView,
  SeasonLineView,
  SeasonStamp,
  SeasonView,
  StatView,
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

function seasonViews(state: GameState): SeasonView[] {
  return state.seasons.map((line) => ({
    seasonIndex: line.seasonIndex,
    schoolName: schoolName(line.schoolId),
    classYear: null,
    record: recordOf(line, state),
    snaps: line.snaps,
    stats: statViews(state, line.stats),
  }));
}

// The season identity a card belongs to, captured before `advance()` runs so a
// resolved outcome can be read under the header that was true when the choice
// was made. Progression values are deliberately excluded -- see SeasonStamp.
export function seasonStamp(state: GameState): SeasonStamp {
  return {
    seasonNumber: state.seasonIndex + 1,
    classYear: state.eligibility.classYear,
    phaseLabel: phaseLabel(state.phase),
    schoolName: currentSchoolName(state),
  };
}

function momentViews(state: GameState): MomentView[] {
  return state.moments.map((m) => ({
    seasonIndex: m.seasonIndex,
    item: m.item,
    glyph: iconGlyph(m.icon),
  }));
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

function headline(state: GameState): { headline: string; subhead: string | null; wasDrafted: boolean } {
  const draft = state.draftResult;
  if (draft && !draft.undrafted) {
    return {
      headline: `Round ${draft.round}, Pick ${draft.pick}`,
      subhead: `#${draft.overallPick} overall`,
      wasDrafted: true,
    };
  }
  if (draft && draft.undrafted) {
    return { headline: "Undrafted", subhead: "No team called.", wasDrafted: false };
  }
  // Busted. endingReason is not limited to the two WASHOUT_REASONS strings --
  // content `ending` effects supply their own ("Career-ending injury",
  // "Academically ineligible") -- so render the field, never match a known set.
  const reason = state.endingReason ?? WASHOUT_REASONS.overall;
  return { headline: reason, subhead: "The career ended here.", wasDrafted: false };
}

export function buildSummary(state: GameState): CareerSummaryView {
  const { headline: h, subhead, wasDrafted } = headline(state);
  return {
    headline: h,
    subhead,
    finalOverall: state.overall,
    seed: state.seed,
    schoolPath: schoolPath(state),
    seasons: seasonViews(state),
    trophies: Object.entries(state.trophies)
      .filter(([, count]) => count > 0)
      .map(([id, count]) => ({ label: trophyLabel(id), count })),
    awards: state.awards.map(awardLabel),
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
    overall: state.overall,
    standing: standingPhrase(state.overall),
    trust: trustPhrase(state.character),
    status: state.status,
    decision: getDecision(state),
    summary: terminal ? buildSummary(state) : null,
  };
}
