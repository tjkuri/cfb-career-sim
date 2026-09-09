import type { GameState, SchoolTrait } from "./types";
import type { ContentBundle } from "../content/schema";
import { applyEffect, isSidelined, type InjuryLookup } from "./effects";
import { rngChance, rngPick, type Rng } from "./rng";

// The trait of the school the player is CURRENTLY at, or undefined.
//
// Must tolerate an empty schoolId: eligibleTiers -> deriveDraftStock runs at
// Signing Day from createCareer, before the player has a school at all.
export function schoolTraitOf(state: GameState, content: ContentBundle): SchoolTrait | undefined {
  if (!state.school.schoolId) return undefined;
  return content.schools.find((s) => s.id === state.school.schoolId)?.trait;
}

// The school's multiplier on a phase's snap roll.
//
// Deliberately NOT written into state.snapModifier: transfer and redshirt
// already own that field and enterOffseason resets it to 1 every year, so a
// third writer would contend for one mutable and the reset would silently eat
// a multi-season effect. This is a separate, derived multiplier.
//
// wideOpen is not tenure-keyed (its cost is ongoing too). factory and
// developmental land in waves 2 and 3 and ARE tenure-keyed.
export function schoolSnapModifier(state: GameState, content: ContentBundle): number {
  const trait = schoolTraitOf(state, content);
  if (trait === "wideOpen") return content.schoolTraits.wideOpen.snapModifier;
  return 1;
}

// wideOpen's cost: a thin two-deep means you keep playing hurt.
//
// The engine has never had an ambient injury source — injuries have only ever
// come from event effects — so this is scoped tightly to the trait.
//
// The draw happens ONLY when the trait is present, which keeps the change
// surgical: a career that never attends a wideOpen school consumes exactly the
// RNG it consumed before, and its seeded outcome is unchanged. (rngChance also
// short-circuits at probability 0 without consuming a draw.)
//
// Cost calibration note: one fire costs ~1.67 of the 3 on-field phases in a
// season, because recoveryPhases >= 2 is schema-enforced and tickPhaseStart
// decrements then heals — the applying phase AND the next are both lost. The
// offseason absorbs a tick for free, so postseason fires cost 1 on-field phase
// and nonconf/conference fires cost 2.
//
// The DURABLE cost is the lost snaps, not the overall hit: applyEffect stores
// restoreAmount and tickPhaseStart gives the overall back on heal. The overall
// only bites where it straddles a boundary — enterOffseason's development and
// washout checks, or deriveDraftStock if the player declares before healing.
export function rollAmbientInjury(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
  injuryOf: InjuryLookup,
): void {
  if (schoolTraitOf(state, content) !== "wideOpen") return;
  if (isSidelined(state)) return;
  const cfg = content.schoolTraits.wideOpen;
  if (!rngChance(rng, cfg.injuryProbPerPhase)) return;
  applyEffect(state, { kind: "injury", injuryType: rngPick(rng, cfg.injuryTypes) }, injuryOf);
}
