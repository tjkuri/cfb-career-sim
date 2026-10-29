import type { Role, Tier } from "./types";

// The overall a player needs to start at each tier. Rotation is a step below.
// A 60-overall freshman starts at FCS, rotates in the Group of 5, and sits at a
// power program -- which is the whole Signing Day decision.
export const STARTER_BAR: Record<Tier, number> = { 1: 58, 2: 65, 3: 72, 4: 78 };
export const ROTATION_GAP = 7;

export const ROLE_SNAPS: Record<Role, number> = { starter: 1, rotation: 0.55, backup: 0.2 };

export const TIER_NAMES: Record<Tier, string> = {
  1: "FCS",
  2: "Group of 5",
  3: "Power Four",
  4: "Blueblood",
};

export function roleFor(overall: number, tier: Tier): Role {
  const bar = STARTER_BAR[tier];
  if (overall >= bar) return "starter";
  if (overall >= bar - ROTATION_GAP) return "rotation";
  return "backup";
}
