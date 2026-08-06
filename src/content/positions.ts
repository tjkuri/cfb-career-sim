import type { Position } from "../engine/types";

export const POSITIONS: Record<Position, { label: string; stats: string[] }> = {
  QB: { label: "Quarterback", stats: ["passYards", "passTds", "ints"] },
  OSKILL: { label: "Offensive skill", stats: ["scrimmageYards", "totalTds", "receptions"] },
  OL: { label: "Offensive line", stats: ["pancakes", "sacksAllowed"] },
  DL: { label: "Defensive line", stats: ["sacks", "tfls", "tackles"] },
  DSKILL: { label: "Defensive skill", stats: ["tackles", "ints", "passBreakups"] },
  K: { label: "Kicker", stats: ["fieldGoals", "points", "gameWinners"] },
};
