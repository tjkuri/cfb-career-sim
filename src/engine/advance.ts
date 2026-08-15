import type { GameEvent, GameState } from "./types";
import { PHASE_ORDER, CLASS_ORDER } from "./types";
import { createRng, rngChance, type Rng } from "./rng";
import { applyEffect, tickPhaseStart, flushPendingEffects, clampOverall, type InjuryLookup } from "./effects";
import { resolveOutcome } from "./outcomes";
import { selectRandomEvent, selectFixedEvent } from "./select-event";
import { simulatePhaseProduction } from "./simulate";
import { applyRecruitingChoice } from "./recruiting";
import { computeDraftResult } from "./draft";
import { runPostseasonResolver } from "./postseason";
import { CONTENT } from "../content/index";
import type { ContentBundle } from "../content/schema";
import { generateTransferOffers } from "./transfer";

const DECLARE_EVENT_ID = "declare";
const TRANSFER_EVENT_ID = "transfer";
const REDSHIRT_EVENT_ID = "redshirt";
const ON_FIELD_PHASES = new Set(["nonconf", "conference", "postseason"]);

type HubStep = "entry" | "redshirt" | "declare" | "transfer";
const HUB_ORDER: Exclude<HubStep, "entry">[] = ["redshirt", "declare", "transfer"];

export interface PendingDecision {
  eventId: string;
  title: string;
  description: string;
  options: { id: string; label: string }[];
}

function injuryLookup(content: ContentBundle): InjuryLookup {
  return (t) => content.injuries[t] ?? { overallDelta: 3, recoveryPhases: 1 };
}

function clone(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

export function getDecision(state: GameState, content: ContentBundle = CONTENT): PendingDecision | null {
  if (state.status !== "active" || state.currentEventId === null) return null;
  if (state.currentEventId === "recruiting") {
    const opts = state.pendingOptions ?? [];
    return {
      eventId: "recruiting",
      title: "Signing Day",
      description: "Where do you commit?",
      options: opts.map((o) => ({ id: o.id, label: o.label })),
    };
  }
  if (state.currentEventId === DECLARE_EVENT_ID) {
    return {
      eventId: DECLARE_EVENT_ID,
      title: "Declare for the Draft?",
      description: "You're draft-eligible. Cash in now, or return for another season?",
      options: [
        { id: "declare", label: "Declare for the NFL Draft" },
        { id: "return", label: "Return to school" },
      ],
    };
  }
  if (state.currentEventId === TRANSFER_EVENT_ID) {
    const opts = state.pendingOptions ?? [];
    return {
      eventId: TRANSFER_EVENT_ID,
      title: "Transfer Portal",
      description: "The portal is open. Stay, or take an offer?",
      options: opts.map((o) => ({ id: o.id, label: o.label })),
    };
  }
  if (state.currentEventId === REDSHIRT_EVENT_ID) {
    return {
      eventId: REDSHIRT_EVENT_ID,
      title: "Redshirt?",
      description: "Sit this season to preserve a year of eligibility and gamble on coming back stronger — it might backfire.",
      options: [
        { id: "redshirt", label: "Take the redshirt (sit the season)" },
        { id: "decline", label: "Play this season" },
      ],
    };
  }
  const ev = content.events.find((e) => e.id === state.currentEventId);
  if (!ev) return null;
  return { eventId: ev.id, title: ev.title, description: ev.description, options: ev.options.map((o) => ({ id: o.id, label: o.label })) };
}

export function advance(state: GameState, choiceId: string, content: ContentBundle = CONTENT): GameState {
  const s = clone(state);
  const rng = createRng(s.seed, s.rngCursor);
  const injuryOf = injuryLookup(content);

  applyChoice(s, choiceId, content, rng, injuryOf);
  if (s.status === "active") autoProgress(s, content, rng, injuryOf);
  finalizeIfEnded(s, rng, injuryOf);

  s.rngCursor = rng.cursor;
  return s;
}

function applyChoice(s: GameState, choiceId: string, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  if (s.currentEventId === "recruiting") {
    const offer = (s.pendingOptions ?? []).find((o) => o.id === choiceId);
    if (!offer) throw new Error(`Invalid recruiting choice: ${choiceId}`);
    applyRecruitingChoice(s, offer.schoolId, content);
    s.pendingOptions = undefined;
    s.currentEventId = null;
    return;
  }
  if (s.currentEventId === DECLARE_EVENT_ID) {
    if (choiceId !== "declare" && choiceId !== "return") {
      throw new Error(`Invalid declare choice: ${choiceId}`);
    }
    if (choiceId === "declare") { s.status = "declared"; s.currentEventId = null; return; }
    // return to school: proceed to the next hub decision (transfer, once wired).
    raiseNextHubDecision(s, content, rng, "declare");
    return;
  }
  if (s.currentEventId === TRANSFER_EVENT_ID) {
    const offer = (s.pendingOptions ?? []).find((o) => o.id === choiceId);
    if (!offer) throw new Error(`Invalid transfer choice: ${choiceId}`);
    if (offer.id !== "stay") s.school = { schoolId: offer.schoolId, tier: offer.tier };
    s.snapModifier = offer.snapModifier;
    s.pendingOptions = undefined;
    s.currentEventId = null;
    raiseNextHubDecision(s, content, rng, "transfer");
    return;
  }
  if (s.currentEventId === REDSHIRT_EVENT_ID) {
    if (choiceId !== "redshirt" && choiceId !== "decline") {
      throw new Error(`Invalid redshirt choice: ${choiceId}`);
    }
    if (choiceId === "decline") {
      raiseNextHubDecision(s, content, rng, "redshirt");
      return;
    }
    // Take the redshirt: roll the bump/sink, sit the upcoming season, preserve eligibility.
    const cfg = content.redshirt;
    const success = rngChance(rng, cfg.successProb);
    applyEffect(s, { kind: "overall", timing: "immediate", amount: success ? cfg.bumpOverall : cfg.sinkOverall }, injuryOf);
    s.eligibility.redshirtUsed = true;
    s.snapModifier = cfg.sitSnapModifier;
    s.redshirtSeasonActive = true;
    s.currentEventId = null; // taking the redshirt ends this offseason's hub sequence
    return;
  }
  const ev = content.events.find((e) => e.id === s.currentEventId);
  if (!ev) throw new Error(`No current event: ${s.currentEventId}`);
  const opt = ev.options.find((o) => o.id === choiceId);
  if (!opt) throw new Error(`Invalid choice ${choiceId} for event ${ev.id}`);
  const outcome = resolveOutcome(opt, rng);
  for (const eff of outcome.effects) applyEffect(s, eff, injuryOf);
  if (ev.kind === "fixed") s.phaseFiredEventIds.push(ev.id);
  s.currentEventId = null;
}

function advancePhase(s: GameState): void {
  const idx = PHASE_ORDER.indexOf(s.phase);
  if (idx === PHASE_ORDER.length - 1) {
    // postseason -> next season offseason
    s.seasonIndex += 1;
    s.phase = "offseason";
  } else {
    s.phase = PHASE_ORDER[idx + 1]!;
  }
  s.phaseAbs += 1;
}

export function developmentDelta(seasonSnaps: number, cfg: { snapsPerDevPoint: number; devCap: number }): number {
  return Math.min(cfg.devCap, Math.floor(seasonSnaps / cfg.snapsPerDevPoint));
}

// The two soft-washout endings. Named so the balance harness can tell this
// path from the character spiral without matching a literal that might drift.
export const WASHOUT_REASONS = {
  overall: "Lost a step and washed out",
  buried: "Buried on the depth chart",
} as const;

export function enterOffseason(s: GameState, content: ContentBundle, rng: Rng): void {
  // Reset per-season modifiers from any prior transfer/redshirt.
  s.snapModifier = 1;
  s.redshirtSeasonActive = false;

  // Develop from last season's playing time before advancing eligibility.
  const lastSeason = s.seasons[s.seasons.length - 1];
  if (lastSeason) {
    s.overall = clampOverall(s.overall + developmentDelta(lastSeason.snaps, content.progression));
  }

  // Soft-washout: collapsed overall, or buried (near-zero snaps) for consecutive seasons.
  const prog = content.progression;
  const recent = s.seasons.slice(-prog.washoutConsecutiveSeasons);
  const buried =
    recent.length >= prog.washoutConsecutiveSeasons &&
    recent.every((line) => line.snaps < prog.washoutSnapFloor);
  if (s.overall < prog.washoutOverallFloor || buried) {
    s.status = "busted";
    s.endingReason =
      s.overall < prog.washoutOverallFloor ? WASHOUT_REASONS.overall : WASHOUT_REASONS.buried;
    s.currentEventId = null;
    return;
  }

  // Advance eligibility one class year.
  const ci = CLASS_ORDER.indexOf(s.eligibility.classYear);
  if (ci < CLASS_ORDER.length - 1) s.eligibility.classYear = CLASS_ORDER[ci + 1]!;
  s.eligibility.yearsUsed += 1;
  s.eligibility.draftEligible = s.eligibility.classYear === "JR" || s.eligibility.classYear === "SR";

  const eligibilityCap = CLASS_ORDER.length + (s.eligibility.redshirtUsed ? 1 : 0);
  if (s.eligibility.yearsUsed >= eligibilityCap) {
    // Out of eligibility -> forced to declare.
    s.status = "declared";
    return;
  }

  raiseNextHubDecision(s, content, rng, "entry");
}

function redshirtOffered(s: GameState): boolean {
  return (
    !s.eligibility.redshirtUsed &&
    (s.eligibility.classYear === "SO" ||
      s.eligibility.classYear === "JR" ||
      s.injuries.some((i) => i.kind === "injury"))
  );
}

function raiseNextHubDecision(s: GameState, content: ContentBundle, rng: Rng, from: HubStep): void {
  const startIdx = from === "entry" ? 0 : HUB_ORDER.indexOf(from) + 1;
  for (let i = startIdx; i < HUB_ORDER.length; i++) {
    const step = HUB_ORDER[i]!;
    if (step === "redshirt") {
      if (redshirtOffered(s)) { s.currentEventId = REDSHIRT_EVENT_ID; return; }
      continue;
    }
    if (step === "declare") {
      if (s.eligibility.draftEligible) { s.currentEventId = DECLARE_EVENT_ID; return; }
    }
    if (step === "transfer") {
      s.pendingOptions = generateTransferOffers(s, content, rng);
      s.currentEventId = TRANSFER_EVENT_ID;
      return;
    }
  }
  s.currentEventId = null;
}

function autoProgress(s: GameState, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  let guard = 0;
  while (s.status === "active" && s.currentEventId === null && guard++ < 1000) {
    if (!s.phaseSimulated) {
      // First time entering this phase: tick + produce exactly once.
      tickPhaseStart(s, injuryOf);
      if (s.status !== "active") return;
      if (ON_FIELD_PHASES.has(s.phase)) {
        const last = s.seasons[s.seasons.length - 1];
        if (!last || last.seasonIndex !== s.seasonIndex) {
          s.seasons.push({ seasonIndex: s.seasonIndex, schoolId: s.school.schoolId, snaps: 0, stats: {}, teamWins: 0, teamLosses: 0 });
        }
      }
      simulatePhaseProduction(s, rng);
      s.phaseSimulated = true;
      s.phaseFiredEventIds = [];
      s.phaseRandomDrawn = false;
    }

    // Fire matching fixed (scripted) events one at a time.
    const fixedEv = selectFixedEvent(s, content);
    if (fixedEv) {
      s.currentEventId = fixedEv.id;
      return;
    }

    // Then at most one random event per phase.
    if (!s.phaseRandomDrawn) {
      s.phaseRandomDrawn = true;
      const ev: GameEvent | null = selectRandomEvent(s, content, rng);
      if (ev) {
        s.currentEventId = ev.id;
        return;
      }
    }

    // Phase fully handled: resolve postseason honors, then move on.
    if (s.phase === "postseason") runPostseasonResolver(s, content, rng, injuryOf);
    advancePhase(s);
    s.phaseSimulated = false;
    if (s.phase === "offseason") {
      enterOffseason(s, content, rng);
      // Hub may set a declare decision (stop) or force-declare (ending).
      if (s.currentEventId !== null || s.status !== "active") return;
    }
  }
}

function finalizeIfEnded(s: GameState, rng: Rng, injuryOf: InjuryLookup): void {
  if (s.status === "active") return;
  // The declare paths return before autoProgress reaches tickPhaseStart, so the
  // queue's only drain never runs. Flush on every terminal status, busted
  // included, so a reported final overall is never inflated by a penalty that
  // was earned and then orphaned.
  flushPendingEffects(s, injuryOf);
  if (s.status === "declared") {
    s.draftResult = computeDraftResult(s, rng);
    s.status = "drafted";
  }
}
