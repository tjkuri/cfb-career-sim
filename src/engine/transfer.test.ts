import { describe, it, expect } from "vitest";
import { generateTransferOffers } from "./transfer";
import { createCareer } from "./create-career";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";
import type { Setup } from "./types";

const setup: Setup = { lastName: "T", jerseyNumber: 1, homeState: "TX", position: "QB" };

function stateAt(tier: 1 | 2 | 3 | 4, overall: number, lastSnaps: number) {
  const s = createCareer(setup, "xfer");
  s.overall = overall;
  s.school = { schoolId: "unt", tier }; // North Texas is tier 2 in the base ladder
  s.seasons.push({ seasonIndex: 0, schoolId: "unt", snaps: lastSnaps, stats: {}, teamWins: 0, teamLosses: 0, overall: s.overall, classYear: s.eligibility.classYear });
  return s;
}

describe("generateTransferOffers", () => {
  it("always includes a stay offer first with modifier 1", () => {
    const offers = generateTransferOffers(stateAt(2, 70, 400), CONTENT, createRng("a"));
    expect(offers[0]!.id).toBe("stay");
    expect(offers[0]!.snapModifier).toBe(1);
  });

  it("always offers a step up, until the top tier", () => {
    for (const tier of [1, 2, 3] as const) {
      const offers = generateTransferOffers(stateAt(tier, 62, 400), CONTENT, createRng(`up-${tier}`));
      expect(offers.some((o) => o.tier === tier + 1)).toBe(true);
    }
    const top = generateTransferOffers(stateAt(4, 90, 400), CONTENT, createRng("top"));
    expect(top.every((o) => o.tier === 4)).toBe(true);
  });

  it("offers a jump of two tiers only once draft stock has the big programs calling", () => {
    const low = generateTransferOffers(stateAt(1, 62, 400), CONTENT, createRng("jump-low"));
    expect(low.some((o) => o.tier === 3)).toBe(false);
    const high = generateTransferOffers(stateAt(1, 90, 400), CONTENT, createRng("jump-high"));
    expect(high.some((o) => o.tier === 3)).toBe(true);
  });

  it("offers a step down to a backup above tier 1", () => {
    const offers = generateTransferOffers(stateAt(3, 60, 100), CONTENT, createRng("down"));
    expect(offers.some((o) => o.tier === 2)).toBe(true);
  });

  it("does not offer a step down to a starter", () => {
    const offers = generateTransferOffers(stateAt(3, 80, 500), CONTENT, createRng("nodown"));
    expect(offers.some((o) => o.tier < 3)).toBe(false);
  });

  it("is deterministic for a seed", () => {
    const a = generateTransferOffers(stateAt(2, 80, 400), CONTENT, createRng("same"));
    const b = generateTransferOffers(stateAt(2, 80, 400), CONTENT, createRng("same"));
    expect(a).toEqual(b);
  });
});
