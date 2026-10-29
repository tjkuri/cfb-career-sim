import type { GameState } from "../../engine/index";
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
