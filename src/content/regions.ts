import type { RegionsConfig, SchoolSamplerConfig, TransferConfig } from "./schema";

// Region groupings (initial, balance/coverage-tunable). States not listed get no
// region bonus. Only states present in the school ladder need appear.
export const REGIONS: RegionsConfig = {
  South: ["AL", "GA", "FL", "MS", "LA", "SC", "TN", "NC"],
  Midwest: ["OH", "MI", "IN", "IL", "WI", "IA", "MN", "ND", "KS", "MO"],
  West: ["CA", "OR", "WA", "ID", "MT", "CO", "AZ", "UT", "NV"],
  Southwest: ["TX", "OK", "NM"],
  Northeast: ["NY", "NJ", "PA", "MA", "CT"],
};

export const SCHOOL_SAMPLER: SchoolSamplerConfig = { base: 1, homeStateBonus: 6, regionBonus: 2 };

// Transfer knobs (used in Stage-2b Tasks 5-6). One-season snap multipliers by
// move direction, and the "buried" snap threshold that surfaces a move-down offer.
export const TRANSFER: TransferConfig = {
  lateralSnapModifier: 1.1,
  moveUpSnapModifier: 0.6,
  moveDownSnapModifier: 1.3,
  buriedSnapThreshold: 250,
};
