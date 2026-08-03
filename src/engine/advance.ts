import type { GameEvent, GameState } from "./types";
import { PHASE_ORDER, CLASS_ORDER } from "./types";
import { createRng, type Rng } from "./rng";
import { applyEffect, tickPhaseStart, type InjuryLookup } from "./effects";
import { resolveOutcome } from "./outcomes";
import { selectRandomEvent } from "./select-event";
import { recruitingOptions, applyRecruitingChoice, simulatePhaseProduction } from "./simulate";
import { computeDraftResult } from "./draft";
import { CONTENT } from "../content/index";
import type { ContentBundle } from "../content/schema";

const DECLARE_EVENT_ID = "declare";
const ON_FIELD_PHASES = new Set(["nonconf", "conference", "postseason"]);

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
    const opts = recruitingOptions(state, content);
    return { eventId: "recruiting", title: "Signing Day", description: "Where do you commit?", options: opts.map((o) => ({ id: o.id, label: o.label })) };
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
  finalizeIfEnded(s, rng);

  s.rngCursor = rng.cursor;
  return s;
}

function applyChoice(s: GameState, choiceId: string, content: ContentBundle, rng: Rng, injuryOf: InjuryLookup): void {
  if (s.currentEventId === "recruiting") {
    const opt = recruitingOptions(s, content).find((o) => o.id === choiceId);
    if (!opt) throw new Error(`Invalid recruiting choice: ${choiceId}`);
    applyRecruitingChoice(s, opt.schoolId, content);
    s.currentEventId = null;
    return;
  }
  if (s.currentEventId === DECLARE_EVENT_ID) {
    if (choiceId !== "declare" && choiceId !== "return") {
      throw new Error(`Invalid declare choice: ${choiceId}`);
    }
    if (choiceId === "declare") s.status = "declared";
    s.currentEventId = null;
    return;
  }
  const ev = content.events.find((e) => e.id === s.currentEventId);
  if (!ev) throw new Error(`No current event: ${s.currentEventId}`);
  const opt = ev.options.find((o) => o.id === choiceId);
  if (!opt) throw new Error(`Invalid choice ${choiceId} for event ${ev.id}`);
  const outcome = resolveOutcome(opt, rng);
  for (const eff of outcome.effects) applyEffect(s, eff, injuryOf);
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

function runOffseasonHub(s: GameState): void {
  // Advance eligibility one class year.
  const ci = CLASS_ORDER.indexOf(s.eligibility.classYear);
  if (ci < CLASS_ORDER.length - 1) s.eligibility.classYear = CLASS_ORDER[ci + 1]!;
  s.eligibility.yearsUsed += 1;
  s.eligibility.draftEligible = s.eligibility.classYear === "JR" || s.eligibility.classYear === "SR";

  if (s.eligibility.yearsUsed >= CLASS_ORDER.length) {
    // Out of eligibility -> forced to declare.
    s.status = "declared";
    return;
  }
  if (s.eligibility.draftEligible) s.currentEventId = DECLARE_EVENT_ID;
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

      // At most one random event per phase. If one fires, stop for a decision.
      const ev: GameEvent | null = selectRandomEvent(s, content, rng);
      if (ev) {
        s.currentEventId = ev.id;
        return;
      }
    }
    // Phase fully handled (no event, or the event was just resolved): move on.
    advancePhase(s);
    s.phaseSimulated = false;
    if (s.phase === "offseason") {
      runOffseasonHub(s);
      // Hub may set a declare decision (stop) or force-declare (ending).
      if (s.currentEventId !== null || s.status !== "active") return;
    }
  }
}

function finalizeIfEnded(s: GameState, rng: Rng): void {
  if (s.status === "declared") {
    s.draftResult = computeDraftResult(s, rng);
    s.status = "drafted";
  }
}
