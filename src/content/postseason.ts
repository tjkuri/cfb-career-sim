import type { PostseasonConfig, ProgressionConfig } from "./schema";

// All values are initial, balance-tunable starting points (tuned in Stage 4).
// Award stat thresholds are grounded in the STAT_MODEL yields in engine/simulate.ts:
// a full season is ~3 on-field phases x ~160 snaps at overall 70 (fewer for K, which
// plays special-teams snaps). K now produces countable stats and can earn All-Conference
// (a strong kicker clears its threshold); its tiny 0.05 prestige multiplier still keeps
// prestige awards near-impossible, holding the hard-mode draft ceiling.
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
  // All-Conference thresholds are placed at ~27.5% of seasons cleared, so the
  // award is worth the same wherever a player chooses to line up: position is a
  // setup choice here, and awards feed draft stock (awards.length * 3 in
  // draft.ts). They were previously placed ad hoc, which left OL and DL clearing
  // ~40% of seasons against OSKILL's 18% — a 1.68x career spread. K's threshold
  // already sat at 27.8% and is deliberately left alone; its lower rate comes
  // from prob 0.6, an authored difference rather than a misplacement.
  production: [
    { id: "allConference", position: "QB", stat: "passYards", threshold: 1282, prob: 0.7 },
    { id: "allConference", position: "OSKILL", stat: "scrimmageYards", threshold: 844, prob: 0.7 },
    { id: "allConference", position: "OL", stat: "pancakes", threshold: 34, prob: 0.7 },
    { id: "allConference", position: "DL", stat: "sacks", threshold: 8, prob: 0.7 },
    { id: "allConference", position: "DSKILL", stat: "tackles", threshold: 58, prob: 0.7 },
    { id: "allConference", position: "K", stat: "fieldGoals", threshold: 15, prob: 0.6 },
  ],
};

export const PROGRESSION: ProgressionConfig = {
  snapsPerDevPoint: 180,
  // A kicker's full season is ~165 snaps against a field player's ~480 (see
  // STAT_MODEL in engine/simulate.ts), i.e. ~34% of the workload. Against the
  // flat 180 divisor, floor() zeroed K's development for entire careers and
  // capped its draft stock below the round-1 threshold outright. 180 x 0.34.
  snapsPerDevPointByPosition: { K: 62 },
  devCap: 3,
  washoutOverallFloor: 45,
  washoutSnapFloor: 60,
  washoutConsecutiveSeasons: 2,
};
