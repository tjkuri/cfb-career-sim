import type { Effect, GameEvent, Outcome, Position } from "../engine/types";
import { CLASS_ORDER } from "../engine/types";

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
  // Derive the known-position set from the bundle itself so it can't drift from
  // the authored positions table (and so a condition referencing a position the
  // bundle doesn't define is flagged).
  const knownPositions = new Set<string>(Object.keys(bundle.positions));
  const knownInjuries = new Set(Object.keys(bundle.injuries));
  const knownTrophies = new Set(bundle.trophyIds);
  const knownAwards = new Set(bundle.awardIds);

  for (const [id, inj] of Object.entries(bundle.injuries))
    if (inj.recoveryPhases < 1) errors.push(`Injury ${id}: recoveryPhases must be >= 1`);

  const seen = new Set<string>();
  for (const ev of bundle.events) {
    if (seen.has(ev.id)) errors.push(`Duplicate event id: ${ev.id}`);
    seen.add(ev.id);
    if (ev.weight < 0) errors.push(`Event ${ev.id}: weight must be >= 0`);
    if (ev.options.length === 0) errors.push(`Event ${ev.id}: has no options`);
    for (const opt of ev.options) {
      if (opt.probability < 0 || opt.probability > 1)
        errors.push(`Event ${ev.id} option ${opt.id}: probability must be in [0,1]`);
      const outcomes = [opt.positiveOutcome, opt.negativeOutcome].filter(
        (o): o is Outcome => o !== undefined,
      );
      for (const oc of outcomes) for (const eff of oc.effects) checkEffect(ev.id, opt.id, eff, errors);
    }

    const c = ev.conditions;
    if (c) {
      if (c.minClass && !CLASS_ORDER.includes(c.minClass))
        errors.push(`Event ${ev.id}: invalid minClass "${c.minClass}"`);
      if (c.tier) for (const t of c.tier)
        if (t < 1 || t > 4) errors.push(`Event ${ev.id}: invalid tier "${t}"`);
      if (c.position) for (const p of c.position)
        if (!knownPositions.has(p)) errors.push(`Event ${ev.id}: invalid position "${p}"`);
      if (c.maxCharacter !== undefined && (c.maxCharacter < 0 || c.maxCharacter > 100))
        errors.push(`Event ${ev.id}: invalid maxCharacter "${c.maxCharacter}"`);
      if (c.maxOverall !== undefined && (c.maxOverall < 0 || c.maxOverall > 99))
        errors.push(`Event ${ev.id}: invalid maxOverall "${c.maxOverall}"`);
    }
  }
  const recruiting = bundle.events.find((e) => e.id === "recruiting");
  if (!recruiting) errors.push('Missing required fixed event "recruiting"');
  else if (recruiting.kind !== "fixed") errors.push('Event recruiting: must be kind "fixed"');
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
