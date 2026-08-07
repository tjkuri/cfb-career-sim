import { describe, it, expect } from "vitest";
import { eventMatches, selectRandomEvent, selectFixedEvent } from "./select-event";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { ContentBundle } from "../content/schema";
import { CONTENT } from "../content/index";
import { POSTSEASON, PROGRESSION } from "../content/postseason";
import { REGIONS, SCHOOL_SAMPLER, TRANSFER } from "../content/regions";
import { REDSHIRT } from "../content/redshirt";
import type { EventConditions, GameEvent, GameState, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

const qbEvent: GameEvent = {
  id: "qb-only", kind: "random", phase: "nonconf", weight: 5, conditions: { position: ["QB"] },
  title: "t", description: "d",
  options: [{ id: "o", label: "l", probability: 1, positiveOutcome: { description: "x", effects: [] } }],
};
const dlEvent: GameEvent = { ...qbEvent, id: "dl-only", conditions: { position: ["DL"] } };
const bundle = (events: GameEvent[]): ContentBundle => ({
  events, injuries: {}, schools: [], positions: {} as any, trophyIds: [], awardIds: [],
  postseason: POSTSEASON, progression: PROGRESSION,
  regions: REGIONS, schoolSampler: SCHOOL_SAMPLER, transfer: TRANSFER, redshirt: REDSHIRT,
});

function makeState(overrides: Partial<GameState>): GameState {
  const s = structuredClone(createCareer(setup, "s"));
  s.phase = "offseason";
  return { ...s, ...overrides };
}

function makeEvent(overrides: { conditions?: EventConditions } & Partial<GameEvent>): GameEvent {
  return {
    id: "ev",
    kind: "random",
    phase: "offseason",
    weight: 1,
    title: "t",
    description: "d",
    options: [{ id: "o", label: "l", probability: 1, positiveOutcome: { description: "x", effects: [] } }],
    ...overrides,
  };
}

describe("eventMatches", () => {
  it("requires the current phase", () => {
    const s = createCareer(setup, "s"); s.phase = "offseason";
    expect(eventMatches(s, qbEvent)).toBe(false);
    s.phase = "nonconf";
    expect(eventMatches(s, qbEvent)).toBe(true);
  });
  it("respects position conditions", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    expect(eventMatches(s, dlEvent)).toBe(false);
  });
  it("respects minClass and tier and requiresInjury", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    const srOnly: GameEvent = { ...qbEvent, conditions: { minClass: "SR" } };
    expect(eventMatches(s, srOnly)).toBe(false);
    s.eligibility.classYear = "SR";
    expect(eventMatches(s, srOnly)).toBe(true);
    const injuredOnly: GameEvent = { ...qbEvent, conditions: { requiresInjury: true } };
    expect(eventMatches(s, injuredOnly)).toBe(false);
    s.injuries.push({ kind: "injury", injuryType: "acl", remainingPhases: 2, restoreAmount: 10 });
    expect(eventMatches(s, injuredOnly)).toBe(true);
  });
  it("respects tier conditions", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    const tier3Only: GameEvent = { ...qbEvent, conditions: { tier: [3] } };
    expect(eventMatches(s, tier3Only)).toBe(false);
    s.school.tier = 3;
    expect(eventMatches(s, tier3Only)).toBe(true);
  });

  it("maxCharacter gates on low character", () => {
    const ev = makeEvent({ conditions: { maxCharacter: 30 } }); // phase must match state.phase
    const lowChar = makeState({ character: 20 });
    const highChar = makeState({ character: 50 });
    expect(eventMatches(lowChar, ev)).toBe(true);
    expect(eventMatches(highChar, ev)).toBe(false);
  });

  it("maxOverall gates on low overall", () => {
    const ev = makeEvent({ conditions: { maxOverall: 55 } });
    expect(eventMatches(makeState({ overall: 50 }), ev)).toBe(true);
    expect(eventMatches(makeState({ overall: 70 }), ev)).toBe(false);
  });

  it("requiresActiveInjury counts injuries but not suspensions", () => {
    const ev = makeEvent({ conditions: { requiresActiveInjury: true } });
    const healthy = makeState({});
    const injured = makeState({ injuries: [{ kind: "injury", injuryType: "acl", remainingPhases: 3, restoreAmount: 14 }] });
    const suspended = makeState({ injuries: [{ kind: "suspension", injuryType: "suspension", remainingPhases: 1, restoreAmount: 0 }] });
    expect(eventMatches(healthy, ev)).toBe(false);
    expect(eventMatches(injured, ev)).toBe(true);
    expect(eventMatches(suspended, ev)).toBe(false);
  });
});

describe("requiresFinalSeason", () => {
  const ev: GameEvent = {
    id: "senior-day",
    kind: "fixed",
    phase: "offseason",
    weight: 1,
    conditions: { requiresFinalSeason: true },
    title: "Senior Day",
    description: "The last time you run out of this tunnel.",
    options: [{ id: "go", label: "Go", probability: 1, positiveOutcome: { description: "ok", effects: [] } }],
  };

  const stateWith = (yearsUsed: number, redshirtUsed: boolean): GameState => {
    const base = createCareer({ lastName: "S", jerseyNumber: 7, homeState: "TX", position: "QB" }, "fs");
    return {
      ...base,
      phase: "offseason",
      eligibility: { ...base.eligibility, classYear: "SR", yearsUsed, redshirtUsed },
    };
  };

  it("matches the final season of a career with no redshirt (cap 4)", () => {
    expect(eventMatches(stateWith(3, false), ev)).toBe(true);
  });

  it("does not match earlier seasons of a career with no redshirt", () => {
    expect(eventMatches(stateWith(2, false), ev)).toBe(false);
  });

  it("matches only the fifth season of a redshirted career (cap 5)", () => {
    expect(eventMatches(stateWith(4, true), ev)).toBe(true);
    expect(eventMatches(stateWith(3, true), ev)).toBe(false);
  });

  it("ignores redshirtSeasonActive — the sit-season exclusion is structural, not special-cased", () => {
    // Taking a redshirt raises the cap by exactly the year it consumes, so a sit
    // season can never be the final season. The latest possible sit is a medical
    // redshirt for an injured SR at yearsUsed 3 against a cap of 5.
    const sitting = { ...stateWith(3, true), redshirtSeasonActive: true };
    expect(eventMatches(sitting, ev)).toBe(false);
    // The flag itself is inert: set on the actual final season, it still matches.
    const finalWithFlag = { ...stateWith(4, true), redshirtSeasonActive: true };
    expect(eventMatches(finalWithFlag, ev)).toBe(true);
  });

  it("ignores the condition when it is absent", () => {
    const plain: GameEvent = { ...ev, conditions: {} };
    expect(eventMatches(stateWith(1, false), plain)).toBe(true);
  });
});

describe("selectRandomEvent", () => {
  it("returns null when nothing matches", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    expect(selectRandomEvent(s, bundle([dlEvent]), createRng("s"))).toBeNull();
  });
  it("returns a matching event", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    const ev = selectRandomEvent(s, bundle([qbEvent, dlEvent]), createRng("s"));
    expect(ev?.id).toBe("qb-only");
  });
});

describe("selectFixedEvent", () => {
  it("returns the first matching fixed event, excluding recruiting and already-fired ids", () => {
    const state = makeState({ phase: "nonconf" }); // ensure phase matches the events below
    const content = {
      ...CONTENT,
      events: [
        { id: "recruiting", kind: "fixed", phase: "nonconf", weight: 1, title: "r", description: "d",
          options: [{ id: "c", label: "c", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
        { id: "m1", kind: "fixed", phase: "nonconf", weight: 1, title: "m1", description: "d",
          options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
        { id: "m2", kind: "fixed", phase: "nonconf", weight: 1, title: "m2", description: "d",
          options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
        { id: "r1", kind: "random", phase: "nonconf", weight: 1, title: "r1", description: "d",
          options: [{ id: "ok", label: "ok", probability: 1, positiveOutcome: { description: "d", effects: [] } }] },
      ],
    } as typeof CONTENT;

    expect(selectFixedEvent({ ...state, phaseFiredEventIds: [] }, content)!.id).toBe("m1"); // recruiting excluded
    expect(selectFixedEvent({ ...state, phaseFiredEventIds: ["m1"] }, content)!.id).toBe("m2");
    expect(selectFixedEvent({ ...state, phaseFiredEventIds: ["m1", "m2"] }, content)).toBeNull(); // random not returned
  });
});
