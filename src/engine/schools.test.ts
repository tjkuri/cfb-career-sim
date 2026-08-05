import { describe, it, expect } from "vitest";
import { schoolWeight, bestSchoolInTier } from "./schools";
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
