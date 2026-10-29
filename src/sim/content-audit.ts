// Content audit: which cards a player sees most, which cards offer a choice
// that is not really a choice, and which lines slip out of second person.
// `npx tsx src/sim/content-audit.ts [careers]`
import { advance, createCareer, getDecision } from "../engine/index";
import { ALL_POSITIONS, type Effect, type EventOption } from "../engine/types";
import { CONTENT } from "../content/index";

function value(effects: Effect[]): number {
  let v = 0;
  for (const e of effects) {
    if (e.kind === "overall") v += e.amount;
    if (e.kind === "character") v += e.amount * 0.15;
    if (e.kind === "injury") v -= CONTENT.injuries[e.injuryType]?.overallDelta ?? 3;
    if (e.kind === "suspension") v -= 2;
    if (e.kind === "ending") v -= 40;
    if (e.kind === "snaps") v += e.amount / 60;
    if (e.kind === "stat") v += e.amount > 0 ? 0.3 : -0.3;
  }
  return v;
}
function ev(o: EventOption): number {
  const p = o.negativeOutcome ? o.probability : 1;
  return p * value(o.positiveOutcome.effects) + (1 - p) * value(o.negativeOutcome?.effects ?? o.positiveOutcome.effects);
}
function worst(o: EventOption): number {
  return Math.min(value(o.positiveOutcome.effects), o.negativeOutcome && o.probability < 1 ? value(o.negativeOutcome.effects) : Infinity);
}

const N = Number(process.argv[2] ?? 600);
const seen = new Map<string, number>();
for (let i = 0; i < N; i++) {
  const pos = ALL_POSITIONS[i % ALL_POSITIONS.length]!;
  let s = createCareer({ lastName: "A", jerseyNumber: 1, homeState: "TX", position: pos }, `audit-${i}`);
  let guard = 0;
  while (s.status === "active" && guard++ < 200) {
    const d = getDecision(s);
    if (!d) break;
    if (d.kind === "event") seen.set(d.eventId, (seen.get(d.eventId) ?? 0) + 1);
    s = advance(s, d.options[Math.floor((i * 7 + guard) % d.options.length)]!.id);
  }
}

console.log(`\n== most-seen cards (share of careers, ${N} careers)`);
for (const [id, n] of [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  const e = CONTENT.events.find((x) => x.id === id)!;
  console.log(`${((100 * n) / N).toFixed(0).padStart(3)}%  w${e.weight}  ${id}  (${e.phase}${e.conditions?.position ? " " + e.conditions.position.join("/") : ""})`);
}

console.log("\n== dominated choices (an option better on average AND in its worst case)");
for (const e of CONTENT.events) {
  if (e.options.length < 2) continue;
  for (const a of e.options)
    for (const b of e.options) {
      if (a === b) continue;
      if (ev(a) > ev(b) + 0.4 && worst(a) >= worst(b)) {
        console.log(`${e.id}: "${a.label}" (ev ${ev(a).toFixed(1)}, worst ${worst(a).toFixed(1)}) beats "${b.label}" (ev ${ev(b).toFixed(1)}, worst ${worst(b).toFixed(1)})`);
      }
    }
}

console.log("\n== third person");
const third = /\b(he|she|him|her|his|himself|herself)\b/i;
for (const e of CONTENT.events)
  for (const o of e.options)
    for (const oc of [o.positiveOutcome, o.negativeOutcome])
      for (const eff of oc?.effects ?? []) if (eff.kind === "moment" && third.test(eff.item)) console.log(`${e.id}: "${eff.item}"`);
