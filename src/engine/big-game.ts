import type { BigGameResult, BigGameStakes, GameState, Matchup, PendingBigGame, Position, Spot } from "./types";
import type { ContentBundle } from "../content/schema";
import { createRng, rngChance, rngInt, rngPick, type Rng } from "./rng";
import { applyEffect, isSidelined, type InjuryLookup } from "./effects";
import { BIG_GAME_TROPHY, PLAYBOOKS, bigGameName, rivalryName, stableIndex, type Situation } from "../content/big-game";
import { CAPTAIN_BIG_GAME_EDGE, isCaptain, roleOf } from "./role";

export const BIG_GAME_EVENT_ID = "big-game";

// The film's tendency is shown as a number and varies game to game; the
// pre-snap look is honest LOOK_ACCURACY of the time. When they disagree, the
// number decides it: past about 60%, trust the film; under it, trust the look.
export const TENDENCIES = [35, 45, 60, 75, 90];
export const LOOK_ACCURACY = 0.6;

// What winning the last snap is worth, on top of the trophy.
export const BIG_GAME_WIN_OVR = 1;
export const BIG_GAME_WIN_REP = 2;

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

// A school's rival never changes: the same conference opponent every year.
function rivalOf(s: GameState, content: ContentBundle) {
  const own = content.schools.find((x) => x.id === s.school.schoolId);
  const pool = content.schools
    .filter((x) => x.id !== s.school.schoolId && x.conference === own?.conference)
    .sort((a, b) => a.id.localeCompare(b.id));
  const fallback = content.schools.filter((x) => x.id !== s.school.schoolId && x.tier === s.school.tier).sort((a, b) => a.id.localeCompare(b.id));
  const list = pool.length > 0 ? pool : fallback;
  return list[stableIndex(s.school.schoolId, list.length)]!;
}

function pickOpponent(s: GameState, stakes: BigGameStakes, content: ContentBundle, rng: Rng): string {
  if (stakes === "rivalry") return rivalOf(s, content).name;
  const own = content.schools.find((x) => x.id === s.school.schoolId);
  const others = content.schools.filter((x) => x.id !== s.school.schoolId);
  let pool = others;
  if (stakes === "cfp") pool = others.filter((x) => x.tier === Math.max(3, s.school.tier) || x.tier === 4);
  else if (stakes === "conf") pool = others.filter((x) => x.conference === own?.conference);
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
  const name =
    stakes === "rivalry"
      ? rivalryName(s.school.schoolId, rivalOf(s, content).id)
      : bigGameName(stakes, s.school.tier, own?.conference ?? "", rngInt(rng, 0, 99));
  const opponent = pickOpponent(s, stakes, content, rng);

  const role = roleOf(s, s.school.tier);
  const available = !s.redshirtSeasonActive && !isSidelined(s);
  // A backup only gets the call when the starter goes down -- which, in the
  // game that decides the season, happens more often than it should.
  const thrownIn = role === "backup" && rngChance(rng, 0.6);
  if (available && (role !== "backup" || thrownIn)) {
    // Mostly alternate packages, so the menu changes from one big game to the next.
    const lastPkg = [...s.seasons].reverse().find((l) => l.bigGame?.played)?.bigGame?.pkg;
    const count = PLAYBOOKS[s.setup.position].length;
    const pkg = lastPkg === undefined ? rngInt(rng, 0, count - 1) : rngChance(rng, 0.75) ? (lastPkg + 1) % count : lastPkg;
    const seen = s.seasons.filter((l) => (l.bigGame?.pkg ?? 0) === pkg).map((l) => l.bigGame?.situation).filter((x): x is number => x !== undefined);
    const book = playbook(s.setup.position, pkg);
    const fresh = book.situations.map((_, i) => i).filter((i) => !seen.includes(i));
    const situation = rngPick(rng, fresh.length > 0 ? fresh : book.situations.map((_, i) => i));
    const scoutedCall = rngInt(rng, 0, 2);
    const tendency = rngPick(rng, TENDENCIES);
    const theirCall = clue(scoutedCall, tendency / 100, rng);
    s.pendingBigGame = {
      stakes,
      name,
      opponent,
      theirCall,
      scoutedCall,
      tendency,
      lookCall: clue(theirCall, LOOK_ACCURACY, rng),
      situation,
      pkg,
      spot: makeSpot(s.setup.position, rng, pkg),
      thrownIn,
    };
    s.currentEventId = BIG_GAME_EVENT_ID;
    return;
  }
  // Played without the player: a coin flip leaning on the program.
  const won = rngChance(rng, 0.42 + s.school.tier * 0.03);
  finishBigGame(s, { stakes, name, opponent, won, played: false, text: watchedText(s, won) }, rng, injuryOf);
}

function clue(truth: number, accuracy: number, rng: Rng): number {
  if (rngChance(rng, accuracy)) return truth;
  return rngPick(rng, [0, 1, 2].filter((i) => i !== truth));
}

/**
 * The last snap of the season, with a score that the result has to agree
 * with, and with nothing after it: fourth down, or the clock running out. On
 * offense you trail by less than a touchdown and need to score now; on defense you lead by less than one and
 * need a stop; a kicker trails by a field goal or less.
 */
export function makeSpot(position: Position, rng: Rng, pkg = 0): Spot {
  const book = playbook(position, pkg);
  const side = book.side;
  const base = rngInt(rng, 14, 31);
  const trailing = (deficit: number, yardsToGoal: number, toGo: number, clock: number, overtime = false, forceFourth = false): Spot => ({
    side, yardsToGoal, toGo,
    down: lastSnapDown(clock, rng, forceFourth),
    clock,
    us: base - deficit, them: base, overtime,
  });
  const leading = (yardsToGoal: number, toGo: number, clock: number, forceFourth = false): Spot => ({
    side, yardsToGoal, toGo,
    down: lastSnapDown(clock, rng, forceFourth),
    clock,
    us: base, them: base - rngInt(rng, 1, 6), overtime: false,
  });

  switch (book.situation) {
    case "redzone": {
      // In overtime they have already kicked a field goal on their possession,
      // so a touchdown wins it and anything less loses it.
      const overtime = rngChance(rng, 0.2);
      const ytg = rngInt(rng, 3, 24);
      const toGo = ytg <= 10 ? ytg : Math.min(ytg, rngInt(rng, 3, 10));
      return trailing(overtime ? 3 : rngInt(rng, 3, 6), ytg, toGo, overtime ? 0 : rngInt(rng, 2, 58), overtime);
    }
    case "goalline": {
      const overtime = rngChance(rng, 0.2);
      const ytg = rngInt(rng, 1, 4);
      return trailing(overtime ? 3 : rngInt(rng, 3, 6), ytg, ytg, overtime ? 0 : rngInt(rng, 2, 58), overtime, true);
    }
    case "lastgasp":
    case "protect":
      // Midfield with the clock all but gone: it has to go the distance.
      return trailing(rngInt(rng, 3, 6), rngInt(rng, 25, 38), rngInt(rng, 3, 10), rngInt(rng, 0, 5));
    case "stop": {
      const ytg = position === "DSKILL" ? rngInt(rng, 14, 45) : rngInt(rng, 6, 35);
      return leading(ytg, Math.min(ytg, rngInt(rng, 2, 10)), rngInt(rng, 2, 65));
    }
    case "cover": {
      const ytg = rngInt(rng, 14, 45);
      return leading(ytg, Math.min(ytg, rngInt(rng, 2, 10)), rngInt(rng, 2, 65));
    }
    case "goalstand": {
      const ytg = rngInt(rng, 1, 3);
      return leading(ytg, ytg, rngInt(rng, 2, 40), true);
    }
    case "hailmary":
      return leading(rngInt(rng, 35, 46), rngInt(rng, 5, 10), rngInt(rng, 0, 4));
    case "fieldgoal": {
      const ytg = rngInt(rng, 13, 38); // a 30- to 55-yard kick
      return { side, yardsToGoal: ytg, toGo: ytg, down: 4, clock: rngInt(rng, 0, 4), us: base - rngInt(rng, 0, 2), them: base, overtime: false };
    }
    case "chipshot": {
      const ytg = rngInt(rng, 3, 12); // a 20- to 29-yard kick
      return { side, yardsToGoal: ytg, toGo: ytg, down: 4, clock: rngInt(rng, 0, 3), us: base - rngInt(rng, 0, 2), them: base, overtime: false };
    }
  }
}

/** A position's package; saves from before packages existed use the first. */
export function playbook(position: Position, pkg = 0) {
  const list = PLAYBOOKS[position];
  return list[pkg] ?? list[0]!;
}

/**
 * The snap has to be the last one. With time on the clock that means fourth
 * down; an earlier down only works when the clock runs out on the play.
 */
function lastSnapDown(clock: number, rng: Rng, forceFourth: boolean): Spot["down"] {
  if (forceFourth || clock > 5) return 4;
  return rngChance(rng, 0.5) ? 3 : 4;
}

/** Field-goal distance: the line of scrimmage, ten yards of end zone, a seven-yard hold. */
export function kickDistance(spot: Spot): number {
  return spot.yardsToGoal + 17;
}

// Longer is harder: small next to the matchup, but you can feel a 55-yarder.
// The last-play situations get a fixed nudge instead, so a heave from
// midfield is a little harder than a red-zone snap without being a coin flip.
function distanceShift(spot: Spot, situation: Situation): number {
  switch (situation) {
    case "lastgasp":
    case "protect":
      return -0.04;
    case "goalstand":
    case "hailmary":
      return 0;
    case "chipshot":
      return 0.02;
  }
  if (spot.side === "kick") return -(kickDistance(spot) - 40) * 0.01;
  if (spot.side === "offense") return -(spot.yardsToGoal - 8) * 0.005;
  return (spot.yardsToGoal - 20) * 0.003;
}

export function matchupOf(base: number): Matchup {
  return base >= 0.7 ? "strong" : base <= 0.4 ? "weak" : "even";
}

// The score after the snap, consistent with the spot.
function finalScore(spot: Spot, won: boolean): [number, number] {
  if (spot.side === "offense") return won ? [spot.us + 7, spot.them] : [spot.us, spot.them];
  if (spot.side === "defense") return won ? [spot.us, spot.them] : [spot.us, spot.them + 7];
  // A missed kick in a tie goes to overtime, and they win it there.
  if (won) return [spot.us + 3, spot.them];
  return spot.us === spot.them ? [spot.us, spot.them + 3] : [spot.us, spot.them];
}

function watchedText(s: GameState, won: boolean): string {
  const why = s.redshirtSeasonActive
    ? "You watch it in a hoodie on the sideline, redshirting."
    : isSidelined(s)
      ? "You watch it on crutches."
      : "You never get off the bench.";
  return `${why} ${won ? "They win it without you." : "They lose it without you."}`;
}

/**
 * A save parked on a big game from before spots and pre-snap looks existed
 * carries neither. Fill them in from the seed, so the decision renders and
 * resolves the same way every time.
 */
export function pendingBigGame(s: GameState): PendingBigGame | undefined {
  const g = s.pendingBigGame as (Partial<PendingBigGame> & Pick<PendingBigGame, "stakes" | "name" | "opponent">) | undefined;
  if (!g) return undefined;
  if (g.spot && g.theirCall !== undefined && g.lookCall !== undefined) return g as PendingBigGame;
  const rng = createRng(`${s.seed}:big-game:${s.seasonIndex}`);
  const scoutedCall = g.scoutedCall ?? rngInt(rng, 0, 2);
  const tendency = rngPick(rng, TENDENCIES);
  const theirCall = clue(scoutedCall, tendency / 100, rng);
  return {
    situation: 0,
    thrownIn: false,
    ...g,
    theirCall,
    scoutedCall,
    tendency,
    lookCall: clue(theirCall, LOOK_ACCURACY, rng),
    pkg: g.pkg ?? 0,
    spot: makeSpot(s.setup.position, rng, g.pkg ?? 0),
  };
}

export function resolveBigGame(s: GameState, callId: string, rng: Rng, injuryOf: InjuryLookup): void {
  const pending = pendingBigGame(s);
  if (!pending) throw new Error("No big game pending");
  const book = playbook(s.setup.position, pending.pkg);
  const mine = book.calls.findIndex((c) => c.id === callId);
  if (mine < 0) throw new Error(`Invalid play call: ${callId}`);

  const theirs = pending.theirCall;
  const base = book.odds[mine]![theirs]!;
  const p = bigGameOdds(s.overall, base + distanceShift(pending.spot, book.situation), pending.thrownIn, isCaptain(s));
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
      pkg: pending.pkg,
      spot: pending.spot,
      call: book.calls[mine]!.label,
      counter: book.counters[theirs]!.label,
      look: book.counters[pending.lookCall]!.look,
      matchup: matchupOf(base),
      callIndex: mine,
      counterIndex: theirs,
      lookIndex: pending.lookCall,
      text: won ? book.success[mine]! : book.failure[mine]!,
      score: finalScore(pending.spot, won),
    },
    rng,
    injuryOf,
  );
}

export function bigGameOdds(overall: number, base: number, thrownIn: boolean, captain = false): number {
  const p = base + (overall - 75) * 0.008 - (thrownIn ? 0.05 : 0) + (captain ? CAPTAIN_BIG_GAME_EDGE : 0);
  return Math.max(0.1, Math.min(0.92, p));
}

function finishBigGame(
  s: GameState,
  r: Omit<BigGameResult, "score"> & { score?: [number, number] },
  rng: Rng,
  injuryOf: InjuryLookup,
): void {
  const season = s.seasons[s.seasons.length - 1]!;
  // A game the player watched gets a plausible score; one they played gets
  // the score their snap produced.
  const them = rngInt(rng, 13, 31);
  const score: [number, number] = r.score ?? (r.won ? [them + rngInt(rng, 1, 7), them] : [Math.max(0, them - rngInt(rng, 1, 6)), them]);
  const result: BigGameResult = { ...r, score };
  season.bigGame = result;
  if (r.won) season.teamWins += 1;
  else season.teamLosses += 1;

  const trophy = BIG_GAME_TROPHY[r.stakes];
  if (r.won && trophy) {
    applyEffect(s, { kind: "trophy", id: trophy }, injuryOf);
    (season.honors ??= []).push(trophy);
  }
  if (!r.played) return;

  const book = playbook(s.setup.position, r.pkg);
  if (r.won) {
    applyEffect(s, { kind: "overall", timing: "immediate", amount: BIG_GAME_WIN_OVR }, injuryOf);
    applyEffect(s, { kind: "character", amount: BIG_GAME_WIN_REP }, injuryOf);
    for (const [stat, n] of Object.entries(book.statBump)) applyEffect(s, { kind: "stat", stat, amount: n }, injuryOf);
    applyEffect(s, { kind: "moment", item: `Won the ${r.name} on the last play`, icon: r.stakes === "cfp" ? "ring" : "trophy" }, injuryOf);
  } else if (r.stakes === "cfp" || r.stakes === "conf") {
    applyEffect(s, { kind: "moment", item: `One play short in the ${r.name}`, icon: "broken" }, injuryOf);
  }
}
