import { describe, it, expect } from "vitest";
import {
  ENDING_PENALTY,
  STOCK_WEIGHTS,
  effectScore,
  makePolicy,
  optionCharacterScore,
  optionScore,
  outcomeScore,
  PROFILES,
} from "./policies";
import { playCareer } from "./play-headless";
import { CONTENT } from "../content/index";
import { BUST_EVENTS } from "../content/events/bust";
import type { EventOption, Setup } from "../engine/types";
import { createCareer, getDecision, advance, type GameState } from "../engine/index";

const setup: Setup = { lastName: "P", jerseyNumber: 1, homeState: "TX", position: "QB" };

describe("the draft-stock option scorer", () => {
  it("prices each effect kind off deriveDraftStock's own coefficients", () => {
    // Hand-computed against engine/draft.ts. If deriveDraftStock's weights
    // change, these must be re-derived — every "bad play" number in report 018
    // is conditional on them.
    expect(effectScore({ kind: "overall", timing: "immediate", amount: 5 }, "QB", CONTENT, 0)).toBeCloseTo(7);
    expect(effectScore({ kind: "character", amount: -10 }, "QB", CONTENT, 0)).toBeCloseTo(-1.5);
    expect(effectScore({ kind: "snaps", amount: 200 }, "QB", CONTENT, 0)).toBeCloseTo(1);
    expect(effectScore({ kind: "trophy", id: "bowlWin" }, "QB", CONTENT, 0)).toBeCloseTo(STOCK_WEIGHTS.trophy);
    expect(effectScore({ kind: "award", id: "heisman" }, "QB", CONTENT, 0)).toBeCloseTo(STOCK_WEIGHTS.award);
    expect(effectScore({ kind: "moment", item: "x", icon: "y" }, "QB", CONTENT, 0)).toBe(0);
    expect(effectScore({ kind: "stat", stat: "passYards", amount: 500 }, "QB", CONTENT, 0)).toBe(0);
  });

  it("charges an injury for the snaps it costs plus a fraction of the overall hit", () => {
    // QB mean snaps/phase = (120 + 200) / 2 = 160. ACL: 5 recovery phases, 14 overall.
    // -(5 * 160 * 0.005) - 0.25 * 14 * 1.4 = -4 - 4.9
    expect(effectScore({ kind: "injury", injuryType: "acl" }, "QB", CONTENT, 0)).toBeCloseTo(-8.9);
    // A suspension blocks snaps and nothing else.
    expect(effectScore({ kind: "suspension", phases: 2 }, "QB", CONTENT, 0)).toBeCloseTo(-1.6);
  });

  it("is the only place the two definitions of 'bad' differ", () => {
    const ending = { kind: "ending", reason: "x" } as const;
    expect(effectScore(ending, "QB", CONTENT, 0)).toBe(0);
    expect(effectScore(ending, "QB", CONTENT, ENDING_PENALTY)).toBe(ENDING_PENALTY);
  });

  it("weights the two branches by the option's own authored probability", () => {
    const option: EventOption = {
      id: "o",
      label: "o",
      probability: 0.25,
      positiveOutcome: { description: "", effects: [{ kind: "overall", timing: "immediate", amount: 4 }] },
      negativeOutcome: { description: "", effects: [{ kind: "overall", timing: "immediate", amount: -4 }] },
    };
    // 0.25 * 5.6 + 0.75 * -5.6
    expect(optionScore(option, "QB", CONTENT, 0)).toBeCloseTo(-2.8);
  });

  it("treats a missing negativeOutcome as deterministic, matching resolveOutcome", () => {
    const option: EventOption = {
      id: "o",
      label: "o",
      probability: 0.1,
      positiveOutcome: { description: "", effects: [{ kind: "overall", timing: "immediate", amount: 2 }] },
    };
    expect(optionScore(option, "QB", CONTENT, 0)).toBeCloseTo(outcomeScore(option.positiveOutcome, "QB", CONTENT, 0));
  });

  it("scores character separately and in raw character points", () => {
    const option: EventOption = {
      id: "o",
      label: "o",
      probability: 0.5,
      positiveOutcome: { description: "", effects: [{ kind: "character", amount: 10 }] },
      negativeOutcome: { description: "", effects: [{ kind: "character", amount: -20 }] },
    };
    expect(optionCharacterScore(option)).toBeCloseTo(-5);
  });
});

describe("the deliberately-bad policies", () => {
  it("every profile drives every career to a terminal state", () => {
    for (const name of Object.keys(PROFILES) as (keyof typeof PROFILES)[]) {
      const policy = makePolicy(PROFILES[name]);
      for (let i = 0; i < 5; i++) {
        const s = playCareer(setup, `${name}-${i}`, policy);
        expect(["drafted", "busted"], `${name} seed ${i} ended as ${s.status}`).toContain(s.status);
      }
    }
  });

  it("is deterministic for a fixed seed and profile", () => {
    const a = playCareer(setup, "det", makePolicy(PROFILES.lazyFull));
    const b = playCareer(setup, "det", makePolicy(PROFILES.lazyFull));
    expect(a).toEqual(b);
  });

  it("declare:asap ends the career at the first eligible offseason; declare:never plays it out", () => {
    const early = playCareer(setup, "dec-1", makePolicy(PROFILES.lazyEarly));
    const full = playCareer(setup, "dec-1", makePolicy(PROFILES.lazyFull));
    expect(early.seasons.length).toBe(2);
    expect(full.seasons.length).toBeGreaterThan(early.seasons.length);
  });

  it("transfer:stay never changes school; transfer:up climbs tiers", () => {
    let stayed = 0;
    let climbed = 0;
    for (let i = 0; i < 20; i++) {
      const stay = playCareer(setup, `tr-${i}`, makePolicy(PROFILES.offseasonStay));
      const ids = new Set(stay.seasons.map((s) => s.schoolId));
      if (ids.size === 1) stayed++;
      const up = playCareer(setup, `tr-${i}`, makePolicy(PROFILES.offseasonUp));
      if (up.school.tier > stay.school.tier) climbed++;
    }
    expect(stayed).toBe(20);
    expect(climbed).toBeGreaterThan(0);
  });

  it("the antisocial profile reaches the character band the bust events gate on; the lazy one does not", () => {
    // This is the whole reason two definitions of "bad" exist: the draft-stock
    // scorer prices character at 0.15 against overall's 1.4, so minimising
    // stock dumps OVERALL and leaves character near its starting value.
    const chars = (name: keyof typeof PROFILES) =>
      Array.from({ length: 40 }, (_, i) => playCareer(setup, `ch-${i}`, makePolicy(PROFILES[name])).character);
    const anti = chars("antisocialFull");
    const lazy = chars("lazyFull");
    const under35 = (xs: number[]) => xs.filter((c) => c <= 35).length / xs.length;
    expect(under35(anti)).toBeGreaterThan(0.5);
    expect(under35(lazy)).toBeLessThan(0.2);
  });

  it("the best profile beats the lazy one on final overall, every seed", () => {
    // Sanity on the sign of the scorer: if maximising it did not beat
    // minimising it, the scorer would not be measuring anything.
    const best = playCareer(setup, "cmp", makePolicy(PROFILES.goodStay));
    const worst = playCareer(setup, "cmp", makePolicy(PROFILES.lazyFull));
    expect(best.overall).toBeGreaterThan(worst.overall);
  });

  it("only ever returns an id the engine offered", () => {
    for (const name of ["lazyFull", "saboteurFull", "antisocialFull", "goodStay"] as const) {
      const policy = makePolicy(PROFILES[name]);
      let s: GameState = createCareer(setup, `valid-${name}`, CONTENT);
      const rngless = { next: () => 0.5, cursor: 0 };
      for (let i = 0; i < 60 && s.status === "active"; i++) {
        const d = getDecision(s, CONTENT);
        if (!d) break;
        const choice = policy(s, d.options, rngless);
        expect(d.options.map((o) => o.id), `${name} chose ${choice} for ${d.eventId}`).toContain(choice);
        s = advance(s, choice, CONTENT);
      }
    }
  });
});

describe("saboteur vs lazy", () => {
  it("differ only where an option can actually end the career", () => {
    // Every `ending` effect in the bundle lives in bust.ts, so outside those
    // six events the two scorers must agree option-for-option.
    const bustIds = new Set(BUST_EVENTS.map((e) => e.id));
    let compared = 0;
    for (const ev of CONTENT.events) {
      if (bustIds.has(ev.id)) continue;
      for (const o of ev.options) {
        expect(optionScore(o, "QB", CONTENT, 0)).toBeCloseTo(optionScore(o, "QB", CONTENT, ENDING_PENALTY));
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(100);
  });
});
