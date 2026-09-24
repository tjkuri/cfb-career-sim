import { describe, it, expect } from "vitest";
import {
  PLAYING_SNAP_FLOOR,
  TRUST_LADDER,
  standingPhrase,
  trustMove,
  trustPhrase,
  trustRungOf,
} from "./bands";
import { CONTENT } from "../../content/index";
import { createCareer, type Setup } from "../../engine/index";

// Starting values are read off a real career rather than deep-imported from
// engine internals, so this test uses only the five-export public surface.
const FRESH = createCareer(
  { lastName: "Kuri", jerseyNumber: 7, homeState: "TX", position: "QB" } satisfies Setup,
  "bands",
);

describe("standing bands", () => {
  it("covers the whole legal overall range", () => {
    for (let n = 0; n <= 99; n++) expect(standingPhrase(n).length).toBeGreaterThan(0);
  });

  it("changes at each documented boundary", () => {
    for (const edge of [50, 60, 69, 77, 85, 92]) {
      expect(standingPhrase(edge)).not.toBe(standingPhrase(edge - 1));
    }
  });

  it("is monotonic — no phrase repeats out of order", () => {
    const seen: string[] = [];
    for (let n = 0; n <= 99; n++) {
      const p = standingPhrase(n);
      if (seen[seen.length - 1] !== p) {
        expect(seen).not.toContain(p);
        seen.push(p);
      }
    }
  });

  it("puts a player at the washout floor in the lowest band", () => {
    expect(standingPhrase(CONTENT.progression.washoutOverallFloor)).toBe(standingPhrase(0));
  });

  it("puts a fresh recruit in the rotation band", () => {
    expect(standingPhrase(FRESH.overall)).toBe("in the rotation");
  });
});

// Report 027, defect 2: `ON THE FIELD: on the scout team` printed beside
// `339 snaps · 31 tackles` in the same header strip.
describe("standing bands vs the snap count beside them", () => {
  const OFF_FIELD = ["on the scout team", "hanging on to a roster spot"];

  it("keeps the engine's own floor as the anchor", () => {
    expect(PLAYING_SNAP_FLOOR).toBe(CONTENT.progression.washoutSnapFloor);
  });

  it("is unchanged when no snap count is supplied", () => {
    for (let n = 0; n <= 99; n++) {
      expect(standingPhrase(n, undefined)).toBe(standingPhrase(n));
      expect(standingPhrase(n, null)).toBe(standingPhrase(n));
    }
  });

  it("never denies playing time the snap count refutes", () => {
    for (let n = 0; n <= 99; n++) {
      expect(OFF_FIELD).not.toContain(standingPhrase(n, PLAYING_SNAP_FLOOR));
      expect(OFF_FIELD).not.toContain(standingPhrase(n, 339));
    }
  });

  it("still says scout team below the floor, and through a redshirt season", () => {
    // `sitSnapModifier: 0.05` gives a sat-out season a median of 26 snaps and a
    // measured max of 54 over 2,315 redshirt rows -- all below the floor.
    for (const snaps of [0, 26, 54, PLAYING_SNAP_FLOOR - 1]) {
      expect(standingPhrase(55, snaps)).toBe("on the scout team");
      expect(standingPhrase(20, snaps)).toBe("hanging on to a roster spot");
    }
  });

  it("lifts only to the weakest phrase compatible with playing", () => {
    expect(standingPhrase(55, 339)).toBe("in the rotation");
    expect(standingPhrase(20, 339)).toBe("in the rotation");
  });

  it("never moves a phrase that was not a denial", () => {
    for (let n = 0; n <= 99; n++) {
      const bare = standingPhrase(n);
      if (OFF_FIELD.includes(bare)) continue;
      for (const snaps of [0, 26, 60, 339, 900]) expect(standingPhrase(n, snaps)).toBe(bare);
    }
  });

  it("survives a wrecked save without asserting anything", () => {
    for (const snaps of [NaN, Infinity, -Infinity]) {
      expect(standingPhrase(55, snaps)).toBe("on the scout team");
    }
    // A negative snap count is reachable: `applyEffect` had no lower bound on
    // authored negative snap effects (DECISION 040). It is below the floor, so
    // it cannot lift anything.
    expect(standingPhrase(55, -8)).toBe("on the scout team");
  });
});

describe("trust bands", () => {
  it("covers the whole legal character range", () => {
    for (let n = 0; n <= 100; n++) expect(trustPhrase(n).length).toBeGreaterThan(0);
  });

  it("changes at each documented boundary", () => {
    for (const edge of [30, 50, 66, 80]) {
      expect(trustPhrase(edge)).not.toBe(trustPhrase(edge - 1));
    }
  });

  // DECISION 080 / brief 054. The two properties the recalibration exists to
  // create, stated as the player experiences them rather than as thresholds:
  // a fresh career is not standing on a trapdoor, and the rung above it is
  // closer than the fifteen points that made it unreachable.
  it("does not drop a starting career a rung on one bad card", () => {
    // Every authored single negative `character` outcome from -1 to -4, which
    // is 49 of the bundle's 72. The marker must not move for any of them.
    for (const hit of [1, 2, 3, 4]) {
      expect(trustPhrase(FRESH.character - hit)).toBe(trustPhrase(FRESH.character));
    }
  });

  it("puts the top rung inside the reach of a virtuous career", () => {
    // Measured ceiling of maximally virtuous play is about +14 from the start
    // (report 054); the rung above must sit below that, or it is scenery.
    const climb = 14;
    expect(trustRungOf(trustPhrase(FRESH.character + climb))).toBeLessThan(
      trustRungOf(trustPhrase(FRESH.character)),
    );
  });

  it("is coarser than the standing scale", () => {
    const trust = new Set<string>();
    const standing = new Set<string>();
    for (let n = 0; n <= 99; n++) {
      trust.add(trustPhrase(n));
      standing.add(standingPhrase(n));
    }
    expect(trust.size).toBeLessThan(standing.size);
  });

  it("starts a career in the trusted band", () => {
    expect(trustPhrase(FRESH.character)).toBe("the staff trusts you");
  });
});

// The ladder (task 043). The summary draws all five rungs and the career screen
// marks the click one is crossed on, so two properties have to hold or both
// displays start telling the player something `character` cannot support.
describe("the trust ladder", () => {
  it("is every band phrase exactly once, best first", () => {
    expect(TRUST_LADDER).toHaveLength(5);
    expect(new Set(TRUST_LADDER).size).toBe(5);
    // Ordered by regard, which is what makes an index a rung. Walking the
    // whole legal range must never produce a phrase that is off the ladder,
    // and must never walk it backwards.
    let rung = trustRungOf(trustPhrase(0));
    for (let n = 0; n <= 100; n++) {
      const here = trustRungOf(trustPhrase(n));
      expect(here).toBeGreaterThanOrEqual(0);
      expect(here).toBeLessThanOrEqual(rung);
      rung = here;
    }
    expect(trustRungOf(trustPhrase(100))).toBe(0);
    expect(trustRungOf(trustPhrase(0))).toBe(TRUST_LADDER.length - 1);
  });

  it("reports direction and cannot report distance", () => {
    const top = trustPhrase(90);
    const second = trustPhrase(75);
    const bottom = trustPhrase(5);
    expect(trustMove(second, top)).toBe("up");
    expect(trustMove(top, second)).toBe("down");
    // The whole constraint in one assertion: a four-rung fall and a one-rung
    // fall are the SAME value, so nothing downstream can render a magnitude
    // for `character` (DECISION 002, DECISION 046).
    expect(trustMove(top, bottom)).toBe(trustMove(top, second));
    expect(trustMove(bottom, top)).toBe(trustMove(second, top));
  });

  it("says nothing when there is nothing to say", () => {
    const now = trustPhrase(75);
    // No baseline -- a save written before the card froze one.
    expect(trustMove(null, now)).toBeNull();
    expect(trustMove(undefined, now)).toBeNull();
    // Same rung: character moved, the building's read of it did not.
    expect(trustMove(now, now)).toBeNull();
    expect(trustMove(trustPhrase(66), trustPhrase(79))).toBeNull();
    // A phrase this ladder does not contain -- a save written against other
    // words. It is not placed, so no move is claimed.
    expect(trustMove("a phrase from another build", now)).toBeNull();
    expect(trustRungOf("a phrase from another build")).toBe(-1);
  });
});
