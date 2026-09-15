import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { advance, getDecision } from "./advance";
import type { GameState, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

// REWRITTEN for DECISION 057. Both tests used to hand-build a career sitting on
// the declare decision with a deferred penalty queued past any tick, then press
// "declare". The decision is deleted, so the shape is built the only way it now
// occurs: a career that runs out of eligibility with an effect still queued.
//
// The queue's only drain is `tickPhaseStart`, and the last advance of a career
// returns before reaching it, so a penalty earned in the final postseason would
// be orphaned and the reported final overall inflated. That is what these pin.

/** Keeps a career alive so it reaches the end of its eligibility. */
function survivingChoice(d: { eventId: string; options: { id: string }[] }): string {
  const ids = d.options.map((o) => o.id);
  if (d.eventId === "redshirt") return "decline";
  if (ids.includes("stay")) return "stay";
  return ids[0]!;
}

/**
 * The last decision of a career that ends in the draft, with the choice that
 * ends it. Re-advancing from here is the moment the queue must be flushed.
 */
function lastStepBeforeDraft(): { state: GameState; choiceId: string } {
  for (let attempt = 0; attempt < 40; attempt++) {
    let s = createCareer(setup, `flush-${attempt}`);
    let last: { state: GameState; choiceId: string } | null = null;
    for (let guard = 0; guard < 500 && s.status === "active"; guard++) {
      const d = getDecision(s);
      if (!d) break;
      const choiceId = survivingChoice(d);
      last = { state: s, choiceId };
      s = advance(s, choiceId);
    }
    // A washout ends the career mid-season and never reaches the draft; this
    // fixture needs the drafted path, where `draftResult` exists to be charged.
    if (s.status === "drafted" && last) return last;
  }
  throw new Error("no career reached the draft in 40 seeds");
}

const QUEUED_PENALTY = -6;

/** The same state with one deferred penalty queued far past any tick. */
function withQueuedPenalty(state: GameState): GameState {
  return {
    ...state,
    pendingEffects: [
      ...state.pendingEffects,
      { effect: { kind: "overall", timing: "deferred", amount: QUEUED_PENALTY }, firePhaseAbs: 9999 },
    ],
  };
}

describe("pending effects at career end", () => {
  it("lands a queued deferred effect when eligibility runs out", () => {
    const { state, choiceId } = lastStepBeforeDraft();
    const clean = advance(state, choiceId);
    const charged = advance(withQueuedPenalty(state), choiceId);

    expect(clean.status).toBe("drafted");
    expect(charged.status).toBe("drafted");
    expect(charged.pendingEffects).toEqual([]);
    // The penalty is applied exactly once, and nothing else differs: the
    // injected effect consumes no RNG, so both careers played identically.
    expect(charged.overall).toBe(clean.overall + QUEUED_PENALTY);
  });

  it("charges the draft result for the flushed penalty", () => {
    const { state, choiceId } = lastStepBeforeDraft();
    const clean = advance(state, choiceId);
    const charged = advance(withQueuedPenalty(state), choiceId);

    expect(charged.draftResult!.draftStock).toBeLessThan(clean.draftResult!.draftStock);
  });
});
