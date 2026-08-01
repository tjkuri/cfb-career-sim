import type { EventOption, Outcome } from "./types";
import { rngChance, type Rng } from "./rng";

export function resolveOutcome(option: EventOption, rng: Rng): Outcome {
  const success = rngChance(rng, option.probability);
  if (success) return option.positiveOutcome;
  return option.negativeOutcome ?? option.positiveOutcome;
}
