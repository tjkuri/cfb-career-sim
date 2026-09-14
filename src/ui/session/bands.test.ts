import { describe, it, expect } from "vitest";
import { PLAYING_SNAP_FLOOR, standingPhrase, trustPhrase } from "./bands";
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
    for (const edge of [30, 50, 70, 85]) {
      expect(trustPhrase(edge)).not.toBe(trustPhrase(edge - 1));
    }
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
