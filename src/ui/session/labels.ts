import type { Position } from "../../engine/index";

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
