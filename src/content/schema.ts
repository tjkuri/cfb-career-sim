import type { Effect, GameEvent, Position } from "../engine/types";

export interface ContentBundle {
  events: GameEvent[];
  injuries: Record<string, { label: string; overallDelta: number; recoveryPhases: number }>;
  schools: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string }[];
  positions: Record<Position, { label: string; stats: string[] }>;
  trophyIds: string[];
  awardIds: string[];
}

export function validateContent(bundle: ContentBundle): string[] {
  const errors: string[] = [];
  const knownStats = new Set<string>();
  for (const p of Object.values(bundle.positions)) for (const s of p.stats) knownStats.add(s);
  const knownInjuries = new Set(Object.keys(bundle.injuries));
  const knownTrophies = new Set(bundle.trophyIds);
  const knownAwards = new Set(bundle.awardIds);

  const seen = new Set<string>();
  for (const ev of bundle.events) {
    if (seen.has(ev.id)) errors.push(`Duplicate event id: ${ev.id}`);
    seen.add(ev.id);
    if (ev.weight < 0) errors.push(`Event ${ev.id}: weight must be >= 0`);
    if (ev.options.length === 0) errors.push(`Event ${ev.id}: has no options`);
    for (const opt of ev.options) {
      if (opt.probability < 0 || opt.probability > 1)
        errors.push(`Event ${ev.id} option ${opt.id}: probability must be in [0,1]`);
      const outcomes = [opt.positiveOutcome, opt.negativeOutcome].filter(Boolean);
      for (const oc of outcomes) for (const eff of oc!.effects) checkEffect(ev.id, opt.id, eff, errors);
    }
  }
  if (!seen.has("recruiting")) errors.push('Missing required fixed event "recruiting"');
  return errors;

  function checkEffect(evId: string, optId: string, eff: Effect, out: string[]) {
    const where = `Event ${evId} option ${optId}`;
    if (eff.kind === "injury" && !knownInjuries.has(eff.injuryType))
      out.push(`${where}: unknown injury "${eff.injuryType}"`);
    if (eff.kind === "trophy" && !knownTrophies.has(eff.id)) out.push(`${where}: unknown trophy "${eff.id}"`);
    if (eff.kind === "award" && !knownAwards.has(eff.id)) out.push(`${where}: unknown award "${eff.id}"`);
    if (eff.kind === "stat" && !knownStats.has(eff.stat)) out.push(`${where}: unknown stat "${eff.stat}"`);
  }
}
