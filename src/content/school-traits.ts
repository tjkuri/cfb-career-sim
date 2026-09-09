import type { SchoolTrait } from "../engine/types";
import type { SchoolTraitConfig } from "./schema";

// Shown in offer labels. Hints, never mechanics: the player discovers what a
// trait does by replaying, not by reading a stat block at Signing Day. Each
// suggests the benefit and the cost without naming either.
export const TRAIT_HINTS: Record<SchoolTrait, string> = {
  wideOpen: "the two-deep is thin",
  factory: "sends more guys to Sundays than anywhere else",
  developmental: "takes three-stars and turns them into draft picks",
};

// Initial values. Wave 1 measures and calibrates wideOpen (see the wave-1 plan,
// Task 6); factory and developmental are carried here so the schema and
// validator are exercised, but NO SCHOOL CARRIES THEM YET — they are inert
// until waves 2 and 3 size them against their own probe runs.
//
// Sizing note for wideOpen's cost, which is easy to get wrong by ~2x: one
// ambient injury costs ~1.67 of the 3 on-field phases in a season, not one.
// applyEffect sets remainingPhases to recoveryPhases (>= 2, schema-enforced),
// isSidelined is `remainingPhases > 0`, and tickPhaseStart decrements THEN
// heals — so the applying phase and the next are both lost. The offseason
// absorbs a tick for free, so a postseason fire costs 1 on-field phase while a
// nonconf or conference fire costs 2; mean 5/3.
//
// At injuryProbPerPhase 0.06 over ~9.3 on-field phases per career, that is
// ~0.56 extra injuries costing ~0.31 seasons of snaps, against an ongoing
// +15% snap bonus. Starting point only — Task 6 replaces these with measured
// values.
export const SCHOOL_TRAITS: SchoolTraitConfig = {
  wideOpen: {
    snapModifier: 1.15,
    injuryProbPerPhase: 0.06,
    // Soft-tissue and lower-body knocks: the injuries of a player taking more
    // snaps than his body is ready for. Deliberately excludes acl — the
    // heavy-lever injury stays reserved (see the handoff's tuning-lever list).
    injuryTypes: ["hamstring", "ankle", "turfToe"],
  },
  factory: { firstSeasonSnapModifier: 0.8, draftStockBonusPerSeason: 1.5, draftStockBonusCap: 5 },
  developmental: { snapsPerDevPointMultiplier: 0.85, earlySnapModifier: 0.9, earlySeasons: 2 },
};
