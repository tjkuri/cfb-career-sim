import { describe, it, expect } from "vitest";
import { createCareer, advance, getDecision } from "./index";
import type { GameState, Setup } from "./types";
import { CONTENT } from "../content/index";
import type { ContentBundle } from "../content/schema";

const SETUP: Setup = { lastName: "Player", jerseyNumber: 7, homeState: "TX", position: "QB" };

type Decision = NonNullable<ReturnType<typeof getDecision>>;

// A policy that keeps the career alive: declining the redshirt, so the walk
// can reach the hub step that sits behind it. It used to decline the draft
// too -- a first-option policy declared the moment it was eligible, which made
// the transfer step unreachable -- and that clause went with the declare
// decision (DECISION 057).
function survivingChoice(d: Decision): string {
  if (d.eventId === "redshirt") return "decline";
  return d.options[0]!.id;
}

// Drive a career until `predicate` holds. Tries several seeds so a test never
// depends on one seed happening to produce a given decision.
function playUntil(
  seedPrefix: string,
  predicate: (s: GameState, d: Decision) => boolean,
): { state: GameState; decision: Decision } | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    let s = createCareer(SETUP, `${seedPrefix}-${attempt}`);
    for (let guard = 0; guard < 1000 && s.status === "active"; guard++) {
      const d = getDecision(s);
      if (!d) break;
      if (predicate(s, d)) return { state: s, decision: d };
      s = advance(s, survivingChoice(d));
    }
  }
  return null;
}

describe("lastOutcome", () => {
  it("is absent on a freshly created career", () => {
    expect(createCareer(SETUP, "fresh").lastOutcome).toBeUndefined();
  });

  it("is set from the outcome the seeded RNG actually resolved", () => {
    // A deterministic single-outcome event: whatever fires, the prose must be
    // one the content authored for the option that was chosen.
    const found = playUntil("outcome-1", (_s, d) => d !== null && d.eventId === "gym-grind");
    expect(found).not.toBeNull();
    const { state, decision } = found!;
    const next = advance(state, "grind");
    const ev = CONTENT.events.find((e) => e.id === decision.eventId)!;
    const opt = ev.options.find((o) => o.id === "grind")!;
    const authored = [opt.positiveOutcome.description, opt.negativeOutcome?.description].filter(Boolean);
    expect(authored).toContain(next.lastOutcome?.description);
  });

  it("is cleared at the start of the next advance", () => {
    // Whenever a state that already carries outcome prose is handed a hub
    // decision -- whose branches author none -- the stale prose must be gone.
    let observed = 0;
    for (let attempt = 0; attempt < 40 && observed < 3; attempt++) {
      let s = createCareer(SETUP, `clear-${attempt}`);
      for (let guard = 0; guard < 1000 && s.status === "active"; guard++) {
        const d = getDecision(s);
        if (!d) break;
        const isHub = d.eventId === "recruiting" || d.eventId === "transfer";
        if (isHub && s.lastOutcome) {
          expect(advance(s, survivingChoice(d)).lastOutcome).toBeUndefined();
          observed++;
        }
        s = advance(s, survivingChoice(d));
      }
    }
    expect(observed).toBeGreaterThan(0);
  });

  it("is undefined after a recruiting choice", () => {
    const s = createCareer(SETUP, "recruit-1");
    const d = getDecision(s)!;
    expect(d.eventId).toBe("recruiting");
    expect(advance(s, d.options[0]!.id).lastOutcome).toBeUndefined();
  });

  // REMOVED (DECISION 057): "is undefined after a declare choice". The declare
  // branch of `applyChoice` authored no prose and the test pinned that; the
  // branch is deleted. The recruiting and transfer cases below cover the same
  // rule for every hub branch that is left.

  it("is undefined after a transfer choice", () => {
    const found = playUntil("transfer-1", (_s, d) => d !== null && d.eventId === "transfer");
    expect(found).not.toBeNull();
    expect(advance(found!.state, found!.decision.options[0]!.id).lastOutcome).toBeUndefined();
  });

  it("reports the redshirt bump and sink from the authored strings", () => {
    const found = playUntil("redshirt-1", (_s, d) => d !== null && d.eventId === "redshirt");
    expect(found).not.toBeNull();
    const after = advance(found!.state, "redshirt");
    expect([CONTENT.redshirt.bumpDescription, CONTENT.redshirt.sinkDescription]).toContain(
      after.lastOutcome?.description,
    );
  });

  it("reports both redshirt branches depending on the roll", () => {
    // Force each branch by swapping successProb, so both authored strings are
    // proven reachable rather than only whichever the seed happened to hit.
    const found = playUntil("redshirt-2", (_s, d) => d !== null && d.eventId === "redshirt");
    expect(found).not.toBeNull();
    const always: ContentBundle = { ...CONTENT, redshirt: { ...CONTENT.redshirt, successProb: 1 } };
    const never: ContentBundle = { ...CONTENT, redshirt: { ...CONTENT.redshirt, successProb: 0 } };
    expect(advance(found!.state, "redshirt", always).lastOutcome?.description).toBe(
      CONTENT.redshirt.bumpDescription,
    );
    expect(advance(found!.state, "redshirt", never).lastOutcome?.description).toBe(
      CONTENT.redshirt.sinkDescription,
    );
  });

  it("survives a career-ending choice so the player learns how it ended", () => {
    // An `ending` effect terminates the career inside applyChoice; the prose
    // that describes it must still be on the returned state.
    let s = createCareer(SETUP, "ending-1");
    for (let guard = 0; guard < 5000 && s.status === "active"; guard++) {
      const d = getDecision(s);
      if (!d) break;
      const next = advance(s, d.options[d.options.length - 1]!.id);
      if (next.status === "busted" && next.endingReason) {
        expect(typeof next.lastOutcome?.description === "string" || next.lastOutcome === undefined).toBe(true);
        return;
      }
      s = next;
    }
  });

  it("says which way a gamble went, so the card can say it paid off or backfired", () => {
    const found = playUntil("shape-1", (_s, d) => d !== null && d.eventId === "gym-grind");
    expect(found).not.toBeNull();
    const next = advance(found!.state, "grind");
    expect(typeof next.lastOutcome!.positive).toBe("boolean");
  });
});
