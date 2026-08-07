import { describe, it, expect } from "vitest";
import { schoolWeight, bestSchoolInTier, sampleSchoolInTier } from "./schools";
import { createRng } from "./rng";
import { CONTENT } from "../content/index";

describe("schoolWeight", () => {
  it("weights a home-state school above a same-region school above an out-of-region school", () => {
    // Build three tier-3 schools with known states relative to homeState "TX" (Southwest).
    const content = { ...CONTENT, schools: [
      { id: "home", name: "Home U", tier: 3 as const, conference: "X", state: "TX" },     // home state
      { id: "region", name: "Region U", tier: 3 as const, conference: "X", state: "OK" },  // same region (Southwest)
      { id: "far", name: "Far U", tier: 3 as const, conference: "X", state: "OH" },        // other region
    ]};
    const w = (id: string) => schoolWeight(content.schools.find((s) => s.id === id)!, "TX", content);
    expect(w("home")).toBeGreaterThan(w("region"));
    expect(w("region")).toBeGreaterThan(w("far"));
  });

  it("scales the home-state bonus down as tier rises", () => {
    const mk = (id: string, tier: 1 | 2 | 3 | 4) => ({ id, name: id, tier, conference: "X", state: "TX" });
    const content = { ...CONTENT, schools: [mk("t1", 1), mk("t2", 2), mk("t3", 3), mk("t4", 4)] };
    const w = (id: string) => schoolWeight(content.schools.find((s) => s.id === id)!, "TX", content);
    expect(w("t1")).toBeGreaterThan(w("t2"));
    expect(w("t2")).toBeGreaterThan(w("t3"));
    expect(w("t3")).toBeGreaterThan(w("t4"));
  });

  it("gives an out-of-region school only the base weight at every tier", () => {
    // OH is Midwest; homeState TX is Southwest -> neither home-state nor same-region.
    const mk = (id: string, tier: 1 | 2 | 3 | 4) => ({ id, name: id, tier, conference: "X", state: "OH" });
    const content = { ...CONTENT, schools: [mk("f1", 1), mk("f4", 4)] };
    const w = (id: string) => schoolWeight(content.schools.find((s) => s.id === id)!, "TX", content);
    expect(w("f1")).toBe(CONTENT.schoolSampler.base);
    expect(w("f4")).toBe(CONTENT.schoolSampler.base);
  });
});

describe("bestSchoolInTier", () => {
  it("returns the highest-weight school in a tier and can exclude one", () => {
    const content = { ...CONTENT, schools: [
      { id: "home", name: "Home U", tier: 3 as const, conference: "X", state: "TX" },
      { id: "far", name: "Far U", tier: 3 as const, conference: "X", state: "OH" },
    ]};
    expect(bestSchoolInTier(content, 3, "TX")!.id).toBe("home");
    expect(bestSchoolInTier(content, 3, "TX", "home")!.id).toBe("far"); // excluded -> next best
  });

  it("returns undefined when a tier has no schools", () => {
    const content = { ...CONTENT, schools: [] };
    expect(bestSchoolInTier(content, 2, "TX")).toBeUndefined();
  });
});

describe("sampleSchoolInTier", () => {
  it("only returns schools in the requested tier and respects exclude", () => {
    const content = { ...CONTENT, schools: [
      { id: "a", name: "A", tier: 2 as const, conference: "X", state: "TX" },
      { id: "b", name: "B", tier: 2 as const, conference: "X", state: "OK" },
      { id: "c", name: "C", tier: 3 as const, conference: "X", state: "TX" },
    ]};
    for (let i = 0; i < 20; i++) {
      const pick = sampleSchoolInTier(content, 2, "TX", createRng(`s-${i}`), new Set(["a"]));
      expect(pick).toBeDefined();
      expect(pick!.tier).toBe(2);
      expect(pick!.id).not.toBe("a");
    }
  });

  it("returns undefined when no school matches", () => {
    const content = { ...CONTENT, schools: [{ id: "c", name: "C", tier: 3 as const, conference: "X", state: "TX" }] };
    expect(sampleSchoolInTier(content, 2, "TX", createRng("x"))).toBeUndefined();
  });

  it("excludes every id in the exclusion set", () => {
    const content = { ...CONTENT, schools: [
      { id: "a", name: "A", tier: 2 as const, conference: "X", state: "TX" },
      { id: "b", name: "B", tier: 2 as const, conference: "X", state: "TX" },
      { id: "c", name: "C", tier: 2 as const, conference: "X", state: "TX" },
    ]};
    for (let i = 0; i < 20; i++) {
      const pick = sampleSchoolInTier(content, 2, "TX", createRng(`ex-${i}`), new Set(["a", "b"]));
      expect(pick!.id).toBe("c");
    }
  });

  it("returns undefined when the exclusion set covers the whole tier", () => {
    const content = { ...CONTENT, schools: [
      { id: "a", name: "A", tier: 2 as const, conference: "X", state: "TX" },
    ]};
    expect(sampleSchoolInTier(content, 2, "TX", createRng("x"), new Set(["a"]))).toBeUndefined();
  });
});
