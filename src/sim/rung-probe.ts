// Brief 054 / DECISION 080: is the top rung of the trust ladder reachable, and
// does a starting player fall a rung on a single bad card?
//
// Every previous character measurement in this directory reports the ENDPOINT —
// final `character`, or Δ from the start. That is the wrong instrument for the
// complaint B81 was opened over. The playtester did not say "my number was
// low"; they said *"only something you can lose"* and *"the first fall came on
// decision 2"*. Both of those are statements about the LADDER: which rung the
// career finished on, whether it ever stood on the top one, which direction its
// FIRST rung change went, and how many rung changes it saw at all. None of them
// can be recovered from a final value, because a career that dips to 69 on
// click two and climbs back to 76 has the same endpoint as one that never moved
// and a completely different experience.
//
// So this probe keeps the whole `character` trajectory — one value per
// `advance()` — and scores it against a BAND TABLE PASSED IN. The table is a
// parameter rather than an import so the old and new calibrations can be scored
// against the SAME careers: identical seeds, identical policies, identical
// trajectories, only the thresholds differ. A side-by-side that re-rolled the
// careers would be comparing two samples as well as two tables.
//
// `TRUST_BAND_FLOORS` (human-lazy-probe.ts) is the sim-side copy of the UI
// table and is asserted equal to it in human-lazy-probe.test.ts, so scoring
// against it is scoring against what the player actually reads.
//
// CLI:
//   npx tsx src/sim/rung-probe.ts <runs> <profile,profile|all> <pos,pos|all> [seedPrefix]

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
import { makePolicy, PROFILES, type Policy, type ProfileName } from "./policies";
import { TRUST_BAND_FLOORS } from "./human-lazy-probe";

export interface BandFloor {
  min: number;
  phrase: string;
}

/** The calibration DECISION 080 measured as broken, kept here so the report can
    score both tables against one set of careers. Not imported from the UI: the
    UI table is the NEW one now, and a side-by-side needs both. */
export const OLD_TRUST_BAND_FLOORS: BandFloor[] = [
  { min: 85, phrase: "they would run through a wall for you" },
  { min: 70, phrase: "the staff trusts you" },
  { min: 50, phrase: "just a guy in the building" },
  { min: 30, phrase: "a problem they are managing" },
  { min: 0, phrase: "the staff has stopped defending you" },
];

/** Rung index, 0 at the top, for a `character` value under a given table. */
export function rungOf(bands: BandFloor[], character: number): number {
  for (let i = 0; i < bands.length; i++) if (character >= bands[i]!.min) return i;
  return bands.length - 1;
}

/**
 * The `character` value after every decision of one career, starting with the
 * value the career was created with. Length is (decisions + 1).
 *
 * A copy of `playCareer`'s loop, for the reason `virtue-probe` and
 * `failure-probe` keep their own: play-headless is the module the balance
 * baselines were produced with and it should not grow a hook per probe.
 */
export function traceCharacter(setup: Setup, seed: string, policy: Policy): number[] {
  let s = createCareer(setup, seed, CONTENT);
  const policyRng = createRng(seed + ":policy");
  const trail: number[] = [s.character];
  let guard = 0;
  while (s.status === "active" && guard++ < 1000) {
    const decision = getDecision(s, CONTENT);
    if (!decision) break;
    const choice = policy(s, decision.options, policyRng);
    s = advance(s, choice, CONTENT);
    trail.push(s.character);
  }
  return trail;
}

export interface RungTrace {
  /** Rung the career finished on, 0 = top. */
  finalRung: number;
  /** Did the career stand on the top rung at any point, not just at the end. */
  everTop: boolean;
  /** Was the career ever ON the top rung at career end. */
  endsTop: boolean;
  /** Direction of the FIRST rung change, or null if the ladder never moved. */
  firstMove: "up" | "down" | null;
  /** Which decision index the first rung change landed on (1-based), or null. */
  firstMoveAt: number | null;
  /** How many times the rung changed across the whole career. */
  moves: number;
  ups: number;
  downs: number;
}

export function scoreTrail(bands: BandFloor[], trail: number[]): RungTrace {
  let prev = rungOf(bands, trail[0]!);
  let everTop = prev === 0;
  let firstMove: "up" | "down" | null = null;
  let firstMoveAt: number | null = null;
  let moves = 0;
  let ups = 0;
  let downs = 0;
  for (let i = 1; i < trail.length; i++) {
    const here = rungOf(bands, trail[i]!);
    if (here === 0) everTop = true;
    if (here !== prev) {
      moves++;
      // Best-first, so a SMALLER index is a higher rung.
      const dir = here < prev ? "up" : "down";
      if (dir === "up") ups++;
      else downs++;
      if (firstMove === null) {
        firstMove = dir;
        firstMoveAt = i;
      }
      prev = here;
    }
  }
  return { finalRung: prev, everTop, endsTop: prev === 0, firstMove, firstMoveAt, moves, ups, downs };
}

export interface RungReport {
  profile: string;
  position: Position | "ALL";
  runs: number;
  /** Share of careers finishing on each rung, index 0 = top. Sums to 1. */
  finalOccupancy: number[];
  /** Careers that END on the top rung. */
  topEndRate: number;
  /** Careers that ever TOUCH the top rung. */
  topEverRate: number;
  /** Of careers whose ladder moved at all, the share whose first move was down. */
  firstMoveDownRate: number;
  /** Share of ALL careers whose first rung change is downward. */
  firstMoveDownOfAll: number;
  /** Share of careers whose ladder never moved. */
  neverMovesRate: number;
  /** Median decision index of the first rung change (careers that move). */
  firstMoveAtMedian: number | null;
  movesMean: number;
  upsMean: number;
  downsMean: number;
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor((s.length - 1) / 2)]!;
}

export function summarizeRungs(
  profile: string,
  position: Position | "ALL",
  bands: BandFloor[],
  traces: RungTrace[],
): RungReport {
  const n = traces.length;
  const occ = new Array(bands.length).fill(0);
  for (const t of traces) occ[t.finalRung]++;
  const moved = traces.filter((t) => t.firstMove !== null);
  return {
    profile,
    position,
    runs: n,
    finalOccupancy: occ.map((c: number) => c / n),
    topEndRate: traces.filter((t) => t.endsTop).length / n,
    topEverRate: traces.filter((t) => t.everTop).length / n,
    firstMoveDownRate: moved.length ? moved.filter((t) => t.firstMove === "down").length / moved.length : 0,
    firstMoveDownOfAll: traces.filter((t) => t.firstMove === "down").length / n,
    neverMovesRate: (n - moved.length) / n,
    firstMoveAtMedian: median(moved.map((t) => t.firstMoveAt!)),
    movesMean: traces.reduce((a, t) => a + t.moves, 0) / n,
    upsMean: traces.reduce((a, t) => a + t.ups, 0) / n,
    downsMean: traces.reduce((a, t) => a + t.downs, 0) / n,
  };
}

/** Every career's trajectory for one (profile, position) cell. */
export function traceCell(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position,
  homeState = "TX",
): number[][] {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const policy = makePolicy(PROFILES[profileName]);
  const out: number[][] = [];
  for (let i = 0; i < runs; i++) out.push(traceCharacter(setup, `${seedPrefix}-${i}`, policy));
  return out;
}

function main(): void {
  const runs = Number(process.argv[2] ?? 400);
  const profileArg = process.argv[3] ?? "all";
  const positionArg = process.argv[4] ?? "all";
  const seedPrefix = process.argv[5] ?? "b81";
  const profiles = (
    profileArg === "all"
      ? ["virtueAmbitious", "virtueLoyal", "good", "baselineRandom", "lazyFull", "saboteurFull"]
      : profileArg.split(",")
  ) as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : (positionArg.split(",") as Position[]);

  const tables: { name: string; bands: BandFloor[] }[] = [
    { name: "old", bands: OLD_TRUST_BAND_FLOORS },
    { name: "new", bands: TRUST_BAND_FLOORS },
  ];

  const out: Record<string, RungReport[]> = { old: [], new: [] };
  for (const p of profiles) {
    if (!(p in PROFILES)) {
      console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    const allTrails: number[][] = [];
    for (const pos of positions) {
      const trails = traceCell(runs, seedPrefix, p, pos);
      allTrails.push(...trails);
      for (const t of tables) {
        out[t.name]!.push(summarizeRungs(p, pos, t.bands, trails.map((x) => scoreTrail(t.bands, x))));
      }
    }
    for (const t of tables) {
      out[t.name]!.push(
        summarizeRungs(p, "ALL", t.bands, allTrails.map((x) => scoreTrail(t.bands, x))),
      );
    }
  }
  console.log(JSON.stringify(out, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("rung-probe.ts")) main();
