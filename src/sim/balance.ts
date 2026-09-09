import { playCareer } from "./play-headless";
import { firstOptionPolicy, randomPolicy, type Policy } from "./policies";
import { ALL_POSITIONS, WASHOUT_REASONS, type Position, type Setup } from "../engine/index";

export interface BalanceReport {
  position: Position;
  runs: number;
  draftedRate: number;
  bustedRate: number;
  // Share of ALL careers ending via the soft-washout path (collapsed overall or
  // buried on the depth chart) rather than the character spiral. A subset of
  // bustedRate, and a mechanism the spiral tuning does not reach.
  washoutRate: number;
  undraftedRate: number;
  round1Rate: number;
  allConfRate: number;
  avgSeasons: number;
  avgInjuries: number;
  injuredRate: number;
  // Stage 3d: the spiral is tuned on character, so the report has to show it.
  // bustedRate alone is a lagging, near-binary signal with no gradient.
  avgFinalCharacter: number;
  minFinalCharacter: number;
  characterP05: number;
  characterP25: number;
  charUnder55Rate: number; // band-2 entry rate
  charUnder35Rate: number; // band-3 entry rate
  avgFinalOverall: number;
  minFinalOverall: number;
}

export function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
}

// A career ending at exactly maxCharacter counts as "in the band" — mirrors
// the engine's `state.character > c.maxCharacter` gate semantics.
export function bandRate(characters: number[], maxCharacter: number): number {
  return characters.filter((c) => c <= maxCharacter).length / characters.length;
}

const WASHOUT_REASON_SET = new Set<string>([WASHOUT_REASONS.overall, WASHOUT_REASONS.buried]);

export function runBalance(
  runs: number,
  seedPrefix: string,
  policy: Policy,
  position: Position = "QB",
  // Defaults to TX so every baseline recorded in STAGE4-HANDOFF.md stays
  // directly comparable. Trait measurement sweeps states instead, because the
  // sampler's home-state bonus means a TX-only run measures Texas, not the
  // ladder.
  homeState: string = "TX",
): BalanceReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  let drafted = 0, busted = 0, washed = 0, undrafted = 0, round1 = 0, seasons = 0;
  let allConf = 0, injuries = 0, everInjured = 0;
  const characters: number[] = [];
  const overalls: number[] = [];
  for (let i = 0; i < runs; i++) {
    const s = playCareer(setup, `${seedPrefix}-${i}`, policy);
    seasons += s.seasons.length;
    characters.push(s.character);
    overalls.push(s.overall);
    injuries += s.careerInjuries;
    if (s.careerInjuries > 0) everInjured++;
    if (s.awards.includes("allConference")) allConf++;
    if (s.status === "busted") {
      busted++;
      if (s.endingReason && WASHOUT_REASON_SET.has(s.endingReason)) washed++;
    }
    if (s.status === "drafted") {
      drafted++;
      if (s.draftResult?.undrafted) undrafted++;
      else if (s.draftResult?.round === 1) round1++;
    }
  }
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const sortedChars = [...characters].sort((a, b) => a - b);
  return {
    position,
    runs,
    draftedRate: drafted / runs,
    bustedRate: busted / runs,
    washoutRate: washed / runs,
    undraftedRate: undrafted / runs,
    round1Rate: round1 / runs,
    allConfRate: allConf / runs,
    avgSeasons: seasons / runs,
    avgInjuries: injuries / runs,
    injuredRate: everInjured / runs,
    avgFinalCharacter: sum(characters) / runs,
    minFinalCharacter: Math.min(...characters),
    characterP05: percentile(sortedChars, 0.05),
    characterP25: percentile(sortedChars, 0.25),
    charUnder55Rate: bandRate(characters, 55),
    charUnder35Rate: bandRate(characters, 35),
    avgFinalOverall: sum(overalls) / runs,
    minFinalOverall: Math.min(...overalls),
  };
}

// CLI: `npm run balance -- 2000 random` (QB, as before)
//      `npm run balance -- 500 random DL`
//      `npm run balance -- 500 random all`
function main() {
  const runs = Number(process.argv[2] ?? 2000);
  const policy: Policy = process.argv[3] === "first" ? firstOptionPolicy : randomPolicy;
  const target = process.argv[4] ?? "QB";
  if (target === "all") {
    const rows = ALL_POSITIONS.map((p) => runBalance(runs, "balance", policy, p));
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (!ALL_POSITIONS.includes(target as Position)) {
    console.error(`Unknown position "${target}". Expected one of ${ALL_POSITIONS.join(", ")}, or "all".`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(runBalance(runs, "balance", policy, target as Position), null, 2));
}
if (process.argv[1] && process.argv[1].endsWith("balance.ts")) main();
