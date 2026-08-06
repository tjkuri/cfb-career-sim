import { describe, it, expect } from "vitest";
import { eventMatches, selectRandomEvent } from "./select-event";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { ContentBundle } from "../content/schema";
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
