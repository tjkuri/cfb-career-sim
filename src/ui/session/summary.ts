import { deriveDraftStock, nextRoundAt, stockParts, type GameState } from "../../engine/index";
import { CONTENT } from "../../content/index";
import { honorView, schoolName } from "./game-view";
import { statLabel } from "./labels";
import type { HonorView } from "./types";

const NUM = new Intl.NumberFormat("en-US");

export interface CareerSummary {
  headline: string;
  subhead: string;
  /** 0 = washed out, 1 = undrafted ... 8 = top-10 pick. Drives how loud the ending is. */
  tier: number;
  schoolPath: string[];
  honors: (HonorView & { count: number })[];
  totals: { label: string; value: string }[];
  record: string;
  bigGames: { won: number; played: number };
  /** Where the career went on draft night: 1-based overall pick, or 0 if undrafted. */
  overallPick: number;
  scouting: Scouting;
}

/** What a scout would say: what helped, what held the career back, how close it came. */
export interface Scouting {
  liked: string[];
  concerns: string[];
  /** "3 points short of Round 4", or null at the top of the board. */
  nextRound: string | null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

export function buildSummary(state: GameState): CareerSummary {
  const path: string[] = [];
  for (const line of state.seasons) {
    const name = schoolName(line.schoolId);
    if (path[path.length - 1] !== name) path.push(name);
  }

  const counts = new Map<string, number>();
  for (const line of state.seasons) for (const h of line.honors ?? []) counts.set(h, (counts.get(h) ?? 0) + 1);
  const order = ["heisman", "cfpTitle", "allAmerican", "confTitle", "allConference", "bowlWin"];
  const honors = order.filter((id) => counts.has(id)).map((id) => ({ ...honorView(id), count: counts.get(id)! }));

  const pos = state.setup.position;
  const totals = CONTENT.positions[pos].stats.map((k) => ({
    label: statLabel(pos, k),
    value: NUM.format(state.seasons.reduce((a, s) => a + (s.stats[k] ?? 0), 0)),
  }));
  const wins = state.seasons.reduce((a, s) => a + s.teamWins, 0);
  const losses = state.seasons.reduce((a, s) => a + s.teamLosses, 0);
  const played = state.seasons.filter((s) => s.bigGame?.played);

  const d = state.draftResult;
  let headline: string;
  let subhead: string;
  let tier: number;
  if (state.status === "busted") {
    headline = state.endingReason ?? "Career over";
    subhead = "No one calls your name on draft night.";
    tier = 0;
  } else if (!d || d.undrafted) {
    headline = "Undrafted";
    subhead = "Seven rounds and your phone never rings. A tryout invite is still a door.";
    tier = 1;
  } else {
    headline = `Round ${d.round}, Pick ${d.pick}`;
    subhead = `${ordinal(d.overallPick)} overall pick in the NFL Draft`;
    tier = d.round === 1 ? (d.overallPick <= 10 ? 8 : 7) : 8 - d.round;
  }

  return {
    overallPick: d && !d.undrafted ? d.overallPick : 0,
    scouting: scouting(state),
    headline,
    subhead,
    tier,
    schoolPath: path,
    honors,
    totals,
    record: `${wins}–${losses}`,
    bigGames: { won: played.filter((s) => s.bigGame!.won).length, played: played.length },
  };
}

// Each part of the grade, as a share of what a great career gets from it, so
// the strongest and weakest read the same way whatever the scale.
const PART_CEILING = { production: 12, honors: 20, competition: 9 };

function scouting(state: GameState): Scouting {
  const p = stockParts(state);
  const best = Math.max(0, ...state.seasons.filter((l) => !l.redshirt && l.snaps > 0).map((l) => l.tierPlayed ?? 1));
  const awards = state.seasons.flatMap((l) => l.honors ?? []).filter((h) => ["heisman", "allAmerican", "allConference"].includes(h));
  const lines: { share: number; good: string; bad: string }[] = [
    // Overall and Rep read off the value itself: a 74 is not pro-ready tape
    // however it ranks against the rest of the grade.
    { share: state.overall >= 85 ? 1 : state.overall < 78 ? 0 : 0.5, good: `Pro-ready tape: ${state.overall} OVR`, bad: `The tape is not there yet: ${state.overall} OVR` },
    { share: p.production / PART_CEILING.production, good: "Years of film as a starter", bad: "Not much film: too many snaps on the bench" },
    { share: p.honors / PART_CEILING.honors, good: awards.length ? `A resume of awards (${awards.length})` : "Trophies on the resume", bad: "No national awards" },
    {
      share: p.competition / PART_CEILING.competition,
      good: best === 4 ? "Proven against the best programs" : "Played against Power Four talent",
      bad: best <= 1 ? "Only ever played at the FCS level" : "Never tested at a top program",
    },
    { share: state.character >= 85 ? 1 : state.character <= 50 ? 0 : 0.5, good: "Clean character report", bad: "Character questions in the interviews" },
  ];
  // The redshirt's price, paid on draft night.
  if (state.eligibility.redshirtUsed) lines.push({ share: 0.2, good: "", bad: "Fifth-year senior: less upside left" });
  const ranked = [...lines].sort((a, b) => b.share - a.share);
  const liked = ranked.filter((l) => l.share >= 0.55).slice(0, 2).map((l) => l.good);
  const concerns = ranked.reverse().filter((l) => l.share < 0.4).slice(0, 2).map((l) => l.bad);

  const d = state.draftResult;
  const round = !d || d.undrafted ? 0 : d.round;
  const target = nextRoundAt(round);
  let nextRound: string | null = null;
  if (target !== null && state.status === "drafted") {
    const short = Math.max(1, target - deriveDraftStock(state));
    nextRound = `${short} stock point${short === 1 ? "" : "s"} short of ${round === 0 ? "getting drafted" : `Round ${round - 1}`}`;
  }
  return { liked, concerns, nextRound };
}

export function shareText(state: GameState): string {
  const s = buildSummary(state);
  const lines = [
    `${state.setup.lastName} #${state.setup.jerseyNumber} · ${CONTENT.positions[state.setup.position].label}`,
    s.schoolPath.join(" → "),
  ];
  if (s.honors.length > 0) lines.push(s.honors.map((h) => `${h.icon} ${h.count > 1 ? `${h.count}× ` : ""}${h.label}`).join(" · "));
  lines.push(`${s.headline} · OVR ${state.overall}`);
  lines.push(`seed ${state.seed}`);
  return lines.join("\n");
}
