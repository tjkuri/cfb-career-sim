import type { RedshirtConfig } from "./schema";

// Initial, balance-tunable (Stage 4). A one-season sit that rolls a permanent
// overall swing: bump on success, sink on failure. Swing is a touch larger than
// the soccer training gambles (+4/-3) because a redshirt is a whole-season bet.
export const REDSHIRT: RedshirtConfig = {
  successProb: 0.6,
  bumpOverall: 5,
  sinkOverall: -3,
  sitSnapModifier: 0.05,
  bumpDescription:
    "A year in the weight room and the scout-team huddle with nobody watching. You come back bigger, and the coaches notice in the first padded practice.",
  sinkDescription:
    "A year of reps you did not get. The game looks a half-step faster when you finally line up again, and everyone who redshirted with you looks further along.",
};
