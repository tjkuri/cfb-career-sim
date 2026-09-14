// Brief 018, stage 1: can you lose, and is the offseason a decision?
//
// `balance.ts` answers "is the game balanced for a player who engages with it"
// — it reports rates under `randomPolicy`. This probe answers two different
// questions and needs three things `runBalance` does not provide:
//
//   1. a per-round draft histogram and a split of the busted terminal by
//      MECHANISM (soft washout by overall, soft washout by burial, and each
//      authored bust ending), because "bustedRate 0.02" hides which of the
//      three paths is doing the work;
//   2. per-career instrumentation of the offseason — how many times a career
//      moved up, laterally or down a tier — so the cost of a transfer can be
//      priced instead of inferred;
//   3. a trace of which events actually surfaced, so "this failure path exists
//      in the content" can be separated from "this failure path ever fires".
//
// It edits nothing. Everything here reads the frozen engine and content.
//
// CLI:
//   npx tsx src/sim/failure-probe.ts <runs> <profile|all> <position|all>
//   npx tsx src/sim/failure-probe.ts pools        (analytic bust-draw shares)

import { createCareer, advance, getDecision, WASHOUT_REASONS, ALL_POSITIONS, type GameState, type Position, type Setup } from "../engine/index";
import { createRng } from "../engine/rng";
import { eventMatches } from "../engine/select-event";
import { CLASS_ORDER, type ClassYear, type GameEvent, type Tier } from "../engine/types";
import { CONTENT } from "../content/index";
import { BUST_EVENTS } from "../content/events/bust";
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";
import { percentile } from "./balance";

const BUST_EVENT_IDS = new Set(BUST_EVENTS.map((e) => e.id));

// The character/overall gates the authored bust events sit behind
// (content/events/bust.ts). A career that never crosses one of these can never
// draw the event, no matter how the RNG falls — so "was ever exposed" is the
// ceiling on "ever busted through content", and the gap between them is the
// draw probability.
export interface GateExposure {
  mri: boolean;        // requiresActiveInjury
  academics: boolean;  // character <= 35, class >= SO
  drugTest: boolean;   // character <= 30
  doghouse: boolean;   // character <= 25
  arrest: boolean;     // character <= 20
  lostLove: boolean;   // overall <= 55, class >= JR
}

export interface Trace {
  state: GameState;
  decisionIds: string[];
  exposure: GateExposure;
  minCharacter: number;
  minOverall: number;
  bustEventsSeen: string[];
  tierPath: Tier[]; // school tier at the start of each decision, deduped consecutively
  // `overall` as seen at each offseason decision. The soft-washout check
  // (`overall < washoutOverallFloor`) runs inside enterOffseason, which is not
  // a decision point, so this is the closest observable proxy: the value the
  // check just compared, one hub step later. Pooled across careers it says
  // where a washout floor would have to sit to fire at all.
  offseasonOverall: number[];
}

function classAtLeast(year: ClassYear, need: ClassYear): boolean {
  return CLASS_ORDER.indexOf(year) >= CLASS_ORDER.indexOf(need);
}

// A copy of playCareer's loop that records what it saw. Deliberately a copy
// rather than a callback bolted onto playCareer: play-headless.ts is the module
// the balance baselines were produced with and it should not grow a hook for
// one probe.
export function traceCareer(setup: Setup, seed: string, policy: Policy): Trace {
  let s = createCareer(setup, seed, CONTENT);
  const policyRng = createRng(seed + ":policy");
  const decisionIds: string[] = [];
  const bustEventsSeen: string[] = [];
  const tierPath: Tier[] = [];
  const offseasonOverall: number[] = [];
  const exposure: GateExposure = { mri: false, academics: false, drugTest: false, doghouse: false, arrest: false, lostLove: false };
  let minCharacter = s.character;
  let minOverall = s.overall;
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, CONTENT);
    if (!decision) break;
    decisionIds.push(decision.eventId);
    if (BUST_EVENT_IDS.has(decision.eventId)) bustEventsSeen.push(decision.eventId);
    if (s.school.schoolId && tierPath[tierPath.length - 1] !== s.school.tier) tierPath.push(s.school.tier);
    if (s.phase === "offseason" && s.seasons.length > 0) offseasonOverall.push(s.overall);
    minCharacter = Math.min(minCharacter, s.character);
    minOverall = Math.min(minOverall, s.overall);
    if (s.injuries.some((i) => i.kind === "injury")) exposure.mri = true;
    if (s.character <= 35 && classAtLeast(s.eligibility.classYear, "SO")) exposure.academics = true;
    if (s.character <= 30) exposure.drugTest = true;
    if (s.character <= 25) exposure.doghouse = true;
    if (s.character <= 20) exposure.arrest = true;
    if (s.overall <= 55 && classAtLeast(s.eligibility.classYear, "JR")) exposure.lostLove = true;
    s = advance(s, policy(s, decision.options, policyRng), CONTENT);
  }
  minCharacter = Math.min(minCharacter, s.character);
  minOverall = Math.min(minOverall, s.overall);
  return { state: s, decisionIds, exposure, minCharacter, minOverall, bustEventsSeen, tierPath, offseasonOverall };
}

export interface FailureReport {
  profile: string;
  position: Position;
  runs: number;

  // --- Can you lose? ---
  // The headline: any outcome a player would read as failure.
  failRate: number;          // busted OR reached the draft and went undrafted
  bustedRate: number;        // career ended before the draft
  undraftedRate: number;     // reached the draft, nobody called
  pickedRate: number;        // actually drafted

  // Busted, split by mechanism.
  washoutOverallRate: number;
  washoutBuriedRate: number;
  eventBustRate: number;
  endingReasons: Record<string, number>;

  // --- How badly? ---
  roundShare: number[];      // index 0 = undrafted, 1..7 = that round; busted excluded
  round1Rate: number;
  round67Rate: number;
  avgDraftStock: number;     // over careers that reached the draft
  stockP05: number;
  stockP50: number;
  minDraftStock: number;

  avgSeasons: number;
  seasonsShare: Record<number, number>;
  avgFinalOverall: number;
  overallP05: number;
  overallP50: number;
  minFinalOverall: number;
  avgFinalCharacter: number;
  charUnder55Rate: number;
  charUnder35Rate: number;
  minFinalCharacter: number;
  avgInjuries: number;
  allConfRate: number;
  avgTrophies: number;
  avgAwards: number;
  avgCareerSnaps: number;
  // Full integer histogram of draft stock over careers that reached the draft,
  // so any counterfactual undrafted floor can be evaluated exactly against the
  // measured distribution instead of re-running the sim per candidate value.
  stockHistogram: Record<number, number>;
  // Draft-stock counts split by the class year the career declared in. The
  // engine only offers the declare decision to a JR or a SR (advance.ts), so
  // this is the split that makes a class-keyed lever — a penalty on leaving
  // with eligibility unused — evaluable against the same measurement as a
  // global floor change.
  stockCountsByClass: Record<string, Record<number, number>>;

  // Pooled over every offseason a career survived to: the distribution the
  // soft-washout overall floor is compared against.
  offseasonOverallP01: number;
  offseasonOverallP05: number;
  offseasonOverallMin: number;
  offseasonChecks: number;
  // Share of offseason checks that a floor at each candidate value would catch.
  washoutFloorSweep: Record<number, number>;

  // --- Did the failure paths ever get a chance? ---
  gateExposureRate: Record<keyof GateExposure, number>;
  bustEventSurfacedRate: number;   // a bust event actually appeared as a decision
  bustEventFires: Record<string, number>;

  // --- Is the offseason a decision? ---
  avgMovesUp: number;
  avgMovesLateral: number;
  avgMovesDown: number;
  avgFinalTier: number;
  finalTierShare: Record<number, number>;
}

function share<T extends string | number>(values: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[String(v)] = (out[String(v)] ?? 0) + 1;
  for (const k of Object.keys(out)) out[k] = (out[k] ?? 0) / values.length;
  return out;
}

export function summarizeTraces(profile: string, position: Position, traces: Trace[]): FailureReport {
  const n = traces.length;
  const states = traces.map((t) => t.state);
  const rate = (pred: (t: Trace) => boolean) => traces.filter(pred).length / n;
  const mean = (f: (t: Trace) => number) => traces.reduce((a, t) => a + f(t), 0) / n;

  const busted = traces.filter((t) => t.state.status === "busted");
  const reachedDraft = traces.filter((t) => t.state.status === "drafted");
  const undrafted = reachedDraft.filter((t) => t.state.draftResult?.undrafted);

  const endingReasons: Record<string, number> = {};
  for (const t of busted) endingReasons[t.state.endingReason ?? "(none)"] = (endingReasons[t.state.endingReason ?? "(none)"] ?? 0) + 1;

  const roundCounts: number[] = new Array(8).fill(0);
  for (const t of reachedDraft) {
    const r = t.state.draftResult!;
    const idx = r.undrafted ? 0 : r.round;
    roundCounts[idx] = (roundCounts[idx] ?? 0) + 1;
  }

  const stocks = reachedDraft.map((t) => t.state.draftResult!.draftStock).sort((a, b) => a - b);
  const overalls = states.map((s) => s.overall).sort((a, b) => a - b);
  const characters = states.map((s) => s.character).sort((a, b) => a - b);
  const offseasonOveralls = traces.flatMap((t) => t.offseasonOverall).sort((a, b) => a - b);

  const bustFires: Record<string, number> = {};
  for (const t of traces) for (const id of t.bustEventsSeen) bustFires[id] = (bustFires[id] ?? 0) + 1;

  const moves = (t: Trace, dir: "up" | "lat" | "down") => {
    let c = 0;
    for (let i = 1; i < t.tierPath.length; i++) {
      const d = t.tierPath[i]! - t.tierPath[i - 1]!;
      if (dir === "up" && d > 0) c++;
      if (dir === "down" && d < 0) c++;
    }
    return c;
  };
  // A lateral move keeps the tier, so tierPath cannot see it. Count school
  // changes from the season lines instead and subtract the tier moves.
  const schoolChanges = (t: Trace) => {
    let c = 0;
    for (let i = 1; i < t.state.seasons.length; i++) {
      if (t.state.seasons[i]!.schoolId !== t.state.seasons[i - 1]!.schoolId) c++;
    }
    return c;
  };

  const exposureKeys: (keyof GateExposure)[] = ["mri", "academics", "drugTest", "doghouse", "arrest", "lostLove"];
  const gateExposureRate = Object.fromEntries(
    exposureKeys.map((k) => [k, rate((t) => t.exposure[k])]),
  ) as Record<keyof GateExposure, number>;

  return {
    profile,
    position,
    runs: n,
    failRate: rate((t) => t.state.status === "busted" || !!t.state.draftResult?.undrafted),
    bustedRate: busted.length / n,
    undraftedRate: undrafted.length / n,
    pickedRate: (reachedDraft.length - undrafted.length) / n,
    washoutOverallRate: busted.filter((t) => t.state.endingReason === WASHOUT_REASONS.overall).length / n,
    washoutBuriedRate: busted.filter((t) => t.state.endingReason === WASHOUT_REASONS.buried).length / n,
    eventBustRate: busted.filter(
      (t) => t.state.endingReason !== WASHOUT_REASONS.overall && t.state.endingReason !== WASHOUT_REASONS.buried,
    ).length / n,
    endingReasons,
    roundShare: roundCounts.map((c) => c / n),
    round1Rate: roundCounts[1]! / n,
    round67Rate: (roundCounts[6]! + roundCounts[7]!) / n,
    avgDraftStock: stocks.length ? stocks.reduce((a, b) => a + b, 0) / stocks.length : 0,
    stockP05: stocks.length ? percentile(stocks, 0.05) : 0,
    stockP50: stocks.length ? percentile(stocks, 0.5) : 0,
    minDraftStock: stocks.length ? stocks[0]! : 0,
    avgSeasons: mean((t) => t.state.seasons.length),
    seasonsShare: share(states.map((s) => s.seasons.length)),
    avgFinalOverall: overalls.reduce((a, b) => a + b, 0) / n,
    overallP05: percentile(overalls, 0.05),
    overallP50: percentile(overalls, 0.5),
    minFinalOverall: overalls[0]!,
    avgFinalCharacter: characters.reduce((a, b) => a + b, 0) / n,
    charUnder55Rate: characters.filter((c) => c <= 55).length / n,
    charUnder35Rate: characters.filter((c) => c <= 35).length / n,
    minFinalCharacter: characters[0]!,
    avgInjuries: mean((t) => t.state.careerInjuries),
    allConfRate: rate((t) => t.state.awards.includes("allConference")),
    avgTrophies: mean((t) => Object.values(t.state.trophies).reduce((a, b) => a + b, 0)),
    avgAwards: mean((t) => t.state.awards.length),
    avgCareerSnaps: mean((t) => t.state.seasons.reduce((a, l) => a + l.snaps, 0)),
    stockHistogram: share(stocks),
    stockCountsByClass: reachedDraft.reduce<Record<string, Record<number, number>>>((acc, t) => {
      const cls = t.state.eligibility.classYear;
      const stock = t.state.draftResult!.draftStock;
      (acc[cls] ??= {})[stock] = ((acc[cls] ??= {})[stock] ?? 0) + 1;
      return acc;
    }, {}),
    offseasonOverallP01: offseasonOveralls.length ? percentile(offseasonOveralls, 0.01) : 0,
    offseasonOverallP05: offseasonOveralls.length ? percentile(offseasonOveralls, 0.05) : 0,
    offseasonOverallMin: offseasonOveralls.length ? offseasonOveralls[0]! : 0,
    offseasonChecks: offseasonOveralls.length,
    washoutFloorSweep: Object.fromEntries(
      [45, 50, 52, 55, 58, 60].map((f) => [f, offseasonOveralls.filter((o) => o < f).length / Math.max(1, offseasonOveralls.length)]),
    ),
    gateExposureRate,
    bustEventSurfacedRate: rate((t) => t.bustEventsSeen.length > 0),
    bustEventFires: bustFires,
    avgMovesUp: mean((t) => moves(t, "up")),
    avgMovesLateral: mean((t) => Math.max(0, schoolChanges(t) - moves(t, "up") - moves(t, "down"))),
    avgMovesDown: mean((t) => moves(t, "down")),
    avgFinalTier: mean((t) => t.state.school.tier),
    finalTierShare: share(states.map((s) => s.school.tier)),
  };
}

export function runProbe(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position = "QB",
  homeState = "TX",
): FailureReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const policy = makePolicy(PROFILES[profileName]);
  const traces: Trace[] = [];
  for (let i = 0; i < runs; i++) traces.push(traceCareer(setup, `${seedPrefix}-${i}`, policy));
  return summarizeTraces(profileName, position, traces);
}

// ---------------------------------------------------------------------------
// Analytic: when a bust gate IS satisfied, how much of the random-event pool
// does the bust event own? Only one random event fires per phase, drawn by
// weight, so a gated-in bust event is competing with every other eligible
// event in that phase. This is the number that explains why exposure is common
// and busting is not.
// ---------------------------------------------------------------------------
export interface PoolShare {
  bustEventId: string;
  phase: string;
  eligiblePoolSize: number;
  eligiblePoolWeight: number;
  bustWeight: number;
  drawShare: number; // probability this bust event is the one drawn, this phase
}

export function bustPoolShares(position: Position = "QB"): PoolShare[] {
  const out: PoolShare[] = [];
  for (const ev of BUST_EVENTS) {
    // Build the most permissive state that satisfies this event's own gate, so
    // the pool share measured is the BEST case for the failure path.
    const s = createCareer({ lastName: "P", jerseyNumber: 1, homeState: "TX", position }, "pool", CONTENT);
    s.school = { schoolId: CONTENT.schools.find((x) => x.tier === 1)!.id, tier: 1 };
    s.phase = ev.phase;
    s.eligibility = { classYear: "JR", yearsUsed: 2, redshirtUsed: false, draftEligible: true };
    s.seasons = [{ seasonIndex: 0, schoolId: s.school.schoolId, snaps: 400, stats: {}, teamWins: 6, teamLosses: 6, overall: 55, classYear: "JR" }];
    const c = ev.conditions ?? {};
    s.character = c.maxCharacter ?? 70;
    s.overall = c.maxOverall ?? 70;
    if (c.requiresActiveInjury) s.injuries = [{ kind: "injury", injuryType: "mcl", remainingPhases: 3, restoreAmount: 8 }];
    const pool = CONTENT.events.filter((e: GameEvent) => e.kind === "random" && eventMatches(s, e, CONTENT));
    const total = pool.reduce((a, e) => a + e.weight, 0);
    out.push({
      bustEventId: ev.id,
      phase: ev.phase,
      eligiblePoolSize: pool.length,
      eligiblePoolWeight: total,
      bustWeight: ev.weight,
      drawShare: total === 0 ? 0 : ev.weight / total,
    });
  }
  return out;
}

function main(): void {
  if (process.argv[2] === "pools") {
    console.log(JSON.stringify(bustPoolShares((process.argv[3] as Position) ?? "QB"), null, 2));
    return;
  }
  const runs = Number(process.argv[2] ?? 500);
  const profileArg = process.argv[3] ?? "baselineRandom";
  const positionArg = process.argv[4] ?? "QB";
  const profiles = (profileArg === "all" ? Object.keys(PROFILES) : [profileArg]) as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : [positionArg as Position];
  const rows: FailureReport[] = [];
  for (const p of profiles) {
    if (!(p in PROFILES)) {
      console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    for (const pos of positions) rows.push(runProbe(runs, "b018", p, pos));
  }
  console.log(JSON.stringify(rows, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("failure-probe.ts")) main();
