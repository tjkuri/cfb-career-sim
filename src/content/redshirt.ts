import type { RedshirtConfig } from "./schema";

// Initial, balance-tunable (Stage 4). A one-season sit that rolls a permanent
// overall swing: bump on success, sink on failure. Swing is a touch larger than
// the soccer training gambles (+4/-3) because a redshirt is a whole-season bet.
export const REDSHIRT: RedshirtConfig = {
  successProb: 0.6,
  bumpOverall: 5,
  sinkOverall: -3,
  sitSnapModifier: 0.05,
};
