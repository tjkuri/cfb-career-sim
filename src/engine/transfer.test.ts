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

  it("offers a step up only when it is earned: a starting job or the stock for it", () => {
    // A backup with a modest stock gets no call from the tier above.
    const benched = stateAt(2, 62, 100);
    benched.seasons[0]!.role = "backup";
    expect(generateTransferOffers(benched, CONTENT, createRng("up-b")).some((o) => o.tier === 3)).toBe(false);
    // The same player as last season's starter does.
    const started = stateAt(2, 70, 480);
    started.seasons[0]!.role = "starter";
    expect(generateTransferOffers(started, CONTENT, createRng("up-s")).some((o) => o.tier === 3)).toBe(true);
    // Nobody is above a blueblood.
    const top = generateTransferOffers(stateAt(4, 90, 400), CONTENT, createRng("top"));
    expect(top.every((o) => o.tier === 4)).toBe(true);
  });

  it("keeps a blueblood's call for real draft stock, even for a starter", () => {
    const s = stateAt(3, 70, 480);
    s.seasons[0]!.role = "starter";
    expect(generateTransferOffers(s, CONTENT, createRng("bb")).some((o) => o.tier === 4)).toBe(false);
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
