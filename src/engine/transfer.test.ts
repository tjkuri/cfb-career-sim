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
  s.seasons.push({ seasonIndex: 0, schoolId: "unt", snaps: lastSnaps, stats: {}, teamWins: 0, teamLosses: 0 });
  return s;
}

describe("generateTransferOffers", () => {
  it("always includes a stay offer first with modifier 1", () => {
    const offers = generateTransferOffers(stateAt(2, 70, 400), CONTENT, createRng("a"));
    expect(offers[0]!.id).toBe("stay");
    expect(offers[0]!.snapModifier).toBe(1);
  });

  it("offers a move-up when the player has outgrown the tier", () => {
    // High overall -> eligibleTiers includes a tier above current (tier 2).
    const offers = generateTransferOffers(stateAt(2, 92, 500), CONTENT, createRng("up"));
    expect(offers.some((o) => o.snapModifier === CONTENT.transfer.moveUpSnapModifier)).toBe(true);
  });

  it("offers a move-down when buried (low snaps) above tier 1", () => {
    const offers = generateTransferOffers(stateAt(3, 70, 100), CONTENT, createRng("down"));
    expect(offers.some((o) => o.snapModifier === CONTENT.transfer.moveDownSnapModifier)).toBe(true);
  });

  it("does not offer move-down when the player is playing plenty", () => {
    const offers = generateTransferOffers(stateAt(3, 70, 500), CONTENT, createRng("nodown"));
    expect(offers.some((o) => o.snapModifier === CONTENT.transfer.moveDownSnapModifier)).toBe(false);
  });

  it("is deterministic for a seed", () => {
    const a = generateTransferOffers(stateAt(2, 80, 400), CONTENT, createRng("same"));
    const b = generateTransferOffers(stateAt(2, 80, 400), CONTENT, createRng("same"));
    expect(a).toEqual(b);
  });
});
