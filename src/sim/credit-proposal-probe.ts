// Brief 059 / DECISION 084: price the content edit the user has to approve.
//
// DECISION 084 established that 27 of 106 cards can charge the player and can
// never credit him, and that the asymmetry is authored rather than a display
// artifact (21 of 106 survive removing the floor). Every fix edits
// `src/content/**`, which is frozen and is the user's call. This probe exists
// so the call is made against a measured price rather than an estimate.
//
// WHAT IT DOES NOT DO: it does not edit content, and it cannot. It MODELS a
// proposed edit by replaying real careers and adding the proposed character
// delta on top of the outcome the engine actually produced. The figures it
// returns are therefore MODELLED, not observed — see the limitations in
// `reports/059-*.md`. The one thing the model cannot capture is a policy that
// chooses differently once the effect changes; every row is checked for that in
// credit-proposal-probe.test.ts, which asserts `virtue` never flips and PINS
// the one card where `best` does (`trash-talk`, a margin of 0.01 draft-stock
// points at HEAD). That turns "the take counts carry over" — the assumption
// report 057's limitation 4 had to state and leave open — into a verified claim
// with one named exception.
//
// The existing probes are not modified (brief 059 forbids it). The prose-match
// resolver and the floor constant are duplicated from spared-card-probe for the
// same reason that probe duplicated them from `view-model.ts`: this lane may
// not edit `src/ui/**` or the other probes, and both copies are asserted
// against source in the test.
//
// CLI:
//   npx tsx src/sim/credit-proposal-probe.ts <runsPerPosition> <profile,...|all> <pos,...|all> [seedPrefix]

import {
  createCareer,
  advance,
  getDecision,
  deriveDraftStock,
  ALL_POSITIONS,
  type GameState,
  type Position,
  type Setup,
} from "../engine/index";
import { createRng } from "../engine/rng";
import { CONTENT } from "../content/index";
import type { Effect, GameEvent, Outcome } from "../engine/types";
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";

/** `LOCKER_ROOM_MIN_CHARACTER`, view-model.ts:293. Asserted against source in the test. */
export const LOCKER_ROOM_MIN_CHARACTER = 2;

/** `UNDRAFTED_FLOOR`, draft.ts. Asserted against source in the test. */
export const UNDRAFTED_FLOOR = 50;

export type Verdict = "cost" | "credit" | null;

/** `lockerRoomVerdict(character)` from view-model.ts:306, verbatim. */
export function lockerRoomVerdict(character: number): Verdict {
  if (Math.abs(character) < LOCKER_ROOM_MIN_CHARACTER) return null;
  if (character < 0) return "cost";
  if (character > 0) return "credit";
  return null;
}

// ---------------------------------------------------------------------------
// The proposal. THIS TABLE IS THE DELIVERABLE.
// ---------------------------------------------------------------------------

export interface CreditRow {
  /** Event id at HEAD. */
  eventId: string;
  /** Option id at HEAD. */
  optionId: string;
  /** Which of the option's two outcomes the edit lands on. */
  branch: "positive" | "negative";
  /** The authored character sum of that outcome at HEAD. Asserted in the test. */
  from: number;
  /** The proposed character sum. */
  to: number;
  /** The file under src/content/events/ the card lives in. */
  file: string;
  /** One line: why this branch earns standing rather than merely avoiding a charge. */
  why: string;
}

/**
 * Tier 1 — six rows, six cards. Restraint that the ROOM CAN SEE and that COSTS
 * the player something he wanted.
 *
 * That two-part test is the whole editorial argument, and it is what keeps the
 * currency meaning "standing in the room" rather than "compliance score". A
 * branch that is merely the absence of a violation (hire a real advisor, have
 * the contract read, do not sell the tickets) is NOT here, however loudly its
 * sibling is punished: paying for those would redefine character as "avoided
 * doing a bad thing", which is not integrity.
 *
 * Five of the six carry +1 today and are silenced by the display floor of 2.
 * The sixth carries literally nothing.
 */
/**
 * DECISION 086 / 089 — TIER_1 SHIPPED on 2026-09-25 and is applied in
 * `src/content/**` today. The rows are kept here rather than deleted because
 * they are this probe's record of what moved, and because several tests below
 * exist to reproduce figures that were measured BEFORE the edit landed.
 *
 * `REVERT_LANDED` patches those six branches back to their pre-086 values, so
 * `censusCorpus(floor, REVERT_LANDED)` reconstructs the corpus DECISION 084
 * measured. That is how the historical reproductions stay honest: they keep
 * asserting the numbers that were actually observed, against the corpus that
 * was actually observed, instead of being quietly rewritten to whatever the
 * corpus says now.
 *
 * TIER_2 and UNSURE are NOT landed. Tier 2 was rejected (DECISION 089) and the
 * unsure three were never taken, so their `from` values remain live tripwires
 * against the current corpus.
 */
export const TIER_1: CreditRow[] = [
  {
    eventId: "wideopen-two-deep",
    optionId: "bring-the-walkon-along",
    branch: "positive",
    from: 1,
    to: 2,
    file: "school-life.ts",
    why: "Prose already says it: \"the room notices who built him.\" Reps given away are a real cost. The card writes a `moment` and scores nothing readable.",
  },
  {
    eventId: "offseason-captain-vote",
    optionId: "let-the-work-speak",
    branch: "positive",
    from: 0,
    to: 2,
    file: "season-life.ts",
    why: "\"The room votes for you anyway.\" The room's verdict IS the currency, and this is the one card where the room renders it explicitly — currently for zero points.",
  },
  {
    eventId: "the-holding-call",
    optionId: "own-it",
    branch: "positive",
    from: 1,
    to: 2,
    file: "ol.ts",
    why: "Taking the blame in the film session is public and it costs face. The failure roll of the same branch already charges -2; the success is silenced.",
  },
  {
    eventId: "trash-talk",
    optionId: "stay-quiet",
    branch: "positive",
    from: 1,
    to: 2,
    file: "dl.ts",
    why: "\"The staff appreciates the poise.\" The recognition is written into the prose and absent from the numbers.",
  },
  {
    eventId: "the-roughing-call",
    optionId: "dial-it-back",
    branch: "positive",
    from: 1,
    to: 2,
    file: "dl.ts",
    why: "\"A quiet word of approval from the staff.\" Same shape as Trash Talk, same file, and report 057 missed it.",
  },
  {
    eventId: "asked-to-block",
    optionId: "buy-in",
    branch: "positive",
    from: 1,
    to: 2,
    file: "oskill.ts",
    why: "The purest case in the corpus: \"The coaches notice even if the box score doesn't\" — visible, and it costs him his stat line outright.",
  },
];

/**
 * Tier 2 — the five `fixed` season openers, priced SEPARATELY and on purpose.
 *
 * DECISION 084 names these five plus `milestone-rivalry` as the reason ~114
 * played decisions produced zero upward rungs: they are `fixed`, so they fire
 * every played season, and every one of them can charge -2 and can never
 * credit. They are the largest single lever on the finding.
 *
 * They are split out because they are the only rows the `good` profile also
 * takes (measured, not assumed — `best` scores `stay-within` at 0.040 against
 * `handle-it`'s 0.019), so they are the only rows that can move the brief's
 * "`good` materially unmoved" criterion. A user who cares more about that
 * criterion than about the openers can approve Tier 1 alone; the two arms are
 * measured separately so that is a real choice and not a guess.
 */
export const LANDED: readonly CreditRow[] = TIER_1;

/** TIER_1's rows with `to` and `from` swapped — see the note above TIER_1. */
export const REVERT_LANDED: readonly CreditRow[] = TIER_1.map((r) => ({
  ...r,
  from: r.to,
  to: r.from,
}));

export const TIER_2: CreditRow[] = (
  [
    ["milestone-opener-first", "\"the huddle needed\" it — and it is the first card a player ever meets"],
    ["milestone-opener-no-excuse", "\"the guys who watched you all summer notice\""],
    ["milestone-opener-your-team", "\"the young guys copy it\""],
    ["milestone-opener-counting", "\"the sideline says so out loud\""],
    ["milestone-opener-last", "\"You give the day to the guys beside you\""],
  ] as const
).map(([eventId, why]) => ({
  eventId,
  optionId: "stay-within",
  branch: "positive" as const,
  from: 1,
  to: 2,
  file: "milestones.ts",
  why: `Fixed card, fires every played season, charges -2 and can never credit. ${why}.`,
}));

/**
 * The three rows the report puts in front of the user as UNSURE rather than
 * recommending. Measured as a third arm so the user can see what they cost.
 */
export const UNSURE: CreditRow[] = [
  {
    eventId: "targeting-review",
    optionId: "pull-up-at-the-last-second",
    branch: "positive",
    from: 1,
    to: 2,
    file: "dskill.ts",
    why: "UNSURE. Report 057 proposed it. Pulling up protects an opponent at real cost — but it is also the closest thing in the corpus to plain rule-compliance, and the prose gives no recognition.",
  },
  {
    eventId: "sideline-camera",
    optionId: "cool-down",
    branch: "positive",
    from: 1,
    to: 2,
    file: "qb.ts",
    why: "UNSURE. De-escalating in front of the team works and is visible — but the player caused the incident, so this is atonement, and the corpus does not otherwise pay for repairing your own harm.",
  },
  {
    eventId: "offfield-skip-install",
    optionId: "skip-the-podcast",
    branch: "positive",
    from: 0,
    to: 2,
    file: "offfield.ts",
    why: "UNSURE. The only `effects: []` restraint branch that gives up something real (national exposure) for the room — but the prose says nobody notices, and the install is a required meeting.",
  },
];

export const PROPOSALS = {
  tier1: TIER_1,
  tier1plus2: [...TIER_1, ...TIER_2],
  tier1plus2plusUnsure: [...TIER_1, ...TIER_2, ...UNSURE],
  unsureOnly: UNSURE,
} as const;

export type ProposalName = keyof typeof PROPOSALS;

// ---------------------------------------------------------------------------
// The corpus census — the static half of the answer, no careers needed.
// ---------------------------------------------------------------------------

const EVENTS_BY_ID = new Map<string, GameEvent>(CONTENT.events.map((e) => [e.id, e]));

export function characterSum(outcome: Outcome): number {
  return outcome.effects.reduce((a, e: Effect) => a + (e.kind === "character" ? e.amount : 0), 0);
}

export interface CorpusCensus {
  cards: number;
  options: number;
  /** Options with an outcome at or above +floor. */
  canCredit: number;
  /** Options with an outcome at or below -floor. */
  canCharge: number;
  /** Options that can do both (an option's two branches disagree in sign). */
  canBoth: number;
  /** Options that can do neither. */
  silent: number;
  /** Cards that can charge and can never credit. */
  oneWayDown: string[];
  /** Cards that can credit and can never charge. */
  oneWayUp: string[];
}

/**
 * The DECISION 084 sweep, re-derived here rather than quoted, so the report's
 * numbers are this file's output and not a transcription. `floor` is the
 * display floor; pass 1 to reproduce the "floor removed" row.
 *
 * `overrides` applies a proposal as if it had shipped, which is how the
 * "how many of the 27 stop being one-way" figure is produced.
 */
export function censusCorpus(floor: number, overrides: readonly CreditRow[] = []): CorpusCensus {
  const key = (e: string, o: string, b: "positive" | "negative"): string => `${e}|${o}|${b}`;
  const patch = new Map(overrides.map((r) => [key(r.eventId, r.optionId, r.branch), r.to]));
  let canCredit = 0;
  let canCharge = 0;
  let canBoth = 0;
  let silent = 0;
  let options = 0;
  const oneWayDown: string[] = [];
  const oneWayUp: string[] = [];
  for (const ev of CONTENT.events) {
    let cardCredit = false;
    let cardCharge = false;
    for (const op of ev.options) {
      options++;
      const branches: ["positive" | "negative", Outcome | undefined][] = [
        ["positive", op.positiveOutcome],
        ["negative", op.negativeOutcome],
      ];
      const chars = branches
        .filter((b): b is ["positive" | "negative", Outcome] => !!b[1])
        .map(([b, o]) => patch.get(key(ev.id, op.id, b)) ?? characterSum(o));
      const credit = chars.some((c) => c >= floor);
      const charge = chars.some((c) => c <= -floor);
      if (credit) canCredit++;
      if (charge) canCharge++;
      if (credit && charge) canBoth++;
      if (!credit && !charge) silent++;
      cardCredit ||= credit;
      cardCharge ||= charge;
    }
    if (cardCharge && !cardCredit) oneWayDown.push(ev.id);
    if (cardCredit && !cardCharge) oneWayUp.push(ev.id);
  }
  return {
    cards: CONTENT.events.length,
    options,
    canCredit,
    canCharge,
    canBoth,
    silent,
    oneWayDown,
    oneWayUp,
  };
}

// ---------------------------------------------------------------------------
// The measured half.
// ---------------------------------------------------------------------------

/**
 * Resolve which authored outcome fired, by prose, exactly as `cardAccount` in
 * view-model.ts does — including its refusal to account an ambiguous match.
 */
function resolveFired(
  eventId: string,
  optionId: string,
  description: string | undefined,
): { branch: "positive" | "negative" | null; character: number } {
  if (description === undefined) return { branch: null, character: 0 };
  const option = EVENTS_BY_ID.get(eventId)?.options.find((o) => o.id === optionId);
  if (!option) return { branch: null, character: 0 };
  const cands: ["positive" | "negative", Outcome][] = [];
  if (option.positiveOutcome?.description === description) cands.push(["positive", option.positiveOutcome]);
  if (option.negativeOutcome?.description === description) cands.push(["negative", option.negativeOutcome]);
  if (cands.length !== 1) return { branch: null, character: cands.length ? characterSum(cands[0]![1]) : 0 };
  return { branch: cands[0]![0], character: characterSum(cands[0]![1]) };
}

export interface CareerTrace {
  decisions: number;
  /** Locker-room credits the player actually read, at HEAD. */
  creditsBefore: number;
  /** Credits he would read with the proposal applied. */
  creditsAfter: number;
  costsBefore: number;
  costsAfter: number;
  /** Total modelled character added over the career. */
  charDelta: number;
  /** Times a proposal row's branch actually fired. */
  rowHits: Record<string, number>;
  status: GameState["status"];
  stockBefore: number;
  stockAfter: number;
  undraftedBefore: boolean;
  undraftedAfter: boolean;
  busted: boolean;
}

/**
 * Play one career and score it twice: as the engine produced it, and as it
 * would read with the proposal applied.
 *
 * `stockAfter` is `deriveDraftStock` — the engine's own function, not a
 * reimplementation — evaluated on the same final state with `character`
 * replaced by the modelled value (clamped 0..100 exactly as effects.ts clamps
 * it). Everything else about the career is the career that was actually
 * played.
 */
export function traceCareer(
  setup: Setup,
  seed: string,
  policy: Policy,
  proposal: readonly CreditRow[],
): CareerTrace {
  const rows = new Map(proposal.map((r) => [`${r.eventId}|${r.optionId}|${r.branch}`, r]));
  let s = createCareer(setup, seed, CONTENT);
  const policyRng = createRng(seed + ":policy");
  const t: CareerTrace = {
    decisions: 0,
    creditsBefore: 0,
    creditsAfter: 0,
    costsBefore: 0,
    costsAfter: 0,
    charDelta: 0,
    rowHits: Object.fromEntries(proposal.map((r) => [`${r.eventId}|${r.optionId}`, 0])),
    status: "active",
    stockBefore: 0,
    stockAfter: 0,
    undraftedBefore: false,
    undraftedAfter: false,
    busted: false,
  };
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, CONTENT);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    const eventId = decision.eventId;
    s = advance(s, choice, CONTENT);
    t.decisions++;
    const fired = resolveFired(eventId, choice, s.lastOutcome?.description);
    if (fired.branch === null) continue;
    const row = rows.get(`${eventId}|${choice}|${fired.branch}`);
    const after = row ? fired.character + (row.to - row.from) : fired.character;
    if (row) {
      t.charDelta += row.to - row.from;
      t.rowHits[`${eventId}|${choice}`] = (t.rowHits[`${eventId}|${choice}`] ?? 0) + 1;
    }
    const vBefore = lockerRoomVerdict(fired.character);
    const vAfter = lockerRoomVerdict(after);
    if (vBefore === "credit") t.creditsBefore++;
    if (vBefore === "cost") t.costsBefore++;
    if (vAfter === "credit") t.creditsAfter++;
    if (vAfter === "cost") t.costsAfter++;
  }
  t.status = s.status;
  t.busted = s.status === "busted";
  t.stockBefore = deriveDraftStock(s);
  const modelled: GameState = { ...s, character: Math.max(0, Math.min(100, s.character + t.charDelta)) };
  t.stockAfter = deriveDraftStock(modelled);
  t.undraftedBefore = t.stockBefore < UNDRAFTED_FLOOR;
  t.undraftedAfter = t.stockAfter < UNDRAFTED_FLOOR;
  return t;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Standard error of the mean. */
function se(xs: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (n - 1);
  return Math.sqrt(v / n);
}

/** Standard error of a proportion. */
function seP(p: number, n: number): number {
  return n > 0 ? Math.sqrt((p * (1 - p)) / n) : 0;
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))]!;
}

export interface ArmReport {
  profile: string;
  proposal: string;
  careers: number;
  decisionsMean: number;

  draftStockBefore: number;
  draftStockBeforeSe: number;
  draftStockAfter: number;
  draftStockAfterSe: number;
  /** Paired difference, which is the statistic that matters: same careers. */
  draftStockDelta: number;
  draftStockDeltaSe: number;

  undraftedRateBefore: number;
  undraftedRateBeforeSe: number;
  undraftedRateAfter: number;
  undraftedRateAfterSe: number;

  /** Unchanged by construction: the washout gate reads overall and snaps. */
  bustRate: number;
  bustRateSe: number;

  /** Share of careers reading at least one locker-room credit. */
  creditRateBefore: number;
  creditRateBeforeSe: number;
  creditRateAfter: number;
  creditRateAfterSe: number;

  creditP50Before: number;
  creditP50After: number;
  creditMeanBefore: number;
  creditMeanAfter: number;
  creditP90Before: number;
  creditP90After: number;

  costP50Before: number;
  costP50After: number;

  charDeltaMean: number;
  charDeltaSe: number;

  /** Per row: mean fires per career of the exact branch the edit lands on. */
  rowHitsPerCareer: Record<string, number>;
}

export function summarize(
  profile: string,
  proposalName: string,
  proposal: readonly CreditRow[],
  traces: CareerTrace[],
): ArmReport {
  const n = traces.length || 1;
  const before = traces.map((t) => t.stockBefore);
  const after = traces.map((t) => t.stockAfter);
  const paired = traces.map((t) => t.stockAfter - t.stockBefore);
  const cb = traces.map((t) => t.creditsBefore);
  const ca = traces.map((t) => t.creditsAfter);
  const udB = traces.filter((t) => t.undraftedBefore).length / n;
  const udA = traces.filter((t) => t.undraftedAfter).length / n;
  const bust = traces.filter((t) => t.busted).length / n;
  const crB = traces.filter((t) => t.creditsBefore > 0).length / n;
  const crA = traces.filter((t) => t.creditsAfter > 0).length / n;
  return {
    profile,
    proposal: proposalName,
    careers: traces.length,
    decisionsMean: mean(traces.map((t) => t.decisions)),
    draftStockBefore: mean(before),
    draftStockBeforeSe: se(before),
    draftStockAfter: mean(after),
    draftStockAfterSe: se(after),
    draftStockDelta: mean(paired),
    draftStockDeltaSe: se(paired),
    undraftedRateBefore: udB,
    undraftedRateBeforeSe: seP(udB, n),
    undraftedRateAfter: udA,
    undraftedRateAfterSe: seP(udA, n),
    bustRate: bust,
    bustRateSe: seP(bust, n),
    creditRateBefore: crB,
    creditRateBeforeSe: seP(crB, n),
    creditRateAfter: crA,
    creditRateAfterSe: seP(crA, n),
    creditP50Before: quantile(cb, 0.5),
    creditP50After: quantile(ca, 0.5),
    creditMeanBefore: mean(cb),
    creditMeanAfter: mean(ca),
    creditP90Before: quantile(cb, 0.9),
    creditP90After: quantile(ca, 0.9),
    costP50Before: quantile(traces.map((t) => t.costsBefore), 0.5),
    costP50After: quantile(traces.map((t) => t.costsAfter), 0.5),
    charDeltaMean: mean(traces.map((t) => t.charDelta)),
    charDeltaSe: se(traces.map((t) => t.charDelta)),
    rowHitsPerCareer: Object.fromEntries(
      proposal.map((r) => [
        `${r.eventId}|${r.optionId}`,
        mean(traces.map((t) => t.rowHits[`${r.eventId}|${r.optionId}`] ?? 0)),
      ]),
    ),
  };
}

export function traceCell(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position,
  proposal: readonly CreditRow[],
  homeState = "TX",
): CareerTrace[] {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const policy = makePolicy(PROFILES[profileName]);
  const out: CareerTrace[] = [];
  for (let i = 0; i < runs; i++) out.push(traceCareer(setup, `${seedPrefix}-${position}-${i}`, policy, proposal));
  return out;
}

function main(): void {
  const runs = Number(process.argv[2] ?? 100);
  const profileArg = process.argv[3] ?? "virtueLoyal,virtueAmbitious,good,baselineRandom";
  const positionArg = process.argv[4] ?? "all";
  const seedPrefix = process.argv[5] ?? "b59";
  const profiles = profileArg.split(",") as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : (positionArg.split(",") as Position[]);

  const arms: ArmReport[] = [];
  for (const name of Object.keys(PROPOSALS) as ProposalName[]) {
    const proposal = PROPOSALS[name];
    for (const p of profiles) {
      if (!(p in PROFILES)) {
        console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
        process.exitCode = 1;
        return;
      }
      const all: CareerTrace[] = [];
      for (const pos of positions) all.push(...traceCell(runs, seedPrefix, p, pos, proposal));
      arms.push(summarize(p, name, proposal, all));
    }
  }
  const census = {
    head_floor2: censusCorpus(2),
    head_floor1: censusCorpus(1),
    tier1_floor2: censusCorpus(2, TIER_1),
    tier1plus2_floor2: censusCorpus(2, [...TIER_1, ...TIER_2]),
    tier1plus2plusUnsure_floor2: censusCorpus(2, [...TIER_1, ...TIER_2, ...UNSURE]),
  };
  console.log(JSON.stringify({ arms, census }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("credit-proposal-probe.ts")) main();
