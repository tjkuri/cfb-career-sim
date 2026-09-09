import { describe, it, expect } from "vitest";
import { CONTENT } from "./index";
import { createCareer } from "../engine/create-career";
import { REGIONS } from "./regions";
import type { Setup } from "../engine/types";

// Every state that appears in the ladder — the full set of home states a
// player can be created with.
const HOME_STATES = [...new Set(CONTENT.schools.map((s) => s.state))].sort();

function offerTraits(homeState: string, runs: number): (string | undefined)[] {
  const out: (string | undefined)[] = [];
  for (let i = 0; i < runs; i++) {
    const setup: Setup = { lastName: "P", jerseyNumber: 7, homeState, position: "QB" };
    const s = createCareer(setup, `traitdist-${homeState}-${i}`);
    for (const o of s.pendingOptions ?? []) {
      out.push(CONTENT.schools.find((x) => x.id === o.schoolId)?.trait);
    }
  }
  return out;
}

describe("realized trait distribution", () => {
  // This test deliberately does NOT count rows in schools.ts. The sampler
  // weights by home state (homeStateBonus +12/+8/+4/+1 by tier) and region, so
  // players do not land evenly across a tier: zero-mean across the LADDER is
  // not zero-mean across the POPULATION. runBalance compounds this by
  // defaulting to homeState "TX". What matters is the share of offers players
  // actually see.
  it("puts a wideOpen school in front of players from every home state", () => {
    for (const state of HOME_STATES) {
      const traits = offerTraits(state, 60);
      expect(
        traits.filter((t) => t === "wideOpen").length,
        `a recruit from ${state} never sees a wideOpen offer`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps the pooled wideOpen share of offers inside a sane band", () => {
    // Band is wide on purpose: it is a guard against the trait becoming
    // near-universal or near-invisible, not a tuned target. Measured value the
    // first time this ran: 0.345.
    const traits = HOME_STATES.flatMap((s) => offerTraits(s, 40));
    const share = traits.filter((t) => t === "wideOpen").length / traits.length;
    expect(share, `pooled wideOpen share of offers is ${share.toFixed(3)}`).toBeGreaterThan(0.05);
    expect(share, `pooled wideOpen share of offers is ${share.toFixed(3)}`).toBeLessThan(0.45);
  });

  it("covers every region at both tiers wideOpen occupies", () => {
    for (const [region, states] of Object.entries(REGIONS)) {
      for (const tier of [1, 2]) {
        const inCell = CONTENT.schools.filter(
          (s) => s.tier === tier && s.trait === "wideOpen" && states.includes(s.state),
        );
        expect(inCell.length, `region ${region} tier ${tier} has no wideOpen school`).toBeGreaterThan(0);
      }
    }
  });
});
