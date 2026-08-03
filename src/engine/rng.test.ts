import { describe, it, expect } from "vitest";
import { createRng, rngInt, rngPick, rngWeightedPick, rngChance } from "./rng";

describe("rng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-1");
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRng("seed-1");
    const b = createRng("seed-2");
    expect(a.next()).not.toEqual(b.next());
  });

  it("returns floats in [0,1) and advances the cursor", () => {
    const r = createRng("x");
    expect(r.cursor).toBe(0);
    const v = r.next();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
    expect(r.cursor).toBe(1);
  });

  it("can resume from a cursor to reproduce a sequence", () => {
    const a = createRng("resume");
    a.next(); a.next();
    const resumed = createRng("resume", a.cursor);
    const fresh = createRng("resume");
    fresh.next(); fresh.next();
    expect(resumed.next()).toEqual(fresh.next());
  });

  it("rngInt stays within inclusive bounds", () => {
    const r = createRng("ints");
    for (let i = 0; i < 200; i++) {
      const n = rngInt(r, 3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("rngPick returns an element of the array", () => {
    const r = createRng("pick");
    const items = ["a", "b", "c"] as const;
    expect(items).toContain(rngPick(r, items));
  });

  it("rngWeightedPick favors heavier items", () => {
    const r = createRng("weighted");
    const items = ["rare", "common"] as const;
    const weightOf = (x: string) => (x === "common" ? 9 : 1);
    let common = 0;
    for (let i = 0; i < 1000; i++) if (rngWeightedPick(r, items, weightOf) === "common") common++;
    expect(common).toBeGreaterThan(800);
  });

  it("rngChance respects probability extremes", () => {
    const r = createRng("chance");
    expect(rngChance(r, 1)).toBe(true);
    expect(rngChance(r, 0)).toBe(false);
  });

  it("rngInt throws when max < min instead of returning a wrong result", () => {
    const rng = createRng("guard");
    expect(() => rngInt(rng, 5, 1)).toThrow(RangeError);
  });

  it("rngInt still works when min === max (single-value span)", () => {
    const rng = createRng("guard");
    expect(rngInt(rng, 3, 3)).toBe(3);
  });
});
