import type { Effect, GameEvent, Outcome, Position, Tier } from "../engine/types";
import { CLASS_ORDER } from "../engine/types";

export interface AwardBand { min: number; prob: number }
export interface PrestigeAward { id: string; bands: AwardBand[]; teamSuccessBoost: number }
export interface ProductionAward { id: string; position: Position; stat: string; threshold: number; prob: number }
export interface TrophyRule { id: string; minWins: number; prob: number }
export interface TieredTrophyRule { id: string; minWins: number; probByTier: Record<Tier, number> }
export interface PostseasonConfig {
  gamesPerSeason: number;
  tierBaseWinPct: Record<Tier, number>;
  overallWinShiftPerPoint: number;
  winPctClamp: [number, number];
  bowl: TrophyRule;
  conf: TieredTrophyRule;
  cfp: TieredTrophyRule;
  positionMultiplier: Record<Position, number>;
  prestige: PrestigeAward[];
  production: ProductionAward[];
}
export interface ProgressionConfig {
  snapsPerDevPoint: number;
  devCap: number;
  washoutOverallFloor: number;
  washoutSnapFloor: number;
  washoutConsecutiveSeasons: number;
}
export interface RegionsConfig { [region: string]: string[] }
export interface SchoolSamplerConfig {
  base: number;
  homeStateBonus: Record<Tier, number>;
  regionBonus: Record<Tier, number>;
  offerCount: number;
}
export interface TransferConfig {
  lateralSnapModifier: number;
  moveUpSnapModifier: number;
  moveDownSnapModifier: number;
  buriedSnapThreshold: number;
}
export interface RedshirtConfig {
  successProb: number;
  bumpOverall: number;
  sinkOverall: number;
  sitSnapModifier: number;
}

export interface ContentBundle {
  events: GameEvent[];
  injuries: Record<string, { label: string; overallDelta: number; recoveryPhases: number }>;
  schools: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string }[];
  positions: Record<Position, { label: string; stats: string[] }>;
  trophyIds: string[];
  awardIds: string[];
  postseason: PostseasonConfig;
  progression: ProgressionConfig;
  regions: RegionsConfig;
  schoolSampler: SchoolSamplerConfig;
  transfer: TransferConfig;
  redshirt: RedshirtConfig;
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

  const ps = bundle.postseason;
  const inRange = (p: number) => p >= 0 && p <= 1;
  for (const t of [ps.bowl] as { id: string; prob: number }[]) {
    if (!knownTrophies.has(t.id)) errors.push(`Postseason: unknown trophy "${t.id}"`);
    if (!inRange(t.prob)) errors.push(`Postseason trophy ${t.id}: prob must be in [0,1]`);
  }
  for (const t of [ps.conf, ps.cfp]) {
    if (!knownTrophies.has(t.id)) errors.push(`Postseason: unknown trophy "${t.id}"`);
    for (const p of Object.values(t.probByTier))
      if (!inRange(p)) errors.push(`Postseason trophy ${t.id}: probByTier must be in [0,1]`);
  }
  for (const a of ps.prestige) {
    if (!knownAwards.has(a.id)) errors.push(`Postseason: unknown award "${a.id}"`);
    for (const band of a.bands) if (!inRange(band.prob)) errors.push(`Postseason award ${a.id}: band prob must be in [0,1]`);
  }
  for (const a of ps.production) {
    if (!knownAwards.has(a.id)) errors.push(`Postseason: unknown award "${a.id}"`);
    if (!knownStats.has(a.stat)) errors.push(`Postseason award ${a.id}: unknown stat "${a.stat}"`);
    if (!knownPositions.has(a.position)) errors.push(`Postseason award ${a.id}: unknown position "${a.position}"`);
    if (!inRange(a.prob)) errors.push(`Postseason award ${a.id}: prob must be in [0,1]`);
  }

  for (const [region, states] of Object.entries(bundle.regions))
    if (!Array.isArray(states)) errors.push(`Region ${region}: states must be an array`);
  const sampler = bundle.schoolSampler;
  if (sampler.base < 0) errors.push("schoolSampler.base must be >= 0");
  if (!Number.isInteger(sampler.offerCount) || sampler.offerCount < 1)
    errors.push("schoolSampler.offerCount must be an integer >= 1");
  const ALL_TIERS: Tier[] = [1, 2, 3, 4];
  for (const field of ["homeStateBonus", "regionBonus"] as const) {
    const table = sampler[field];
    for (const t of ALL_TIERS) {
      const v = table?.[t];
      if (v === undefined) errors.push(`schoolSampler.${field}: missing entry for tier ${t}`);
      else if (v < 0) errors.push(`schoolSampler.${field}: tier ${t} must be >= 0`);
    }
  }
  const tr = bundle.transfer;
  // Snap modifiers scale a transferee's whole season; a value of 0 would zero it out,
  // so these three must be strictly positive. buriedSnapThreshold is just a cutoff and
  // may legitimately be 0.
  for (const k of ["lateralSnapModifier", "moveUpSnapModifier", "moveDownSnapModifier"] as const)
    if (tr[k] <= 0) errors.push(`transfer.${k} must be > 0`);
  if (tr.buriedSnapThreshold < 0) errors.push("transfer.buriedSnapThreshold must be >= 0");

  const prog = bundle.progression;
  if (prog.snapsPerDevPoint < 1) errors.push("progression.snapsPerDevPoint must be >= 1");
  if (prog.devCap < 0) errors.push("progression.devCap must be >= 0");
  if (prog.washoutConsecutiveSeasons < 1) errors.push("progression.washoutConsecutiveSeasons must be >= 1");
  if (prog.washoutOverallFloor < 0) errors.push("progression.washoutOverallFloor must be >= 0");
  if (prog.washoutSnapFloor < 0) errors.push("progression.washoutSnapFloor must be >= 0");

  const rs = bundle.redshirt;
  if (rs.successProb < 0 || rs.successProb > 1) errors.push("redshirt.successProb must be in [0,1]");
  if (rs.sitSnapModifier <= 0 || rs.sitSnapModifier > 1) errors.push("redshirt.sitSnapModifier must be in (0,1]");

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
      if (c.requiresFinalSeason !== undefined && typeof c.requiresFinalSeason !== "boolean")
        errors.push(`Event ${ev.id}: requiresFinalSeason must be a boolean`);
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
