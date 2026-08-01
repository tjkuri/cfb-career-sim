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
}

export function runBalance(runs: number, seedPrefix: string, policy: Policy): BalanceReport {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };
  let drafted = 0, busted = 0, undrafted = 0, round1 = 0, seasons = 0;
  for (let i = 0; i < runs; i++) {
    const s = playCareer(setup, `${seedPrefix}-${i}`, policy);
    seasons += s.seasons.length;
    if (s.status === "busted") busted++;
    if (s.status === "drafted") {
      drafted++;
      if (s.draftResult?.undrafted) undrafted++;
      else if (s.draftResult?.round === 1) round1++;
    }
  }
  return {
    runs,
    draftedRate: drafted / runs,
    bustedRate: busted / runs,
    undraftedRate: undrafted / runs,
    round1Rate: round1 / runs,
    avgSeasons: seasons / runs,
  };
}

// CLI: `npm run balance -- 2000 random`
function main() {
  const runs = Number(process.argv[2] ?? 2000);
  const policy: Policy = process.argv[3] === "first" ? firstOptionPolicy : randomPolicy;
  console.log(JSON.stringify(runBalance(runs, "balance", policy), null, 2));
}
if (process.argv[1] && process.argv[1].endsWith("balance.ts")) main();
