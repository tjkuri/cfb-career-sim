import { getDecision, WASHOUT_REASONS, type GameState } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { standingPhrase, trustPhrase } from "./bands";
import { awardLabel, iconGlyph, statLabel, trophyLabel } from "./labels";
import type { CareerSummaryView, CareerView, MomentView, SeasonView } from "./types";

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

function currentRecord(state: GameState): string | null {
  const line = state.seasons[state.seasons.length - 1];
  if (!line || line.seasonIndex !== state.seasonIndex) return null;
  return `${line.teamWins}-${line.teamLosses}`;
}

function seasonViews(state: GameState): SeasonView[] {
  return state.seasons.map((line) => ({
    seasonIndex: line.seasonIndex,
    schoolName: schoolName(line.schoolId),
    classYear: null,
    record: `${line.teamWins}-${line.teamLosses}`,
    snaps: line.snaps,
    stats: Object.entries(line.stats)
      .filter(([, v]) => v !== 0)
      .map(([key, value]) => ({ label: statLabel(state.setup.position, key), value })),
  }));
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
    overall: state.overall,
    standing: standingPhrase(state.overall),
    trust: trustPhrase(state.character),
    status: state.status,
    decision: getDecision(state),
    summary: terminal ? buildSummary(state) : null,
  };
}
