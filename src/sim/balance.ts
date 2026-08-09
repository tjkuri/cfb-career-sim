import { playCareer } from "./play-headless";
import { firstOptionPolicy, randomPolicy, type Policy } from "./policies";
import type { Setup } from "../engine/index";

export interface BalanceReport {
  runs: number;
  draftedRate: number;
  bustedRate: number;
  undraftedRate: number;
  round1Rate: number;
  avgSeasons: number;
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

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
}

export function runBalance(runs: number, seedPrefix: string, policy: Policy): BalanceReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };
  let drafted = 0, busted = 0, undrafted = 0, round1 = 0, seasons = 0;
  const characters: number[] = [];
  const overalls: number[] = [];
  for (let i = 0; i < runs; i++) {
    const s = playCareer(setup, `${seedPrefix}-${i}`, policy);
    seasons += s.seasons.length;
    characters.push(s.character);
    overalls.push(s.overall);
    if (s.status === "busted") busted++;
    if (s.status === "drafted") {
      drafted++;
      if (s.draftResult?.undrafted) undrafted++;
      else if (s.draftResult?.round === 1) round1++;
    }
  }
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const sortedChars = [...characters].sort((a, b) => a - b);
  return {
    runs,
    draftedRate: drafted / runs,
    bustedRate: busted / runs,
    undraftedRate: undrafted / runs,
    round1Rate: round1 / runs,
    avgSeasons: seasons / runs,
    avgFinalCharacter: sum(characters) / runs,
    minFinalCharacter: Math.min(...characters),
    characterP05: percentile(sortedChars, 0.05),
    characterP25: percentile(sortedChars, 0.25),
    charUnder55Rate: characters.filter((c) => c <= 55).length / runs,
    charUnder35Rate: characters.filter((c) => c <= 35).length / runs,
    avgFinalOverall: sum(overalls) / runs,
    minFinalOverall: Math.min(...overalls),
  };
}

// CLI: `npm run balance -- 2000 random`
function main() {
  const runs = Number(process.argv[2] ?? 2000);
  const policy: Policy = process.argv[3] === "first" ? firstOptionPolicy : randomPolicy;
  console.log(JSON.stringify(runBalance(runs, "balance", policy), null, 2));
}
if (process.argv[1] && process.argv[1].endsWith("balance.ts")) main();
