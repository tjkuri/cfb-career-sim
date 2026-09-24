// Brief 037: does the game count what the player does?
//
// `failure-probe.ts` answers "can you lose?" and reports the draft in terms of
// rates and draft stock. This probe answers a different question -- "is a good
// career distinguishable from a bad one, from inside the game?" -- and needs
// three things the failure probe does not report:
//
//   1. HONOURS, split by award. `failure-probe` reports `allConfRate` and
//      `avgAwards`; the playtester's complaint was specifically about the
//      All-American, and `avgAwards` pools three awards of very different
//      rarity into one mean that hides it.
//   2. Median round and median overall pick, not just the round-1 rate. "One
//      round apart" is the unit the player actually reads on the final screen.
//   3. The locker-room BAND distribution, using the same thresholds the UI
//      prints (ui/session/bands.ts TRUST_BANDS). Character is never shown as a
//      number, so a character mean is not a thing any player can perceive; the
//      band is.
//
// It edits nothing. Everything here reads the frozen engine and content.
//
// CLI:
//   npx tsx src/sim/human-lazy-probe.ts <runs> <profile,profile,...|all> <position|all>

import { ALL_POSITIONS, type GameState, type Position, type Setup } from "../engine/index";
import { makePolicy, PROFILES, type ProfileName } from "./policies";
import { playCareer } from "./play-headless";
import { percentile } from "./balance";

// Copied, not imported: src/sim must not depend on src/ui. `bands.test.ts`
// already pins these values on the UI side; this table is asserted equal to it
// in human-lazy-probe.test.ts.
export const TRUST_BAND_FLOORS: { min: number; phrase: string }[] = [
  { min: 80, phrase: "they would run through a wall for you" },
  { min: 66, phrase: "the staff trusts you" },
  { min: 50, phrase: "just a guy in the building" },
  { min: 30, phrase: "a problem they are managing" },
  { min: 0, phrase: "the staff has stopped defending you" },
];

export function trustBand(character: number): string {
  for (const b of TRUST_BAND_FLOORS) if (character >= b.min) return b.phrase;
  return TRUST_BAND_FLOORS[TRUST_BAND_FLOORS.length - 1]!.phrase;
}

export interface HonoursReport {
  profile: string;
  position: Position;
  runs: number;

  bustedRate: number;
  undraftedRate: number;
  draftedRate: number;

  round1Rate: number;
  round12Rate: number;
  round67Rate: number;
  // index 0 = undrafted, 1..7 = that round. Denominator: careers that reached
  // the draft (busted careers excluded, because they never got a round).
  roundShareOfDrafted: number[];
  // Over careers that were actually picked.
  medianRound: number;
  medianPick: number;
  medianOverallPick: number;

  overallMean: number;
  overallP25: number;
  overallP50: number;
  overallP75: number;

  // The honours block. Denominator is ALL careers, including busted ones: a
  // career that ended early earned no honours and that is part of the answer.
  allAmericanRate: number;
  heismanRate: number;
  allConferenceRate: number;
  anyAwardRate: number;
  anyTrophyRate: number;
  avgTrophies: number;

  // The same honours and rating, conditioned on the career actually reaching
  // the draft board. This is what a player who SURVIVES a bad career reads on
  // the final screen -- and it is the number the playtester experienced, since
  // their career did not end early.
  pickedAllAmericanRate: number;
  pickedAllConferenceRate: number;
  pickedAnyAwardRate: number;
  pickedOverallP50: number;

  endingReasons: Record<string, number>;

  characterMean: number;
  characterP50: number;
  bandShare: Record<string, number>;

  avgSeasons: number;
  avgCareerSnaps: number;
  avgDraftStock: number;
}

export function summarize(profile: string, position: Position, states: GameState[]): HonoursReport {
  const n = states.length;
  const rate = (p: (s: GameState) => boolean) => states.filter(p).length / n;
  const mean = (f: (s: GameState) => number) => states.reduce((a, s) => a + f(s), 0) / n;

  const reached = states.filter((s) => s.status === "drafted");
  const picked = reached.filter((s) => !s.draftResult!.undrafted);

  const roundCounts = new Array(8).fill(0) as number[];
  for (const s of reached) {
    const r = s.draftResult!;
    roundCounts[r.undrafted ? 0 : r.round]! += 1;
  }
  const sortedRounds = picked.map((s) => s.draftResult!.round).sort((a, b) => a - b);
  const sortedPicks = picked.map((s) => s.draftResult!.pick).sort((a, b) => a - b);
  const sortedOverallPicks = picked.map((s) => s.draftResult!.overallPick).sort((a, b) => a - b);
  const overalls = states.map((s) => s.overall).sort((a, b) => a - b);
  const characters = states.map((s) => s.character).sort((a, b) => a - b);
  const stocks = reached.map((s) => s.draftResult!.draftStock);

  const pickedRate = (p: (s: GameState) => boolean) =>
    picked.length ? picked.filter(p).length / picked.length : 0;
  const pickedOveralls = picked.map((s) => s.overall).sort((a, b) => a - b);
  const endingReasons: Record<string, number> = {};
  for (const s of states) {
    if (s.status !== "busted") continue;
    const k = s.endingReason ?? "(none)";
    endingReasons[k] = (endingReasons[k] ?? 0) + 1;
  }

  const bandCounts: Record<string, number> = {};
  for (const b of TRUST_BAND_FLOORS) bandCounts[b.phrase] = 0;
  for (const s of states) bandCounts[trustBand(s.character)]! += 1;
  const bandShare = Object.fromEntries(
    Object.entries(bandCounts).map(([k, v]) => [k, v / n]),
  );

  return {
    profile,
    position,
    runs: n,
    bustedRate: rate((s) => s.status === "busted"),
    undraftedRate: rate((s) => !!s.draftResult?.undrafted),
    draftedRate: picked.length / n,
    round1Rate: roundCounts[1]! / n,
    round12Rate: (roundCounts[1]! + roundCounts[2]!) / n,
    round67Rate: (roundCounts[6]! + roundCounts[7]!) / n,
    roundShareOfDrafted: roundCounts.map((c) => (reached.length ? c / reached.length : 0)),
    medianRound: sortedRounds.length ? percentile(sortedRounds, 0.5) : 0,
    medianPick: sortedPicks.length ? percentile(sortedPicks, 0.5) : 0,
    medianOverallPick: sortedOverallPicks.length ? percentile(sortedOverallPicks, 0.5) : 0,
    overallMean: mean((s) => s.overall),
    overallP25: percentile(overalls, 0.25),
    overallP50: percentile(overalls, 0.5),
    overallP75: percentile(overalls, 0.75),
    allAmericanRate: rate((s) => s.awards.includes("allAmerican")),
    heismanRate: rate((s) => s.awards.includes("heisman")),
    allConferenceRate: rate((s) => s.awards.includes("allConference")),
    anyAwardRate: rate((s) => s.awards.length > 0),
    anyTrophyRate: rate((s) => Object.values(s.trophies).some((c) => c > 0)),
    avgTrophies: mean((s) => Object.values(s.trophies).reduce((a, b) => a + b, 0)),
    pickedAllAmericanRate: pickedRate((s) => s.awards.includes("allAmerican")),
    pickedAllConferenceRate: pickedRate((s) => s.awards.includes("allConference")),
    pickedAnyAwardRate: pickedRate((s) => s.awards.length > 0),
    pickedOverallP50: pickedOveralls.length ? percentile(pickedOveralls, 0.5) : 0,
    endingReasons,
    characterMean: mean((s) => s.character),
    characterP50: percentile(characters, 0.5),
    bandShare,
    avgSeasons: mean((s) => s.seasons.length),
    avgCareerSnaps: mean((s) => s.seasons.reduce((a, l) => a + l.snaps, 0)),
    avgDraftStock: stocks.length ? stocks.reduce((a, b) => a + b, 0) / stocks.length : 0,
  };
}

export function runHonoursProbe(
  runs: number,
  seedPrefix: string,
  profileName: ProfileName,
  position: Position,
  homeState = "TX",
): HonoursReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const policy = makePolicy(PROFILES[profileName]);
  const states: GameState[] = [];
  for (let i = 0; i < runs; i++) states.push(playCareer(setup, `${seedPrefix}-${i}`, policy));
  return summarize(profileName, position, states);
}

function main(): void {
  const runs = Number(process.argv[2] ?? 500);
  const profileArg = process.argv[3] ?? "good";
  const positionArg = process.argv[4] ?? "all";
  const profiles = (profileArg === "all" ? Object.keys(PROFILES) : profileArg.split(",")) as ProfileName[];
  const positions = positionArg === "all" ? ALL_POSITIONS : [positionArg as Position];
  const rows: HonoursReport[] = [];
  for (const p of profiles) {
    if (!(p in PROFILES)) {
      console.error(`Unknown profile "${p}". Known: ${Object.keys(PROFILES).join(", ")}`);
      process.exitCode = 1;
      return;
    }
    for (const pos of positions) rows.push(runHonoursProbe(runs, "b037", p, pos));
  }
  console.log(JSON.stringify(rows, null, 2));
}

if (process.argv[1] && process.argv[1].endsWith("human-lazy-probe.ts")) main();
