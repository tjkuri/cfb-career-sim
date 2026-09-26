// Brief 061 / DECISION 085: price Route 3, and measure RUNG CROSSINGS.
//
// Two jobs, one harness.
//
// ---------------------------------------------------------------------------
// WHY THIS PROBE IS *OBSERVED* AND REPORT 059's WAS *MODELLED*
// ---------------------------------------------------------------------------
// `credit-proposal-probe.ts` could not put the edit in the game: it replayed
// HEAD careers and added the proposed character delta on top of the outcome the
// engine actually produced. Its own §7 names the three things that cost:
//   1. no figure came from a build with the edit in it,
//   2. the `maxCharacter` gates on nine cards were not re-evaluated,
//   3. policy re-selection had to be checked separately, card by card.
//
// None of that is necessary. The engine takes its content as a CALL-TIME
// PARAMETER — `createCareer(setup, seed, content)`, `getDecision(s, content)`,
// `advance(s, choice, content)` — and so does `makePolicy(profile, content)`.
// No file under `src/engine/**` imports `src/content/**` at all. So an arm can
// be played against a PATCHED CONTENT OBJECT constructed in this file: the
// careers are real, the gates re-evaluate, and the policy re-selects on its own
// because it is reading the patched bundle. **`src/content/**` is not touched,
// on disk or otherwise — `patchContent` deep-copies the events it edits.**
//
// The price of that honesty: arms are NOT paired. Once a policy picks a
// different option, or a `maxCharacter` gate flips, the RNG stream diverges and
// the two careers stop being the same career. Seeds are identical, so the two
// samples share their starting conditions and their school pools, but
// `summarize` can only report an UNPAIRED two-sample interval, which is wider
// than 059's paired ones by construction and too wide to discriminate anything
// on this board. `pairedSweep` below recovers the precision by differencing on
// the SEED; see its header for why that is a variance reduction rather than a
// paired-career claim. Arms that change no behaviour come back bit-identical,
// and `route3-rung-probe.test.ts` asserts that for the HEAD arm and for Route 3
// on a maximum-virtue career.
//
// ---------------------------------------------------------------------------
// PART 2 — RUNG CROSSINGS
// ---------------------------------------------------------------------------
// DECISION 085: *"Credits firing and rungs moving are two different claims and
// 084 ran them together."* Every figure on this board is a count of credit
// LINES. `rung-probe.ts` (report 054) is the nearest thing to a crossing
// measurement and it reports `upsMean` / `downsMean` / `neverMovesRate` at
// HEAD — so the brief's "nobody has ever measured rung crossings" is not quite
// right, and the report says so. What has never been measured is the UPWARD
// distribution (p50, p90, share-zero), time-to-first-crossing per direction,
// or any of it under a content edit. That is what this adds.
//
// The band floors are re-derived here because `bands.ts` exports the PHRASES
// and `trustRungOf`, never the thresholds. `route3-rung-probe.test.ts` asserts
// this table reproduces `trustPhrase(n)` and `trustRungOf(trustPhrase(n))` for
// every n in 0..100, so a later band edit fails a test instead of silently
// invalidating this measurement.
//
// CLI:
//   npx tsx src/sim/route3-rung-probe.ts <runsPerPosition> <profile,...|all> <pos,...|all> [seedPrefix] [mode]
//
// `mode` is `all`, a comma-separated arm list, `paired:<arm,...>` for seed-paired
// deltas against HEAD, or `bounds:<arm>` for the candidate band-table sweep.

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
import type { ContentBundle } from "../content/schema";
import type { Effect, GameEvent, Outcome } from "../engine/types";
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";

/** `LOCKER_ROOM_MIN_CHARACTER`, view-model.ts:293. Asserted against source in the test. */
export const LOCKER_ROOM_MIN_CHARACTER = 2;

/** `UNDRAFTED_FLOOR`, draft.ts. Asserted against source in the test. */
export const UNDRAFTED_FLOOR = 50;

/** `STARTING_CHARACTER`, create-career.ts. Asserted against source in the test. */
export const STARTING_CHARACTER = 70;

/** The five opener card ids, best-first by season. */
export const OPENER_IDS = [
  "milestone-opener-first",
  "milestone-opener-no-excuse",
  "milestone-opener-your-team",
  "milestone-opener-counting",
  "milestone-opener-last",
] as const;

// ---------------------------------------------------------------------------
// The trust ladder, re-derived. See the header.
// ---------------------------------------------------------------------------

export interface BandFloor {
  min: number;
  phrase: string;
}

/** `TRUST_BANDS` from `src/ui/session/bands.ts`, best-first. Pinned in the test. */
export const TRUST_BAND_FLOORS: readonly BandFloor[] = [
  { min: 80, phrase: "they would run through a wall for you" },
  { min: 66, phrase: "the staff trusts you" },
  { min: 50, phrase: "just a guy in the building" },
  { min: 30, phrase: "a problem they are managing" },
  { min: 0, phrase: "the staff has stopped defending you" },
];

/** Rung index, 0 at the top. Smaller index is a HIGHER rung, as in `bands.ts`. */
export function rungOf(character: number): number {
  for (let i = 0; i < TRUST_BAND_FLOORS.length; i++) {
    if (character >= TRUST_BAND_FLOORS[i]!.min) return i;
  }
  return TRUST_BAND_FLOORS.length - 1;
}

export type Verdict = "cost" | "credit" | null;

/** `lockerRoomVerdict(character)` from view-model.ts:306, verbatim. */
export function lockerRoomVerdict(character: number): Verdict {
  if (Math.abs(character) < LOCKER_ROOM_MIN_CHARACTER) return null;
  if (character < 0) return "cost";
  if (character > 0) return "credit";
  return null;
}

// ---------------------------------------------------------------------------
// The arms. THIS TABLE IS HALF THE DELIVERABLE.
// ---------------------------------------------------------------------------

export interface EditRow {
  /** Event id at HEAD. */
  eventId: string;
  /** Option id at HEAD. */
  optionId: string;
  /** Which of the option's two outcomes the edit lands on. */
  branch: "positive" | "negative";
  /** Authored `character` SUM of that outcome at HEAD. Asserted in the test. */
  from: number;
  /** Proposed `character` sum. 0 means the character effect is DELETED. */
  to: number;
  /** File under `src/content/events/`. */
  file: string;
  why: string;
}

/**
 * Tier 1 — report 059 §4, six rows, six cards. Carried through this harness
 * unchanged so all arms sit in one table.
 */
export const TIER_1: EditRow[] = [
  { eventId: "wideopen-two-deep", optionId: "bring-the-walkon-along", branch: "positive", from: 1, to: 2, file: "school-life.ts", why: "Report 059 Tier 1 #1." },
  { eventId: "offseason-captain-vote", optionId: "let-the-work-speak", branch: "positive", from: 0, to: 2, file: "season-life.ts", why: "Report 059 Tier 1 #2." },
  { eventId: "the-holding-call", optionId: "own-it", branch: "positive", from: 1, to: 2, file: "ol.ts", why: "Report 059 Tier 1 #3." },
  { eventId: "trash-talk", optionId: "stay-quiet", branch: "positive", from: 1, to: 2, file: "dl.ts", why: "Report 059 Tier 1 #4." },
  { eventId: "the-roughing-call", optionId: "dial-it-back", branch: "positive", from: 1, to: 2, file: "dl.ts", why: "Report 059 Tier 1 #5." },
  { eventId: "asked-to-block", optionId: "buy-in", branch: "positive", from: 1, to: 2, file: "oskill.ts", why: "Report 059 Tier 1 #6." },
];

/**
 * Tier 2 — the five openers' `stay-within` success, +1 -> +2. Report 059 §4.
 * The only block 059 measured as moving the median career.
 */
export const TIER_2: EditRow[] = OPENER_IDS.map((eventId) => ({
  eventId,
  optionId: "stay-within",
  branch: "positive" as const,
  from: 1,
  to: 2,
  file: "milestones.ts",
  why: "Credit the branch the player chose deliberately, at the display floor.",
}));

/**
 * Route 3 — named by report 059 §5.5 and never priced: instead of crediting
 * `stay-within`, DELETE the `-2` from `handle-it`'s FAILURE outcome.
 *
 * `to: 0` is a deletion, not a zero-amount effect: `patchContent` strips the
 * character effect from the outcome's effects array entirely, which leaves
 * `handle-it`'s failure carrying nothing at all — exactly what the prose
 * already says (*"It takes a half to stop feeling like a guest."*).
 *
 * Wave 26's author considered this, called it R3, and rejected it in a comment
 * block in `milestones.ts` on the grounds that it *"costs the openers the only
 * thing they say."* At that time the opener was ONE button carrying `+0 / -2`.
 * DECISION 074 made it two options and gave `stay-within` a `+1`, so the PM's
 * reading is that the rejection may no longer transfer. That is the question
 * §3 of the report answers with a number.
 */
export const ROUTE_3: EditRow[] = OPENER_IDS.map((eventId) => ({
  eventId,
  optionId: "handle-it",
  branch: "negative" as const,
  from: -2,
  to: 0,
  file: "milestones.ts",
  why: "Delete the -2. Makes the opener silent on the branch the player did not choose.",
}));

export const ARMS = {
  head: [] as readonly EditRow[],
  tier1: TIER_1 as readonly EditRow[],
  tier2: TIER_2 as readonly EditRow[],
  route3: ROUTE_3 as readonly EditRow[],
  tier2plusRoute3: [...TIER_2, ...ROUTE_3] as readonly EditRow[],
} as const;

export type ArmName = keyof typeof ARMS;

// ---------------------------------------------------------------------------
// Patching content WITHOUT editing content.
// ---------------------------------------------------------------------------

export function characterSum(outcome: Outcome): number {
  return outcome.effects.reduce((a, e: Effect) => a + (e.kind === "character" ? e.amount : 0), 0);
}

function patchOutcome(outcome: Outcome, to: number): Outcome {
  const kept: Effect[] = outcome.effects.filter((e) => e.kind !== "character");
  if (to === 0) return { ...outcome, effects: kept };
  // Preserve authored position where a character effect already exists, so the
  // application order of a patched outcome matches the order the author wrote.
  const at = outcome.effects.findIndex((e) => e.kind === "character");
  const ch: Effect = { kind: "character", amount: to };
  if (at < 0) return { ...outcome, effects: [...kept, ch] };
  const out = [...kept];
  out.splice(Math.min(at, out.length), 0, ch);
  return { ...outcome, effects: out };
}

/**
 * A content bundle with the arm's edits applied. Deep-copies only the events,
 * options and outcomes it touches; everything else is shared by reference, so
 * an unedited arm is `CONTENT` with an `events` array of the same members.
 */
export function patchContent(rows: readonly EditRow[], base: ContentBundle = CONTENT): ContentBundle {
  if (rows.length === 0) return base;
  const byEvent = new Map<string, EditRow[]>();
  for (const r of rows) {
    const list = byEvent.get(r.eventId) ?? [];
    list.push(r);
    byEvent.set(r.eventId, list);
  }
  const events: GameEvent[] = base.events.map((ev) => {
    const rs = byEvent.get(ev.id);
    if (!rs) return ev;
    return {
      ...ev,
      options: ev.options.map((op) => {
        const mine = rs.filter((r) => r.optionId === op.id);
        if (mine.length === 0) return op;
        let next = { ...op };
        for (const r of mine) {
          if (r.branch === "positive") {
            next = { ...next, positiveOutcome: patchOutcome(next.positiveOutcome, r.to) };
          } else if (next.negativeOutcome) {
            next = { ...next, negativeOutcome: patchOutcome(next.negativeOutcome, r.to) };
          }
        }
        return next;
      }),
    };
  });
  return { ...base, events };
}

/** Every row's `from` against the bundle it claims to describe. Used by the test. */
export function verifyRows(rows: readonly EditRow[], base: ContentBundle = CONTENT): string[] {
  const problems: string[] = [];
  for (const r of rows) {
    const ev = base.events.find((e) => e.id === r.eventId);
    if (!ev) { problems.push(`${r.eventId}: no such event`); continue; }
    const op = ev.options.find((o) => o.id === r.optionId);
    if (!op) { problems.push(`${r.eventId}/${r.optionId}: no such option`); continue; }
    const outcome = r.branch === "positive" ? op.positiveOutcome : op.negativeOutcome;
    if (!outcome) { problems.push(`${r.eventId}/${r.optionId}: no ${r.branch} outcome`); continue; }
    const got = characterSum(outcome);
    if (got !== r.from) problems.push(`${r.eventId}/${r.optionId}/${r.branch}: from=${r.from} but corpus says ${got}`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// One career, fully traced.
// ---------------------------------------------------------------------------

/**
 * Resolve which authored outcome fired, by prose, exactly as `cardAccount` in
 * view-model.ts does — including its refusal to account an ambiguous match.
 * Resolved against the bundle the career was PLAYED with, not against HEAD.
 */
function resolveFired(
  byId: Map<string, GameEvent>,
  eventId: string,
  optionId: string,
  description: string | undefined,
): { branch: "positive" | "negative" | null; character: number } {
  if (description === undefined) return { branch: null, character: 0 };
  const option = byId.get(eventId)?.options.find((o) => o.id === optionId);
  if (!option) return { branch: null, character: 0 };
  const cands: ["positive" | "negative", Outcome][] = [];
  if (option.positiveOutcome?.description === description) cands.push(["positive", option.positiveOutcome]);
  if (option.negativeOutcome?.description === description) cands.push(["negative", option.negativeOutcome]);
  if (cands.length !== 1) return { branch: null, character: cands.length ? characterSum(cands[0]![1]) : 0 };
  return { branch: cands[0]![0], character: characterSum(cands[0]![1]) };
}

export interface CareerTrace {
  decisions: number;

  // --- the ladder ---------------------------------------------------------
  startRung: number;
  endRung: number;
  /** Rung crossings, counted on the per-decision `character` trajectory. */
  ups: number;
  downs: number;
  /** 1-based decision index of the first crossing in each direction, or null. */
  firstUpAt: number | null;
  firstDownAt: number | null;
  /** Best (smallest) and worst (largest) rung index ever occupied. */
  bestRung: number;
  worstRung: number;

  // --- the ledger the player reads ---------------------------------------
  /** Readable locker-room credit lines (|character| >= floor). */
  credits: number;
  charges: number;
  /** Readable lines sourced from the five opener cards, by branch taken. */
  openerCredits: number;
  openerCharges: number;
  openerLinesByOption: Record<string, number>;
  /** Times each opener option was TAKEN, readable or not. */
  openerTakes: Record<string, number>;

  // --- raw character ------------------------------------------------------
  /** Sum of positive authored `character` on fired outcomes. */
  charEarned: number;
  /** Sum of negative authored `character` on fired outcomes (a negative number). */
  charLost: number;
  finalCharacter: number;

  // --- the career ---------------------------------------------------------
  status: GameState["status"];
  busted: boolean;
  draftStock: number;
  undrafted: boolean;
}

export function traceCareer(
  setup: Setup,
  seed: string,
  policy: Policy,
  content: ContentBundle,
): CareerTrace {
  const byId = new Map<string, GameEvent>(content.events.map((e) => [e.id, e]));
  let s = createCareer(setup, seed, content);
  const policyRng = createRng(seed + ":policy");
  const openerSet = new Set<string>(OPENER_IDS);

  let prevRung = rungOf(s.character);
  const t: CareerTrace = {
    decisions: 0,
    startRung: prevRung,
    endRung: prevRung,
    ups: 0,
    downs: 0,
    firstUpAt: null,
    firstDownAt: null,
    bestRung: prevRung,
    worstRung: prevRung,
    credits: 0,
    charges: 0,
    openerCredits: 0,
    openerCharges: 0,
    openerLinesByOption: { "handle-it": 0, "stay-within": 0 },
    openerTakes: { "handle-it": 0, "stay-within": 0 },
    charEarned: 0,
    charLost: 0,
    finalCharacter: s.character,
    status: "active",
    busted: false,
    draftStock: 0,
    undrafted: false,
  };

  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, content);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    const eventId = decision.eventId;
    s = advance(s, choice, content);
    t.decisions++;

    // The ladder, scored on the value the player's phrase is derived from.
    const here = rungOf(s.character);
    if (here !== prevRung) {
      // Best-first, so a SMALLER index is a HIGHER rung.
      if (here < prevRung) {
        t.ups++;
        if (t.firstUpAt === null) t.firstUpAt = t.decisions;
      } else {
        t.downs++;
        if (t.firstDownAt === null) t.firstDownAt = t.decisions;
      }
      prevRung = here;
    }
    if (here < t.bestRung) t.bestRung = here;
    if (here > t.worstRung) t.worstRung = here;

    const fired = resolveFired(byId, eventId, choice, s.lastOutcome?.description);
    if (fired.branch === null) continue;
    if (fired.character > 0) t.charEarned += fired.character;
    if (fired.character < 0) t.charLost += fired.character;
    const v = lockerRoomVerdict(fired.character);
    if (v === "credit") t.credits++;
    if (v === "cost") t.charges++;
    if (openerSet.has(eventId)) {
      t.openerTakes[choice] = (t.openerTakes[choice] ?? 0) + 1;
      if (v !== null) {
        t.openerLinesByOption[choice] = (t.openerLinesByOption[choice] ?? 0) + 1;
        if (v === "credit") t.openerCredits++;
        else t.openerCharges++;
      }
    }
  }

  t.endRung = prevRung;
  t.finalCharacter = s.character;
  t.status = s.status;
  t.busted = s.status === "busted";
  t.draftStock = deriveDraftStock(s);
  t.undrafted = t.draftStock < UNDRAFTED_FLOOR;
  return t;
}

// ---------------------------------------------------------------------------
// Statistics.
// ---------------------------------------------------------------------------

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Standard error of the mean. */
export function se(xs: number[]): number {
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

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)]!;
}

function occupancy(xs: number[]): number[] {
  const occ = new Array(TRUST_BAND_FLOORS.length).fill(0);
  for (const x of xs) occ[x]++;
  return occ.map((c: number) => (xs.length ? c / xs.length : 0));
}

export interface ArmSummary {
  arm: string;
  profile: string;
  careers: number;
  decisionsMean: number;

  // Part 1 / the four-arm table
  draftStock: number;
  draftStockSe: number;
  undraftedRate: number;
  undraftedRateSe: number;
  bustRate: number;
  bustRateSe: number;
  creditsMean: number;
  creditsSe: number;
  creditsP50: number;
  creditRate: number;
  chargesMean: number;
  chargesSe: number;
  chargesP50: number;

  // Part 2 / the ladder
  upsMean: number;
  upsSe: number;
  upsP50: number;
  upsP90: number;
  zeroUpShare: number;
  zeroUpShareSe: number;
  downsMean: number;
  downsSe: number;
  downsP50: number;
  downsP90: number;
  zeroDownShare: number;
  zeroDownShareSe: number;
  startOccupancy: number[];
  endOccupancy: number[];
  everTopRate: number;
  firstUpAtMedian: number | null;
  firstDownAtMedian: number | null;
  /** Of careers that cross at all, share whose FIRST crossing was down. */
  firstMoveDownRate: number;

  // character accounting
  charEarnedMean: number;
  charEarnedP50: number;
  charLostMean: number;
  charLostP50: number;
  finalCharacterMean: number;
  finalCharacterP50: number;

  // the openers
  openerAnyLineRate: number;
  openerAnyLineRateSe: number;
  openerCreditsMean: number;
  openerChargesMean: number;
  openerTakes: Record<string, number>;
  openerLinesByOption: Record<string, number>;
}

export function summarize(arm: string, profile: string, traces: CareerTrace[]): ArmSummary {
  const n = traces.length || 1;
  const ups = traces.map((t) => t.ups);
  const downs = traces.map((t) => t.downs);
  const credits = traces.map((t) => t.credits);
  const charges = traces.map((t) => t.charges);
  const stock = traces.map((t) => t.draftStock);
  const zu = traces.filter((t) => t.ups === 0).length / n;
  const zd = traces.filter((t) => t.downs === 0).length / n;
  const ud = traces.filter((t) => t.undrafted).length / n;
  const bust = traces.filter((t) => t.busted).length / n;
  const cr = traces.filter((t) => t.credits > 0).length / n;
  const anyOpener = traces.filter((t) => t.openerCredits + t.openerCharges > 0).length / n;
  const moved = traces.filter((t) => t.firstUpAt !== null || t.firstDownAt !== null);
  const firstDown = moved.filter((t) => {
    const u = t.firstUpAt ?? Infinity;
    const d = t.firstDownAt ?? Infinity;
    return d < u;
  }).length;
  const takeKeys = ["handle-it", "stay-within"];
  return {
    arm,
    profile,
    careers: traces.length,
    decisionsMean: mean(traces.map((t) => t.decisions)),

    draftStock: mean(stock),
    draftStockSe: se(stock),
    undraftedRate: ud,
    undraftedRateSe: seP(ud, n),
    bustRate: bust,
    bustRateSe: seP(bust, n),
    creditsMean: mean(credits),
    creditsSe: se(credits),
    creditsP50: quantile(credits, 0.5),
    creditRate: cr,
    chargesMean: mean(charges),
    chargesSe: se(charges),
    chargesP50: quantile(charges, 0.5),

    upsMean: mean(ups),
    upsSe: se(ups),
    upsP50: quantile(ups, 0.5),
    upsP90: quantile(ups, 0.9),
    zeroUpShare: zu,
    zeroUpShareSe: seP(zu, n),
    downsMean: mean(downs),
    downsSe: se(downs),
    downsP50: quantile(downs, 0.5),
    downsP90: quantile(downs, 0.9),
    zeroDownShare: zd,
    zeroDownShareSe: seP(zd, n),
    startOccupancy: occupancy(traces.map((t) => t.startRung)),
    endOccupancy: occupancy(traces.map((t) => t.endRung)),
    everTopRate: traces.filter((t) => t.bestRung === 0).length / n,
    firstUpAtMedian: median(traces.filter((t) => t.firstUpAt !== null).map((t) => t.firstUpAt!)),
    firstDownAtMedian: median(traces.filter((t) => t.firstDownAt !== null).map((t) => t.firstDownAt!)),
    firstMoveDownRate: moved.length ? firstDown / moved.length : 0,

    charEarnedMean: mean(traces.map((t) => t.charEarned)),
    charEarnedP50: quantile(traces.map((t) => t.charEarned), 0.5),
    charLostMean: mean(traces.map((t) => t.charLost)),
    charLostP50: quantile(traces.map((t) => t.charLost), 0.5),
    finalCharacterMean: mean(traces.map((t) => t.finalCharacter)),
    finalCharacterP50: quantile(traces.map((t) => t.finalCharacter), 0.5),

    openerAnyLineRate: anyOpener,
    openerAnyLineRateSe: seP(anyOpener, n),
    openerCreditsMean: mean(traces.map((t) => t.openerCredits)),
    openerChargesMean: mean(traces.map((t) => t.openerCharges)),
    openerTakes: Object.fromEntries(takeKeys.map((k) => [k, mean(traces.map((t) => t.openerTakes[k] ?? 0))])),
    openerLinesByOption: Object.fromEntries(
      takeKeys.map((k) => [k, mean(traces.map((t) => t.openerLinesByOption[k] ?? 0))]),
    ),
  };
}

/** Unpaired two-sample standard error of a difference of means. */
export function diffSe(aSe: number, bSe: number): number {
  return Math.sqrt(aSe * aSe + bSe * bSe);
}

// ---------------------------------------------------------------------------
// Seed-paired deltas, and why they are needed.
// ---------------------------------------------------------------------------
// The price of an OBSERVED arm is that it is not a paired sample: the moment a
// policy picks differently, or a `maxCharacter` gate flips, the RNG stream
// diverges and the two careers stop being the same career. An unpaired
// two-sample interval on draft stock is ±0.6 points, which is wider than every
// effect on this board, so it would report "no difference" for everything and
// discriminate nothing — the exact failure DECISION 085 called out in the 059
// brief's acceptance criterion.
//
// The fix is to pair on the SEED rather than on the career. The same seed gives
// both arms the same position, the same home state and the same school pool,
// and the trajectories agree until the first decision the edit actually
// touches. The difference estimator stays unbiased and its variance drops by
// however much of the between-seed variance is shared, which is most of it.
// **This is a variance reduction, not a paired-career claim** — where an arm
// changes no behaviour the pairing is exact and the delta is identically 0,
// which is the identity `route3-rung-probe.test.ts` asserts for
// `virtueLoyal` under Route 3.

export interface PairedDelta {
  arm: string;
  profile: string;
  careers: number;
  /** Seeds whose career diverged from HEAD at all. */
  divergedShare: number;
  draftStockDelta: number;
  draftStockDeltaSe: number;
  upsDelta: number;
  upsDeltaSe: number;
  downsDelta: number;
  downsDeltaSe: number;
  creditsDelta: number;
  creditsDeltaSe: number;
  chargesDelta: number;
  chargesDeltaSe: number;
  /** Careers going from zero upward crossings to at least one, and the reverse. */
  zeroUpToSomeShare: number;
  someUpToZeroShare: number;
}

export function pairedSweep(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  positions: readonly Position[],
  armName: ArmName,
  homeState = "TX",
): PairedDelta {
  const headContent = patchContent(ARMS.head);
  const armContent = patchContent(ARMS[armName]);
  const h: CareerTrace[] = [];
  const a: CareerTrace[] = [];
  for (const pos of positions) {
    h.push(...traceCell(runs, seedPrefix, profileName, pos, headContent, homeState));
    a.push(...traceCell(runs, seedPrefix, profileName, pos, armContent, homeState));
  }
  const n = h.length;
  const d = (f: (t: CareerTrace) => number): number[] => a.map((t, i) => f(t) - f(h[i]!));
  const stock = d((t) => t.draftStock);
  const ups = d((t) => t.ups);
  const downs = d((t) => t.downs);
  const credits = d((t) => t.credits);
  const charges = d((t) => t.charges);
  let diverged = 0;
  let zeroToSome = 0;
  let someToZero = 0;
  for (let i = 0; i < n; i++) {
    if (JSON.stringify(a[i]) !== JSON.stringify(h[i])) diverged++;
    if (h[i]!.ups === 0 && a[i]!.ups > 0) zeroToSome++;
    if (h[i]!.ups > 0 && a[i]!.ups === 0) someToZero++;
  }
  return {
    arm: armName,
    profile: profileName,
    careers: n,
    divergedShare: n ? diverged / n : 0,
    draftStockDelta: mean(stock),
    draftStockDeltaSe: se(stock),
    upsDelta: mean(ups),
    upsDeltaSe: se(ups),
    downsDelta: mean(downs),
    downsDeltaSe: se(downs),
    creditsDelta: mean(credits),
    creditsDeltaSe: se(credits),
    chargesDelta: mean(charges),
    chargesDeltaSe: se(charges),
    zeroUpToSomeShare: n ? zeroToSome / n : 0,
    someUpToZeroShare: n ? someToZero / n : 0,
  };
}

// ---------------------------------------------------------------------------
// The boundary sweep — because the brief's fallback names the wrong change.
// ---------------------------------------------------------------------------
// Brief 061 says that if no content arm moves the median virtuous career's
// upward crossings, "the fault is in the rung boundaries after all — which
// would make DECISION 081's shelved `80/67` change live again."
//
// `80/67` moves the SECOND floor, 66 -> 67. From a start of 70 that takes the
// fall threshold from -5 to -4; it adds DOWNWARD movement and cannot add an
// upward crossing to any career, because the top floor does not move. DECISION
// 081 is explicit that `80/67` exists to restore ACTIVITY via the early-fall
// rate. It is not a remedy for a zero-upward-crossing complaint.
//
// The boundary that could be is the TOP floor. The median virtuous career
// finishes 4 points short of 80 (table E), so this sweep scores ONE set of
// careers against several candidate top floors, which is the instrument
// `rung-probe.ts` was built for and the reason its band table is a parameter.
// Both floors are swept so DECISION 081's own change is priced on the same
// careers rather than quoted.

/** A `character` value per decision, first element being the starting value. */
export function traceLadder(
  setup: Setup,
  seed: string,
  policy: Policy,
  content: ContentBundle,
): number[] {
  let s = createCareer(setup, seed, content);
  const policyRng = createRng(seed + ":policy");
  const trail: number[] = [s.character];
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, content);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    s = advance(s, choice, content);
    trail.push(s.character);
  }
  return trail;
}

export interface BoundaryScore {
  topFloor: number;
  secondFloor: number;
  zeroUpShare: number;
  everTopRate: number;
  upsMean: number;
  downsMean: number;
  /** Share of careers whose FIRST crossing is downward, of those that move. */
  firstMoveDownRate: number;
  neverMovesRate: number;
}

export function scoreBoundaries(
  trails: number[][],
  topFloor: number,
  secondFloor: number,
): BoundaryScore {
  const floors = [topFloor, secondFloor, 50, 30, 0];
  const rung = (c: number): number => {
    for (let i = 0; i < floors.length; i++) if (c >= floors[i]!) return i;
    return floors.length - 1;
  };
  const n = trails.length || 1;
  let zeroUp = 0;
  let everTop = 0;
  let ups = 0;
  let downs = 0;
  let moved = 0;
  let firstDown = 0;
  for (const trail of trails) {
    let prev = rung(trail[0]!);
    let top = prev === 0;
    let u = 0;
    let d = 0;
    let first: "up" | "down" | null = null;
    for (let i = 1; i < trail.length; i++) {
      const here = rung(trail[i]!);
      if (here === 0) top = true;
      if (here !== prev) {
        const dir = here < prev ? "up" : "down";
        if (dir === "up") u++;
        else d++;
        if (first === null) first = dir;
        prev = here;
      }
    }
    if (u === 0) zeroUp++;
    if (top) everTop++;
    ups += u;
    downs += d;
    if (first !== null) {
      moved++;
      if (first === "down") firstDown++;
    }
  }
  return {
    topFloor,
    secondFloor,
    zeroUpShare: zeroUp / n,
    everTopRate: everTop / n,
    upsMean: ups / n,
    downsMean: downs / n,
    firstMoveDownRate: moved ? firstDown / moved : 0,
    neverMovesRate: (n - moved) / n,
  };
}

export function boundarySweep(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  positions: readonly Position[],
  armName: ArmName,
  candidates: readonly [number, number][],
  homeState = "TX",
): { profile: string; arm: string; careers: number; scores: BoundaryScore[] } {
  const content = patchContent(ARMS[armName]);
  const policy = makePolicy(PROFILES[profileName], content);
  const trails: number[][] = [];
  for (const position of positions) {
    const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
    for (let i = 0; i < runs; i++) {
      trails.push(traceLadder(setup, `${seedPrefix}-${position}-${i}`, policy, content));
    }
  }
  return {
    profile: profileName,
    arm: armName,
    careers: trails.length,
    scores: candidates.map(([t, s]) => scoreBoundaries(trails, t, s)),
  };
}

export function traceCell(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position,
  content: ContentBundle,
  homeState = "TX",
): CareerTrace[] {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  // The policy reads the PATCHED bundle, so re-selection happens on its own.
  const policy = makePolicy(PROFILES[profileName], content);
  const out: CareerTrace[] = [];
  for (let i = 0; i < runs; i++) {
    out.push(traceCareer(setup, `${seedPrefix}-${position}-${i}`, policy, content));
  }
  return out;
}

/**
 * What the `best` and `virtue` scorers pick on each opener, per arm. This is
 * report 059's limitation 3 answered by construction rather than by a side
 * calculation: the numbers below come out of the same patched bundle the
 * careers are played against.
 */
export function openerPicks(content: ContentBundle, position: Position = "QB"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of OPENER_IDS) {
    const ev = content.events.find((e) => e.id === id);
    if (!ev) continue;
    for (const events of ["best", "virtue"] as const) {
      const policy = makePolicy({ events, recruiting: "first", transfer: "stay", redshirt: "take" }, content);
      const fake = { currentEventId: id, setup: { position } } as unknown as GameState;
      out[`${id}|${events}`] = policy(fake, ev.options.map((o) => ({ id: o.id, label: o.label })), createRng("x"));
    }
  }
  return out;
}

function main(): void {
  const runs = Number(process.argv[2] ?? 100);
  const profileArg = process.argv[3] ?? "virtueLoyal,virtueAmbitious,good,baselineRandom";
  const positionArg = process.argv[4] ?? "all";
  const seedPrefix = process.argv[5] ?? "b61";
  const armArg = process.argv[6] ?? "all";
  const profiles = (profileArg === "all"
    ? ["virtueLoyal", "virtueAmbitious", "good", "baselineRandom"]
    : profileArg.split(",")) as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : (positionArg.split(",") as Position[]);
  // `bounds:<arm>` sweeps candidate band tables over ONE set of careers.
  if (armArg.startsWith("bounds:")) {
    const arm = armArg.slice("bounds:".length) as ArmName;
    if (!(arm in ARMS)) {
      console.error(`Unknown arm "${arm}". Known: ${Object.keys(ARMS).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const candidates: [number, number][] = [
      [80, 66], // HEAD, DECISION 081 as shipped
      [80, 67], // DECISION 081's shelved alternative
      [79, 66],
      [78, 66],
      [77, 66],
      [76, 66],
      [78, 67],
    ];
    const out = profiles.map((p) => boundarySweep(runs, seedPrefix, p, positions, arm, candidates));
    console.log(JSON.stringify({ bounds: out }, null, 2));
    return;
  }

  // `paired:<arm>,<arm>` runs the seed-paired delta sweep against HEAD instead
  // of the per-arm summary sweep.
  if (armArg.startsWith("paired:")) {
    const names = armArg.slice("paired:".length).split(",") as ArmName[];
    const deltas: PairedDelta[] = [];
    for (const arm of names) {
      if (!(arm in ARMS)) {
        console.error(`Unknown arm "${arm}". Known: ${Object.keys(ARMS).join(", ")}`);
        process.exitCode = 1;
        return;
      }
      for (const p of profiles) deltas.push(pairedSweep(runs, seedPrefix, p, positions, arm));
    }
    console.log(JSON.stringify({ paired: deltas }, null, 2));
    return;
  }

  const armNames = (armArg === "all" ? Object.keys(ARMS) : armArg.split(",")) as ArmName[];
  const rowProblems: Record<string, string[]> = {};
  const picks: Record<string, Record<string, string>> = {};
  const out: ArmSummary[] = [];
  for (const arm of armNames) {
    if (!(arm in ARMS)) {
      console.error(`Unknown arm "${arm}". Known: ${Object.keys(ARMS).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const rows = ARMS[arm];
    rowProblems[arm] = verifyRows(rows);
    const content = patchContent(rows);
    picks[arm] = openerPicks(content);
    for (const p of profiles) {
      if (!(p in PROFILES)) {
        console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
        process.exitCode = 1;
        return;
      }
      const all: CareerTrace[] = [];
      for (const pos of positions) all.push(...traceCell(runs, seedPrefix, p, pos, content));
      out.push(summarize(arm, p, all));
    }
  }
  console.log(JSON.stringify({ arms: out, rowProblems, openerPicks: picks }, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("route3-rung-probe.ts")) main();
