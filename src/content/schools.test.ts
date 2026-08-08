import { describe, it, expect } from "vitest";
import { SCHOOLS } from "./schools";
import { REGIONS } from "./regions";
import type { Tier } from "../engine/types";

const TIERS: Tier[] = [1, 2, 3, 4];

// Tier 1 in Georgia is deliberately a single program: Mercer is the only
// plausible FCS school there, and inventing a second would break realism-first.
const TWO_PER_STATE_EXEMPTIONS = [{ state: "GA", tier: 1 as Tier }];

describe("school ladder", () => {
  it("has a usable pool at every tier", () => {
    for (const t of TIERS) {
      expect(SCHOOLS.filter((s) => s.tier === t).length).toBeGreaterThanOrEqual(9);
    }
  });

  it("has unique ids", () => {
    const ids = SCHOOLS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fills every region x tier cell the sampler can reach", () => {
    for (const [region, states] of Object.entries(REGIONS)) {
      for (const t of TIERS) {
        const inCell = SCHOOLS.filter((s) => s.tier === t && states.includes(s.state));
        expect(inCell.length, `region ${region} tier ${t} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("has two schools per tier at tiers 1-2 in the high-population states", () => {
    for (const state of ["TX", "CA", "FL", "OH", "GA"]) {
      for (const t of [1, 2] as Tier[]) {
        const exempt = TWO_PER_STATE_EXEMPTIONS.some((e) => e.state === state && e.tier === t);
        const n = SCHOOLS.filter((s) => s.state === state && s.tier === t).length;
        if (exempt) expect(n).toBeGreaterThanOrEqual(1);
        else expect(n, `${state} tier ${t} has ${n}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("places every school in a region", () => {
    const regioned = new Set(Object.values(REGIONS).flat());
    for (const s of SCHOOLS) {
      expect(regioned.has(s.state), `${s.name} (${s.state}) is in no region`).toBe(true);
    }
  });
});
