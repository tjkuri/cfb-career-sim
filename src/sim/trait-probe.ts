import { playCareer } from "./play-headless";
import { randomPolicy } from "./policies";
import { CONTENT } from "../content/index";
import { ALL_POSITIONS, ALL_SCHOOL_TRAITS, type Position, type Setup, type GameState } from "../engine/index";

export interface TraitProbeReport {
  bucket: string;
  position: Position;
  careers: number;
  shareOfPopulation: number;
  draftedRate: number;
  undraftedRate: number;
  actuallyPickedRate: number;
  round1Rate: number;
  allConfRate: number;
  bustedRate: number;
  avgSeasons: number;
  avgInjuries: number;
  injuredRate: number;
  avgFinalOverall: number;
  avgFinalCharacter: number;
  charUnder55Rate: number;
}

// Bucket by whether the career EVER RECEIVED the effect, not by where it spent
// the most seasons. Modal-school bucketing mis-attributes exactly the cases
// these traits are built around: a career that takes season 1 at a wideOpen
// school -- collecting the full effect -- then transfers and plays three
// seasons elsewhere would bucket as untraited, hiding the effect inside the
// control group and biasing BOTH buckets at once.
//
// A career can therefore appear in more than one bucket. That is correct, and
// `careers` + `shareOfPopulation` make the overlap visible rather than silent.
export function traitsExperienced(s: GameState): Set<string> {
  const out = new Set<string>();
  for (const line of s.seasons) {
    const trait = CONTENT.schools.find((x) => x.id === line.schoolId)?.trait;
    if (trait) out.add(trait);
  }
  return out;
}

function summarize(bucket: string, position: Position, careers: GameState[], total: number): TraitProbeReport {
  const n = careers.length;
  const safe = (x: number) => (n === 0 ? 0 : x / n);
  const drafted = careers.filter((s) => s.status === "drafted");
  const undrafted = drafted.filter((s) => s.draftResult?.undrafted);
  return {
    bucket,
    position,
    careers: n,
    shareOfPopulation: total === 0 ? 0 : n / total,
    draftedRate: safe(drafted.length),
    undraftedRate: safe(undrafted.length),
    actuallyPickedRate: safe(drafted.length - undrafted.length),
    round1Rate: safe(drafted.filter((s) => !s.draftResult?.undrafted && s.draftResult?.round === 1).length),
    allConfRate: safe(careers.filter((s) => s.awards.includes("allConference")).length),
    bustedRate: safe(careers.filter((s) => s.status === "busted").length),
    avgSeasons: safe(careers.reduce((a, s) => a + s.seasons.length, 0)),
    avgInjuries: safe(careers.reduce((a, s) => a + s.careerInjuries, 0)),
    injuredRate: safe(careers.filter((s) => s.careerInjuries > 0).length),
    avgFinalOverall: safe(careers.reduce((a, s) => a + s.overall, 0)),
    avgFinalCharacter: safe(careers.reduce((a, s) => a + s.character, 0)),
    charUnder55Rate: safe(careers.filter((s) => s.character <= 55).length),
  };
}

export function runTraitProbe(
  runs: number,
  seedPrefix: string,
  position: Position,
  homeState = "TX",
): TraitProbeReport[] {
  const setup: Setup = { lastName: "Player", jerseyNumber: 7, homeState, position };
  const all: GameState[] = [];
  for (let i = 0; i < runs; i++) all.push(playCareer(setup, `${seedPrefix}-${i}`, randomPolicy));
  const rows: TraitProbeReport[] = [summarize("ALL", position, all, all.length)];
  for (const trait of ALL_SCHOOL_TRAITS) {
    rows.push(summarize(trait, position, all.filter((s) => traitsExperienced(s).has(trait)), all.length));
  }
  rows.push(summarize("untraited", position, all.filter((s) => traitsExperienced(s).size === 0), all.length));
  return rows;
}

// CLI: `npm run traits -- 3000 QB`      (one position)
//      `npm run traits -- 3000 all`     (every position)
//      `npm run traits -- 3000 QB CA`   (sweep a different home state)
function main() {
  const runs = Number(process.argv[2] ?? 3000);
  const target = process.argv[3] ?? "QB";
  const homeState = process.argv[4] ?? "TX";
  const positions = target === "all" ? ALL_POSITIONS : [target as Position];
  if (target !== "all" && !ALL_POSITIONS.includes(target as Position)) {
    console.error(`Unknown position "${target}". Expected one of ${ALL_POSITIONS.join(", ")}, or "all".`);
    process.exitCode = 1;
    return;
  }
  const rows = positions.flatMap((p) => runTraitProbe(runs, "traits", p, homeState));
  console.log(JSON.stringify(rows, null, 2));
}
if (process.argv[1] && process.argv[1].endsWith("trait-probe.ts")) main();
