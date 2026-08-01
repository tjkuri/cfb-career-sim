import { describe, it, expect } from "vitest";
import { eventMatches, selectRandomEvent } from "./select-event";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import type { ContentBundle } from "../content/schema";
import type { GameEvent, Setup } from "./types";

const setup: Setup = { lastName: "A", jerseyNumber: 1, homeState: "TX", position: "QB" };

const qbEvent: GameEvent = {
  id: "qb-only", kind: "random", phase: "nonconf", weight: 5, conditions: { position: ["QB"] },
  title: "t", description: "d",
  options: [{ id: "o", label: "l", probability: 1, positiveOutcome: { description: "x", effects: [] } }],
};
const dlEvent: GameEvent = { ...qbEvent, id: "dl-only", conditions: { position: ["DL"] } };
const bundle = (events: GameEvent[]): ContentBundle => ({
  events, injuries: {}, schools: [], positions: {} as any, trophyIds: [], awardIds: [],
});

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
    s.injuries.push({ injuryType: "acl", remainingPhases: 2, restoreAmount: 10 });
    expect(eventMatches(s, injuredOnly)).toBe(true);
  });
  it("respects tier conditions", () => {
    const s = createCareer(setup, "s"); s.phase = "nonconf";
    const tier3Only: GameEvent = { ...qbEvent, conditions: { tier: [3] } };
    expect(eventMatches(s, tier3Only)).toBe(false);
    s.school.tier = 3;
    expect(eventMatches(s, tier3Only)).toBe(true);
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
