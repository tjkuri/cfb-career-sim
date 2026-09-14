import type { GameState } from "../engine/index";
import { rngInt, type Rng } from "../engine/rng";

export type Policy = (state: GameState, options: { id: string; label: string }[], rng: Rng) => string;

export const firstOptionPolicy: Policy = (_s, options) => options[0]!.id;

export const randomPolicy: Policy = (_s, options, rng) => options[rngInt(rng, 0, options.length - 1)]!.id;

// ---------------------------------------------------------------------------
// Deliberately-bad play (brief 018, stage 1 measurement)
//
// `firstOptionPolicy` and `randomPolicy` are content-blind. To ask "can you
// lose?" we need a policy that plays badly ON PURPOSE, and "badly" has to be
// defined against something, because the engine exposes no reward signal. The
// definition used here is the engine's own objective function: NFL draft stock,
// as computed by `deriveDraftStock` (engine/draft.ts). Every option's authored
// effects are scored in draft-stock points and the worst-scoring option is
// taken. See `optionScore` below for the full weight table and its derivation.
//
// Two definitions of "bad" are supported, because they are genuinely different
// players and the numbers differ between them:
//
//   "lazy"     — ending effects score ZERO. This is a player who takes the
//                low-effort, self-serving option every time and simply does not
//                weigh the consequence. It is the 014 playtester: skipped the
//                install, ghosted the media, played hurt.
//   "saboteur" — ending effects score ENDING_PENALTY (a large negative). This
//                is a player actively trying to end the career. It is the upper
//                bound on reachable failure, not a plausible human.
//
//   "best"     — the same scorer, maximised. The control: a player who plays
//                well. A balance change that a good player "should not notice"
//                is a change that barely moves this row.
// ---------------------------------------------------------------------------

import type { ContentBundle } from "../content/schema";
import { CONTENT } from "../content/index";
import type { Effect, EventOption, Outcome, SchoolOffer, Tier } from "../engine/types";
import { STAT_MODEL } from "../engine/simulate";

// Marginal draft-stock value of one unit of each currency, read straight off
// deriveDraftStock (engine/draft.ts):
//
//   overallPart    = (overall - 40) * 1.4        -> 1.4 stock per overall point
//   characterPart  = (character - 50) * 0.15     -> 0.15 stock per character point
//   production     = min(15, totalSnaps / 200)   -> 0.005 stock per snap, below the cap
//   trophyPart     = trophies * 2.5
//   awardPart      = awards * 3
//
// `stat` effects score 0: they feed the All-Conference production awards
// indirectly, and pricing that properly would need a per-position threshold
// model. This understates the value of stat-bearing options for every policy
// equally, and is recorded as a known limitation of the scorer.
export const STOCK_WEIGHTS = {
  overallPoint: 1.4,
  characterPoint: 0.15,
  snap: 0.005,
  trophy: 2.5,
  award: 3,
  // An injury's overall hit is restored on heal (effects.ts), so it is only
  // durable where it straddles a boundary the engine freezes overall at: the
  // season boundary's development + washout checks, or the draft itself. One
  // boundary in four phase transitions, hence 0.25.
  injuryStraddle: 0.25,
} as const;

// Large enough that no realistic stack of stat effects can outweigh it, small
// enough to stay clear of floating-point trouble.
export const ENDING_PENALTY = -1000;

function meanSnapsPerPhase(position: keyof typeof STAT_MODEL): number {
  const m = STAT_MODEL[position];
  return (m.snapsMin + m.snapsMax) / 2;
}

export function effectScore(
  effect: Effect,
  position: keyof typeof STAT_MODEL,
  content: ContentBundle,
  endingWeight: number,
): number {
  const perPhase = meanSnapsPerPhase(position);
  switch (effect.kind) {
    case "overall":
      // Deferred and immediate both land before computeDraftResult
      // (finalizeIfEnded flushes the queue), so they price the same.
      return effect.amount * STOCK_WEIGHTS.overallPoint;
    case "character":
      return effect.amount * STOCK_WEIGHTS.characterPoint;
    case "snaps":
      return effect.amount * STOCK_WEIGHTS.snap;
    case "stat":
      return 0;
    case "injury": {
      const info = content.injuries[effect.injuryType] ?? { overallDelta: 3, recoveryPhases: 2 };
      const lostSnaps = info.recoveryPhases * perPhase;
      return -(lostSnaps * STOCK_WEIGHTS.snap)
        - STOCK_WEIGHTS.injuryStraddle * info.overallDelta * STOCK_WEIGHTS.overallPoint;
    }
    case "suspension":
      return -(effect.phases * perPhase * STOCK_WEIGHTS.snap);
    case "trophy":
      return STOCK_WEIGHTS.trophy;
    case "award":
      return STOCK_WEIGHTS.award;
    case "moment":
      return 0;
    case "ending":
      return endingWeight;
    default: {
      const _exhaustive: never = effect;
      throw new Error(`Unhandled effect kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}

export function outcomeScore(
  outcome: Outcome,
  position: keyof typeof STAT_MODEL,
  content: ContentBundle,
  endingWeight: number,
): number {
  return outcome.effects.reduce((a, e) => a + effectScore(e, position, content, endingWeight), 0);
}

// Expected draft-stock delta of taking this option, using the option's own
// authored probability. `negativeOutcome` absent means the option is
// deterministic (resolveOutcome falls back to positiveOutcome).
export function optionScore(
  option: EventOption,
  position: keyof typeof STAT_MODEL,
  content: ContentBundle,
  endingWeight: number,
): number {
  const p = Math.max(0, Math.min(1, option.probability));
  const pos = outcomeScore(option.positiveOutcome, position, content, endingWeight);
  const neg = option.negativeOutcome
    ? outcomeScore(option.negativeOutcome, position, content, endingWeight)
    : pos;
  return p * pos + (1 - p) * neg;
}

// The character-only score of an option: expected character delta, in raw
// character points rather than draft-stock points.
//
// This exists because the draft-stock scorer answers a different question than
// the 014 playtester's behaviour did. `deriveDraftStock` prices a character
// point at 0.15 against an overall point's 1.4, so a stock-minimising player
// dumps OVERALL and leaves character almost untouched — the exact opposite of
// a player who skips the install, ghosts the media and lets a relative handle
// the money. Those are character choices, and the six authored bust events are
// gated on character. Measuring "can you lose?" with a policy that never
// crosses a bust gate would answer the wrong question.
export function optionCharacterScore(option: EventOption): number {
  const sumChar = (o: Outcome | undefined) =>
    (o?.effects ?? []).reduce((a, e) => a + (e.kind === "character" ? e.amount : 0), 0);
  const p = Math.max(0, Math.min(1, option.probability));
  const pos = sumChar(option.positiveOutcome);
  const neg = option.negativeOutcome ? sumChar(option.negativeOutcome) : pos;
  return p * pos + (1 - p) * neg;
}

export type EventStrategy = "first" | "random" | "lazy" | "saboteur" | "antisocial" | "best";
export type RecruitStrategy = "first" | "random" | "highestTier" | "lowestTier";
export type DeclareStrategy = "asap" | "never" | "random";
export type TransferStrategy = "stay" | "up" | "upOrLateral" | "lateral" | "down" | "random";
export type RedshirtStrategy = "take" | "decline" | "random";

export interface PolicyProfile {
  events: EventStrategy;
  recruiting: RecruitStrategy;
  declare: DeclareStrategy;
  transfer: TransferStrategy;
  redshirt: RedshirtStrategy;
}

const ENDING_WEIGHT: Record<"lazy" | "saboteur" | "antisocial" | "best", number> = {
  lazy: 0,
  saboteur: ENDING_PENALTY,
  // The antisocial player is careless, not suicidal: same weighting as lazy.
  antisocial: 0,
  // A good player treats a career-ending outcome as the catastrophe it is.
  best: ENDING_PENALTY,
};

// Character dominates, draft stock breaks the (very common) ties: most options
// carry no character effect at all, and without a tiebreak the policy would
// collapse to "first option" across most of the content.
const CHARACTER_PRIORITY = 1000;

function pickTier(offers: SchoolOffer[], want: "high" | "low"): string {
  let best = offers[0]!;
  for (const o of offers) {
    if (want === "high" ? o.tier > best.tier : o.tier < best.tier) best = o;
  }
  return best.id;
}

function transferChoice(
  offers: SchoolOffer[],
  currentTier: Tier,
  strategy: TransferStrategy,
  rng: Rng,
): string {
  const stay = offers.find((o) => o.id === "stay") ?? offers[0]!;
  const up = offers.find((o) => o.id !== "stay" && o.tier > currentTier);
  const lateral = offers.find((o) => o.id !== "stay" && o.tier === currentTier);
  const down = offers.find((o) => o.id !== "stay" && o.tier < currentTier);
  switch (strategy) {
    case "stay": return stay.id;
    case "up": return (up ?? stay).id;
    case "upOrLateral": return (up ?? lateral ?? stay).id;
    case "lateral": return (lateral ?? stay).id;
    case "down": return (down ?? stay).id;
    case "random": return offers[rngInt(rng, 0, offers.length - 1)]!.id;
  }
}

// Build a policy out of one strategy per decision surface, so a measurement can
// vary exactly one of them and hold the rest fixed. That separation is the
// whole point: "is the offseason a decision?" is unanswerable if the event
// policy moves at the same time as the transfer policy.
export function makePolicy(profile: PolicyProfile, content: ContentBundle = CONTENT): Policy {
  return (state, options, rng) => {
    const id = state.currentEventId;

    if (id === "recruiting" || id === "transfer") {
      const offers = state.pendingOptions ?? [];
      if (offers.length === 0) return options[0]!.id;
      if (id === "recruiting") {
        switch (profile.recruiting) {
          case "first": return offers[0]!.id;
          case "random": return offers[rngInt(rng, 0, offers.length - 1)]!.id;
          case "highestTier": return pickTier(offers, "high");
          case "lowestTier": return pickTier(offers, "low");
        }
      }
      return transferChoice(offers, state.school.tier, profile.transfer, rng);
    }

    if (id === "declare") {
      switch (profile.declare) {
        case "asap": return "declare";
        case "never": return "return";
        case "random": return rngInt(rng, 0, 1) === 0 ? "declare" : "return";
      }
    }

    if (id === "redshirt") {
      switch (profile.redshirt) {
        case "take": return "redshirt";
        case "decline": return "decline";
        case "random": return rngInt(rng, 0, 1) === 0 ? "redshirt" : "decline";
      }
    }

    if (profile.events === "first") return options[0]!.id;
    if (profile.events === "random") return options[rngInt(rng, 0, options.length - 1)]!.id;

    const ev = content.events.find((e) => e.id === id);
    // No authored event behind this decision (should not happen — every hub
    // decision is handled above). Fall back to the first option rather than
    // throwing, so a content change can never break a measurement run.
    if (!ev) return options[0]!.id;
    const weight = ENDING_WEIGHT[profile.events];
    const position = state.setup.position;
    const scored = ev.options.map((o) => ({
      id: o.id,
      score: optionScore(o, position, content, weight)
        + (profile.events === "antisocial" ? CHARACTER_PRIORITY * optionCharacterScore(o) : 0),
    }));
    // Ties resolve to the first option, so a profile is deterministic given a seed.
    let chosen = scored[0]!;
    for (const s of scored) {
      if (profile.events === "best" ? s.score > chosen.score : s.score < chosen.score) chosen = s;
    }
    return chosen.id;
  };
}

// The named profiles the 018 measurement runs. Kept here rather than in the
// probe so a later stage can re-run the identical policy by name.
export const PROFILES = {
  // Controls.
  baselineRandom: { events: "random", recruiting: "random", declare: "random", transfer: "random", redshirt: "random" },
  good: { events: "best", recruiting: "highestTier", declare: "never", transfer: "up", redshirt: "take" },
  // Q1: bad play, full career (never declares until eligibility forces it).
  lazyFull: { events: "lazy", recruiting: "lowestTier", declare: "never", transfer: "stay", redshirt: "decline" },
  saboteurFull: { events: "saboteur", recruiting: "lowestTier", declare: "never", transfer: "stay", redshirt: "decline" },
  // Q1: the 014 playtester — bad play, declares at the first opportunity.
  lazyEarly: { events: "lazy", recruiting: "lowestTier", declare: "asap", transfer: "stay", redshirt: "decline" },
  saboteurEarly: { events: "saboteur", recruiting: "lowestTier", declare: "asap", transfer: "stay", redshirt: "decline" },
  // Q1: the second definition of "bad" — the player who tanks CHARACTER, which
  // is the axis the six authored bust events are gated on.
  antisocialFull: { events: "antisocial", recruiting: "lowestTier", declare: "never", transfer: "stay", redshirt: "decline" },
  antisocialEarly: { events: "antisocial", recruiting: "lowestTier", declare: "asap", transfer: "stay", redshirt: "decline" },
  // Q1: is early declaring the loophole on its own, with ordinary play?
  randomEarly: { events: "random", recruiting: "random", declare: "asap", transfer: "random", redshirt: "random" },
  randomFull: { events: "random", recruiting: "random", declare: "never", transfer: "random", redshirt: "random" },
  // Q2: transfer strategy is the ONLY variable. Everything else is held at the
  // house baseline so the difference between these rows is the offseason.
  offseasonStay: { events: "random", recruiting: "random", declare: "random", transfer: "stay", redshirt: "random" },
  offseasonUp: { events: "random", recruiting: "random", declare: "random", transfer: "up", redshirt: "random" },
  offseasonUpOrLateral: { events: "random", recruiting: "random", declare: "random", transfer: "upOrLateral", redshirt: "random" },
  offseasonLateral: { events: "random", recruiting: "random", declare: "random", transfer: "lateral", redshirt: "random" },
  offseasonRandom: { events: "random", recruiting: "random", declare: "random", transfer: "random", redshirt: "random" },
  // Q2, long careers: the "transfer up every year" line only has room to pay
  // off if the career runs long enough for the tier to matter, so the A/B is
  // repeated with declare held at "never".
  longStay: { events: "random", recruiting: "random", declare: "never", transfer: "stay", redshirt: "random" },
  longUp: { events: "random", recruiting: "random", declare: "never", transfer: "up", redshirt: "random" },
  // Q2, good players: the same A/B for someone who is actually optimising.
  goodStay: { events: "best", recruiting: "highestTier", declare: "never", transfer: "stay", redshirt: "take" },
  goodUp: { events: "best", recruiting: "highestTier", declare: "never", transfer: "up", redshirt: "take" },
  // The control for any early-declare penalty: someone who played WELL and
  // still leaves as a junior. A change aimed at the two-season loophole must
  // not quietly reprice this player.
  goodEarly: { events: "best", recruiting: "highestTier", declare: "asap", transfer: "up", redshirt: "take" },
} satisfies Record<string, PolicyProfile>;

export type ProfileName = keyof typeof PROFILES;
