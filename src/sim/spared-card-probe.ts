// Brief 057 / DECISION 078: when a player takes the good-teammate branch of the
// ten cards B76 deliberately spared, how often does the game say anything back?
//
// Every character probe in this directory measures the VALUE of `character`:
// its endpoint (virtue-probe), its trajectory and the rung it stands on
// (rung-probe), its band phrase (human-lazy-probe). None of them measures
// whether a particular CARD spoke. That is a different question and it cannot
// be recovered from any of those series, because the locker-room line is gated
// on the summed character delta of the ONE OUTCOME that fired, not on the
// running total — `LOCKER_ROOM_MIN_CHARACTER = 2` in
// `src/ui/session/view-model.ts` (DECISION 075/077). A career can climb twenty
// character points one silent point at a time.
//
// So this probe instruments the decision loop itself. For every `advance()` it
// records which event was raised, which option the policy took, which outcome
// fired, and — reproducing `accountOf`/`lockerRoomVerdict` exactly — whether
// the card printed a locker-room line. The denominator is CAREERS, not cells:
// the brief's question is "how often does a player see this", and an aggregate
// over N runs cannot answer it.
//
// The floor is duplicated here rather than imported because `view-model.ts`
// does not export it and this wave may not edit `src/ui/**`. The duplication is
// asserted against the source text in spared-card-probe.test.ts, which is the
// same guard human-lazy-probe.test.ts puts on its copy of the band table.
//
// CLI:
//   npx tsx src/sim/spared-card-probe.ts <runsPerPosition> <profile,profile|all> <pos,pos|all> [seedPrefix]

import {
  createCareer,
  advance,
  getDecision,
  ALL_POSITIONS,
  type Position,
  type Setup,
} from "../engine/index";
import { createRng } from "../engine/rng";
import { CONTENT } from "../content/index";
import type { Effect, GameEvent, Outcome } from "../engine/types";
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";

/** `LOCKER_ROOM_MIN_CHARACTER`, view-model.ts:293. See the header. */
export const LOCKER_ROOM_MIN_CHARACTER = 2;

export type Verdict = "cost" | "credit" | null;

/**
 * `lockerRoomVerdict(character)` from view-model.ts:306, verbatim.
 *
 * Size is never shown; this decides only whether the card speaks at all.
 */
export function lockerRoomVerdict(character: number): Verdict {
  if (Math.abs(character) < LOCKER_ROOM_MIN_CHARACTER) return null;
  if (character < 0) return "cost";
  if (character > 0) return "credit";
  return null;
}

export interface SparedCard {
  /** Event id at HEAD. */
  id: string;
  /** Card title, for the report table. */
  title: string;
  /** File the card lives in, so the table resolves to source. */
  file: string;
  /** The branch a good teammate would plausibly take. */
  goodOptionId: string;
  /**
   * True for `targeting-review`, the eleventh card DECISION 078 resolved as
   * correct rather than spared. Excluded from the headline "ten".
   */
  eleventh?: boolean;
}

/**
 * The ten cards DECISION 078 spared, plus the eleventh it resolved as correct.
 *
 * Taken from report 051 §4.1 rows 13–22 (the ten) and row 9 (`targeting-review`).
 * Every id and every option id here is verified against `src/content/**` at
 * HEAD by spared-card-probe.test.ts, which is the check DECISION 078 exists
 * because 050 skipped: a set defined by a measurement is not a set verified
 * card by card.
 */
export const SPARED_CARDS: SparedCard[] = [
  { id: "the-toe-tap", title: "The Toe-Tap", file: "oskill.ts", goodOptionId: "wave-it-off" },
  { id: "bowl-opt-out", title: "Bowl Opt-Out", file: "oskill.ts", goodOptionId: "play" },
  { id: "nonconf-blowout-sideline", title: "Up Forty at Halftime", file: "season-life.ts", goodOptionId: "work-the-sideline" },
  { id: "transfer-qb", title: "The Transfer QB", file: "qb.ts", goodOptionId: "mentor" },
  { id: "playing-through-the-hand", title: "Playing Through the Hand", file: "ol.ts", goodOptionId: "play-through-it" },
  { id: "wideopen-two-deep", title: "The Two-Deep", file: "school-life.ts", goodOptionId: "bring-the-walkon-along" },
  { id: "the-holding-call", title: "The Holding Call", file: "ol.ts", goodOptionId: "own-it" },
  { id: "trash-talk", title: "Trash Talk", file: "dl.ts", goodOptionId: "stay-quiet" },
  { id: "offseason-captain-vote", title: "The Captain Vote", file: "season-life.ts", goodOptionId: "let-the-work-speak" },
  { id: "blueblood-five-star", title: "The Five-Star Behind You", file: "universal.ts", goodOptionId: "bring-him-along" },
  { id: "targeting-review", title: "Targeting Review", file: "dskill.ts", goodOptionId: "pull-up-at-the-last-second", eleventh: true },
];

export const SPARED_IDS = new Set(SPARED_CARDS.map((c) => c.id));
export const TEN_IDS = SPARED_CARDS.filter((c) => !c.eleventh).map((c) => c.id);
export const ELEVEN_IDS = SPARED_CARDS.map((c) => c.id);
const CARD_BY_ID = new Map(SPARED_CARDS.map((c) => [c.id, c]));

const EVENTS_BY_ID = new Map<string, GameEvent>(CONTENT.events.map((e) => [e.id, e]));

function characterSum(outcome: Outcome): number {
  return outcome.effects.reduce((a, e: Effect) => a + (e.kind === "character" ? e.amount : 0), 0);
}

function hasMoment(outcome: Outcome): boolean {
  return outcome.effects.some((e) => e.kind === "moment");
}

/**
 * What the card on screen said, resolved the way `cardAccount` resolves it.
 *
 * `firedOutcomes` matches an outcome by its PROSE, and when two candidates
 * match with different accountings `cardAccount` returns null — the card says
 * nothing rather than a confident fiction. Both behaviours are reproduced,
 * because a report that counted an ambiguous match as a spoken line would be
 * over-counting exactly the thing under test.
 */
export function resolveSpoken(
  eventId: string,
  optionId: string,
  description: string | undefined,
): { verdict: Verdict; character: number; moment: boolean; ambiguous: boolean; matched: boolean } {
  const silent = { verdict: null as Verdict, character: 0, moment: false, ambiguous: false, matched: false };
  if (description === undefined) return silent;
  const option = EVENTS_BY_ID.get(eventId)?.options.find((o) => o.id === optionId);
  if (!option) return silent;
  const candidates = [option.positiveOutcome, option.negativeOutcome].filter(
    (o): o is Outcome => !!o && o.description === description,
  );
  if (candidates.length === 0) return silent;
  const chars = candidates.map(characterSum);
  const verdicts = chars.map(lockerRoomVerdict);
  const agree = verdicts.every((v) => v === verdicts[0]);
  if (!agree) return { verdict: null, character: chars[0]!, moment: false, ambiguous: true, matched: true };
  return {
    verdict: verdicts[0]!,
    character: chars[0]!,
    moment: candidates.some(hasMoment),
    ambiguous: false,
    matched: true,
  };
}

/** One career's record of what the spared cards did. Counts, keyed by event id. */
export interface CareerTrace {
  decisions: number;
  /** Times the card was RAISED as a decision, whatever branch was taken. */
  fires: Record<string, number>;
  /** Times the good branch was taken. */
  goodTakes: Record<string, number>;
  /** Good-branch takes where the locker-room line printed, either direction. */
  goodSpeaks: Record<string, number>;
  /** Good-branch takes where it printed as a CREDIT. */
  goodCredits: Record<string, number>;
  /** Good-branch takes where it printed as a COST (the branch's failure roll). */
  goodCosts: Record<string, number>;
  /** Good-branch takes silenced by the floor: 0 < |char| < 2. */
  goodSubFloor: Record<string, number>;
  /** Good-branch takes that carried no character at all: char == 0. */
  goodZero: Record<string, number>;
  /** Good-branch takes that fired a `moment` (visible even when silent). */
  goodMoments: Record<string, number>;
  /** Any branch, any direction: times this card printed a locker-room line. */
  anySpeaks: Record<string, number>;
}

function emptyCounts(): Record<string, number> {
  const r: Record<string, number> = {};
  for (const id of ELEVEN_IDS) r[id] = 0;
  return r;
}

function bump(rec: Record<string, number>, id: string): void {
  rec[id] = (rec[id] ?? 0) + 1;
}

/**
 * Play one career and record what the spared cards did.
 *
 * A copy of `playCareer`'s loop, for the reason `virtue-probe`, `rung-probe`
 * and `failure-probe` keep their own: play-headless is the module the balance
 * baselines were produced with and it should not grow a hook per probe.
 */
export function traceCareer(setup: Setup, seed: string, policy: Policy): CareerTrace {
  let s = createCareer(setup, seed, CONTENT);
  const policyRng = createRng(seed + ":policy");
  const t: CareerTrace = {
    decisions: 0,
    fires: emptyCounts(),
    goodTakes: emptyCounts(),
    goodSpeaks: emptyCounts(),
    goodCredits: emptyCounts(),
    goodCosts: emptyCounts(),
    goodSubFloor: emptyCounts(),
    goodZero: emptyCounts(),
    goodMoments: emptyCounts(),
    anySpeaks: emptyCounts(),
  };
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, CONTENT);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    const eventId = decision.eventId;
    s = advance(s, choice, CONTENT);
    t.decisions++;
    if (!SPARED_IDS.has(eventId)) continue;
    bump(t.fires, eventId);
    const spoken = resolveSpoken(eventId, choice, s.lastOutcome?.description);
    if (spoken.verdict !== null) bump(t.anySpeaks, eventId);
    const card = CARD_BY_ID.get(eventId)!;
    if (choice !== card.goodOptionId) continue;
    bump(t.goodTakes, eventId);
    if (spoken.moment) bump(t.goodMoments, eventId);
    if (spoken.verdict === "credit") {
      bump(t.goodSpeaks, eventId);
      bump(t.goodCredits, eventId);
    } else if (spoken.verdict === "cost") {
      bump(t.goodSpeaks, eventId);
      bump(t.goodCosts, eventId);
    } else if (spoken.character === 0) {
      bump(t.goodZero, eventId);
    } else {
      bump(t.goodSubFloor, eventId);
    }
  }
  return t;
}

// ---------------------------------------------------------------------------
// Summaries. Every rate below has CAREERS in the denominator.
// ---------------------------------------------------------------------------

export interface CardRow {
  id: string;
  title: string;
  /** Share of careers in which the card fires at least once. */
  fireRate: number;
  firesMean: number;
  firesP50: number;
  firesP90: number;
  /** Share of careers in which the good branch is taken at least once. */
  goodTakeRate: number;
  /** Share of careers in which the good branch is taken AND the line prints. */
  goodSpeakRate: number;
  goodCreditRate: number;
  goodCostRate: number;
  /** Share of careers where the good branch was taken but the floor ate it. */
  goodSubFloorRate: number;
  /** Share of careers where the good branch carried no character at all. */
  goodZeroRate: number;
  goodMomentRate: number;
  /** Share of careers in which this card prints a line on ANY branch. */
  anySpeakRate: number;
  /**
   * Take-level counts, denominator = good-branch TAKES of this card, not
   * careers. The career rates above answer "does a player see it"; these
   * answer "when he takes it, what happens", and blurring the two is the
   * error DECISION 078 was opened over.
   */
  takes: { total: number; credit: number; cost: number; subFloor: number; zero: number };
}

export interface ProbeReport {
  profile: string;
  position: Position | "ALL";
  careers: number;
  cards: CardRow[];
  /** THE HEADLINE: share of careers where a good branch of the TEN speaks. */
  headlineSpeakRate: number;
  /** Same, credits only. */
  headlineCreditRate: number;
  /** Per-career count of spoken good-branch cards among the ten. */
  spokenPerCareerMean: number;
  spokenPerCareerP50: number;
  spokenPerCareerP90: number;
  /** Distribution of that count: index i = share of careers with exactly i. */
  spokenPerCareerHist: number[];
  /**
   * The same series counting CREDITS only. A "Cost you in the locker room."
   * printed by the good branch's failure roll is the game saying something
   * back, and it is not the good branch being recognised; the report has to
   * be able to tell those apart and so does this summary.
   */
  creditPerCareerMean: number;
  creditPerCareerP50: number;
  creditPerCareerP90: number;
  creditPerCareerHist: number[];
  /** Share of careers taking a good branch of any of the ten at least once. */
  anyGoodTakeRate: number;
  /** Careers that took a good branch but heard nothing from any of the ten. */
  tookButSilentRate: number;
  /** Careers that met none of the ten at all. */
  metNoneRate: number;
  /**
   * The split the brief demands be kept separate. Denominator is good-branch
   * TAKES across the ten (not careers), because this is a per-event property.
   */
  takes: {
    total: number;
    spokeCredit: number;
    spokeCost: number;
    subFloor: number;
    zeroCharacter: number;
  };
  /**
   * Career-level silence split. Of careers hearing nothing from the ten, how
   * many never met one vs met one and were eaten by the floor/zero.
   */
  silence: {
    silentCareers: number;
    neverMetAnyOfTen: number;
    metAndTookButEaten: number;
    metButNeverTookGood: number;
  };
  decisionsMean: number;
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]!;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function summarize(
  profile: string,
  position: Position | "ALL",
  traces: CareerTrace[],
): ProbeReport {
  const n = traces.length || 1;
  const sum = (f: (t: CareerTrace) => number): number => traces.reduce((a, t) => a + f(t), 0);
  const overTen = (rec: (t: CareerTrace) => Record<string, number>) => (t: CareerTrace): number =>
    TEN_IDS.reduce((a, id) => a + (rec(t)[id] ?? 0), 0);

  const spokenPerCareer = traces.map(overTen((t) => t.goodSpeaks));
  const takesPerCareer = traces.map(overTen((t) => t.goodTakes));
  const firesPerCareer = traces.map(overTen((t) => t.fires));

  const cards: CardRow[] = SPARED_CARDS.map((c) => {
    const fires = traces.map((t) => t.fires[c.id] ?? 0);
    return {
      id: c.id,
      title: c.title,
      fireRate: fires.filter((x) => x > 0).length / n,
      firesMean: mean(fires),
      firesP50: quantile(fires, 0.5),
      firesP90: quantile(fires, 0.9),
      goodTakeRate: traces.filter((t) => (t.goodTakes[c.id] ?? 0) > 0).length / n,
      goodSpeakRate: traces.filter((t) => (t.goodSpeaks[c.id] ?? 0) > 0).length / n,
      goodCreditRate: traces.filter((t) => (t.goodCredits[c.id] ?? 0) > 0).length / n,
      goodCostRate: traces.filter((t) => (t.goodCosts[c.id] ?? 0) > 0).length / n,
      goodSubFloorRate: traces.filter((t) => (t.goodSubFloor[c.id] ?? 0) > 0).length / n,
      goodZeroRate: traces.filter((t) => (t.goodZero[c.id] ?? 0) > 0).length / n,
      goodMomentRate: traces.filter((t) => (t.goodMoments[c.id] ?? 0) > 0).length / n,
      anySpeakRate: traces.filter((t) => (t.anySpeaks[c.id] ?? 0) > 0).length / n,
      takes: {
        total: sum((t) => t.goodTakes[c.id] ?? 0),
        credit: sum((t) => t.goodCredits[c.id] ?? 0),
        cost: sum((t) => t.goodCosts[c.id] ?? 0),
        subFloor: sum((t) => t.goodSubFloor[c.id] ?? 0),
        zero: sum((t) => t.goodZero[c.id] ?? 0),
      },
    };
  });

  const creditPerCareer = traces.map(overTen((t) => t.goodCredits));
  const histOf = (xs: number[]): number[] => {
    const h = new Array(xs.reduce((a, b) => Math.max(a, b), 0) + 1).fill(0);
    for (const v of xs) h[v]++;
    return h.map((c: number) => c / n);
  };
  const hist = histOf(spokenPerCareer);

  const silentCareers = spokenPerCareer.filter((v) => v === 0).length;
  const neverMet = traces.filter((t, i) => spokenPerCareer[i] === 0 && firesPerCareer[i] === 0).length;
  const metNoTake = traces.filter(
    (_t, i) => spokenPerCareer[i] === 0 && firesPerCareer[i]! > 0 && takesPerCareer[i] === 0,
  ).length;
  const metAndTook = traces.filter(
    (_t, i) => spokenPerCareer[i] === 0 && takesPerCareer[i]! > 0,
  ).length;

  return {
    profile,
    position,
    careers: traces.length,
    cards,
    headlineSpeakRate: spokenPerCareer.filter((v) => v > 0).length / n,
    headlineCreditRate:
      traces.filter((t) => TEN_IDS.some((id) => (t.goodCredits[id] ?? 0) > 0)).length / n,
    spokenPerCareerMean: mean(spokenPerCareer),
    spokenPerCareerP50: quantile(spokenPerCareer, 0.5),
    spokenPerCareerP90: quantile(spokenPerCareer, 0.9),
    spokenPerCareerHist: hist,
    creditPerCareerMean: mean(creditPerCareer),
    creditPerCareerP50: quantile(creditPerCareer, 0.5),
    creditPerCareerP90: quantile(creditPerCareer, 0.9),
    creditPerCareerHist: histOf(creditPerCareer),
    anyGoodTakeRate: takesPerCareer.filter((v) => v > 0).length / n,
    tookButSilentRate: metAndTook / n,
    metNoneRate: firesPerCareer.filter((v) => v === 0).length / n,
    takes: {
      total: sum(overTen((t) => t.goodTakes)),
      spokeCredit: sum(overTen((t) => t.goodCredits)),
      spokeCost: sum(overTen((t) => t.goodCosts)),
      subFloor: sum(overTen((t) => t.goodSubFloor)),
      zeroCharacter: sum(overTen((t) => t.goodZero)),
    },
    silence: {
      silentCareers,
      neverMetAnyOfTen: neverMet,
      metAndTookButEaten: metAndTook,
      metButNeverTookGood: metNoTake,
    },
    decisionsMean: mean(traces.map((t) => t.decisions)),
  };
}

/** Every career's trace for one (profile, position) cell. */
export function traceCell(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position,
  homeState = "TX",
): CareerTrace[] {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const policy = makePolicy(PROFILES[profileName]);
  const out: CareerTrace[] = [];
  for (let i = 0; i < runs; i++) out.push(traceCareer(setup, `${seedPrefix}-${position}-${i}`, policy));
  return out;
}

// ---------------------------------------------------------------------------
// The floor census — what lowering LOCKER_ROOM_MIN_CHARACTER would cost.
//
// "Lower the floor for this family" is one of brief 057's routes, and it cannot
// be priced from the ten cards alone: the floor is global, so dropping it to 1
// pays the ten back by reintroducing the line on every OTHER card whose
// character delta is a single point. DECISION 075 raised the floor precisely
// because that line was read on 37.5% of resolved cards and meant nothing on a
// third of them. This measures both sides on the same careers.
// ---------------------------------------------------------------------------

export interface FloorCensus {
  careers: number;
  /** Cards resolved per career (authored events only, hubs excluded). */
  cardsPerCareer: number;
  /** Locker-room lines per career at each floor, index = floor - 1. */
  linesPerCareerByFloor: number[];
  /** Share of resolved cards printing a line at each floor. */
  shareOfCardsByFloor: number[];
  /** Of the extra lines a floor of 1 buys, the share coming from the ten. */
  extraLinesFromTheTen: number;
  extraLinesTotal: number;
}

/**
 * Lines per career at floors 1, 2 and 3, across the whole bundle.
 *
 * `floors` is 1-based and dense so the caller reads `linesPerCareerByFloor[0]`
 * as "floor 1"; the current build is index 1.
 */
export function floorCensus(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  positions: Position[],
  maxFloor = 3,
): FloorCensus {
  const policy = makePolicy(PROFILES[profileName]);
  const lines = new Array(maxFloor).fill(0);
  let cards = 0;
  let careers = 0;
  let extraTen = 0;
  let extraAll = 0;
  for (const position of positions) {
    const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position };
    for (let i = 0; i < runs; i++) {
      const seed = `${seedPrefix}-${position}-${i}`;
      let s = createCareer(setup, seed, CONTENT);
      const policyRng = createRng(seed + ":policy");
      careers++;
      let guard = 0;
      while (s.status === "active" && guard++ < 1000) {
        const decision = getDecision(s, CONTENT);
        if (!decision) break;
        const choice = policy(s, decision.options, policyRng);
        const eventId = decision.eventId;
        s = advance(s, choice, CONTENT);
        const option = EVENTS_BY_ID.get(eventId)?.options.find((o) => o.id === choice);
        if (!option) continue; // hub decision: no authored card to account
        const description = s.lastOutcome?.description;
        const fired = [option.positiveOutcome, option.negativeOutcome].filter(
          (o): o is Outcome => !!o && o.description === description,
        );
        if (fired.length === 0) continue;
        cards++;
        const c = Math.abs(characterSum(fired[0]!));
        for (let f = 1; f <= maxFloor; f++) if (c >= f) lines[f - 1]++;
        if (c >= 1 && c < LOCKER_ROOM_MIN_CHARACTER) {
          extraAll++;
          if (TEN_IDS.includes(eventId)) extraTen++;
        }
      }
    }
  }
  return {
    careers,
    cardsPerCareer: cards / careers,
    linesPerCareerByFloor: lines.map((x: number) => x / careers),
    shareOfCardsByFloor: lines.map((x: number) => x / cards),
    extraLinesFromTheTen: extraTen,
    extraLinesTotal: extraAll,
  };
}

function main(): void {
  const runs = Number(process.argv[2] ?? 100);
  const profileArg = process.argv[3] ?? "virtueLoyal,virtueAmbitious,good";
  const positionArg = process.argv[4] ?? "all";
  const seedPrefix = process.argv[5] ?? "b57";
  const profiles = profileArg.split(",") as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : (positionArg.split(",") as Position[]);

  const out: ProbeReport[] = [];
  for (const p of profiles) {
    if (!(p in PROFILES)) {
      console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const all: CareerTrace[] = [];
    for (const pos of positions) {
      const traces = traceCell(runs, seedPrefix, p, pos);
      all.push(...traces);
      out.push(summarize(p, pos, traces));
    }
    out.push(summarize(p, "ALL", all));
  }
  const census = Object.fromEntries(
    profiles.map((p) => [p, floorCensus(runs, seedPrefix, p, positions)]),
  );
  console.log(JSON.stringify({ reports: out, floorCensus: census }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("spared-card-probe.ts")) main();
