import type { GameState } from "../engine/index";
import { rngInt, type Rng } from "../engine/rng";

export type Policy = (state: GameState, options: { id: string; label: string }[], rng: Rng) => string;

export const firstOptionPolicy: Policy = (_s, options) => options[0]!.id;

export const randomPolicy: Policy = (_s, options, rng) => options[rngInt(rng, 0, options.length - 1)]!.id;
