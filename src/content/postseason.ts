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
  // All-Conference thresholds are placed at ~27.5% of seasons cleared. Re-placed
  // once already, when the postseason depth pass added shared events: only one
  // random event fires per phase, so a deeper shared pool means fewer
  // position-event draws and less award stat. The band is the goal and these
  // are the knob — re-measure and re-place them after any content change that
  // shifts the postseason draw., so the
  // award is worth the same wherever a player chooses to line up: position is a
  // setup choice here, and awards feed draft stock (awards.length * 3 in
  // draft.ts). They were previously placed ad hoc, which left OL and DL clearing
  // ~40% of seasons against OSKILL's 18% — a 1.68x career spread. K's threshold
  // already sat at 27.8% and is deliberately left alone; its lower rate comes
  // from prob 0.6, an authored difference rather than a misplacement.
  production: [
    { id: "allConference", position: "QB", stat: "passYards", threshold: 1240, prob: 0.7 },
    { id: "allConference", position: "OSKILL", stat: "scrimmageYards", threshold: 821, prob: 0.7 },
    { id: "allConference", position: "OL", stat: "pancakes", threshold: 33, prob: 0.7 },
    { id: "allConference", position: "DL", stat: "sacks", threshold: 8, prob: 0.7 },
    { id: "allConference", position: "DSKILL", stat: "tackles", threshold: 57, prob: 0.7 },
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
  // DECISION 058, measured in report 034 §4 (candidate F2, 9,000 careers per
  // profile). Do not re-derive these by eye: 200/60 is the gentle end of the
  // sweep, chosen because it makes a failing career visible in the number the
  // player already watches without touching a well-played one (`good` stays at
  // 0.9% undrafted / 40.7% round 1).
  declineSnapFloor: 200,
  snapsPerDeclinePoint: 60,
  // 200 x 0.34 and 60 x 0.34, the same workload factor as snapsPerDevPoint's
  // K entry above. Without these a well-played kicker -- ~559 career snaps
  // against a field player's ~1,450 -- sits under the flat 200 floor every
  // season and declines all career: measured at 4.53% undrafted and 5.47%
  // round 1, against 0.07% and 50.7% for a QB played identically well.
  declineSnapFloorByPosition: { K: 68 },
  snapsPerDeclinePointByPosition: { K: 20 },
  washoutOverallFloor: 45,
  washoutSnapFloor: 60,
  washoutConsecutiveSeasons: 2,
};
