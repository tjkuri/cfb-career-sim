// Brief 024, step 1: the repetition harness, committed this time.
//
// `reports/008-measure-repetition.md` produced this phase's key numbers — first
// verbatim repeat at decision 13, 45% of decisions re-showing a card already
// seen — from a throwaway script that never entered the repo. This is that
// script, rebuilt as a reproducible probe so the content pilot can be graded on
// a before/after rather than on a memory of a number.
//
// It edits nothing. Everything here reads the engine and the content bundle.
//
// ---------------------------------------------------------------------------
// Why the repeat key is the rendered card, not the event id
// ---------------------------------------------------------------------------
//
// 008 attributed by event id, which was correct for the content of the day: one
// `milestone-opener`, so "the same card twice" and "the same id twice" were the
// same statement. The pilot breaks that equivalence on purpose — five opener
// variants carry five distinct ids and render five distinct cards. An id-keyed
// harness would therefore report the problem solved the moment the ids were
// written, whether or not a single word had changed.
//
// So the key here is the pair `(title, description)` of the decision the player
// is actually looking at. On unmodified content the two keys must agree, and
// `repetition-probe.test.ts` asserts that agreement directly (plus the property
// it rests on: no two events in the bundle render the same card). Read that
// test before trusting any number this file produces.
//
// CLI:
//   npx tsx src/sim/repetition-probe.ts <careersPerPosition> <B|C|all> <card|id>

import { createCareer, advance, getDecision, ALL_POSITIONS, type Position, type Setup } from "../engine/index";
import { createRng } from "../engine/rng";
import type { ClassYear, Phase } from "../engine/types";
import type { ContentBundle } from "../content/schema";
import { CONTENT } from "../content/index";
import { makePolicy, type PolicyProfile } from "./policies";
import { percentile } from "./balance";

// One decision as the player met it: the card's rendered text, plus the career
// coordinates 008's method names (seasonIndex, phase, classYear).
export interface DecisionRecord {
  index: number; // 1-based position in the career
  eventId: string;
  title: string;
  description: string;
  seasonIndex: number;
  phase: Phase;
  classYear: ClassYear;
}

export type RepeatKey = "card" | "id";

// U+001F (unit separator) cannot appear in authored prose, so no title/body
// re-split can collide with a different pair.
const SEP = "";

export function cardKeyOf(d: DecisionRecord): string {
  return `${d.title}${SEP}${d.description}`;
}

export function idKeyOf(d: DecisionRecord): string {
  return d.eventId;
}

export function keyFn(key: RepeatKey): (d: DecisionRecord) => string {
  return key === "card" ? cardKeyOf : idKeyOf;
}

// The first decision whose card (or id) was already shown earlier in the same
// career. Returns the REPEATING decision, not the original sighting, so its
// `index` is the decision number at which the player is first shown something
// they have read before, and its `eventId` attributes the repeat.
export function firstRepeat(
  decisions: DecisionRecord[],
  key: (d: DecisionRecord) => string,
): DecisionRecord | null {
  const seen = new Set<string>();
  for (const d of decisions) {
    const k = key(d);
    if (seen.has(k)) return d;
    seen.add(k);
  }
  return null;
}

// Share of a career's decisions that re-show something already seen. First
// sightings are not re-showings, so a career of N distinct cards scores 0 and a
// career that shows one card N times scores (N-1)/N.
export function repeatShare(
  decisions: DecisionRecord[],
  key: (d: DecisionRecord) => string,
): number {
  if (decisions.length === 0) return 0;
  const seen = new Set<string>();
  let repeats = 0;
  for (const d of decisions) {
    const k = key(d);
    if (seen.has(k)) repeats++;
    seen.add(k);
  }
  return repeats / decisions.length;
}

// 008's cohorts B and C. Both fix the three hub answers to a single strategy
// and leave content choices to the random policy, exactly as 008 did; the
// caveat there applies here unchanged (a real player's choices correlate with
// state, which moves WHICH random events gate in but not the fixed skeleton
// where every headline number lives).
export const REPETITION_COHORTS = {
  // B — the maximum-exposure case and the shape a playtester plays: declines
  // the redshirt, stays put. Four seasons.
  B: { events: "random", recruiting: "random", transfer: "stay", redshirt: "decline" },
  // C — the five-season redshirt career. This is the cohort class-year gating
  // would have failed (advance.ts caps classYear at SR, so C is FR SO JR SR SR)
  // and is why DECISION 042 chose seasonIndex. It is not optional.
  C: { events: "random", recruiting: "random", transfer: "stay", redshirt: "take" },
} satisfies Record<string, PolicyProfile>;

export type CohortName = keyof typeof REPETITION_COHORTS;

// Drives the engine's own loop — createCareer -> getDecision -> advance, the
// reference loop in play-headless.ts — recording the decision BEFORE each
// advance(), which is the only point at which the card the player is reading
// exists.
export function traceCareer(
  setup: Setup,
  seed: string,
  profile: PolicyProfile,
  content: ContentBundle = CONTENT,
): DecisionRecord[] {
  const policy = makePolicy(profile, content);
  const policyRng = createRng(seed + ":policy");
  let s = createCareer(setup, seed, content);
  const out: DecisionRecord[] = [];
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, content);
    if (!decision) break;
    out.push({
      index: out.length + 1,
      eventId: decision.eventId,
      title: decision.title,
      description: decision.description,
      seasonIndex: s.seasonIndex,
      phase: s.phase,
      classYear: s.eligibility.classYear,
    });
    s = advance(s, policy(s, decision.options, policyRng), content);
  }
  return out;
}

export interface RepetitionReport {
  cohort: string;
  key: RepeatKey;
  careers: number;
  careersByPosition: Record<Position, number>;
  decisionsMedian: number;
  decisionsP10: number;
  decisionsP90: number;
  // Over careers that repeat at all — 008 reports it the same way.
  careersWithAnyRepeat: number;
  firstRepeatMedian: number;
  firstRepeatP10: number;
  firstRepeatP90: number;
  firstRepeatMin: number;
  firstRepeatMax: number;
  repeatByDecision16Rate: number;
  repeatShareMedian: number;
  repeatShareP90: number;
  // Which event served the first repeat, counted across careers. 008's headline
  // attribution ("milestone-opener in 205 of 331 cases") is this field.
  firstRepeatByEvent: Record<string, number>;
}

export function runRepetitionProbe(
  profile: PolicyProfile,
  careersPerPosition: number,
  seedPrefix: string,
  key: RepeatKey,
  cohortName = "",
  content: ContentBundle = CONTENT,
): RepetitionReport {
  const keyOf = keyFn(key);
  const byPosition = {} as Record<Position, number>;
  const decisionCounts: number[] = [];
  const firstRepeats: number[] = [];
  const shares: number[] = [];
  const byEvent: Record<string, number> = {};
  let repeatBy16 = 0;
  let careers = 0;

  for (const position of ALL_POSITIONS) {
    byPosition[position] = careersPerPosition;
    for (let i = 0; i < careersPerPosition; i++) {
      const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position };
      const trace = traceCareer(setup, `${seedPrefix}-${position}-${i}`, profile, content);
      careers++;
      decisionCounts.push(trace.length);
      shares.push(repeatShare(trace, keyOf));
      const first = firstRepeat(trace, keyOf);
      if (first) {
        firstRepeats.push(first.index);
        byEvent[first.eventId] = (byEvent[first.eventId] ?? 0) + 1;
        if (first.index <= 16) repeatBy16++;
      }
    }
  }

  const sortedDecisions = [...decisionCounts].sort((a, b) => a - b);
  const sortedFirst = [...firstRepeats].sort((a, b) => a - b);
  const sortedShares = [...shares].sort((a, b) => a - b);
  const noRepeat = sortedFirst.length === 0;

  return {
    cohort: cohortName,
    key,
    careers,
    careersByPosition: byPosition,
    decisionsMedian: percentile(sortedDecisions, 0.5),
    decisionsP10: percentile(sortedDecisions, 0.1),
    decisionsP90: percentile(sortedDecisions, 0.9),
    careersWithAnyRepeat: sortedFirst.length,
    firstRepeatMedian: noRepeat ? 0 : percentile(sortedFirst, 0.5),
    firstRepeatP10: noRepeat ? 0 : percentile(sortedFirst, 0.1),
    firstRepeatP90: noRepeat ? 0 : percentile(sortedFirst, 0.9),
    firstRepeatMin: noRepeat ? 0 : sortedFirst[0]!,
    firstRepeatMax: noRepeat ? 0 : sortedFirst[sortedFirst.length - 1]!,
    repeatByDecision16Rate: careers === 0 ? 0 : repeatBy16 / careers,
    repeatShareMedian: percentile(sortedShares, 0.5),
    repeatShareP90: percentile(sortedShares, 0.9),
    firstRepeatByEvent: Object.fromEntries(
      Object.entries(byEvent).sort((a, b) => b[1] - a[1]),
    ),
  };
}

// CLI: `npx tsx src/sim/repetition-probe.ts 24 all card`
function main(): void {
  const perPosition = Number(process.argv[2] ?? 24);
  const cohortArg = process.argv[3] ?? "all";
  const key = (process.argv[4] ?? "card") as RepeatKey;
  if (key !== "card" && key !== "id") {
    console.error(`Unknown key "${key}". Expected "card" or "id".`);
    process.exitCode = 1;
    return;
  }
  const names = (cohortArg === "all" ? Object.keys(REPETITION_COHORTS) : [cohortArg]) as CohortName[];
  const rows: RepetitionReport[] = [];
  for (const n of names) {
    if (!(n in REPETITION_COHORTS)) {
      console.error(`Unknown cohort "${n}". Known: ${Object.keys(REPETITION_COHORTS).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    // Seed prefixes are per-cohort and fixed, so a before/after comparison runs
    // the identical careers.
    rows.push(runRepetitionProbe(REPETITION_COHORTS[n], perPosition, `rep-${n}`, key, n));
  }
  console.log(JSON.stringify(rows, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("repetition-probe.ts")) main();
