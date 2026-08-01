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
    // A first-option policy returns to school when able, so it should progress past FR.
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
});
