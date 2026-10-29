import type { RegionsConfig, SchoolSamplerConfig } from "./schema";

// Region groupings (initial, balance/coverage-tunable). States not listed get no
// region bonus. Only states present in the school ladder need appear.
export const REGIONS: RegionsConfig = {
  South: ["AL", "GA", "FL", "MS", "LA", "SC", "TN", "NC", "KY", "VA"],
  Midwest: ["OH", "MI", "IN", "IL", "WI", "IA", "MN", "ND", "KS", "MO"],
  West: ["CA", "OR", "WA", "ID", "MT", "CO", "AZ", "UT", "NV"],
  Southwest: ["TX", "OK", "NM"],
  Northeast: ["NY", "NJ", "PA", "MA", "CT"],
};

// Geographic pull scales with tier: a small school recruits its backyard, a
// blue blood recruits nationally. Initial values, tuned in Stage 4.
export const SCHOOL_SAMPLER: SchoolSamplerConfig = {
  base: 1,
  homeStateBonus: { 1: 12, 2: 8, 3: 4, 4: 1 },
  regionBonus: { 1: 5, 2: 3, 3: 2, 4: 0.5 },
  // How many schools a recruit chooses between on Signing Day.
  offerCount: 3,
};
