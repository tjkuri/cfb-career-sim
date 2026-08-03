import type { GameEvent, GameState } from "./types";
import { CLASS_ORDER } from "./types";
import { rngWeightedPick, type Rng } from "./rng";
import type { ContentBundle } from "../content/schema";

export function eventMatches(state: GameState, ev: GameEvent): boolean {
  if (ev.phase !== state.phase) return false;
  const c = ev.conditions;
  if (!c) return true;
  if (c.position && !c.position.includes(state.setup.position)) return false;
  if (c.tier && !c.tier.includes(state.school.tier)) return false;
  if (c.minClass) {
    const need = CLASS_ORDER.indexOf(c.minClass);
    const have = CLASS_ORDER.indexOf(state.eligibility.classYear);
    if (have < need) return false;
  }
  if (c.requiresInjury && state.injuries.length === 0) return false;
  if (c.requiresActiveInjury && !state.injuries.some((i) => i.kind === "injury")) return false;
  if (c.maxCharacter !== undefined && state.character > c.maxCharacter) return false;
  if (c.maxOverall !== undefined && state.overall > c.maxOverall) return false;
  return true;
}

export function selectRandomEvent(state: GameState, content: ContentBundle, rng: Rng): GameEvent | null {
  const pool = content.events.filter((e) => e.kind === "random" && eventMatches(state, e));
  if (pool.length === 0) return null;
  return rngWeightedPick(rng, pool, (e) => e.weight);
}
