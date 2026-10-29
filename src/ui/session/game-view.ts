import {
  CLASS_ORDER,
  deriveDraftStock,
  getDecision,
  projectedRound,
  roleFor,
  TIER_NAMES,
  type DecisionOption,
  type Effect,
  type GameState,
  type PendingDecision,
  type Position,
  type SeasonLine,
} from "../../engine/index";
import { CONTENT } from "../../content/index";
import { awardLabel, iconGlyph, statLabel, trophyLabel } from "./labels";
import type { Chip, DecisionView, GameView, HonorView, LedgerRow, OptionView, SeasonRecap } from "./types";

const NUM = new Intl.NumberFormat("en-US");
const MINUS = "−";

export function schoolName(id: string): string {
  return CONTENT.schools.find((s) => s.id === id)?.name ?? id;
}

function signed(n: number): string {
  return `${n > 0 ? "+" : MINUS}${Math.abs(n)}`;
}

// Stats where more is worse for the player who owns them.
function statIsBad(position: Position, stat: string): boolean {
  return stat === "sacksAllowed" || (position === "QB" && stat === "ints");
}

/**
 * What a list of effects does, as a handful of chips. Overall and Rep are
 * summed; injuries, suspensions and honours are named; stats are shown when
 * they are what the outcome is about.
 */
export function effectChips(effects: Effect[] | undefined, position: Position): Chip[] {
  const chips: Chip[] = [];
  let now = 0;
  let later = 0;
  let rep = 0;
  const stats: Chip[] = [];
  for (const e of effects ?? []) {
    switch (e.kind) {
      case "overall":
        if (e.timing === "deferred") later += e.amount;
        else now += e.amount;
        break;
      case "character":
        rep += e.amount;
        break;
      case "injury": {
        const inj = CONTENT.injuries[e.injuryType];
        chips.push({ text: `${inj?.label ?? "Injury"} ${MINUS}${inj?.overallDelta ?? 3}`, tone: "bad" });
        break;
      }
      case "suspension":
        chips.push({ text: e.phases > 1 ? "Suspended (long)" : "Suspended", tone: "bad" });
        break;
      case "snaps":
        chips.push({ text: e.amount > 0 ? "More snaps" : "Fewer snaps", tone: e.amount > 0 ? "good" : "bad" });
        break;
      case "stat": {
        const bad = statIsBad(position, e.stat) ? e.amount > 0 : e.amount < 0;
        stats.push({ text: `${signed(e.amount)} ${statLabel(position, e.stat)}`, tone: bad ? "bad" : "good" });
        break;
      }
      case "trophy":
        chips.push({ text: `🏆 ${trophyLabel(e.id)}`, tone: "good" });
        break;
      case "award":
        chips.push({ text: `⭐ ${awardLabel(e.id)}`, tone: "good" });
        break;
      case "ending":
        chips.push({ text: "Career over", tone: "bad" });
        break;
      case "moment":
        break;
    }
  }
  const lead: Chip[] = [];
  if (now) lead.push({ text: `${signed(now)} OVR`, tone: now > 0 ? "good" : "bad" });
  if (later) lead.push({ text: `${signed(later)} OVR later`, tone: later > 0 ? "good" : "bad" });
  if (rep) lead.push({ text: `${signed(rep)} Rep`, tone: rep > 0 ? "good" : "bad" });
  const out = [...lead, ...chips, ...stats.slice(0, 2)];
  return out.length > 0 ? out : [{ text: "Nothing changes", tone: "neutral" }];
}

function optionView(o: DecisionOption, position: Position): OptionView {
  if (o.school) {
    return {
      id: o.id,
      label: o.label,
      branches: [],
      school: {
        name: o.school.name,
        tierName: TIER_NAMES[o.school.tier],
        conference: o.school.conference,
        role: o.school.role,
        trait: o.school.trait,
        current: !!o.school.current,
      },
    };
  }
  if (o.detail !== undefined) return { id: o.id, label: o.label, branches: [], detail: o.detail };
  const p = o.probability ?? 1;
  const branches = [{ chance: Math.round(p * 100), chips: effectChips(o.positive, position) }];
  if (o.negative && p < 1) branches.push({ chance: 100 - Math.round(p * 100), chips: effectChips(o.negative, position) });
  return { id: o.id, label: o.label, branches };
}

export function decisionView(d: PendingDecision, position: Position): DecisionView {
  const options = d.options.map((o) => optionView(o, position));
  if (d.kind === "redshirt") {
    // The redshirt's real trade is time, which no effect carries: say it.
    for (const o of options) {
      const extra: Chip[] =
        o.id === "redshirt"
          ? [{ text: "Sit out this season", tone: "neutral" }, { text: "+1 year of eligibility", tone: "good" }]
          : [{ text: "Keep your spot on the field", tone: "neutral" }];
      o.branches = o.branches.map((b) => ({ ...b, chips: [...b.chips.filter((c) => c.tone !== "neutral"), ...extra] }));
    }
  }
  return { kind: d.kind, title: d.title, description: d.description, options, bigGame: d.bigGame };
}

// --- honours ---------------------------------------------------------------

const HONORS: Record<string, Omit<HonorView, "id">> = {
  heisman: { label: "Heisman Trophy", short: "Heisman", icon: "🏅", rarity: 3 },
  cfpTitle: { label: "National Champions", short: "Natty", icon: "💍", rarity: 3 },
  allAmerican: { label: "All-American", short: "All-Amer", icon: "⭐", rarity: 2 },
  confTitle: { label: "Conference Champions", short: "Conf", icon: "🏆", rarity: 2 },
  allConference: { label: "All-Conference", short: "All-Conf", icon: "✦", rarity: 1 },
  bowlWin: { label: "Bowl Win", short: "Bowl", icon: "🥇", rarity: 1 },
};

export function honorView(id: string): HonorView {
  return { id, ...(HONORS[id] ?? { label: id, short: id, icon: "◆", rarity: 1 }) };
}

// --- season lines ----------------------------------------------------------

export function classLabel(line: Pick<SeasonLine, "classYear" | "redshirt">, afterRedshirt: boolean): string {
  if (line.redshirt) return "RS";
  return afterRedshirt ? `RS-${line.classYear}` : line.classYear;
}

function sat(state: GameState, seasonIndex: number): boolean {
  return state.seasons.some((s) => s.seasonIndex < seasonIndex && s.redshirt);
}

export function statLine(position: Position, stats: Record<string, number>): string {
  const g = (k: string) => NUM.format(stats[k] ?? 0);
  switch (position) {
    case "QB":
      return `${g("passYards")} yds · ${g("passTds")} TD · ${g("ints")} INT`;
    case "OSKILL":
      return `${g("scrimmageYards")} yds · ${g("totalTds")} TD`;
    case "OL":
      return `${g("pancakes")} pancakes · ${g("sacksAllowed")} sacks allowed`;
    case "DL":
      return `${g("sacks")} sacks · ${g("tfls")} TFL`;
    case "DSKILL":
      return `${g("tackles")} tkl · ${g("ints")} INT`;
    case "K":
      return `${g("fieldGoals")} FG · ${g("gameWinners")} game-winners`;
  }
}

function seasonsPlanned(state: GameState): number {
  return CLASS_ORDER.length + (state.eligibility.redshirtUsed ? 1 : 0);
}

function ledger(state: GameState): LedgerRow[] {
  const total = Math.max(seasonsPlanned(state), state.seasons.length);
  const rows: LedgerRow[] = [];
  const active = state.status === "active";
  for (let i = 0; i < total; i++) {
    const line = state.seasons.find((s) => s.seasonIndex === i);
    if (line) {
      const current = active && i === state.seasonIndex;
      rows.push({
        seasonNumber: i + 1,
        classLabel: classLabel(line, sat(state, i)),
        state: current ? "current" : "done",
        schoolName: schoolName(line.schoolId),
        tierName: line.tierPlayed ? TIER_NAMES[line.tierPlayed] : undefined,
        role: line.redshirt ? undefined : line.role,
        redshirt: !!line.redshirt,
        record: line.teamWins + line.teamLosses > 0 ? `${line.teamWins}–${line.teamLosses}` : undefined,
        statLine: line.snaps > 0 && !line.redshirt ? statLine(state.setup.position, line.stats) : undefined,
        overall: line.overall,
        honors: (line.honors ?? []).map(honorView),
        bigGame: line.bigGame ? { name: line.bigGame.name, won: line.bigGame.won, played: line.bigGame.played } : undefined,
      });
    } else {
      const current = active && i === state.seasonIndex;
      rows.push({ seasonNumber: i + 1, classLabel: "", state: current ? "current" : "future", honors: [] });
    }
  }
  return rows;
}

function trophyCase(state: GameState): GameView["trophyCase"] {
  const counts = new Map<string, number>();
  for (const line of state.seasons) for (const h of line.honors ?? []) counts.set(h, (counts.get(h) ?? 0) + 1);
  const order = ["heisman", "cfpTitle", "allAmerican", "confTitle", "allConference", "bowlWin"];
  return order
    .filter((id) => counts.has(id))
    .map((id) => ({ id, label: honorView(id).label, icon: honorView(id).icon, count: counts.get(id)! }));
}

export function currentClassLabel(state: GameState): string {
  if (state.redshirtSeasonActive) return "RS";
  return state.eligibility.redshirtUsed ? `RS-${state.eligibility.classYear}` : state.eligibility.classYear;
}

export function buildView(state: GameState): GameView {
  const school = state.school.schoolId ? CONTENT.schools.find((s) => s.id === state.school.schoolId) : undefined;
  const stock = deriveDraftStock(state);
  const injury = state.injuries.find((i) => i.kind === "injury");
  const decision = getDecision(state);
  const last = state.seasons[state.seasons.length - 1];
  return {
    name: state.setup.lastName,
    number: state.setup.jerseyNumber,
    position: state.setup.position,
    positionLabel: CONTENT.positions[state.setup.position].label,
    schoolName: school?.name ?? null,
    tierName: school ? TIER_NAMES[school.tier] : null,
    conference: school?.conference ?? null,
    classLabel: currentClassLabel(state),
    overall: state.overall,
    role: school ? (last?.seasonIndex === state.seasonIndex && last.role ? last.role : roleFor(state.overall, state.school.tier)) : null,
    rep: state.character,
    stock,
    round: projectedRound(stock),
    rank: bigBoardRank(stock),
    injury: injury ? (CONTENT.injuries[injury.injuryType]?.label ?? "Injured") : null,
    trophyCase: trophyCase(state),
    ledger: ledger(state),
    decision: decision ? decisionView(decision, state.setup.position) : null,
    status: state.status,
    draftResult: state.draftResult ?? null,
    endingReason: state.endingReason ?? null,
    moments: state.moments.map((m) => ({ seasonNumber: m.seasonIndex + 1, item: m.item, icon: iconGlyph(m.icon) })),
    seed: state.seed,
  };
}

// --- recap -----------------------------------------------------------------

/**
 * The season that finished inside one `advance`, if one did. The season index
 * moves on at the end of every postseason, including the last one.
 */
export function seasonRecap(before: GameState, after: GameState): SeasonRecap | null {
  if (after.seasonIndex <= before.seasonIndex) return null;
  const line = after.seasons.find((s) => s.seasonIndex === before.seasonIndex);
  if (!line) return null;
  const stockBefore = deriveDraftStock(before);
  const stockAfter = after.draftResult?.draftStock ?? deriveDraftStock(after);
  const pos = after.setup.position;
  const stats = CONTENT.positions[pos].stats.map((k) => ({ label: statLabel(pos, k), value: NUM.format(line.stats[k] ?? 0) }));
  return {
    seasonNumber: line.seasonIndex + 1,
    classLabel: classLabel(line, sat(after, line.seasonIndex)),
    schoolName: schoolName(line.schoolId),
    role: line.redshirt ? null : (line.role ?? null),
    redshirt: !!line.redshirt,
    record: `${line.teamWins}–${line.teamLosses}`,
    stats,
    honors: (line.honors ?? []).filter((h) => h !== "bowlWin" && h !== "confTitle" && h !== "cfpTitle").map(honorView),
    bigGame: line.bigGame ?? null,
    ovrEnd: line.overall,
    ovrNext: after.overall,
    stockBefore,
    stockAfter,
    rankBefore: bigBoardRank(stockBefore),
    rankAfter: bigBoardRank(stockAfter),
    roundBefore: projectedRound(stockBefore),
    roundAfter: after.draftResult ? (after.draftResult.undrafted ? 0 : after.draftResult.round) : projectedRound(stockAfter),
    final: after.status !== "active",
  };
}

/**
 * Where scouts have you on their big board, as a projected pick. Continuous
 * with the draft's own round bands, so a #20 is a first-rounder and a #200 is
 * a seventh; below the draft line it keeps counting so early growth still
 * shows as a climb.
 */
export function bigBoardRank(stock: number): number {
  if (stock >= 55) return Math.max(1, Math.round(((91 - stock) / 6) * 32 + 16));
  return Math.round(224 + (55 - stock) * 12);
}

export function roundLabel(round: number): string {
  return round === 0 ? "Undrafted" : `Round ${round}`;
}

export function roundShort(round: number): string {
  return round === 0 ? "UDFA" : `Rd ${round}`;
}
