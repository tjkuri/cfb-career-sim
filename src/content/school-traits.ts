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
// 1.15 / 0.06 are KEPT UNCHANGED. The bonus and the cost land on different
// currencies and very nearly cancel — snaps buy all-conference, injuries give
// back the draft — while every whole-population band holds except one
// pre-existing exception noted below (`npx tsx src/sim/balance.ts 3000 random
// all`: picked 0.900-0.953 [OL's 0.953 is out of the 0.85-0.95 band, see
// below], round1 non-K 0.0203-0.0293 with K at 0.0057, busted 0.0127-0.0253,
// allConf 0.427-0.520 spread 1.217x, charU55 0.402-0.464, avgSeasons
// 3.059-3.072).
//
// UPDATED by the pre-merge fix wave (findings 2 and 3 of the whole-branch
// review, both wave-1 defects): rollAmbientInjury now skips redshirt seasons
// entirely (the benefit was already zero there, so charging the cost broke
// the spec's shared-temporal-scope rule — see the WHY comment on that
// function in school-effects.ts), and both trait-gated school-life.ts events
// picked up the missing requiresPlaying gate. Both changes remove injury/
// overall exposure that had no business firing on a sitting player, so
// bustedRate fell wave-wide (was 0.0150-0.0267) and picked rose slightly
// wave-wide — including OL, to 0.9533. That is NOT a fix-wave regression: OL's
// picked rate was ALREADY over the 0.9500 ceiling before wideOpen ever
// existed (0.9617, measured pre-wave-1 on f554bc0 — see the handoff's target-
// bands table). Wave 1 happened to pull it down to exactly 0.9500; this fix
// wave partially undid that, back toward its pre-existing value. Reported as
// a pre-existing exception, not tuned away — 1.15/0.06 stay unchanged per
// this file's own rule below, and the fix-wave report has the full
// before/after table.
//
// State it plainly rather than calling it neutral: avgFinalOverall drifts
// slightly NEGATIVE in all six positions (-0.21 to -0.48), one-directional, not
// pure variance. It is small, it is inside every band, and it is the price of a
// trait whose cost is real — but it is a drift, not noise, and if a later wave
// adds anything else that shaves overall, this stacks with it.
//
// ── Before touching snapModifier, read this ────────────────────────────────
// Its benefit is a CLIFF, not a slope. Development is
// `min(devCap 3, floor(seasonSnaps / snapsPerDevPoint))` (engine/advance.ts),
// an absolute divisor of 180 for field players and 62 for K. Snaps come from
// `rngInt(snapsMin, snapsMax)` per on-field phase (STAT_MODEL,
// engine/simulate.ts), so what decides whether the bonus does ANYTHING is
// whether it lifts mean snaps-per-phase past the divisor. The modifier needed
// is therefore `divisor / meanSnapsPerPhase`, independent of how many phases a
// season actually survives:
//
//   pos      mean/phase   3-phase season   dev @1.0   dev @1.15   needs >=
//   QB       160          480              2          3           1.125
//   OSKILL   160          480              2          3           1.125
//   DL       165          495              2          3           1.091
//   DSKILL   165          495              2          3           1.091
//   K         55          165              2          3           1.127
//   OL       185          555              3          3           (already over)
//
// So 1.15 buys a whole development point — the third, i.e. the devCap — for
// five of six positions, and clears the boundary by only ~12 snaps at the QB/
// OSKILL mean (552 vs 540) and ~4 at K's (190 vs 186). Anything at or below
// 1.125 silently zeroes the trait's entire upside for QB/OSKILL/K while leaving
// injuryProbPerPhase fully intact — the same shape as the K development defect
// of the previous stage, where a snap difference was annihilated by Math.floor.
// **Lowering this is not a small adjustment. There is no gentle trim available.**
//
// It is distributional, not a hard cliff per career: per-phase draws span
// 120-200 (QB/OSKILL), so a healthy season ranges ~360-600 and injuries remove
// whole phases. Only the MEAN sits just above the boundary — plenty of
// individual seasons fall short of it, which is what makes the trait read as
// variance rather than as a flat +1 overall. Waves 2 and 3 sizing `factory`'s
// and `developmental`'s snap modifiers must size against this same table; note
// OL is already above the divisor unmodified and so is insensitive to small
// snap bonuses, while K's 62 divisor gives it its own boundary entirely.
//
// Nothing was moved because nothing was off.
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
