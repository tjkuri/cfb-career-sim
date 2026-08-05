import type { PostseasonConfig, ProgressionConfig } from "./schema";

// All values are initial, balance-tunable starting points (tuned in Stage 4).
// Award stat thresholds are grounded in the STAT_MODEL yields in engine/simulate.ts:
// a full season is ~3 on-field phases x ~160 snaps at overall 70. K produces no
// stats in the current model, so K earns no production award (intentional hard-mode);
// its tiny prestige multiplier keeps prestige awards near-impossible too.
export const POSTSEASON: PostseasonConfig = {
  gamesPerSeason: 12,
  tierBaseWinPct: { 1: 0.45, 2: 0.5, 3: 0.58, 4: 0.68 },
  overallWinShiftPerPoint: 0.005, // (overall - 70) * this, added to base win pct
  winPctClamp: [0.12, 0.92],
  bowl: { id: "bowlWin", minWins: 7, prob: 0.55 },
  conf: { id: "confTitle", minWins: 10, probByTier: { 1: 0.5, 2: 0.45, 3: 0.4, 4: 0.5 } },
  cfp: { id: "cfpTitle", minWins: 12, probByTier: { 1: 0.05, 2: 0.1, 3: 0.2, 4: 0.35 } },
  positionMultiplier: { QB: 1.0, OSKILL: 0.8, DL: 0.4, DSKILL: 0.4, OL: 0.15, K: 0.05 },
  prestige: [
    { id: "heisman", bands: [{ min: 92, prob: 0.5 }, { min: 88, prob: 0.25 }, { min: 84, prob: 0.08 }], teamSuccessBoost: 0.5 },
    { id: "allAmerican", bands: [{ min: 85, prob: 0.6 }, { min: 80, prob: 0.3 }, { min: 75, prob: 0.1 }], teamSuccessBoost: 0.3 },
  ],
  production: [
    { id: "allConference", position: "QB", stat: "passYards", threshold: 1300, prob: 0.7 },
    { id: "allConference", position: "OSKILL", stat: "scrimmageYards", threshold: 900, prob: 0.7 },
    { id: "allConference", position: "OL", stat: "pancakes", threshold: 30, prob: 0.7 },
    { id: "allConference", position: "DL", stat: "sacks", threshold: 7, prob: 0.7 },
    { id: "allConference", position: "DSKILL", stat: "tackles", threshold: 60, prob: 0.7 },
  ],
};

export const PROGRESSION: ProgressionConfig = {
  snapsPerDevPoint: 180,
  devCap: 3,
  washoutOverallFloor: 45,
  washoutSnapFloor: 60,
  washoutConsecutiveSeasons: 2,
};
