// Plays a few thousand careers per policy and prints what a player would feel:
// how many clicks a career takes, how often the big moments land, and where
// the draft lands. `npx tsx src/sim/fun-balance.ts [careersPerPolicy]`
import { advance, createCareer, getDecision, type DecisionOption, type GameState, type PendingDecision } from "../engine/index";
import { ALL_POSITIONS } from "../engine/types";
import type { Effect } from "../engine/types";
import { playbook } from "../engine/big-game";

type Policy = (d: PendingDecision, s: GameState, rand: () => number) => string;

function value(effects: Effect[] | undefined): number {
  let v = 0;
  for (const e of effects ?? []) {
    if (e.kind === "overall") v += e.amount;
    if (e.kind === "character") v += e.amount * 0.15;
    if (e.kind === "injury") v -= 5;
    if (e.kind === "suspension") v -= 2;
    if (e.kind === "ending") v -= 40;
    if (e.kind === "snaps") v += e.amount / 60;
  }
  return v;
}

function ev(o: DecisionOption): number {
  const p = o.probability ?? 1;
  return p * value(o.positive) + (1 - p) * value(o.negative);
}

// Read the two clues: trust a strong film tendency, otherwise the look.
function counterScout(d: PendingDecision, s: GameState): string {
  const g = d.bigGame!;
  const book = playbook(s.setup.position, g.pkg);
  const film = book.counters.findIndex((c) => c.label === g.scout.call);
  const look = book.counters.findIndex((c) => c.look === g.look);
  const read = film === look || g.scout.percent >= 60 ? film : look;
  let best = 0;
  for (let i = 1; i < 3; i++) if (book.odds[i]![read]! > book.odds[best]![read]!) best = i;
  return book.calls[best]!.id;
}

const POLICIES: Record<string, Policy> = {
  random: (d, _s, r) => d.options[Math.floor(r() * d.options.length)]!.id,
  smart: (d, s, r) => {
    if (d.kind === "bigGame") return counterScout(d, s);
    if (d.kind === "school") {
      // Play where you start, but climb when you can start higher up.
      const ranked = [...d.options].sort((a, b) => score(b) - score(a));
      return ranked[0]!.id;
    }
    void r;
    return [...d.options].sort((a, b) => ev(b) - ev(a))[0]!.id;
  },
  safe: (d, s) => {
    if (d.kind === "bigGame") return counterScout(d, s);
    if (d.kind === "school") return d.options[0]!.id;
    return [...d.options].sort((a, b) => (b.probability ?? 1) - (a.probability ?? 1))[0]!.id;
  },
};

function score(o: DecisionOption): number {
  const sc = o.school!;
  const roleV = sc.role === "starter" ? 3 : sc.role === "rotation" ? 1.5 : 0;
  return sc.tier + roleV;
}

function rand(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = Number(process.argv[2] ?? 1500);
for (const [name, policy] of Object.entries(POLICIES)) {
  const r = rand(7);
  let decisions = 0, bigGames = 0, bigWins = 0, heisman = 0, aa = 0, busted = 0, ovr = 0, natty = 0, repeats = 0;
  const rounds = new Array(8).fill(0) as number[];
  const perPos: Record<string, number[]> = {};
  for (let i = 0; i < N; i++) {
    const pos = ALL_POSITIONS[i % ALL_POSITIONS.length]!;
    let s = createCareer({ lastName: "Sim", jerseyNumber: 1, homeState: "TX", position: pos }, `fb-${name}-${i}`);
    const seen = new Map<string, number>();
    let guard = 0;
    while (s.status === "active" && guard++ < 200) {
      const d = getDecision(s);
      if (!d) break;
      decisions++;
      if (d.kind === "event") seen.set(d.eventId, (seen.get(d.eventId) ?? 0) + 1);
      s = advance(s, policy(d, s, r));
    }
    for (const n of seen.values()) if (n > 1) repeats++;
    for (const line of s.seasons) {
      if (line.bigGame?.played) { bigGames++; if (line.bigGame.won) bigWins++; }
      for (const h of line.honors ?? []) {
        if (h === "heisman") heisman++;
        if (h === "allAmerican") aa++;
        if (h === "cfpTitle") natty++;
      }
    }
    if (s.status === "busted") busted++;
    ovr += s.overall;
    const round = s.draftResult ? (s.draftResult.undrafted ? 0 : s.draftResult.round) : 0;
    if (s.status === "drafted") rounds[round]!++;
    (perPos[pos] ??= [0, 0])[0]! += round === 1 ? 1 : 0;
    perPos[pos]![1]! += 1;
  }
  const pct = (n: number) => `${((100 * n) / N).toFixed(1)}%`;
  console.log(`\n== ${name} (${N} careers)`);
  console.log(`decisions/career ${(decisions / N).toFixed(1)}  final OVR ${(ovr / N).toFixed(1)}  busted ${pct(busted)}  repeated cards ${repeats}`);
  console.log(`big games played/career ${(bigGames / N).toFixed(2)}  won ${((100 * bigWins) / Math.max(1, bigGames)).toFixed(0)}%  natty careers-ish ${pct(natty)}`);
  console.log(`heisman/career ${pct(heisman)}  all-american/career ${pct(aa)}`);
  console.log(`draft: R1 ${pct(rounds[1]!)} R2-3 ${pct(rounds[2]! + rounds[3]!)} R4-7 ${pct(rounds[4]! + rounds[5]! + rounds[6]! + rounds[7]!)} UDFA ${pct(rounds[0]!)}`);
  console.log(`R1 by position: ${Object.entries(perPos).map(([p, [a, b]]) => `${p} ${((100 * a!) / b!).toFixed(0)}%`).join("  ")}`);
}
