import type { BigGameResult, BigGameStakes, GameState, PendingBigGame } from "./types";
import type { ContentBundle } from "../content/schema";
import { rngChance, rngInt, rngPick, type Rng } from "./rng";
import { applyEffect, isSidelined, type InjuryLookup } from "./effects";
import { BIG_GAME_TROPHY, PLAYBOOKS, bigGameName } from "../content/big-game";
import { roleFor } from "./role";

export const BIG_GAME_EVENT_ID = "big-game";

// How often the film room's tip is the call the other side actually runs.
export const SCOUT_ACCURACY = 0.6;

function pickStakes(s: GameState, wins: number, rng: Rng): BigGameStakes {
  const tier = s.school.tier;
  const cfp =
    (tier === 4 && wins >= 11) ||
    (tier === 3 && wins >= 12) ||
    (tier === 3 && wins >= 11 && rngChance(rng, 0.35)) ||
    (tier === 2 && wins >= 12 && rngChance(rng, 0.2)) ||
    (tier === 1 && wins >= 11 && rngChance(rng, 0.5));
  if (cfp) return "cfp";
  if (wins >= 9 && rngChance(rng, 0.6)) return "conf";
  if (wins >= (tier === 1 ? 8 : 6)) return "bowl";
  return "rivalry";
}

function pickOpponent(s: GameState, stakes: BigGameStakes, content: ContentBundle, rng: Rng): string {
  const own = content.schools.find((x) => x.id === s.school.schoolId);
  const others = content.schools.filter((x) => x.id !== s.school.schoolId);
  let pool = others;
  if (stakes === "cfp") pool = others.filter((x) => x.tier === Math.max(3, s.school.tier) || x.tier === 4);
  else if (stakes === "conf" || stakes === "rivalry") pool = others.filter((x) => x.conference === own?.conference);
  else pool = others.filter((x) => x.tier === s.school.tier && x.conference !== own?.conference);
  if (stakes === "cfp" && s.school.tier === 1) pool = others.filter((x) => x.tier === 1);
  if (pool.length === 0) pool = others.filter((x) => x.tier === s.school.tier);
  if (pool.length === 0) pool = others;
  return rngPick(rng, pool).name;
}

/**
 * Called once the regular season is in the books. Works out the biggest game
 * the team reached and either raises it as a decision (the player calls the
 * play) or, when the player cannot take the field, plays it out on its own.
 */
export function setupBigGame(s: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  const season = s.seasons[s.seasons.length - 1];
  if (!season || season.seasonIndex !== s.seasonIndex) return;
  const stakes = pickStakes(s, season.teamWins, rng);
  const own = content.schools.find((x) => x.id === s.school.schoolId);
  const name = bigGameName(stakes, s.school.tier, own?.conference ?? "", rngInt(rng, 0, 99));
  const opponent = pickOpponent(s, stakes, content, rng);

  const role = roleFor(s.overall, s.school.tier);
  const available = !s.redshirtSeasonActive && !isSidelined(s);
  // A backup only gets the call when the starter goes down -- which, in the
  // game that decides the season, happens more often than it should.
  const thrownIn = role === "backup" && rngChance(rng, 0.6);
  if (available && (role !== "backup" || thrownIn)) {
    const seen = s.seasons.map((l) => l.bigGame?.situation).filter((x): x is number => x !== undefined);
    const book = PLAYBOOKS[s.setup.position];
    const fresh = book.situations.map((_, i) => i).filter((i) => !seen.includes(i));
    const situation = rngPick(rng, fresh.length > 0 ? fresh : book.situations.map((_, i) => i));
    s.pendingBigGame = { stakes, name, opponent, scoutedCall: rngInt(rng, 0, 2), situation, thrownIn };
    s.currentEventId = BIG_GAME_EVENT_ID;
    return;
  }
  // Played without the player: a coin flip leaning on the program.
  const won = rngChance(rng, 0.42 + s.school.tier * 0.03);
  finishBigGame(s, { stakes, name, opponent, won, played: false, text: watchedText(s, won) }, rng, injuryOf);
}

function watchedText(s: GameState, won: boolean): string {
  const why = s.redshirtSeasonActive
    ? "You watch it in a hoodie on the sideline, redshirting."
    : isSidelined(s)
      ? "You watch it on crutches."
      : "You never get off the bench.";
  return `${why} ${won ? "They win it without you." : "They lose it without you."}`;
}

export function resolveBigGame(s: GameState, callId: string, rng: Rng, injuryOf: InjuryLookup): void {
  const pending = s.pendingBigGame;
  if (!pending) throw new Error("No big game pending");
  const book = PLAYBOOKS[s.setup.position];
  const mine = book.calls.findIndex((c) => c.id === callId);
  if (mine < 0) throw new Error(`Invalid play call: ${callId}`);

  let theirs = pending.scoutedCall;
  if (!rngChance(rng, SCOUT_ACCURACY)) {
    const rest = [0, 1, 2].filter((i) => i !== pending.scoutedCall);
    theirs = rngPick(rng, rest);
  }
  const p = bigGameOdds(s.overall, book.odds[mine]![theirs]!, pending.thrownIn);
  const won = rngChance(rng, p);
  s.pendingBigGame = undefined;
  s.currentEventId = null;
  finishBigGame(
    s,
    {
      stakes: pending.stakes,
      name: pending.name,
      opponent: pending.opponent,
      won,
      played: true,
      situation: pending.situation,
      call: book.calls[mine]!.label,
      counter: book.counters[theirs]!.label,
      text: won ? book.success[mine]! : book.failure[mine]!,
    },
    rng,
    injuryOf,
  );
}

export function bigGameOdds(overall: number, base: number, thrownIn: boolean): number {
  const p = base + (overall - 75) * 0.008 - (thrownIn ? 0.05 : 0);
  return Math.max(0.1, Math.min(0.92, p));
}

function finishBigGame(
  s: GameState,
  r: Omit<BigGameResult, "score">,
  rng: Rng,
  injuryOf: InjuryLookup,
): void {
  const season = s.seasons[s.seasons.length - 1]!;
  const them = rngInt(rng, 13, 31);
  // A kicker's winner is a field goal; everyone else's is a touchdown or a stop.
  const margin = s.setup.position === "K" ? rngInt(rng, 1, 3) : rngInt(rng, 1, 7);
  const us = r.won ? them + margin : Math.max(0, them - rngInt(rng, 1, 6));
  const result: BigGameResult = { ...r, score: [us, them] };
  season.bigGame = result;
  if (r.won) season.teamWins += 1;
  else season.teamLosses += 1;

  const trophy = BIG_GAME_TROPHY[r.stakes];
  if (r.won && trophy) {
    applyEffect(s, { kind: "trophy", id: trophy }, injuryOf);
    (season.honors ??= []).push(trophy);
  }
  if (!r.played) return;

  const book = PLAYBOOKS[s.setup.position];
  if (r.won) {
    applyEffect(s, { kind: "overall", timing: "immediate", amount: 1 }, injuryOf);
    applyEffect(s, { kind: "character", amount: 3 }, injuryOf);
    for (const [stat, n] of Object.entries(book.statBump)) applyEffect(s, { kind: "stat", stat, amount: n }, injuryOf);
    applyEffect(s, { kind: "moment", item: `Won the ${r.name} on the last play`, icon: r.stakes === "cfp" ? "ring" : "trophy" }, injuryOf);
  } else if (r.stakes === "cfp" || r.stakes === "conf") {
    applyEffect(s, { kind: "moment", item: `One play short in the ${r.name}`, icon: "broken" }, injuryOf);
  }
}
