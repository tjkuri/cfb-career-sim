// Brief 047 / 049: does virtue actually pay in a PLAYED career, and what do the
// no-choice cards cost?
//
// Every other probe in this directory measures the engine's own numbers —
// overall, character, draft stock. This one measures what the PLAYER READS.
// The complaint B62 was convened over is not "my character number was too low",
// it is *"I was told I cost the locker room five times and never once asked
// about it"*, and that sentence is printed by exactly one function:
// `cardAccount` in `src/ui/session/view-model.ts`, whose `lockerRoom` field
// CareerScreen turns into *"Earned you credit in the locker room."* or *"Cost
// you in the locker room."*
//
// So this harness calls that function directly on each `(before, after,
// decision, optionId)` quad. Nothing about the accounting is re-implemented
// here; if the card's attribution rules change, this probe changes with them.
// That is the point — an approximation of the card would answer a question
// nobody asked.
//
// The career loop is a copy of `playCareer` (play-headless.ts), for the same
// reason `failure-probe.ts` keeps its own copy: play-headless is the module the
// balance baselines were produced with and it should not grow a hook per probe.
//
// CLI:
//   npx tsx src/sim/virtue-probe.ts <runs> <profile,profile|all> <pos,pos|all> [seedPrefix]

import {
  createCareer,
  advance,
  getDecision,
  ALL_POSITIONS,
  type GameState,
  type PendingDecision,
  type Position,
  type Setup,
} from "../engine/index";
import { STARTING_CHARACTER } from "../engine/create-career";
import { createRng } from "../engine/rng";
import { CONTENT } from "../content/index";
import { cardAccount } from "../ui/session/view-model";
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";
import { percentile } from "./balance";

// The five per-season Season Opener variants (DECISIONS 030/036/042/043) and
// the wider set of cards the player is never asked about. Both are derived from
// the bundle rather than hardcoded, so a content change cannot silently leave
// this attribution measuring yesterday's card list.
export const OPENER_EVENT_IDS: string[] = CONTENT.events
  .filter((e) => e.id.startsWith("milestone-opener-"))
  .map((e) => e.id);

/** Every event whose card offers the player exactly one button. */
export function singleOptionEventIds(): Set<string> {
  return new Set(CONTENT.events.filter((e) => e.options.length === 1).map((e) => e.id));
}

export interface CardLine {
  eventId: string;
  optionId: string;
  /** null when `cardAccount` could not attribute the movement — see its doc. */
  lockerRoom: "cost" | "credit" | null;
  /** Character points this card's own outcome moved, from the authored effects. */
  characterDelta: number;
  /** The card offered exactly one button. */
  oneButton: boolean;
}

export interface VirtueTrace {
  state: GameState;
  lines: CardLine[];
  earned: number;
  cost: number;
  finalCharacter: number;
  characterDelta: number;
}

function characterOf(before: GameState, after: GameState): number {
  return after.character - before.character;
}

export function traceVirtue(setup: Setup, seed: string, policy: Policy): VirtueTrace {
  const singles = SINGLE_OPTION_IDS;
  let s = createCareer(setup, seed, CONTENT);
  const policyRng = createRng(seed + ":policy");
  const lines: CardLine[] = [];
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision: PendingDecision | null = getDecision(s, CONTENT);
    if (!decision) break;
    const optionId = policy(s, decision.options, policyRng);
    const before = s;
    const after = advance(s, optionId, CONTENT);
    const account = cardAccount(before, after, decision, optionId);
    if (account) {
      lines.push({
        eventId: decision.eventId,
        optionId,
        lockerRoom: account.lockerRoom,
        // The card's own character movement. `accountOf` folds it into a
        // direction and throws the size away (character is never shown as a
        // number, DECISION 002), so recover the size from the state diff — it
        // is the same quantity, and `applyChoice` runs first inside advance().
        characterDelta: characterOf(before, after),
        oneButton: singles.has(decision.eventId),
      });
    }
    s = after;
  }
  const earned = lines.filter((l) => l.lockerRoom === "credit").length;
  const cost = lines.filter((l) => l.lockerRoom === "cost").length;
  return {
    state: s,
    lines,
    earned,
    cost,
    finalCharacter: s.character,
    characterDelta: s.character - STARTING_CHARACTER,
  };
}

const SINGLE_OPTION_IDS = singleOptionEventIds();

export interface VirtueReport {
  profile: string;
  position: Position;
  runs: number;

  // --- what the player reads ---
  earnedMean: number;
  earnedMedian: number;
  zeroEarnedRate: number;
  costMean: number;
  costMedian: number;
  net: number;
  earnedOverCostRate: number;

  // --- where they end up ---
  charDeltaP05: number;
  charDeltaP25: number;
  charDeltaMedian: number;
  charDeltaP75: number;
  charDeltaP95: number;
  charDeltaMean: number;
  belowStartRate: number;
  avgFinalCharacter: number;

  // --- is the game still losable ---
  bustedRate: number;
  charUnder55Rate: number;
  charUnder35Rate: number;

  // --- attribution of the Cost lines ---
  costLinesOneButton: number;
  costLinesOpener: number;
  costLinesChosen: number;
  openerNewOptionShare: number; // share of opener cards on which the NEW option was taken
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export function summarizeVirtue(
  profile: string,
  position: Position,
  traces: VirtueTrace[],
): VirtueReport {
  const n = traces.length;
  const earned = traces.map((t) => t.earned);
  const cost = traces.map((t) => t.cost);
  const deltas = traces.map((t) => t.characterDelta).sort((a, b) => a - b);
  const finals = traces.map((t) => t.finalCharacter);

  const openerLines = traces.flatMap((t) => t.lines.filter((l) => OPENER_EVENT_IDS.includes(l.eventId)));

  return {
    profile,
    position,
    runs: n,
    earnedMean: mean(earned),
    earnedMedian: percentile([...earned].sort((a, b) => a - b), 0.5),
    zeroEarnedRate: earned.filter((e) => e === 0).length / n,
    costMean: mean(cost),
    costMedian: percentile([...cost].sort((a, b) => a - b), 0.5),
    net: mean(earned) - mean(cost),
    earnedOverCostRate: traces.filter((t) => t.earned > t.cost).length / n,
    charDeltaP05: percentile(deltas, 0.05),
    charDeltaP25: percentile(deltas, 0.25),
    charDeltaMedian: percentile(deltas, 0.5),
    charDeltaP75: percentile(deltas, 0.75),
    charDeltaP95: percentile(deltas, 0.95),
    charDeltaMean: mean(deltas),
    belowStartRate: deltas.filter((d) => d < 0).length / n,
    avgFinalCharacter: mean(finals),
    bustedRate: traces.filter((t) => t.state.status === "busted").length / n,
    charUnder55Rate: finals.filter((c) => c <= 55).length / n,
    charUnder35Rate: finals.filter((c) => c <= 35).length / n,
    costLinesOneButton: mean(
      traces.map((t) => t.lines.filter((l) => l.lockerRoom === "cost" && l.oneButton).length),
    ),
    costLinesOpener: mean(
      traces.map(
        (t) =>
          t.lines.filter((l) => l.lockerRoom === "cost" && OPENER_EVENT_IDS.includes(l.eventId)).length,
      ),
    ),
    costLinesChosen: mean(
      traces.map((t) => t.lines.filter((l) => l.lockerRoom === "cost" && !l.oneButton).length),
    ),
    openerNewOptionShare:
      openerLines.length === 0
        ? 0
        : openerLines.filter((l) => l.optionId !== "handle-it").length / openerLines.length,
  };
}

export function runVirtueProbe(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position = "QB",
  homeState = "TX",
): VirtueReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const policy = makePolicy(PROFILES[profileName]);
  const traces: VirtueTrace[] = [];
  for (let i = 0; i < runs; i++) traces.push(traceVirtue(setup, `${seedPrefix}-${i}`, policy));
  return summarizeVirtue(profileName, position, traces);
}

function main(): void {
  const runs = Number(process.argv[2] ?? 3000);
  const profileArg = process.argv[3] ?? "virtueLoyal";
  const positionArg = process.argv[4] ?? "QB";
  const seedPrefix = process.argv[5] ?? "b62p2";
  const profiles = (profileArg === "all" ? Object.keys(PROFILES) : profileArg.split(",")) as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : (positionArg.split(",") as Position[]);
  const rows: VirtueReport[] = [];
  for (const p of profiles) {
    if (!(p in PROFILES)) {
      console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    for (const pos of positions) rows.push(runVirtueProbe(runs, seedPrefix, p, pos));
  }
  console.log(JSON.stringify(rows, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("virtue-probe.ts")) main();
