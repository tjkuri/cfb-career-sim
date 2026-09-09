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
// MEASURED (Task 6, n=3000 per position, `npx tsx src/sim/trait-probe.ts 3000
// all`). wideOpen bucket vs untraited bucket, ranges across the six positions:
//
//   avgInjuries         wideOpen 1.07-1.27   untraited 0.61-0.78
//   avgFinalOverall     wideOpen 72.7-73.7   untraited 70.9-72.1
//   allConfRate         wideOpen 0.48-0.58   untraited 0.32-0.39
//   actuallyPickedRate  wideOpen 0.88-0.94   untraited 0.87-0.94
//
// DO NOT tune against those raw gaps. They are dominated by confounding, not by
// the trait. Re-running the identical probe with the trait NULLED (snapModifier
// 1.0, injuryProbPerPhase 0 — both schema-legal) leaves the bucket gap on
// avgFinalOverall at +1.9 to +2.7 and on allConfRate at +0.09 to +0.13 with the
// trait doing nothing at all. Two reasons: (a) the bucket is "ever attended",
// and longer careers get more chances to land at one of the 11 wideOpen schools,
// so the untraited bucket is enriched in short careers (avgSeasons 2.80 vs 3.18);
// (b) wideOpen sits only at tiers 1-2, where all-conference is easier to win.
// Conditioning on career length collapses the overall gap to ~0 (at 2 seasons,
// 67.38 vs 67.47; at 3, 72.17 vs 72.35; at 5, 82.45 vs 83.26).
//
// The trait's actual causal effect is that null A/B's difference — same seeds,
// same schools, same bucket, magnitudes the only variable:
//
//   avgInjuries        +0.27 to +0.35   (the cost lands, clearly)
//   allConfRate        +0.05 to +0.11   (the snap bonus buys in-season honors)
//   actuallyPickedRate -0.016 to -0.053 (the injuries take draft outcomes back)
//   avgFinalOverall    -0.21 to -0.48
//   round1Rate         -0.010 to +0.007 (nil)
//
// 1.15 / 0.06 are KEPT UNCHANGED because that is variance without drift, which
// is the whole design intent: the bonus and the cost land on different currencies
// and cancel in net — snaps buy all-conference, injuries give back the draft —
// while every whole-population band holds (`npx tsx src/sim/balance.ts 3000
// random all`: picked 0.894-0.949, round1 non-K 0.0217-0.0240 with K at 0.0063,
// busted 0.0143-0.0280, allConf 0.420-0.521 spread 1.24x, charU55 0.397-0.463,
// avgSeasons 3.056-3.071). Nothing was moved because nothing was off.
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
