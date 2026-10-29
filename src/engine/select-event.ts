import type { GameEvent, GameState } from "./types";
import { CLASS_ORDER } from "./types";
import { rngWeightedPick, type Rng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { schoolTraitOf } from "./school-effects";
// Default param, not a required third argument: eventMatches has ~30 call
// sites in select-event.test.ts and long-injury.test.ts, none of which care
// about schoolTrait conditions. Mirrors createCareer's own CONTENT default.
import { CONTENT } from "../content/index";

export function eventMatches(
  state: GameState,
  ev: GameEvent,
  content: ContentBundle = CONTENT,
  phases: readonly GameState["phase"][] = [state.phase],
): boolean {
  if (!phases.includes(ev.phase)) return false;
  const c = ev.conditions;
  if (!c) return true;
  if (c.position && !c.position.includes(state.setup.position)) return false;
  if (c.tier && !c.tier.includes(state.school.tier)) return false;
  if (c.schoolTrait) {
    const trait = schoolTraitOf(state, content);
    if (!trait || !c.schoolTrait.includes(trait)) return false;
  }
  if (c.seasonIndex && !c.seasonIndex.includes(state.seasonIndex)) return false;
  if (c.minClass) {
    const need = CLASS_ORDER.indexOf(c.minClass);
    const have = CLASS_ORDER.indexOf(state.eligibility.classYear);
    if (have < need) return false;
  }
  if (c.requiresInjury && state.injuries.length === 0) return false;
  if (c.requiresActiveInjury && !state.injuries.some((i) => i.kind === "injury")) return false;
  if (c.requiresFinalSeason) {
    // Final playable season == yearsUsed one short of the eligibility cap.
    // A redshirt raises the cap by exactly the year it consumes, so a sit
    // season can never satisfy this.
    const cap = CLASS_ORDER.length + (state.eligibility.redshirtUsed ? 1 : 0);
    if (state.eligibility.yearsUsed !== cap - 1) return false;
  }
  // Milestones assume the player is on the field. A redshirt sit season is
  // exactly the case where they are not, so gate those beats out of it.
  if (c.requiresPlaying && state.redshirtSeasonActive) return false;
  // The mirror (DECISION 066). A card that is FOR the sit season is gated out
  // of every played one. Inert until a card sets it: no shipped event does.
  if (c.requiresRedshirt && !state.redshirtSeasonActive) return false;
  if (c.maxCharacter !== undefined && state.character > c.maxCharacter) return false;
  if (c.maxOverall !== undefined && state.overall > c.maxOverall) return false;
  if (c.minOverall !== undefined && state.overall < c.minOverall) return false;
  return true;
}

// A random card never repeats within a career, and `phases` lets one draw
// stand for a stretch of the season rather than a single phase.
export function selectRandomEvent(
  state: GameState,
  content: ContentBundle,
  rng: Rng,
  phases: readonly GameState["phase"][] = [state.phase],
): GameEvent | null {
  const fired = new Set(state.firedEventIds ?? []);
  const pool = content.events.filter(
    (e) => e.kind === "random" && !fired.has(e.id) && eventMatches(state, e, content, phases),
  );
  if (pool.length === 0) return null;
  return rngWeightedPick(rng, pool, (e) => e.weight * (e.conditions?.position ? POSITION_CARD_BOOST : 1));
}

// Position cards are the football; off-field cards are seasoning. Without
// this, the ~30 shared off-field cards outweigh a position's ~10 cards three
// to one, and the same handful (the cousin, the group chat) turns up in most
// careers whatever you play.
export const POSITION_CARD_BOOST = 3;

export function selectFixedEvent(state: GameState, content: ContentBundle): GameEvent | null {
  for (const ev of content.events) {
    if (ev.kind !== "fixed" || ev.id === "recruiting") continue;
    if (state.phaseFiredEventIds.includes(ev.id)) continue;
    if (eventMatches(state, ev, content)) return ev;
  }
  return null;
}
