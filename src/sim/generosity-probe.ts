// Brief 065 / DECISION 090 — "how generous is this game, and does anything
// know where you played?"
//
// MEASUREMENT ONLY. This file ships no balance change and no product code: it
// plays REAL careers through the shipped engine against the SHIPPED content
// bundle, and records what they finish with. Where a controlled arm is needed
// it is played against a bundle patched IN MEMORY (`src/content/**` is never
// touched on disk), the technique `route3-rung-probe.ts` established.
//
// The brief's trap, restated because every table below obeys it: *a statistic
// measured on a sub-population is not a corpus statistic*, and *when the claim
// is about what a player can experience the denominator is CAREERS, not
// seasons and not cells.* Every rate here carries its denominator. Rates whose
// denominator is a season (e.g. "share of seasons that took All-Conference")
// are labelled as such and never quoted as a career rate.
//
// CLI:
//   npx tsx src/sim/generosity-probe.ts <runs> <profile,...|all> <pos,...|all> [seedPrefix] [mode]
//
// `mode`:
//   careers    (default) — per profile x position career summary
//   tiersplit            — Heisman rate split by the highest tier the career reached
//   flattier             — controlled arm: tierBaseWinPct / conf / cfp flattened to tier 1,
//                          identical seeds, isolating tier's ONLY channel to an award
//   owner                — percentile of the product owner's career in a named population

import {
  createCareer,
  advance,
  getDecision,
  computeDraftStock,
  ALL_POSITIONS,
  type GameState,
  type Position,
  type Setup,
} from "../engine/index";
