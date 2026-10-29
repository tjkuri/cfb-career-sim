import type { Position } from "../../engine/index";
import type { SeasonPhase } from "./types";

// Display names for the three id vocabularies the engine and content traffic in
// but never spell out. Kept in the UI rather than in src/content so the engine
// typecheck pass (tsconfig.engine.json) stays untouched. labels.test.ts asserts
// this file covers everything CONTENT actually emits, so content that adds an id
// fails a test instead of shipping a blank string to the player.

const TROPHY_LABELS: Record<string, string> = {
  confTitle: "Conference Championship",
  cfpTitle: "National Championship",
  bowlWin: "Bowl Win",
};

const AWARD_LABELS: Record<string, string> = {
  heisman: "Heisman Trophy",
  allAmerican: "All-American",
  allConference: "All-Conference",
};

// `ints` is the reason this is position-aware rather than a flat map: a
// quarterback throws them and a defensive back catches them, and labelling both
// "INT" would put a QB's worst stat in the same column as a DB's best.
const STAT_LABELS: Record<string, string> = {
  passYards: "Pass Yds",
  passTds: "Pass TD",
  scrimmageYards: "Scrimmage Yds",
  totalTds: "TD",
  receptions: "Rec",
  pancakes: "Pancakes",
  sacksAllowed: "Sacks Allowed",
  sacks: "Sacks",
  tfls: "TFL",
  tackles: "Tackles",
  passBreakups: "PBU",
  fieldGoals: "FG",
  points: "Points",
  gameWinners: "Game-Winners",
  ints: "INT",
};

const STAT_LABELS_BY_POSITION: Partial<Record<Position, Record<string, string>>> = {
  QB: { ints: "INT Thrown" },
};

export function trophyLabel(id: string): string {
  return TROPHY_LABELS[id] ?? id;
}

export function awardLabel(id: string): string {
  return AWARD_LABELS[id] ?? id;
}

export function statLabel(position: Position, key: string): string {
  return STAT_LABELS_BY_POSITION[position]?.[key] ?? STAT_LABELS[key] ?? key;
}

// ---------------------------------------------------------------------------
// Counted stats: `1 Game-Winners` (017 playtest, claim 10.2)
//
// Every stat above is written in its plural form, because that is how a box
// score is written -- and every one of them is rendered as `<count> <label>`,
// where the count is frequently 1. `1 Game-Winners`, `1 Pancakes`, `1 Sacks`,
// `1 Points`. The playtester found one of them; the header prints the same
// mistake for eight different stats.
//
// The fix is keyed to the LABEL rather than to the stat key, deliberately. The
// key is gone by the time a screen has a `StatView` (which carries a label and
// a number and nothing else), and going back for it would mean changing the
// view-model's own boundary shape. Labels are already unique per stat and
// already the thing being printed.
//
// No -s rule. It cannot be written safely over this vocabulary: the head noun
// is the LAST word in `Game-Winners` and the FIRST in `Sacks Allowed`, and
// half the table is abbreviations (`FG`, `TFL`, `PBU`, `INT`, `Rec`) that do
// not inflect at all. So the singular forms are stated, and `labels.test.ts`
// asserts that every label ending in "s" has one -- a stat added to the table
// without a singular fails a test instead of printing `1 Fumbles` at a player.
const SINGULAR_LABELS: Record<string, string> = {
  "Pass Yds": "Pass Yd",
  "Scrimmage Yds": "Scrimmage Yd",
  Pancakes: "Pancake",
  "Sacks Allowed": "Sack Allowed",
  Sacks: "Sack",
  Tackles: "Tackle",
  Points: "Point",
  "Game-Winners": "Game-Winner",
};

/** Abbreviations that already end in "s" and are not plurals of anything.
    Listed so the coverage test can tell "no singular needed" apart from
    "somebody forgot". */
const UNINFLECTED_LABELS = new Set<string>(["Rec"]);

/**
 * The label to print beside `count` of this stat. Plural everywhere except at
 * exactly one, including at minus one -- `-1 FG` and `1 FG` are both singular
 * in English, and the negative case is live today (see the `FG -1` note in
 * report 020).
 */
export function countedStatLabel(label: string, count: number): string {
  if (Math.abs(count) !== 1) return label;
  return SINGULAR_LABELS[label] ?? label;
}

export function knownSingularLabels(): string[] {
  return Object.keys(SINGULAR_LABELS);
}

export function isUninflected(label: string): boolean {
  return UNINFLECTED_LABELS.has(label);
}

// Where the season is. `GameState.phase` is an engine id vocabulary like the
// three above, so it gets its display names here rather than in a screen.
// Typed as a total Record over SeasonPhase so a phase added to the engine is a
// typecheck failure at this table, not a raw id shown to a player.
const PHASE_LABELS: Record<SeasonPhase, string> = {
  offseason: "Offseason",
  nonconf: "Non-Conference",
  conference: "Conference Play",
  postseason: "Postseason",
};

export function phaseLabel(phase: SeasonPhase): string {
  return PHASE_LABELS[phase];
}

export function knownPhases(): SeasonPhase[] {
  return Object.keys(PHASE_LABELS) as SeasonPhase[];
}

// Moment icons. The authored vocabulary is 22 names; this is the MVP treatment,
// and the function boundary is the point -- swapping in an inline SVG set later
// touches this file only. Unknown names fall back rather than blanking, so new
// content can never leave a hole in the summary timeline.
const ICON_GLYPHS: Record<string, string> = {
  trophy: "🏆",
  shield: "🛡️",
  star: "⭐",
  phone: "📱",
  video: "🎬",
  medical: "🏥",
  hand: "✋",
  football: "🏈",
  zap: "⚡",
  bolt: "⚡",
  wind: "💨",
  tv: "📺",
  target: "🎯",
  sun: "☀️",
  stopwatch: "⏱️",
  money: "💰",
  mic: "🎤",
  eye: "👁️",
  clock: "🕐",
  clipboard: "📋",
  car: "🚗",
  book: "📖",
  ring: "💍",
  broken: "💔",
};

export const FALLBACK_ICON = "◆";

export function iconGlyph(icon: string): string {
  return ICON_GLYPHS[icon] ?? FALLBACK_ICON;
}

export function knownIcons(): string[] {
  return Object.keys(ICON_GLYPHS);
}

export function knownStatKeys(): string[] {
  return Object.keys(STAT_LABELS);
}

export function knownTrophyIds(): string[] {
  return Object.keys(TROPHY_LABELS);
}

export function knownAwardIds(): string[] {
  return Object.keys(AWARD_LABELS);
}
