import type { PostseasonConfig, ProgressionConfig } from "./schema";

// Trophies are no longer rolled here: each season's trophy is decided by the
// big game the team reached (content/big-game.ts), with the player calling the
// last play. This table covers the regular season and individual awards.
export const POSTSEASON: PostseasonConfig = {
  gamesPerSeason: 12,
  tierBaseWinPct: { 1: 0.5, 2: 0.52, 3: 0.58, 4: 0.7 },
  overallWinShiftPerPoint: 0.006, // (overall - 70) * this * role impact
  winPctClamp: [0.15, 0.93],
  // A Heisman at Incarnate Word should be a story people tell, not a Tuesday.
  tierExposure: { 1: 0.06, 2: 0.3, 3: 0.75, 4: 1 },
  positionMultiplier: { QB: 1.0, OSKILL: 0.8, DL: 0.4, DSKILL: 0.4, OL: 0.15, K: 0.05 },
  prestige: [
    { id: "heisman", bands: [{ min: 94, prob: 0.45 }, { min: 90, prob: 0.22 }, { min: 86, prob: 0.07 }], teamSuccessBoost: 0.6 },
    { id: "allAmerican", bands: [{ min: 92, prob: 0.7 }, { min: 88, prob: 0.45 }, { min: 84, prob: 0.25 }, { min: 80, prob: 0.1 }], teamSuccessBoost: 0.3 },
  ],
  // Season production gates, placed for a full-time starter.
  production: [
    { id: "allConference", position: "QB", stat: "passYards", threshold: 1350, prob: 0.75 },
    { id: "allConference", position: "OSKILL", stat: "scrimmageYards", threshold: 900, prob: 0.75 },
    { id: "allConference", position: "OL", stat: "pancakes", threshold: 32, prob: 0.75 },
    { id: "allConference", position: "DL", stat: "sacks", threshold: 8, prob: 0.75 },
    { id: "allConference", position: "DSKILL", stat: "tackles", threshold: 62, prob: 0.75 },
    { id: "allConference", position: "K", stat: "fieldGoals", threshold: 15, prob: 0.75 },
  ],
};

export const PROGRESSION: ProgressionConfig = {
  // Growth is earned: a little for being young, most of it for playing time
  // and for who you practise against every day.
  devByClass: { FR: 1, SO: 0, JR: 0, SR: 0 },
  devByRole: { starter: 3, rotation: 2, backup: 0 },
  devByTier: { 1: 0, 2: 1, 3: 2, 4: 3 },
  devJitter: 1,
  washoutOverallFloor: 45,
  washoutSnapFloor: 40,
  washoutSnapFloorByPosition: { K: 14 },
  washoutConsecutiveSeasons: 2,
};
