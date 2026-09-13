import { describe, it, expect } from "vitest";
import { standingPhrase, trustPhrase } from "./bands";
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
