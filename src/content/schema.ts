import type { ClassYear, Effect, GameEvent, Outcome, Phase, Position, Role, SchoolTrait, Tier } from "../engine/types";
import { ALL_SCHOOL_TRAITS, CLASS_ORDER } from "../engine/types";

export interface AwardBand { min: number; prob: number }
export interface PrestigeAward { id: string; bands: AwardBand[]; teamSuccessBoost: number }
export interface ProductionAward { id: string; position: Position; stat: string; threshold: number; prob: number }
export interface PostseasonConfig {
  gamesPerSeason: number;
  tierBaseWinPct: Record<Tier, number>;
  overallWinShiftPerPoint: number;
  winPctClamp: [number, number];
  // How much a program's spotlight multiplies a starter's national-award odds.
  tierExposure: Record<Tier, number>;
  positionMultiplier: Record<Position, number>;
  prestige: PrestigeAward[];
  production: ProductionAward[];
}
export interface ProgressionConfig {
  // Overall gained per offseason: a base by the class year just played, plus
  // more for playing time, plus or minus `devJitter`. A developmental program
  // adds `developmentalBonus` on top.
  devByClass: Record<ClassYear, number>;
  devByRole: Record<Role, number>;
  // Practising against better players: growth for the level of the program.
  devByTier?: Record<Tier, number>;
  devJitter: number;
  washoutOverallFloor: number;
  washoutSnapFloor: number;
  // A kicker's full season is about a third of a field player's snaps, so the
  // same floor would wash out every kicker who backs up at a big program.
  washoutSnapFloorByPosition?: Partial<Record<Position, number>>;
  washoutConsecutiveSeasons: number;
}
export interface RegionsConfig { [region: string]: string[] }
export interface SchoolSamplerConfig {
  base: number;
  homeStateBonus: Record<Tier, number>;
  regionBonus: Record<Tier, number>;
  offerCount: number;
}
export interface RedshirtConfig {
  successProb: number;
  bumpOverall: number;
  sinkOverall: number;
  sitSnapModifier: number;
  // Prose for the two branches. The redshirt is the one gamble whose result the
  // player would otherwise never be told -- a whole season sat on a 60/40 roll.
  bumpDescription: string;
  sinkDescription: string;
}

// Trait magnitudes. Every trait pairs a benefit with a cost of the SAME
// temporal scope, so no transfer pattern can collect one without the other —
// generateTransferOffers emits a lateral offer every offseason unconditionally,
// so a one-shot benefit against an ongoing cost is farmable by hopping.
export interface SchoolTraitConfig {
  // Both sides ongoing while enrolled.
  wideOpen: { snapModifier: number; injuryProbPerPhase: number; injuryTypes: string[] };
  // Cost front-loaded, benefit accrued per season at the school and capped.
  factory: { firstSeasonSnapModifier: number; draftStockBonusPerSeason: number; draftStockBonusCap: number };
  // Cost front-loaded, benefit ongoing while enrolled.
  developmental: { developmentalBonus: number; earlySnapModifier: number; earlySeasons: number };
}

export interface ContentBundle {
  events: GameEvent[];
  injuries: Record<string, { label: string; overallDelta: number; recoveryPhases: number; lasting?: number }>;
  schools: { id: string; name: string; tier: 1 | 2 | 3 | 4; conference: string; state: string; trait?: SchoolTrait }[];
  positions: Record<Position, { label: string; stats: string[] }>;
  trophyIds: string[];
  awardIds: string[];
  postseason: PostseasonConfig;
  progression: ProgressionConfig;
  regions: RegionsConfig;
  schoolSampler: SchoolSamplerConfig;
  redshirt: RedshirtConfig;
  schoolTraits: SchoolTraitConfig;
  traitHints: Record<SchoolTrait, string>;
}

// The three phases a player spends on the field. `offseason` is excluded
// because nobody is playing in it (and checkEffect already rejects stat/snaps
// effects there outright).
const ON_FIELD_PHASES = new Set<Phase>(["nonconf", "conference", "postseason"]);

// Does any outcome of any option credit season production -- a `stat` line or
// `snaps`? Negative amounts count: a card that debits a stat is still claiming
// the player took the field.
export function awardsProduction(ev: GameEvent): boolean {
  return ev.options.some((opt) =>
    [opt.positiveOutcome, opt.negativeOutcome]
      .filter((o): o is Outcome => o !== undefined)
      .some((oc) => oc.effects.some((eff) => eff.kind === "stat" || eff.kind === "snaps")),
  );
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

  // recoveryPhases: 1 never sidelines anyone — production for its own phase has
  // already run by the time the injury is applied, and it heals at the start of
  // the very next phase. It is NOT mechanically inert, though: an injury alive
  // at the end of a phase is still visible to that phase's boundary checks
  // before it heals — it can depress the soft-washout overall comparison
  // (advance.ts), satisfy redshirtOffered's injury clause (advance.ts), depress
  // deriveDraftStock if the player declares before healing, and gate
  // requiresActiveInjury content in for the rest of its own phase
  // (select-event.ts). Those residual effects are real but boundary-only and
  // too subtle to author against deliberately, which is why the floor is 2, not
  // 1. See docs/superpowers/STAGE4-HANDOFF.md's medical-redshirt note for the
  // fullest account of the offseason-hub case.
  for (const [id, inj] of Object.entries(bundle.injuries))
    if (inj.recoveryPhases < 2) errors.push(`Injury ${id}: recoveryPhases must be >= 2 (1 never sidelines anyone, but has subtle boundary effects)`);

  const ps = bundle.postseason;
  const inRange = (p: number) => p >= 0 && p <= 1;
  for (const p of Object.values(ps.tierExposure))
    if (p < 0) errors.push("Postseason tierExposure must be >= 0");
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

  const prog = bundle.progression;
  if (prog.devJitter < 0) errors.push("progression.devJitter must be >= 0");
  if (prog.washoutConsecutiveSeasons < 1) errors.push("progression.washoutConsecutiveSeasons must be >= 1");
  if (prog.washoutOverallFloor < 0) errors.push("progression.washoutOverallFloor must be >= 0");
  if (prog.washoutSnapFloor < 0) errors.push("progression.washoutSnapFloor must be >= 0");

  const rs = bundle.redshirt;
  if (rs.successProb < 0 || rs.successProb > 1) errors.push("redshirt.successProb must be in [0,1]");
  if (rs.sitSnapModifier <= 0 || rs.sitSnapModifier > 1) errors.push("redshirt.sitSnapModifier must be in (0,1]");
  if (!rs.bumpDescription) errors.push("redshirt.bumpDescription must be a non-empty string");
  if (!rs.sinkDescription) errors.push("redshirt.sinkDescription must be a non-empty string");

  const knownTraits = new Set<string>(ALL_SCHOOL_TRAITS);
  for (const school of bundle.schools)
    if (school.trait !== undefined && !knownTraits.has(school.trait))
      errors.push(`School ${school.id}: unknown trait "${school.trait}"`);

  for (const t of ALL_SCHOOL_TRAITS)
    if (!bundle.traitHints[t]) errors.push(`traitHints: missing hint for trait "${t}"`);

  const st = bundle.schoolTraits;
  // A snap modifier of 0 would zero a whole season's production, so these are
  // strictly positive — same reasoning as the transfer modifiers above.
  if (st.wideOpen.snapModifier <= 0) errors.push("schoolTraits.wideOpen.snapModifier must be > 0");
  if (st.factory.firstSeasonSnapModifier <= 0) errors.push("schoolTraits.factory.firstSeasonSnapModifier must be > 0");
  if (st.developmental.earlySnapModifier <= 0) errors.push("schoolTraits.developmental.earlySnapModifier must be > 0");
  if (st.developmental.developmentalBonus < 0)
    errors.push("schoolTraits.developmental.developmentalBonus must be >= 0");
  if (!inRange(st.wideOpen.injuryProbPerPhase))
    errors.push("schoolTraits.wideOpen.injuryProbPerPhase must be in [0,1]");
  if (st.wideOpen.injuryTypes.length === 0)
    errors.push("schoolTraits.wideOpen.injuryTypes must not be empty");
  for (const t of st.wideOpen.injuryTypes)
    if (!knownInjuries.has(t)) errors.push(`schoolTraits.wideOpen: unknown injury "${t}"`);
  if (st.factory.draftStockBonusPerSeason < 0) errors.push("schoolTraits.factory.draftStockBonusPerSeason must be >= 0");
  if (st.factory.draftStockBonusCap < 0) errors.push("schoolTraits.factory.draftStockBonusCap must be >= 0");
  if (!Number.isInteger(st.developmental.earlySeasons) || st.developmental.earlySeasons < 1)
    errors.push("schoolTraits.developmental.earlySeasons must be an integer >= 1");

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
      for (const oc of outcomes) for (const eff of oc.effects) checkEffect(ev.id, opt.id, eff, ev.phase, errors);
    }

    // DECISION 048. A player sitting a redshirt is not on the field, so a card
    // that credits him production for a season he did not play puts stats on
    // his permanent ledger row and his summary reel. `requiresPlaying` already
    // existed and worked; it was simply missing from 52 of the 59 on-field
    // events that award production. This rule is what stops the next authored
    // card reopening the hole silently. Opting a beat back INTO a redshirt
    // season is deliberately not expressible -- see the decision's note on the
    // declined `allowedDuringRedshirt`.
    if (ON_FIELD_PHASES.has(ev.phase) && awardsProduction(ev) && !ev.conditions?.requiresPlaying)
      errors.push(
        `Event ${ev.id}: on-field event awards stat/snaps production and must set conditions.requiresPlaying (DECISION 048)`,
      );

    const c = ev.conditions;
    if (c) {
      if (c.minClass && !CLASS_ORDER.includes(c.minClass))
        errors.push(`Event ${ev.id}: invalid minClass "${c.minClass}"`);
      if (c.tier) for (const t of c.tier)
        if (t < 1 || t > 4) errors.push(`Event ${ev.id}: invalid tier "${t}"`);
      if (c.seasonIndex) for (const n of c.seasonIndex)
        if (!Number.isInteger(n) || n < 0 || n > 4)
          errors.push(`Event ${ev.id}: invalid seasonIndex "${n}" (expected an integer 0-4)`);
      if (c.position) for (const p of c.position)
        if (!knownPositions.has(p)) errors.push(`Event ${ev.id}: invalid position "${p}"`);
      if (c.schoolTrait) for (const t of c.schoolTrait)
        if (!knownTraits.has(t)) errors.push(`Event ${ev.id}: invalid schoolTrait "${t}"`);
      if (c.maxCharacter !== undefined && (c.maxCharacter < 0 || c.maxCharacter > 100))
        errors.push(`Event ${ev.id}: invalid maxCharacter "${c.maxCharacter}"`);
      if (c.maxOverall !== undefined && (c.maxOverall < 0 || c.maxOverall > 99))
        errors.push(`Event ${ev.id}: invalid maxOverall "${c.maxOverall}"`);
      if (c.minOverall !== undefined && (c.minOverall < 0 || c.minOverall > 99))
        errors.push(`Event ${ev.id}: invalid minOverall "${c.minOverall}"`);
      if (c.minOverall !== undefined && c.maxOverall !== undefined && c.minOverall > c.maxOverall)
        errors.push(`Event ${ev.id}: minOverall ${c.minOverall} exceeds maxOverall ${c.maxOverall} (the event can never fire)`);
      if (c.requiresFinalSeason !== undefined && typeof c.requiresFinalSeason !== "boolean")
        errors.push(`Event ${ev.id}: requiresFinalSeason must be a boolean`);
      if (c.requiresPlaying !== undefined && typeof c.requiresPlaying !== "boolean")
        errors.push(`Event ${ev.id}: requiresPlaying must be a boolean`);
      if (c.requiresRedshirt !== undefined && typeof c.requiresRedshirt !== "boolean")
        errors.push(`Event ${ev.id}: requiresRedshirt must be a boolean`);
      // Both flags at once is unsatisfiable -- requiresPlaying excludes the sit
      // season and requiresRedshirt excludes every other one -- so the card can
      // never fire. Caught here for the same reason minOverall > maxOverall is:
      // an author writing dead content gets told at validation, not by silence.
      if (c.requiresPlaying && c.requiresRedshirt)
        errors.push(`Event ${ev.id}: requiresPlaying and requiresRedshirt are mutually exclusive (the event can never fire)`);
    }
  }
  const recruiting = bundle.events.find((e) => e.id === "recruiting");
  if (!recruiting) errors.push('Missing required fixed event "recruiting"');
  else if (recruiting.kind !== "fixed") errors.push('Event recruiting: must be kind "fixed"');
  return errors;

  function checkEffect(evId: string, optId: string, eff: Effect, phase: Phase, out: string[]) {
    const where = `Event ${evId} option ${optId}`;
    if (eff.kind === "injury" && !knownInjuries.has(eff.injuryType))
      out.push(`${where}: unknown injury "${eff.injuryType}"`);
    if (eff.kind === "trophy" && !knownTrophies.has(eff.id)) out.push(`${where}: unknown trophy "${eff.id}"`);
    if (eff.kind === "award" && !knownAwards.has(eff.id)) out.push(`${where}: unknown award "${eff.id}"`);
    if (eff.kind === "stat" && !knownStats.has(eff.stat)) out.push(`${where}: unknown stat "${eff.stat}"`);
    // A phases: 1 suspension never zeroes a snap — production for its own
    // phase has already run and it clears at the next phase boundary, before
    // any future phase is simulated. Same shape as recoveryPhases: 1, and with
    // the same caveat: it is not mechanically free. It still satisfies
    // requiresInjury (select-event.ts) for the rest of its own phase, since a
    // suspension is pushed into state.injuries alongside real injuries.
    if (eff.kind === "suspension" && eff.phases < 2)
      out.push(`${where}: suspension of 1 phase never zeroes a snap, but still satisfies requiresInjury for the rest of its phase`);
    // In an offseason, applyEffect targets seasons[length - 1] — the PREVIOUS,
    // already-consumed season. Development is spent, the washout check has run,
    // and awards are decided. Pay offseason outcomes in overall instead.
    if (phase === "offseason" && (eff.kind === "stat" || eff.kind === "snaps"))
      out.push(`${where}: offseason ${eff.kind} effects write to the previous, already-resolved season`);
  }
}
