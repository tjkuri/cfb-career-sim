import { describe, it, expect } from "vitest";
import { createCareer } from "./create-career";
import { advance, getDecision } from "./advance";
import type { Setup } from "./types";

const setup: Setup = { lastName: "Allen", jerseyNumber: 7, homeState: "MT", position: "QB" };

function autoplay(seed: string) {
  let s = createCareer(setup, seed);
  let guard = 0;
  while (s.status === "active" && guard++ < 500) {
    const decision = getDecision(s);
    if (!decision) throw new Error("active career with no decision");
    // Policy: always take the first option.
    s = advance(s, decision.options[0]!.id);
  }
  return s;
}

function autoplayAlwaysReturn(seed: string) {
  let s = createCareer(setup, seed);
  let guard = 0;
  while (s.status === "active" && guard++ < 500) {
    const decision = getDecision(s);
    if (!decision) throw new Error("active career with no decision");
    // Policy: whenever asked to declare, return to school instead; otherwise take the first option.
    const choiceId = decision.eventId === "declare" ? "return" : decision.options[0]!.id;
    s = advance(s, choiceId);
  }
  return s;
}

describe("advance / getDecision", () => {
  it("first decision is recruiting with tier options", () => {
    const s = createCareer(setup, "seed");
    const d = getDecision(s);
    expect(d?.eventId).toBe("recruiting");
    expect(d!.options.length).toBeGreaterThan(0);
    expect(d!.options[0]!.id).toContain("commit-");
  });

  it("plays a full career to a terminal state", () => {
    const s = autoplay("career-1");
    expect(["drafted", "busted"]).toContain(s.status);
    if (s.status === "drafted") expect(s.draftResult).toBeDefined();
  });

  it("is deterministic: same seed + same policy => identical final state", () => {
    const a = autoplay("determinism");
    const b = autoplay("determinism");
    expect(a).toEqual(b);
  });

  it("advances eligibility across seasons (reaches at least JR before ending)", () => {
    const s = autoplay("eligibility");
    // The declare decision lists "declare" first, so a first-option policy declares
    // as soon as it becomes draft-eligible (JR), i.e. after yearsUsed reaches 2.
    const reachedUpperclass = s.eligibility.yearsUsed >= 2;
    expect(reachedUpperclass).toBe(true);
  });

  it("does not mutate the input state (purity)", () => {
    const s0 = createCareer(setup, "pure");
    const d = getDecision(s0)!;
    const snapshot = JSON.parse(JSON.stringify(s0));
    advance(s0, d.options[0]!.id);
    expect(s0).toEqual(snapshot);
  });

  it("always-return policy plays all 4 years then force-declares with no phantom trailing season", () => {
    const s = autoplayAlwaysReturn("always-return");
    expect(s.status).toBe("drafted");
    expect(s.eligibility.yearsUsed).toBe(4);
    expect(s.seasons.length).toBe(4);
    // The last season line must reflect an actually-played season, not a
    // just-pushed-then-abandoned empty one from the postseason->offseason rollover.
    const lastSeason = s.seasons[s.seasons.length - 1]!;
    expect(lastSeason.snaps).toBeGreaterThan(0);
    for (const season of s.seasons) {
      expect(season.snaps).toBeGreaterThan(0);
    }
  });

  it("rejects a bogus choiceId at the declare decision", () => {
    let s = createCareer(setup, "declare-guard");
    let guard = 0;
    while (s.status === "active" && guard++ < 500) {
      const d = getDecision(s)!;
      if (d.eventId === "declare") {
        expect(() => advance(s, "banana")).toThrow(/declare/i);
        return;
      }
      s = advance(s, d.options[0]!.id);
    }
    throw new Error("never reached the declare decision");
  });
});
